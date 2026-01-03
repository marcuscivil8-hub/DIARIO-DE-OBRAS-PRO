
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { User, UserRole, Page } from './types';
import Layout from './components/layout/Layout';
import LoginPage from './components/pages/LoginPage';
import { authService } from './services/authService';
import { dataService } from './services/dataService';
import { DataProvider } from './contexts/DataContext';
import PageLoader from './components/ui/PageLoader';

// New imports for Supabase setup
import { initializeSupabase, getCredentialsFromStorage, getSupabaseClient, clearCredentialsFromStorage } from './services/supabaseClient';
import SupabaseSetupPage from './components/pages/SupabaseSetupPage';


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
    const [supabaseInitialized, setSupabaseInitialized] = useState(false);
    const [supabaseConfigError, setSupabaseConfigError] = useState<string | null>(null);
    
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [currentPage, setCurrentPage] = useState<Page>('Dashboard');
    const [selectedObraId, setSelectedObraId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true); // App loading state

    useEffect(() => {
        const { url, anonKey } = getCredentialsFromStorage();
        if (url && anonKey) {
            try {
                initializeSupabase(url, anonKey);
                setSupabaseInitialized(true);
            } catch (err: any) {
                console.error("Failed to init Supabase from localStorage:", err);
                clearCredentialsFromStorage();
                setSupabaseConfigError("As credenciais salvas são inválidas. Por favor, insira novamente.");
                setSupabaseInitialized(false);
                setLoading(false);
            }
        } else {
            setSupabaseInitialized(false);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!supabaseInitialized) return;

        setLoading(true); // Keep the app in a loading state until the initial session is determined.
        const client = getSupabaseClient();
        
        // onAuthStateChange fires immediately with the current session, so it handles the initial check.
        const { data: { subscription } } = client.auth.onAuthStateChange(async (_event, session) => {
            try {
                if (session?.user) {
                    // If there's a user session, fetch their profile from the 'users' table.
                    const userProfile = await dataService.users.getById(session.user.id);
                    setCurrentUser(userProfile);
                } else {
                    // If there's no session, ensure the current user is null.
                    setCurrentUser(null);
                }
            } catch (err: any) {
                // If fetching the profile fails, the stored credentials might be stale or invalid.
                console.error("Auth state change error:", err.message);
                clearCredentialsFromStorage();
                setSupabaseConfigError("Falha ao buscar o perfil do usuário. Verifique suas credenciais e tente novamente.");
                setSupabaseInitialized(false); // Force re-configuration.
            } finally {
                // This is the single point of truth for ending the initial auth loading state.
                setLoading(false);
            }
        });

        // Cleanup the subscription when the component unmounts.
        return () => {
            subscription?.unsubscribe();
        };
    }, [supabaseInitialized]);


    const handleLogin = async (email: string, password: string): Promise<void> => {
        await authService.login(email, password);
        setCurrentPage('Dashboard');
    };

    const handleLogout = async () => {
        await authService.logout();
        setCurrentPage('Dashboard'); 
    };

    const navigateTo = (page: Page, obraId?: string) => {
        setCurrentPage(page);
        setSelectedObraId(obraId || null);
    };

    const handleSupabaseConfigured = () => {
        setSupabaseConfigError(null);
        setSupabaseInitialized(true);
    };
    
    const handleReconfigureSupabase = () => {
        clearCredentialsFromStorage();
        setCurrentUser(null);
        setSupabaseInitialized(false);
    };

    if (!supabaseInitialized) {
        const { url, anonKey } = getCredentialsFromStorage();
        return <SupabaseSetupPage onConfigured={handleSupabaseConfigured} initialUrl={url || ''} initialKey={anonKey || ''} error={supabaseConfigError || undefined} />;
    }

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-brand-blue text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-yellow mb-4"></div>
                <p className="text-xl font-semibold">Carregando Engetch Pro...</p>
            </div>
        );
    }

    if (!currentUser) {
        return <LoginPage onLogin={handleLogin} onReconfigure={handleReconfigureSupabase} />;
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
