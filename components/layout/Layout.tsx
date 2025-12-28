
import React, { useState } from 'react';
import { User, Page } from '../../types';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
    user: User;
    navigateTo: (page: Page) => void;
    onLogout: () => void;
    currentPage: Page;
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ user, navigateTo, onLogout, currentPage, children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-brand-light-gray">
            <Sidebar 
                user={user} 
                navigateTo={navigateTo} 
                onLogout={onLogout}
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header 
                    currentPage={currentPage}
                    user={user}
                    onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                />
                <main className="flex-1 min-h-0 overflow-x-hidden overflow-y-auto bg-brand-light-gray">
                    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;