
import React, { useState, useMemo, useEffect } from 'react';
import { TransacaoFinanceira, TransacaoTipo, Obra, Ponto, Funcionario, PagamentoTipo, CategoriaSaida, User, UserRole, MovimentacaoAlmoxarifado, MovimentacaoTipo, Material } from '../../types';
import { dataService } from '../../services/dataService';
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
                    dataService.transacoes.getAll(),
                    dataService.obras.getAll(),
                    dataService.pontos.getAll(),
                    dataService.funcionarios.getAll(),
                    dataService.movimentacoesAlmoxarifado.getAll(),
                    dataService.materiais.getAll(),
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
            ? transacoesFiltradas.filter((t: TransacaoFinanceira) => t.tipoTransacao === TransacaoTipo.Entrada).reduce((acc: number, t: TransacaoFinanceira) => acc + (t.valor || 0), 0)
            : 0;

        const pontosRelevantes = pontos.filter((p: Ponto) => p.status !== 'falta' && (isAllObras || p.obraId === selectedObraId));
        const custoMaoDeObra = pontosRelevantes.reduce((total: number, ponto: Ponto) => {
            const func = funcionarios.find((f) => f.id === ponto.funcionarioId);
            if (func && typeof func.valor === 'number' && func.valor > 0) {
                const baseDailyValue = func.tipoPagamento === PagamentoTipo.Diaria ? func.valor : (func.valor / 22);
                const dailyCost = ponto.status === 'meio-dia' ? baseDailyValue / 2 : baseDailyValue;
                return total + dailyCost;
            }
            return total;
        }, 0);

        const materiaisMap = new Map<string, Material>(materiais.map((m: Material) => [m.id, m]));
        const movimentosUso = movimentacoes.filter((m: MovimentacaoAlmoxarifado) => 
            m.itemType === 'material' && 
            m.tipoMovimentacao === MovimentacaoTipo.Uso &&
            (isAllObras || m.obraId === selectedObraId)
        );
        const custoMateriais = movimentosUso.reduce((total: number, mov: MovimentacaoAlmoxarifado) => {
            const material = materiaisMap.get(mov.itemId);
            if (material && typeof material.valor === 'number') {
                return total + (material.valor * mov.quantidade);
            }
            return total;
        }, 0);

        const saidasConsolidadas: Record<string, number> = {};

        transacoesFiltradas
            .filter((t: TransacaoFinanceira) => t.tipoTransacao === TransacaoTipo.Saida)
            .forEach((t: TransacaoFinanceira) => {
                saidasConsolidadas[t.categoria] = (saidasConsolidadas[t.categoria] || 0) + (t.valor || 0);
            });

        if (custoMaoDeObra > 0) {
            saidasConsolidadas['Mão de Obra (Folha de Ponto)'] = (saidasConsolidadas['Mão de Obra (Folha de Ponto)'] || 0) + custoMaoDeObra;
        }
        if (custoMateriais > 0) {
            saidasConsolidadas['Materiais (Uso Obra)'] = (saidasConsolidadas['Materiais (Uso Obra)'] || 0) + custoMateriais;
        }

        const totalSaidas = Object.values(saidasConsolidadas).reduce((sum, val) => sum + val, 0);
        const balanco = totalEntradas - totalSaidas;
        
        const pieDataResult = Object.entries(saidasConsolidadas).map(([name, value]) => ({ name, value }));

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
                    <select id="obra-filter" value={selectedObraId} onChange={e => setSelectedObraId(e.target.value)} className="p-2 border rounded-lg">
                        <option value="all">Todas as Obras</option>
                        {obras.map((obra: Obra) => <option key={obra.id} value={obra.id}>{obra.name}</option>)}
                    </select>
                </div>
            </Card>

            <div className={`grid grid-cols-1 ${user.role === UserRole.Admin ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-6`}>
                {user.role === UserRole.Admin && (
                    <Card title="Entradas" className="text-green-600">
                        <p className="text-3xl font-bold">R$ {Number(totalEntradas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </Card>
                )}
                <Card title="Custo Total (Consolidado)" className="text-red-600">
                    <p className="text-3xl font-bold">R$ {Number(totalSaidas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </Card>
                {user.role === UserRole.Admin && (
                    <Card title="Balanço (Entradas - Saídas)" className={balanco >= 0 ? 'text-blue-600' : 'text-red-600'}>
                        <p className="text-3xl font-bold">R$ {Number(balanco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </Card>
                )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                 <Card title="Distribuição de Custos" className="lg:col-span-3">
                    <div className="h-96">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={pieData} 
                                    dataKey="value" 
                                    nameKey="name" 
                                    cx="50%" 
                                    cy="50%" 
                                    outerRadius={120} 
                                    fill="#8884d8" 
                                    labelLine={false}
                                    label={({ name, percent }: any) => `${name} ${(Number(percent || 0) * 100).toFixed(0)}%`}
                                >
                                    {pieData.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: any) => `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
                <Card title="Detalhamento das Saídas" className="lg:col-span-2">
                    <ul className="space-y-3 max-h-96 overflow-y-auto">
                         {Object.entries(saidasPorCategoria).sort((a, b) => Number(b[1]) - Number(a[1])).map(([categoria, valor]) => (
                            <li key={categoria} className="flex justify-between items-center text-gray-700 border-b pb-2">
                                <p className="font-medium text-brand-blue">{categoria}</p>
                                <p className="font-bold">R$ {Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </li>
                         ))}
                    </ul>
                </Card>
            </div>
        </div>
    );
};

export default FinanceiroPage;