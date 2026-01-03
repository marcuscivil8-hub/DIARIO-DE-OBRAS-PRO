
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { User, UserRole, Page } from './types';
import Layout from './components/layout/Layout';
import LoginPage from './components/pages/LoginPage';
import { authService } from './services/authService';
import { supabase } from './services/supabaseClient';
import { dataService } from './services/dataService';
import { DataProvider } from './contexts/DataContext';
import PageLoader from './components/ui/PageLoader';

// Lazy-load pages to split the code and improve initial load time
const DashboardPage = lazy(() => import('./components/pages/DashboardPage'));
const ObrasPage = lazy(() => import('./components/pages/ObrasPage'));
const ObraDetailPage = lazy(() => import('./components/pages/ObraDetailPage'));
const FolhaPontoPage = lazy(() => import('./components/pages/FuncionariosPage'));
const GerenciarFuncionariosPage = lazy(() => import('./components/pages/CadastroFuncionariosPage'));
const FinanceiroPage = lazy(() => import('./components/pages/FinanceiroPage'));
const MateriaisPage = lazy(() => import('./components/pages/MateriaisPage'));
const FerramentasPage = lazy(() => import('./components/pages/FerramentasPage'));
const RelatoriosPage = lazy(() => import('./components/pages/RelatoriosPage'));
const UsuariosPage = lazy(() => import('./components/pages/UsuariosPage'));
const AlmoxarifadoPage = lazy(() => import('./components/pages/AlmoxarifadoPage'));
const DocumentosPage = lazy(() => import('./components/pages/DocumentosPage'));


const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [currentPage, setCurrentPage] = useState<Page>('Dashboard');
    const [selectedObraId, setSelectedObraId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            const user = await authService.getCurrentUser();
            setCurrentUser(user);
            setLoading(false);
        };
        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                const userProfile = await dataService.users.getById(session.user.id);
                setCurrentUser(userProfile);
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);


    const handleLogin = async (email: string, password: string): Promise<void> => {
        await authService.login(email, password);
        // O onAuthStateChange listener irá lidar com a atualização do estado do usuário e o recarregamento dos dados
        setCurrentPage('Dashboard');
    };

    const handleLogout = async () => {
        await authService.logout();
        setCurrentPage('Dashboard'); // Navega para uma página segura após o logout
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
        <DataProvider>
            <Layout user={currentUser} navigateTo={navigateTo} onLogout={handleLogout} currentPage={currentPage}>
                <Suspense fallback={<PageLoader />}>
                    {renderPage()}
                </Suspense>
            </Layout>
        </DataProvider>
    );
};

export default App;