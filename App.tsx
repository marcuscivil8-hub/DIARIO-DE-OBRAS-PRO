import React, { useState, useEffect } from 'react';
import { User, UserRole, Page } from './types';
import Layout from './components/layout/Layout';
import LoginPage from './components/pages/LoginPage';
import DashboardPage from './components/pages/DashboardPage';
import ObrasPage from './components/pages/ObrasPage';
import ObraDetailPage from './components/pages/ObraDetailPage';
import FuncionariosPage from './components/pages/FuncionariosPage';
import CadastroFuncionariosPage from './components/pages/CadastroFuncionariosPage';
import FinanceiroPage from './components/pages/FinanceiroPage';
import MateriaisPage from './components/pages/MateriaisPage';
import FerramentasPage from './components/pages/FerramentasPage';
import RelatoriosPage from './components/pages/RelatoriosPage';
import UsuariosPage from './components/pages/UsuariosPage';
import AlmoxarifadoPage from './components/pages/AlmoxarifadoPage';
import DocumentosPage from './components/pages/DocumentosPage';
import { authService } from './services/authService';

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [currentPage, setCurrentPage] = useState<Page>('Dashboard');
    const [selectedObraId, setSelectedObraId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        // Ouve as mudanças de estado de autenticação (login, logout)
        const subscription = authService.onAuthStateChange(setCurrentUser);

        // Verifica a sessão inicial quando o app carrega
        authService.getSession().then(session => {
            if (session) {
                authService.getUserFromSession(session).then(user => {
                    setCurrentUser(user);
                    setLoading(false);
                });
            } else {
                setLoading(false);
            }
        });

        // Limpa a inscrição ao desmontar o componente
        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    const handleLogin = async (email: string, password: string): Promise<void> => {
        await authService.login(email, password);
        // O onAuthStateChange cuidará de atualizar o estado do usuário
        setCurrentPage('Dashboard');
    };

    const handleLogout = async () => {
        await authService.logout();
        // O onAuthStateChange cuidará de limpar o estado do usuário
        setCurrentPage('Dashboard'); // Redireciona para o login
    };

    const navigateTo = (page: Page, obraId?: string) => {
        setCurrentPage(page);
        if (obraId) {
            setSelectedObraId(obraId);
        } else {
            setSelectedObraId(null);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-brand-blue text-white text-xl">Carregando Diário de Obra Pro...</div>;
    }

    const renderPage = () => {
        if (!currentUser) return <LoginPage onLogin={handleLogin} />;
        
        switch (currentPage) {
            case 'Dashboard':
                return <DashboardPage user={currentUser} navigateTo={navigateTo} />;
            case 'Obras':
                return <ObrasPage user={currentUser} navigateTo={navigateTo} />;
            case 'ObraDetail':
                 return selectedObraId ? <ObraDetailPage user={currentUser} obraId={selectedObraId} navigateTo={navigateTo} /> : <ObrasPage user={currentUser} navigateTo={navigateTo} />;
            case 'CadastroFuncionarios':
                return <CadastroFuncionariosPage user={currentUser} />;
            case 'Funcionarios':
                return <FuncionariosPage user={currentUser} />;
            case 'Financeiro':
                return (currentUser.role === UserRole.Admin || currentUser.role === UserRole.Encarregado) ? <FinanceiroPage user={currentUser} /> : <DashboardPage user={currentUser} navigateTo={navigateTo} />;
            case 'Almoxarifado':
                return currentUser.role === UserRole.Admin || currentUser.role === UserRole.Encarregado ? <AlmoxarifadoPage navigateTo={navigateTo} /> : <DashboardPage user={currentUser} navigateTo={navigateTo} />;
            case 'Materiais':
                return <MateriaisPage user={currentUser} />;
            case 'Ferramentas':
                return <FerramentasPage user={currentUser} />;
            case 'Relatorios':
                return currentUser.role === UserRole.Admin ? <RelatoriosPage /> : <DashboardPage user={currentUser} navigateTo={navigateTo} />;
            case 'Usuarios':
                 return currentUser.role === UserRole.Admin ? <UsuariosPage /> : <DashboardPage user={currentUser} navigateTo={navigateTo} />;
            case 'Documentos':
                return (currentUser.role === UserRole.Admin || currentUser.role === UserRole.Cliente) ? <DocumentosPage user={currentUser} /> : <DashboardPage user={currentUser} navigateTo={navigateTo} />;
            default:
                return <DashboardPage user={currentUser} navigateTo={navigateTo} />;
        }
    };

    if (!currentUser) {
        return <LoginPage onLogin={handleLogin} />;
    }

    return (
        <Layout user={currentUser} navigateTo={navigateTo} onLogout={handleLogout} currentPage={currentPage}>
            {renderPage()}
        </Layout>
    );
};

export default App;