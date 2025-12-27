
import React, { useState, useEffect } from 'react';
import { User, UserRole, Page } from './types';
import { initialUsers } from './services/dataService';
import Layout from './components/layout/Layout';
import LoginPage from './components/pages/LoginPage';
import DashboardPage from './components/pages/DashboardPage';
import ObrasPage from './components/pages/ObrasPage';
import ObraDetailPage from './components/pages/ObraDetailPage';
import FuncionariosPage from './components/pages/FuncionariosPage';
import FinanceiroPage from './components/pages/FinanceiroPage';
import MateriaisPage from './components/pages/MateriaisPage';
import FerramentasPage from './components/pages/FerramentasPage';
import RelatoriosPage from './components/pages/RelatoriosPage';
import UsuariosPage from './components/pages/UsuariosPage';
import useLocalStorage from './hooks/useLocalStorage';

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [currentPage, setCurrentPage] = useState<Page>('Dashboard');
    const [selectedObraId, setSelectedObraId] = useState<string | null>(null);
    const [users, setUsers] = useLocalStorage<User[]>('users', initialUsers);

    useEffect(() => {
        // This effect can be used for initialization if needed
    }, []);

    const handleLogin = (username: string, password: string): boolean => {
        let user;
        if (username.toLowerCase() === 'admin') {
            // Special case for admin login without password
            user = users.find(u => u.username.toLowerCase() === 'admin');
        } else {
            // Standard login for other users
            user = users.find(u => u.username === username && u.password === password);
        }

        if (user) {
            setCurrentUser(user);
            setCurrentPage('Dashboard');
            return true;
        }
        return false;
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setCurrentPage('Dashboard');
    };

    const navigateTo = (page: Page, obraId?: string) => {
        setCurrentPage(page);
        if (obraId) {
            setSelectedObraId(obraId);
        } else {
            setSelectedObraId(null);
        }
    };

    const renderPage = () => {
        if (!currentUser) return <LoginPage onLogin={handleLogin} />;
        
        switch (currentPage) {
            case 'Dashboard':
                return <DashboardPage user={currentUser} navigateTo={navigateTo} />;
            case 'Obras':
                return <ObrasPage user={currentUser} navigateTo={navigateTo} />;
            case 'ObraDetail':
                 return selectedObraId ? <ObraDetailPage user={currentUser} obraId={selectedObraId} navigateTo={navigateTo} /> : <ObrasPage user={currentUser} navigateTo={navigateTo} />;
            case 'Funcionarios':
                return <FuncionariosPage user={currentUser} />;
            case 'Financeiro':
                return currentUser.role === UserRole.Admin ? <FinanceiroPage /> : <DashboardPage user={currentUser} navigateTo={navigateTo} />;
            case 'Materiais':
                return <MateriaisPage user={currentUser} />;
            case 'Ferramentas':
                return <FerramentasPage user={currentUser} />;
            case 'Relatorios':
                return <RelatoriosPage />;
            case 'Usuarios':
                 return currentUser.role === UserRole.Admin ? <UsuariosPage users={users} setUsers={setUsers} /> : <DashboardPage user={currentUser} navigateTo={navigateTo} />;
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
