import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole, Page } from './types';
import Layout from './components/layout/Layout';
import LoginPage from './components/pages/LoginPage';
import DashboardPage from './components/pages/DashboardPage';
import ObrasPage from './components/pages/ObrasPage';
import ObraDetailPage from './components/pages/ObraDetailPage';
import FolhaPontoPage from './components/pages/FuncionariosPage';
import GerenciarFuncionariosPage from './components/pages/CadastroFuncionariosPage';
import FinanceiroPage from './components/pages/FinanceiroPage';
import MateriaisPage from './components/pages/MateriaisPage';
import FerramentasPage from './components/pages/FerramentasPage';
import RelatoriosPage from './components/pages/RelatoriosPage';
import UsuariosPage from './components/pages/UsuariosPage';
import AlmoxarifadoPage from './components/pages/AlmoxarifadoPage';
import DocumentosPage from './components/pages/DocumentosPage';
import { authService } from './services/authService';
import { supabase } from './services/supabaseClient';
import { dataService } from './services/dataService';

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [currentPage, setCurrentPage] = useState<Page>('Dashboard');
    const [selectedObraId, setSelectedObraId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        
        // Check initial session quickly
        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user && isMounted.current) {
                    const userProfile = await dataService.users.getById(session.user.id);
                    setCurrentUser(userProfile);
                }
            } catch (e) {
                console.error("Auth init error", e);
            } finally {
                if (isMounted.current) setLoading(false);
            }
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                const userProfile = await dataService.users.getById(session.user.id);
                setCurrentUser(userProfile);
            } else if (event === 'SIGNED_OUT') {
                setCurrentUser(null);
                setCurrentPage('Dashboard');
            }
        });

        return () => {
            isMounted.current = false;
            subscription.unsubscribe();
        };
    }, []);


    const handleLogin = async (email: string, password: string): Promise<void> => {
        await authService.login(email, password);
        setCurrentPage('Dashboard');
    };

    const handleLogout = async () => {
        await authService.logout();
    };

    const navigateTo = (page: Page, obraId?: string) => {
        setCurrentPage(page);
        setSelectedObraId(obraId || null);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-brand-blue text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-yellow mb-4"></div>
                <p className="text-xl font-semibold">Carregando Engetch Pro...</p>
            </div>
        );
    }

    if (!currentUser) {
        return <LoginPage onLogin={handleLogin} />;
    }

    const renderPage = () => {
        switch (currentPage) {
            case 'Dashboard':
                return <DashboardPage user={currentUser} navigateTo={navigateTo} />;
            case 'Obras':
                return <ObrasPage user={currentUser} navigateTo={navigateTo} />;
            case 'ObraDetail':
                 return selectedObraId ? <ObraDetailPage user={currentUser} obraId={selectedObraId} navigateTo={navigateTo} /> : <ObrasPage user={currentUser} navigateTo={navigateTo} />;
            case 'GerenciarFuncionarios':
                return <GerenciarFuncionariosPage user={currentUser} />;
            case 'FolhaPonto':
                return <FolhaPontoPage user={currentUser} />;
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

    return (
        <Layout user={currentUser} navigateTo={navigateTo} onLogout={handleLogout} currentPage={currentPage}>
            {renderPage()}
        </Layout>
    );
};

export default App;