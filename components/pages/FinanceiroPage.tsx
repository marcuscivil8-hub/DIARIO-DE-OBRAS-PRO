
import React, { useState, useMemo, useEffect } from 'react';
import { TransacaoFinanceira, TransacaoTipo, Obra, Ponto, Funcionario, PagamentoTipo, CategoriaSaida, User, UserRole } from '../../types';
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
    const [loading, setLoading] = useState(true);
    
    const [selectedObraId, setSelectedObraId] = useState<string>('all');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [transacoesData, obrasData, pontosData, funcionariosData] = await Promise.all([
                    apiService.transacoes.getAll(),
                    apiService.obras.getAll(),
                    apiService.pontos.getAll(),
                    apiService.funcionarios.getAll(),
                ]);
                setTransacoes(transacoesData);
                setObras(obrasData);
                setPontos(pontosData);
                setFuncionarios(funcionariosData);
            } catch (error) {
                console.error("Failed to fetch financial data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredTransacoes = useMemo(() => {
        let baseTransacoes = selectedObraId === 'all'
            ? transacoes
            : transacoes.filter(t => t.obraId === selectedObraId);
        
        if (user.role === UserRole.Encarregado) {
            return baseTransacoes.filter(t => t.tipo === TransacaoTipo.Saida);
        }

        return baseTransacoes;
    }, [transacoes, selectedObraId, user.role]);
        
    const custoMaoDeObraPontos = useMemo(() => {
        const pontosRelevantes = pontos.filter(p => 
            p.status === 'presente' && (selectedObraId === 'all' || p.obraId === selectedObraId)
        );

        return pontosRelevantes.reduce((total, ponto) => {
            const func = funcionarios.find(f => f.id === ponto.funcionarioId);
            if (func) {
                if (func.tipoPagamento === PagamentoTipo.Diaria) {
                    return total + func.valor;
                }
                if (func.tipoPagamento === PagamentoTipo.Salario) {
                    return total + (func.valor / 22); // Custo diário aproximado
                }
            }
            return total;
        }, 0);

    }, [pontos, funcionarios, selectedObraId]);

    const { totalEntradas, totalSaidas, balanco, saidasPorCategoria } = useMemo(() => {
        const totalEntradas = filteredTransacoes
            .filter(t => t.tipo === TransacaoTipo.Entrada)
            .reduce((acc, t) => acc + t.valor, 0);

        // Custo de Mão de Obra agora vem EXCLUSIVAMENTE da folha de ponto
        const custoTotalMaoDeObra = custoMaoDeObraPontos;

        // Processa as saídas manuais, ignorando a categoria 'Folha de Pagamento' que não deve mais ser usada
        const saidasManuaisPorCategoria = filteredTransacoes
            .filter(t => t.tipo === TransacaoTipo.Saida && t.categoria !== CategoriaSaida.FolhaPagamento)
            .reduce((acc, t) => {
                const categoria = t.categoria as CategoriaSaida;
                acc[categoria] = (acc[categoria] || 0) + t.valor;
                return acc;
            }, {} as Record<string, number>);

        // Junta os custos para o resumo final
        // FIX: Add explicit type to prevent type inference issues where object values become `unknown`.
        const finalSaidasPorCategoria: Record<string, number> = { ...saidasManuaisPorCategoria };
        if (custoTotalMaoDeObra > 0) {
            finalSaidasPorCategoria['Mão de Obra (Folha de Ponto)'] = custoTotalMaoDeObra;
        }

        const totalSaidas = Object.values(finalSaidasPorCategoria).reduce((sum, val) => sum + Number(val), 0);
        const balanco = totalEntradas - totalSaidas;

        return { totalEntradas, totalSaidas, balanco, saidasPorCategoria: finalSaidasPorCategoria };
    }, [filteredTransacoes, custoMaoDeObraPontos]);


    const pieData = useMemo(() => {
        return Object.entries(saidasPorCategoria).map(([name, value]) => ({ name, value }));
    }, [saidasPorCategoria]);


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
                        {obras.map(obra => <option key={obra.id} value={obra.id}>{obra.name}</option>)}
                    </select>
                </div>
            </Card>

            <div className={`grid grid-cols-1 ${user.role === UserRole.Admin ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-6`}>
                {user.role === UserRole.Admin && (
                    <Card title="Entradas" className="text-green-600">
                        <p className="text-3xl font-bold">R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </Card>
                )}
                <Card title="Saídas (Transações + Ponto)" className="text-red-600">
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
                                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} fill="#8884d8" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                    {pieData.map((entry, index) => (
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
                         {Object.entries(saidasPorCategoria).sort(([,a], [,b]) => Number(b) - Number(a)).map(([categoria, valor]) => (
                            <li key={categoria} className="flex justify-between text-gray-700">
                                <p className={categoria.includes('Mão de Obra') ? 'font-bold text-brand-blue' : ''}>{categoria}</p>
                                <p className={categoria.includes('Mão de Obra') ? 'font-bold text-brand-blue' : ''}>R$ {(valor as number).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                            </li>
                         ))}
                    </ul>
                </Card>
            </div>
        </div>
    );
};

export default FinanceiroPage;
