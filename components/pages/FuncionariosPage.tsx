import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Funcionario, Ponto, User, UserRole, PagamentoTipo, Obra } from '../../types';
import { dataService } from '../../services/dataService';
import Card from '../ui/Card';
import Button from '../ui/Button';

// --- Date Helper Functions for Week ---
const getWeekPeriod = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay(); // Sunday = 0, Monday = 1, ...
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to start on Monday
    const startDate = new Date(d.setDate(diff));
    const endDate = new Date(new Date(startDate).setDate(startDate.getDate() + 6));
    return { startDate, endDate };
};


const changeWeek = (currentDate: Date, direction: 'next' | 'prev') => {
    const newDate = new Date(currentDate);
    const amount = direction === 'next' ? 7 : -7;
    newDate.setDate(newDate.getDate() + amount);
    return newDate;
};


const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
};
// --- End Date Helper Functions ---

interface FolhaPontoPageProps {
    user: User;
}

const FolhaPontoPage: React.FC<FolhaPontoPageProps> = ({ user }) => {
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [pontos, setPontos] = useState<Ponto[]>([]);
    const [obras, setObras] = useState<Obra[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedObraId, setSelectedObraId] = useState<string>('all');
    const [pontoError, setPontoError] = useState<string | null>(null);
    const [updatingPontoKey, setUpdatingPontoKey] = useState<string | null>(null);
    
    const [currentDate, setCurrentDate] = useState(new Date());

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        try {
            const [funcData, pontosData, obrasData] = await Promise.all([
                dataService.funcionarios.getAll(),
                dataService.pontos.getAll(),
                dataService.obras.getAll()
            ]);
            setFuncionarios(funcData);
            setPontos(pontosData);
            setObras(obrasData);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const { startDate, endDate } = getWeekPeriod(currentDate);
    const weekDays = [];
    let dayIterator = new Date(startDate);
    while(dayIterator <= endDate) {
        weekDays.push(new Date(dayIterator));
        dayIterator.setDate(dayIterator.getDate() + 1);
    }
    const weekDayStrings = weekDays.map(formatDate);
    
    const handlePontoClick = async (funcionarioId: string, data: string) => {
        const key = `${funcionarioId}-${data}`;
        // 1. Trava a célula clicada para evitar cliques múltiplos que podem causar inconsistência de dados.
        if (updatingPontoKey === key) return;
        setUpdatingPontoKey(key);
        setPontoError(null);

        if (selectedObraId === 'all') {
            setPontoError('Por favor, selecione uma obra específica para registrar o ponto.');
            setUpdatingPontoKey(null); // Libera a trava
            return;
        }
    
        const existingPonto = pontos.find(p => p.funcionarioId === funcionarioId && p.data === data && p.obraId === selectedObraId);
    
        try {
            // 2. Lógica de transição de estado: a cada clique, o status avança no ciclo.
            if (!existingPonto) {
                // Estado: Não existe -> Criar como 'presente'
                const newPontoData: Omit<Ponto, 'id'> = { funcionarioId, obraId: selectedObraId, data, status: 'presente' };
                const createdPonto = await dataService.pontos.create(newPontoData);
                setPontos(prevPontos => [...prevPontos, createdPonto]);
            } else if (existingPonto.status === 'presente') {
                // Estado: 'presente' -> Atualizar para 'falta'
                const updatedPonto = await dataService.pontos.update(existingPonto.id, { status: 'falta' });
                setPontos(prevPontos => prevPontos.map(p => p.id === existingPonto.id ? updatedPonto : p));
            } else if (existingPonto.status === 'falta') {
                // Estado: 'falta' -> Atualizar para 'meio-dia'
                const updatedPonto = await dataService.pontos.update(existingPonto.id, { status: 'meio-dia' });
                setPontos(prevPontos => prevPontos.map(p => p.id === existingPonto.id ? updatedPonto : p));
            } else if (existingPonto.status === 'meio-dia') {
                // Estado: 'meio-dia' -> Deletar o registro
                await dataService.pontos.delete(existingPonto.id);
                setPontos(prevPontos => prevPontos.filter(p => p.id !== existingPonto.id));
            }
        } catch (error) {
            console.error("Falha ao atualizar o ponto:", error);
            setPontoError("Não foi possível salvar a alteração. A página será recarregada para garantir a consistência dos dados.");
            // Força a recarga da página em caso de erro para re-sincronizar o estado.
            setTimeout(() => window.location.reload(), 2500);
        } finally {
            // 3. Libera a trava da célula, permitindo novos cliques.
            setUpdatingPontoKey(null);
        }
    };
    
    const visibleFuncionarios = useMemo(() => 
        funcionarios
            .filter(f => f.ativo && (selectedObraId === 'all' || f.obraId === selectedObraId))
            .sort((a, b) => a.name.localeCompare(b.name)), 
    [funcionarios, selectedObraId]);

    const custoSemanal = useMemo(() => {
        const activeFuncionarioIds = new Set(funcionarios.filter(f => f.ativo).map(f => f.id));
        const pontosDaSemana = pontos.filter(p => 
            weekDayStrings.includes(p.data) &&
            activeFuncionarioIds.has(p.funcionarioId) &&
            (selectedObraId === 'all' || p.obraId === selectedObraId)
        );
    
        const funcionariosMap = new Map(funcionarios.map(f => [f.id, f]));
    
        const custoTotal = pontosDaSemana.reduce((total, ponto) => {
            const funcionario = funcionariosMap.get(ponto.funcionarioId) as Funcionario | undefined;
            if (!funcionario || typeof funcionario.valor !== 'number' || funcionario.valor <= 0) {
                return total;
            }
    
            let dailyCost = 0;
            const baseDailyValue = funcionario.tipoPagamento === PagamentoTipo.Diaria ? funcionario.valor : (funcionario.valor / 22);

            if (ponto.status === 'presente') {
                dailyCost = baseDailyValue;
            } else if (ponto.status === 'meio-dia') {
                dailyCost = baseDailyValue / 2;
            }
            
            return total + dailyCost;
        }, 0);
    
        return custoTotal;
    }, [pontos, funcionarios, weekDayStrings, selectedObraId]);
    
    if (loading) return <div className="text-center p-8">Carregando folha de pontos...</div>;

    const isPontoDisabled = selectedObraId === 'all';

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-brand-blue">Folha de Pontos</h2>
                <div className="flex items-center space-x-2">
                    <label htmlFor="obra-filter" className="font-semibold text-brand-blue">Obra:</label>
                    <select id="obra-filter" value={selectedObraId} onChange={e => setSelectedObraId((e.target as HTMLSelectElement).value)} className="p-2 border rounded-lg">
                        <option value="all">Todas as Obras</option>
                        {obras.map(obra => <option key={obra.id} value={obra.id}>{obra.name}</option>)}
                    </select>
                </div>
            </div>

            <Card>
                <div className="flex justify-between items-center mb-4">
                    <Button variant="secondary" onClick={() => setCurrentDate(changeWeek(currentDate, 'prev'))}>&larr; Semana Anterior</Button>
                    <h3 className="text-lg font-semibold text-center text-brand-blue">
                        {startDate.toLocaleDateString('pt-BR')} - {endDate.toLocaleDateString('pt-BR')}
                    </h3>
                    <Button variant="secondary" onClick={() => setCurrentDate(changeWeek(currentDate, 'next'))}>Próxima Semana &rarr;</Button>
                </div>
                 {isPontoDisabled && <p className="text-center text-brand-yellow bg-yellow-50 p-2 rounded-md mb-4">Selecione uma obra para registrar presenças ou faltas.</p>}
                 {pontoError && <p className="text-center text-red-600 bg-red-50 p-3 rounded-md mb-4">{pontoError}</p>}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-brand-light-gray">
                                <th className="p-3 text-left font-semibold text-brand-blue border sticky left-0 bg-brand-light-gray z-10">Funcionário</th>
                                {weekDays.map(day => (
                                    <th key={day.toISOString()} className="p-3 text-center font-semibold text-brand-blue border w-24">
                                        <span className="text-xs text-gray-500">{day.toLocaleDateString('pt-BR', { weekday: 'short' }).charAt(0).toUpperCase()}</span>
                                        <br />
                                        {day.getDate()}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {visibleFuncionarios.map(func => (
                                <tr key={func.id} className="hover:bg-gray-50">
                                    <td className="p-3 font-bold text-brand-blue border sticky left-0 bg-white/75 backdrop-blur-sm">{func.name}</td>
                                    {weekDayStrings.map(date => {
                                        const key = `${func.id}-${date}`;
                                        const isUpdating = updatingPontoKey === key;
                                        const ponto = pontos.find(p => p.funcionarioId === func.id && p.data === date && (selectedObraId === 'all' || p.obraId === selectedObraId));
                                        const status = ponto?.status;
                                        let bgColor = 'bg-gray-200';
                                        if (status === 'presente') bgColor = 'bg-green-500';
                                        if (status === 'falta') bgColor = 'bg-red-500';
                                        if (status === 'meio-dia') bgColor = 'bg-blue-500';
                                        
                                        return (
                                            <td key={date} className="p-0 border text-center align-middle">
                                                <button 
                                                    onClick={() => handlePontoClick(func.id, date)} 
                                                    className={`w-full h-12 transition-colors duration-200 ${bgColor} ${isPontoDisabled || isUpdating ? 'cursor-not-allowed opacity-50' : 'hover:opacity-80'}`} 
                                                    disabled={isPontoDisabled || isUpdating}>
                                                </button>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 <div className="mt-4 text-right">
                    <p className="text-lg font-bold text-brand-blue">
                        Custo Estimado da Semana: <span className="text-green-600">R$ {custoSemanal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default FolhaPontoPage;