
import React, { useState, useMemo } from 'react';
import { TransacaoFinanceira, TransacaoTipo, Obra, Ponto, Funcionario, PagamentoTipo } from '../../types';
import useLocalStorage from '../../hooks/useLocalStorage';
import { initialTransacoes, initialObras, initialPontos, initialFuncionarios } from '../../services/dataService';
import Card from '../ui/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const FinanceiroPage: React.FC = () => {
    const [transacoes] = useLocalStorage<TransacaoFinanceira[]>('transacoes', initialTransacoes);
    const [obras] = useLocalStorage<Obra[]>('obras', initialObras);
    const [pontos] = useLocalStorage<Ponto[]>('pontos', initialPontos);
    const [funcionarios] = useLocalStorage<Funcionario[]>('funcionarios', initialFuncionarios);
    const [selectedObraId, setSelectedObraId] = useState<string>('all');

    const filteredTransacoes = selectedObraId === 'all' 
        ? transacoes 
        : transacoes.filter(t => t.obraId === selectedObraId);
        
    const custoMaoDeObra = useMemo(() => {
        const funcionariosDaObra = selectedObraId === 'all'
            ? funcionarios
            : funcionarios.filter(f => f.obraId === selectedObraId);

        const pontosRelevantes = pontos.filter(p => 
            funcionariosDaObra.some(f => f.id === p.funcionarioId) && p.status === 'presente'
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

    const totalEntradas = filteredTransacoes
        .filter(t => t.tipo === TransacaoTipo.Entrada)
        .reduce((acc, t) => acc + t.valor, 0);

    const totalSaidasTransacoes = filteredTransacoes
        .filter(t => t.tipo === TransacaoTipo.Saida)
        .reduce((acc, t) => acc + t.valor, 0);

    const totalSaidas = totalSaidasTransacoes + custoMaoDeObra;
    const balanco = totalEntradas - totalSaidas;

    const saidasPorCategoria = filteredTransacoes
        .filter(t => t.tipo === TransacaoTipo.Saida)
        .reduce((acc, t) => {
            if (!acc[t.categoria]) {
                acc[t.categoria] = 0;
            }
            acc[t.categoria] += t.valor;
            return acc;
        }, {} as Record<string, number>);

    if (custoMaoDeObra > 0) {
        saidasPorCategoria['Mão de Obra (Ponto)'] = custoMaoDeObra;
    }

    const pieData = Object.keys(saidasPorCategoria).map(key => ({
        name: key,
        value: saidasPorCategoria[key]
    }));

    const COLORS = ['#1e3a5f', '#facc15', '#3b82f6', '#fbbf24', '#6b7280', '#ef4444'];

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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card title="Entradas" className="text-green-600">
                    <p className="text-3xl font-bold">R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </Card>
                <Card title="Saídas (Transações + Ponto)" className="text-red-600">
                    <p className="text-3xl font-bold">R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </Card>
                <Card title="Balanço" className={balanco >= 0 ? 'text-blue-600' : 'text-red-600'}>
                    <p className="text-3xl font-bold">R$ {balanco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card title="Despesas por Categoria">
                    <div className="h-80">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
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
                <Card title="Últimas Transações">
                     <ul className="space-y-3 max-h-80 overflow-y-auto">
                        {filteredTransacoes.slice(0, 10).map(t => (
                            <li key={t.id} className="flex justify-between items-center p-2 rounded-lg bg-gray-50">
                                <div>
                                    <p className="font-semibold text-brand-blue">{t.descricao}</p>
                                    <p className="text-sm text-brand-gray">{new Date(t.data).toLocaleDateString('pt-BR')} - {obras.find(o => o.id === t.obraId)?.name}</p>
                                </div>
                                <p className={`font-bold ${t.tipo === TransacaoTipo.Entrada ? 'text-green-600' : 'text-red-600'}`}>
                                    {t.tipo === TransacaoTipo.Entrada ? '+' : '-'} R$ {t.valor.toLocaleString('pt-BR')}
                                </p>
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>
        </div>
    );
};

export default FinanceiroPage;
