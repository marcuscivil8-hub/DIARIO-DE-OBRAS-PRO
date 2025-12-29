import React, { useState, useMemo, useEffect } from 'react';
import { TransacaoFinanceira, TransacaoTipo, Obra, Ponto, Funcionario, PagamentoTipo, CategoriaSaida, User, UserRole, MovimentacaoAlmoxarifado, MovimentacaoTipo, Material } from '../../types';
import { apiService } from '../../services/apiService';
import Card from '../ui/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface FinanceiroPageProps {
    user: User;
}

const FinanceiroPage: React.FC<FinanceiroPageProps> = ({ user }) => {
    const [transacoes, setTransacoes] = useState<TransacaoFinanceira[]>([]);
    const [obras, setObras] = useState<Obra[]>([]);
    const [pontos, setPontos] = useState<Ponto[]>([]);
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [movimentacoes, setMovimentacoes] = useState<MovimentacaoAlmoxarifado[]>([]);
    const [materiais, setMateriais] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [selectedObraId, setSelectedObraId] = useState<string>('all');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [transacoesData, obrasData, pontosData, funcionariosData, movsData, materiaisData] = await Promise.all([
                    apiService.transacoes.getAll(),
                    apiService.obras.getAll(),
                    apiService.pontos.getAll(),
                    apiService.funcionarios.getAll(),
                    apiService.movimentacoesAlmoxarifado.getAll(),
                    apiService.materiais.getAll(),
                ]);
                setTransacoes(transacoesData);
                setObras(obrasData);
                setPontos(pontosData);
                setFuncionarios(funcionariosData);
                setMovimentacoes(movsData);
                setMateriais(materiaisData);
            } catch (error) {
                console.error("Failed to fetch financial data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const { totalEntradas, totalSaidas, balanco, saidasPorCategoria, pieData } = useMemo(() => {
        const isAllObras = selectedObraId === 'all';

        const transacoesFiltradas = isAllObras
            ? transacoes
            : transacoes.filter((t: TransacaoFinanceira) => t.obraId === selectedObraId);

        const totalEntradas = user.role === UserRole.Admin 
            ? transacoesFiltradas.filter((t: TransacaoFinanceira) => t.tipoTransacao === TransacaoTipo.Entrada).reduce((acc: number, t: TransacaoFinanceira) => acc + t.valor, 0)
            : 0;

        const pontosRelevantes = pontos.filter((p: Ponto) => p.status === 'presente' && (isAllObras || p.obraId === selectedObraId));
        const custoMaoDeObra = pontosRelevantes.reduce((total, ponto: Ponto) => {
            const func = funcionarios.find((f: Funcionario) => f.id === ponto.funcionarioId);
            if (func) {
                const dailyCost = func.tipoPagamento === PagamentoTipo.Diaria ? func.valor : (func.valor / 22);
                return total + dailyCost;
            }
            return total;
        }, 0);

        const materiaisMap = new Map(materiais.map((m: Material) => [m.id, m]));
        const movimentosUso = movimentacoes.filter((m: MovimentacaoAlmoxarifado) => 
            m.itemType === 'material' && 
            m.tipoMovimentacao === MovimentacaoTipo.Uso &&
            (isAllObras || m.obraId === selectedObraId)
        );
        const custoMateriais = movimentosUso.reduce((total, mov: MovimentacaoAlmoxarifado) => {
            const material = materiaisMap.get(mov.itemId);
            if (material && material.valor) {
                return total + (material.valor * mov.quantidade);
            }
            return total;
        }, 0);

        const saidasConsolidadas: Record<string, number> = {};

        transacoesFiltradas
            .filter((t: TransacaoFinanceira) => t.tipoTransacao === TransacaoTipo.Saida && t.categoria !== CategoriaSaida.FolhaPagamento && t.categoria !== CategoriaSaida.Material)
            .forEach((t: TransacaoFinanceira) => {
                saidasConsolidadas[t.categoria] = (saidasConsolidadas[t.categoria] || 0) + t.valor;
            });

        if (custoMaoDeObra > 0) {
            saidasConsolidadas['Mão de Obra (Folha de Ponto)'] = custoMaoDeObra;
        }
        if (custoMateriais > 0) {
            saidasConsolidadas[CategoriaSaida.Material] = (saidasConsolidadas[CategoriaSaida.Material] || 0) + custoMateriais;
        }

        const totalSaidas = Object.values(saidasConsolidadas).reduce((sum, val) => sum + val, 0);
        const balanco = totalEntradas - totalSaidas;
        
        const pieDataResult = Object.entries(saidasConsolidadas).map(([name, value]: [string, number]) => ({ name, value }));

        return { totalEntradas, totalSaidas, balanco, saidasPorCategoria: saidasConsolidadas, pieData: pieDataResult };
    }, [selectedObraId, transacoes, pontos, funcionarios, movimentacoes, materiais, user.role]);

    const COLORS = ['#1e3a5f', '#facc15', '#3b82f6', '#fbbf24', '#6b7280', '#ef4444', '#8b5cf6'];

    if (loading) return <div className="text-center p-8">Carregando dados financeiros...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-brand-blue">Controle Financeiro</h2>
            
            <Card>
                <div className="flex items-center space-x-4">
                    <label htmlFor="obra-filter" className="font-semibold text-brand-blue">Filtrar por Obra:</label>
                    <select id="obra-filter" value={selectedObraId} onChange={e => setSelectedObraId((e.target as HTMLSelectElement).value)} className="p-2 border rounded-lg">
                        <option value="all">Todas as Obras</option>
                        {obras.map((obra: Obra) => <option key={obra.id} value={obra.id}>{obra.name}</option>)}
                    </select>
                </div>
            </Card>

            <div className={`grid grid-cols-1 ${user.role === UserRole.Admin ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-6`}>
                {user.role === UserRole.Admin && (
                    <Card title="Entradas" className="text-green-600">
                        <p className="text-3xl font-bold">R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </Card>
                )}
                <Card title="Saídas (Transações + Ponto + Uso de Material)" className="text-red-600">
                    <p className="text-3xl font-bold">R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </Card>
                {user.role === UserRole.Admin && (
                    <Card title="Balanço" className={balanco >= 0 ? 'text-blue-600' : 'text-red-600'}>
                        <p className="text-3xl font-bold">R$ {balanco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </Card>
                )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                 <Card title="Despesas por Categoria" className="lg:col-span-3">
                    <div className="h-96">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} fill="#8884d8" labelLine={false} label={({ name, percent }: {name: string, percent: number}) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                    {pieData.map((_entry: {name: string, value: number}, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
                <Card title="Detalhamento de Saídas" className="lg:col-span-2">
                    <ul className="space-y-2 max-h-96 overflow-y-auto">
{/* FIX: Add explicit types for sort and map callback parameters to ensure correct type inference. */}
                         {Object.entries(saidasPorCategoria).sort(([,a]: [string, number], [,b]: [string, number]) => b - a).map(([categoria, valor]: [string, number]) => (
                            <li key={categoria} className="flex justify-between text-gray-700">
                                <p className={categoria.includes('Mão de Obra') ? 'font-bold text-brand-blue' : ''}>{categoria}</p>
                                <p className={categoria.includes('Mão de Obra') ? 'font-bold text-brand-blue' : ''}>R$ {valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                            </li>
                         ))}
                    </ul>
                </Card>
            </div>
        </div>
    );
};

export default FinanceiroPage;