
import React, { useEffect, useState, useMemo } from 'react';
import { User, Obra, UserRole, Page, Servico, Material, TransacaoFinanceira, Ponto, Funcionario, TransacaoTipo, PagamentoTipo, CategoriaSaida } from '../../types';
import { apiService } from '../../services/apiService';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { ICONS } from '../../constants';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardPageProps {
    user: User;
    navigateTo: (page: Page, obraId?: string) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ user, navigateTo }) => {
    const [obras, setObras] = useState<Obra[]>([]);
    const [servicos, setServicos] = useState<Servico[]>([]);
    const [materiais, setMateriais] = useState<Material[]>([]);
    const [transacoes, setTransacoes] = useState<TransacaoFinanceira[]>([]);
    const [pontos, setPontos] = useState<Ponto[]>([]);
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [lembretes, setLembretes] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    
    // State for admin editing reminders
    const [isLembreteModalOpen, setIsLembreteModalOpen] = useState(false);
    const [lembretesEdit, setLembretesEdit] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [obrasData, servicosData, materiaisData, transacoesData, pontosData, funcionariosData, lembretesData] = await Promise.all([
                    apiService.obras.getAll(),
                    apiService.servicos.getAll(),
                    apiService.materiais.getAll(),
                    apiService.transacoes.getAll(),
                    apiService.pontos.getAll(),
                    apiService.funcionarios.getAll(),
                    apiService.getLembretes(),
                ]);
                setObras(obrasData);
                setServicos(servicosData);
                setMateriais(materiaisData);
                setTransacoes(transacoesData);
                setPontos(pontosData);
                setFuncionarios(funcionariosData);
                setLembretes(lembretesData);
                setLembretesEdit(lembretesData.join('\n'));
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSaveLembretes = async () => {
        const lembretesArray = lembretesEdit.split('\n').filter(l => l.trim() !== '');
        await apiService.updateLembretes(lembretesArray);
        setLembretes(lembretesArray);
        setIsLembreteModalOpen(false);
    };

    const userObras = user.role === UserRole.Cliente 
        ? obras.filter(obra => user.obraIds?.includes(obra.id)) 
        : obras;
    
    const userObraIds = userObras.map(o => o.id);

    const activeObras = userObras.filter(o => o.status === 'Ativa').length;
    
    const delayedServices = servicos.filter(s => {
        const isDelayed = new Date() > new Date(s.dataFimPrevista) && s.status !== 'Concluído';
        return userObraIds.includes(s.obraId) && isDelayed;
    }).length;

    const lowStockMaterials = materiais.filter(m => m.quantidade <= m.estoqueMinimo).length;
    
    const funcionariosHoje = useMemo(() => {
        const todayString = new Date().toISOString().split('T')[0];
        const pontosHoje = pontos.filter(p => p.data === todayString && p.status === 'presente');

        if (user.role === UserRole.Cliente) {
            // Correctly counts workers present only in the client's projects.
            return pontosHoje.filter(p => userObraIds.includes(p.obraId)).length;
        }
        
        // For Admin and Encarregado, count all present workers.
        return pontosHoje.length;
    }, [pontos, userObraIds, user.role]);

    const financialSummaryData = useMemo(() => {
        const months = [];
        const today = new Date();
        today.setDate(1);

        for (let i = 5; i >= 0; i--) {
            const monthDate = new Date(today);
            monthDate.setMonth(today.getMonth() - i);
            const monthName = monthDate.toLocaleString('pt-BR', { month: 'short' }).replace('.', '').charAt(0).toUpperCase() + monthDate.toLocaleString('pt-BR', { month: 'short' }).replace('.', '').slice(1);
            
            const year = monthDate.getFullYear();
            const month = monthDate.getMonth();
            const startOfMonth = new Date(year, month, 1);
            const endOfMonth = new Date(year, month + 1, 0);

            const monthlyTransactions = transacoes.filter(t => {
                const transacDate = new Date(t.data + 'T00:00:00');
                return transacDate >= startOfMonth && transacDate <= endOfMonth;
            });
            const monthlyPontos = pontos.filter(p => {
                const pontoDate = new Date(p.data + 'T00:00:00');
                return pontoDate >= startOfMonth && pontoDate <= endOfMonth && p.status === 'presente';
            });

            const entradas = monthlyTransactions
                .filter(t => t.tipo === TransacaoTipo.Entrada)
                .reduce((sum, t) => sum + t.valor, 0);

            const saidasFromTransactions = monthlyTransactions
                .filter(t => t.tipo === TransacaoTipo.Saida && t.categoria !== CategoriaSaida.FolhaPagamento)
                .reduce((sum, t) => sum + t.valor, 0);
            
            const saidasFromPontos = monthlyPontos.reduce((total, ponto) => {
                const func = funcionarios.find(f => f.id === ponto.funcionarioId);
                if (func) {
                    if (func.tipoPagamento === PagamentoTipo.Diaria) return total + func.valor;
                    if (func.tipoPagamento === PagamentoTipo.Salario) return total + (func.valor / 22);
                }
                return total;
            }, 0);

            const saidas = saidasFromTransactions + saidasFromPontos;

            months.push({ name: monthName, Entradas: entradas, Saídas: saidas });
        }

        return months;
    }, [transacoes, pontos, funcionarios]);
    
    if (loading) {
        return <div className="text-center p-8">Carregando dashboard...</div>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-brand-blue">Bem-vindo, {user.name}!</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-brand-blue to-blue-800 text-white">
                    <h3 className="text-lg font-semibold">Obras Ativas</h3>
                    <p className="text-5xl font-bold">{activeObras}</p>
                    <p className="text-white/80">de {userObras.length} no total</p>
                </Card>
                 <Card className="bg-gradient-to-br from-brand-yellow to-amber-500 text-brand-blue">
                    <h3 className="text-lg font-semibold">Serviços Atrasados</h3>
                    <p className="text-5xl font-bold">{delayedServices}</p>
                    <p className="text-black/70">Precisam de atenção</p>
                </Card>
                 <Card>
                    <h3 className="text-lg font-semibold text-brand-blue">Alerta de Estoque</h3>
                    <p className="text-5xl font-bold text-red-500">{lowStockMaterials}</p>
                    <p className="text-brand-gray">Materiais com estoque baixo</p>
                </Card>
                 <Card>
                    <h3 className="text-lg font-semibold text-brand-blue">Funcionários Hoje</h3>
                    <p className="text-5xl font-bold">{funcionariosHoje}</p>
                    <p className="text-brand-gray">Presentes nas obras</p>
                </Card>
            </div>

            {user.role === UserRole.Admin && (
                <>
                    <Card title="Resumo Financeiro (Últimos 6 meses)">
                        <div className="h-80">
                             <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={financialSummaryData}>
                                    <XAxis dataKey="name" stroke="#6b7280" />
                                    <YAxis stroke="#6b7280" />
                                    <Tooltip wrapperClassName="!bg-white !border !border-gray-300 !rounded-lg" formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} />
                                    <Legend />
                                    <Bar dataKey="Entradas" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Saídas" fill="#facc15" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                    <Card title="Lembretes para Encarregados">
                        <ul className="list-disc list-inside space-y-2 text-brand-gray mb-4">
                            {lembretes.map((l, i) => <li key={i}>{l}</li>)}
                        </ul>
                        <div className="text-right">
                             <Button onClick={() => setIsLembreteModalOpen(true)} variant="secondary" size="sm">Editar Lembretes</Button>
                        </div>
                    </Card>
                </>
            )}
            
            {user.role === UserRole.Encarregado && (
                <Card title="Lembretes e Inspiração">
                    <ul className="list-disc list-inside space-y-2 text-brand-gray mb-4">
                        {lembretes.map((l, i) => <li key={i}>{l}</li>)}
                    </ul>
                    <p className="text-center font-semibold text-brand-blue italic mt-6 p-4 bg-yellow-50 rounded-lg">
                        "Você é incrível! Os desafios da vida colaboram para o nosso crescimento."
                    </p>
                </Card>
            )}

            {user.role === UserRole.Cliente && (
                 <Card>
                    <p className="text-center font-semibold text-brand-blue italic p-4">
                        "Sua confiança é o maior reconhecimento. Obrigado por fazer parte da nossa história, sua parceria é vital para o nosso sucesso."
                    </p>
                </Card>
            )}


            <Card title="Acesso Rápido">
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <button onClick={() => navigateTo('Obras')} className="p-4 bg-brand-light-gray rounded-lg text-center hover:bg-gray-200 transition">
                        <span className="text-3xl">🏗️</span>
                        <p className="font-semibold mt-2 text-brand-blue">Ver Obras</p>
                    </button>
                    {user.role !== UserRole.Cliente && (
                        <button onClick={() => navigateTo('CadastroFuncionarios')} className="p-4 bg-brand-light-gray rounded-lg text-center hover:bg-gray-200 transition">
                            <span className="text-3xl">👷</span>
                            <p className="font-semibold mt-2 text-brand-blue">Funcionários</p>
                        </button>
                    )}
                    {(user.role === UserRole.Admin || user.role === UserRole.Cliente) && (
                         <button onClick={() => navigateTo('Documentos')} className="p-4 bg-brand-light-gray rounded-lg text-center hover:bg-gray-200 transition">
                            <span className="text-3xl">📂</span>
                            <p className="font-semibold mt-2 text-brand-blue">Documentos</p>
                        </button>
                    )}
                    {user.role === UserRole.Admin && (
                        <>
                            <button onClick={() => navigateTo('Financeiro')} className="p-4 bg-brand-light-gray rounded-lg text-center hover:bg-gray-200 transition">
                                <span className="text-3xl">💰</span>
                                <p className="font-semibold mt-2 text-brand-blue">Financeiro</p>
                            </button>
                            <button onClick={() => navigateTo('Relatorios')} className="p-4 bg-brand-light-gray rounded-lg text-center hover:bg-gray-200 transition">
                                <span className="text-3xl">📄</span>
                                <p className="font-semibold mt-2 text-brand-blue">Relatórios</p>
                            </button>
                        </>
                    )}
                 </div>
            </Card>

            <Modal isOpen={isLembreteModalOpen} onClose={() => setIsLembreteModalOpen(false)} title="Editar Lembretes dos Encarregados">
                <form onSubmit={(e) => {e.preventDefault(); handleSaveLembretes();}} className="space-y-4">
                    <div>
                        <label htmlFor="lembretes" className="block text-sm font-medium text-brand-gray mb-2">
                            Digite um lembrete por linha.
                        </label>
                        <textarea
                            id="lembretes"
                            value={lembretesEdit}
                            onChange={(e) => setLembretesEdit(e.target.value)}
                            rows={6}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <Button type="submit" className="w-full">Salvar Lembretes</Button>
                </form>
            </Modal>
        </div>
    );
};

export default DashboardPage;
