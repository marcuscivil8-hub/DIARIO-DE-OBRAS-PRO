
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Funcionario, Ponto, User, UserRole, PagamentoTipo, Obra } from '../../types';
import { apiService } from '../../services/apiService';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal, { ConfirmationModal } from '../ui/Modal';
import { ICONS } from '../../constants';

// --- Date Helper Functions ---
const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
};

const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
};
// --- End Date Helper Functions ---

interface FuncionariosPageProps {
    user: User;
}

const FuncionariosPage: React.FC<FuncionariosPageProps> = ({ user }) => {
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [pontos, setPontos] = useState<Ponto[]>([]);
    const [obras, setObras] = useState<Obra[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFuncionario, setEditingFuncionario] = useState<Funcionario | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [funcionarioToDeactivateId, setFuncionarioToDeactivateId] = useState<string | null>(null);

    const emptyFuncionario: Omit<Funcionario, 'id'> = { name: '', funcao: '', tipoPagamento: PagamentoTipo.Diaria, valor: 0, ativo: true, telefone: '', obraId: null };
    const [currentFuncionario, setCurrentFuncionario] = useState(emptyFuncionario);
    
    const [currentDate, setCurrentDate] = useState(new Date());

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        try {
            const [funcData, pontosData, obrasData] = await Promise.all([
                apiService.funcionarios.getAll(),
                apiService.pontos.getAll(),
                apiService.obras.getAll()
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

    const startOfWeek = getStartOfWeek(currentDate);
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startOfWeek, i));
    const weekDayStrings = weekDays.map(formatDate);

    const handleOpenModal = (func: Funcionario | null = null) => {
        if (func) {
            setEditingFuncionario(func);
            setCurrentFuncionario(func);
        } else {
            setEditingFuncionario(null);
            setCurrentFuncionario(emptyFuncionario);
        }
        setIsModalOpen(true);
    };

    const handleSaveFuncionario = async () => {
        if (editingFuncionario) {
            await apiService.funcionarios.update(editingFuncionario.id, currentFuncionario);
        } else {
            await apiService.funcionarios.create(currentFuncionario);
        }
        setIsModalOpen(false);
        await fetchAllData();
    };

    const triggerDeactivateFuncionario = (id: string) => {
        setFuncionarioToDeactivateId(id);
        setIsConfirmModalOpen(true);
    };

    const confirmDeactivateFuncionario = async () => {
        if (!funcionarioToDeactivateId) return;
        await apiService.funcionarios.update(funcionarioToDeactivateId, { ativo: false });
        setIsConfirmModalOpen(false);
        setFuncionarioToDeactivateId(null);
        await fetchAllData();
    };

    const handlePontoClick = async (funcionarioId: string, data: string) => {
        const pontoIndex = pontos.findIndex(p => p.funcionarioId === funcionarioId && p.data === data);
        let updatedPontos = [...pontos];

        if (pontoIndex > -1) {
            const currentStatus = pontos[pontoIndex].status;
            if (currentStatus === 'presente') {
                updatedPontos[pontoIndex] = { ...updatedPontos[pontoIndex], status: 'falta' };
            } else {
                updatedPontos.splice(pontoIndex, 1);
            }
        } else {
            const newPonto: Ponto = { id: new Date().toISOString(), funcionarioId, data, status: 'presente' };
            updatedPontos.push(newPonto);
        }
        // In a real API, you would create/update/delete a single record.
        // Here we replace all, as our simulation is simple.
        await apiService.pontos.replaceAll(updatedPontos);
        setPontos(updatedPontos); // Optimistic update
    };
    
    const sortedFuncionarios = useMemo(() => 
        [...funcionarios]
            .filter(f => f.ativo)
            .sort((a, b) => a.name.localeCompare(b.name)), 
    [funcionarios]);

    const custoSemanal = useMemo(() => {
        return weekDayStrings.reduce((total, date) => {
            const dailyCost = sortedFuncionarios.reduce((dailyTotal, func) => {
                const ponto = pontos.find(p => p.funcionarioId === func.id && p.data === date && p.status === 'presente');
                if (ponto) {
                    if (func.tipoPagamento === PagamentoTipo.Diaria) {
                        return dailyTotal + func.valor;
                    }
                    if (func.tipoPagamento === PagamentoTipo.Salario) {
                        return dailyTotal + (func.valor / 22);
                    }
                }
                return dailyTotal;
            }, 0);
            return total + dailyCost;
        }, 0);
    }, [pontos, sortedFuncionarios, weekDayStrings]);

    const canEdit = user.role === UserRole.Admin;
    
    if (loading) return <div className="text-center p-8">Carregando funcionários...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-brand-blue">Funcionários e Ponto</h2>
                {canEdit && (
                    <Button onClick={() => handleOpenModal()} className="flex items-center space-x-2">
                        {ICONS.add}
                        <span>Novo Funcionário</span>
                    </Button>
                )}
            </div>

            <Card>
                <div className="flex justify-between items-center mb-4">
                    <Button variant="secondary" onClick={() => setCurrentDate(addDays(currentDate, -7))}>&larr; Semana Anterior</Button>
                    <h3 className="text-lg font-semibold text-center text-brand-blue">
                        {startOfWeek.toLocaleDateString('pt-BR')} - {addDays(startOfWeek, 6).toLocaleDateString('pt-BR')}
                    </h3>
                    <Button variant="secondary" onClick={() => setCurrentDate(addDays(currentDate, 7))}>Próxima Semana &rarr;</Button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-brand-light-gray">
                                <th className="p-3 text-left font-semibold text-brand-blue border">Funcionário</th>
                                {canEdit && <th className="p-3 text-left font-semibold text-brand-blue border">Ações</th>}
                                {weekDays.map(day => (
                                    <th key={day.toISOString()} className="p-3 text-center font-semibold text-brand-blue border w-24">
                                        {day.toLocaleDateString('pt-BR', { weekday: 'short' })}<br/>
                                        <span className="font-normal text-sm">{day.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sortedFuncionarios.map(func => (
                                <tr key={func.id} className="hover:bg-gray-50">
                                    <td className="p-3 font-medium text-gray-800 border">{func.name}</td>
                                    {canEdit && (
                                        <td className="p-3 border">
                                            <div className="flex space-x-2">
                                                <button onClick={() => handleOpenModal(func)} className="text-blue-600 hover:text-blue-800 p-1">{ICONS.edit}</button>
                                                <button onClick={() => triggerDeactivateFuncionario(func.id)} className="text-red-600 hover:text-red-800 p-1">{ICONS.delete}</button>
                                            </div>
                                        </td>
                                    )}
                                    {weekDayStrings.map(date => {
                                        const ponto = pontos.find(p => p.funcionarioId === func.id && p.data === date);
                                        const status = ponto?.status;
                                        const bgColor = status === 'presente' ? 'bg-green-500' : status === 'falta' ? 'bg-red-500' : 'bg-gray-200';
                                        return (
                                            <td key={date} className="p-0 border text-center align-middle">
                                                <button onClick={() => handlePontoClick(func.id, date)} className={`w-full h-12 transition-colors duration-200 ${bgColor} hover:opacity-80`}></button>
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

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingFuncionario ? 'Editar Funcionário' : 'Novo Funcionário'}>
                <form onSubmit={e => { e.preventDefault(); handleSaveFuncionario(); }} className="space-y-4">
                    <input type="text" placeholder="Nome Completo" value={currentFuncionario.name} onChange={e => setCurrentFuncionario({ ...currentFuncionario, name: e.target.value })} className="w-full p-2 border rounded" required />
                    <input type="text" placeholder="Função" value={currentFuncionario.funcao} onChange={e => setCurrentFuncionario({ ...currentFuncionario, funcao: e.target.value })} className="w-full p-2 border rounded" required />
                    <input type="text" placeholder="Telefone" value={currentFuncionario.telefone} onChange={e => setCurrentFuncionario({ ...currentFuncionario, telefone: e.target.value })} className="w-full p-2 border rounded" />
                    <select value={currentFuncionario.tipoPagamento} onChange={e => setCurrentFuncionario({ ...currentFuncionario, tipoPagamento: e.target.value as PagamentoTipo })} className="w-full p-2 border rounded">
                        {Object.values(PagamentoTipo).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <input type="number" placeholder="Valor" value={currentFuncionario.valor} onChange={e => setCurrentFuncionario({ ...currentFuncionario, valor: parseFloat(e.target.value) || 0 })} className="w-full p-2 border rounded" required />
                    <select value={currentFuncionario.obraId || ''} onChange={e => setCurrentFuncionario({ ...currentFuncionario, obraId: e.target.value || null })} className="w-full p-2 border rounded">
                        <option value="">Nenhuma Obra</option>
                        {obras.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                    <div className="flex items-center">
                        <input type="checkbox" id="ativo" checked={currentFuncionario.ativo} onChange={e => setCurrentFuncionario({ ...currentFuncionario, ativo: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue" />
                        <label htmlFor="ativo" className="ml-2 block text-sm text-gray-900">Ativo</label>
                    </div>
                    <Button type="submit" className="w-full">Salvar Funcionário</Button>
                </form>
            </Modal>

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={confirmDeactivateFuncionario}
                title="Confirmar Desativação"
                message="Tem certeza que deseja desativar este funcionário? Ele não aparecerá mais na lista de ponto, mas seus registros históricos serão mantidos."
                confirmText="Desativar"
            />
        </div>
    );
};

export default FuncionariosPage;
