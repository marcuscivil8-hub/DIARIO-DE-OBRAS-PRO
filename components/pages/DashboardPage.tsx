
import React, { useEffect, useState } from 'react';
import { User, Obra, UserRole, Page, Servico, Material } from '../../types';
import { apiService } from '../../services/apiService';
import Card from '../ui/Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardPageProps {
    user: User;
    navigateTo: (page: Page, obraId?: string) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ user, navigateTo }) => {
    const [obras, setObras] = useState<Obra[]>([]);
    const [servicos, setServicos] = useState<Servico[]>([]);
    const [materiais, setMateriais] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [obrasData, servicosData, materiaisData] = await Promise.all([
                    apiService.obras.getAll(),
                    apiService.servicos.getAll(),
                    apiService.materiais.getAll(),
                ]);
                setObras(obrasData);
                setServicos(servicosData);
                setMateriais(materiaisData);
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

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
    
    // Mock data for chart
    const data = [
      { name: 'Jan', Entradas: 4000, Saídas: 2400 },
      { name: 'Fev', Entradas: 3000, Saídas: 1398 },
      { name: 'Mar', Entradas: 9800, Saídas: 2000 },
      { name: 'Abr', Entradas: 3908, Saídas: 2780 },
      { name: 'Mai', Entradas: 4800, Saídas: 1890 },
      { name: 'Jun', Entradas: 3800, Saídas: 2390 },
    ];
    
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
                    <p className="text-5xl font-bold">12</p>
                    <p className="text-brand-gray">Presentes em todas as obras</p>
                </Card>
            </div>

            {user.role === UserRole.Admin && (
                 <Card title="Resumo Financeiro (Últimos 6 meses)">
                    <div className="h-80">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <XAxis dataKey="name" stroke="#6b7280" />
                                <YAxis stroke="#6b7280" />
                                <Tooltip wrapperClassName="!bg-white !border !border-gray-300 !rounded-lg" />
                                <Legend />
                                <Bar dataKey="Entradas" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Saídas" fill="#facc15" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                 </Card>
            )}

            <Card title="Acesso Rápido">
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button onClick={() => navigateTo('Obras')} className="p-4 bg-brand-light-gray rounded-lg text-center hover:bg-gray-200 transition">
                        <span className="text-3xl">🏗️</span>
                        <p className="font-semibold mt-2 text-brand-blue">Ver Obras</p>
                    </button>
                    {user.role !== UserRole.Cliente &&
                    <button onClick={() => navigateTo('Funcionarios')} className="p-4 bg-brand-light-gray rounded-lg text-center hover:bg-gray-200 transition">
                        <span className="text-3xl">👷</span>
                        <p className="font-semibold mt-2 text-brand-blue">Funcionários</p>
                    </button>
                    }
                    {user.role === UserRole.Admin &&
                    <button onClick={() => navigateTo('Financeiro')} className="p-4 bg-brand-light-gray rounded-lg text-center hover:bg-gray-200 transition">
                        <span className="text-3xl">💰</span>
                        <p className="font-semibold mt-2 text-brand-blue">Financeiro</p>
                    </button>
                    }
                     <button onClick={() => navigateTo('Relatorios')} className="p-4 bg-brand-light-gray rounded-lg text-center hover:bg-gray-200 transition">
                        <span className="text-3xl">📄</span>
                        <p className="font-semibold mt-2 text-brand-blue">Relatórios</p>
                    </button>
                 </div>
            </Card>
        </div>
    );
};

export default DashboardPage;
