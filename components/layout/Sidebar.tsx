
import React from 'react';
import { User, UserRole, Page } from '../../types';
import { ICONS } from '../../constants';

interface SidebarProps {
    user: User;
    navigateTo: (page: Page) => void;
    onLogout: () => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const NavLink: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; }> = ({ icon, label, onClick }) => (
    <button onClick={onClick} className="w-full flex items-center space-x-3 text-white/90 hover:bg-brand-yellow hover:text-brand-blue rounded-lg p-3 transition-colors duration-200">
        {icon}
        <span className="font-medium">{label}</span>
    </button>
);

const Sidebar: React.FC<SidebarProps> = ({ user, navigateTo, onLogout, isOpen, setIsOpen }) => {
    
    interface NavItem {
        icon: React.ReactNode;
        label: string;
        page: Page;
    }

    const commonLinks: NavItem[] = [
        { icon: ICONS.dashboard, label: 'Dashboard', page: 'Dashboard' },
        { icon: ICONS.obras, label: 'Obras', page: 'Obras' },
    ];

    const userLinks: NavItem[] = [
        { icon: ICONS.usuarios, label: 'Funcionários', page: 'CadastroFuncionarios' },
        { icon: ICONS.folhaPonto, label: 'Folha de Pontos', page: 'Funcionarios' },
        { icon: ICONS.materiais, label: 'Materiais', page: 'Materiais' },
        { icon: ICONS.ferramentas, label: 'Ferramentas', page: 'Ferramentas' },
        { icon: ICONS.almoxarifado, label: 'Almoxarifado', page: 'Almoxarifado' },
    ];
    
    const adminLinks: NavItem[] = [
        { icon: ICONS.relatorios, label: 'Relatórios', page: 'Relatorios' },
        { icon: ICONS.usuarios, label: 'Usuários', page: 'Usuarios' },
    ];
    
    let links: NavItem[] = [...commonLinks];
    
    if (user.role === UserRole.Admin) {
        links.push(...userLinks, { icon: ICONS.financeiro, label: 'Financeiro', page: 'Financeiro' }, ...adminLinks);
    } else if (user.role === UserRole.Encarregado) {
        links.push(...userLinks, { icon: ICONS.financeiro, label: 'Financeiro', page: 'Financeiro' });
    }
    // Client only has common links

    const handleNavigation = (page: Page) => {
        navigateTo(page);
        if (window.innerWidth < 768) { // md breakpoint
            setIsOpen(false);
        }
    }

    return (
        <>
            <div className={`fixed inset-0 bg-black/60 z-30 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsOpen(false)}></div>
            <aside className={`bg-brand-blue text-white w-64 min-h-screen flex flex-col p-4 fixed md:relative z-40 transform transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
                {/* Header (non-scrolling) */}
                <div className="flex-shrink-0">
                    <div className="flex items-center justify-between mb-8">
                         <div className="flex flex-col">
                            <h1 className="text-2xl font-bold text-white">Engetch</h1>
                            <p className="text-white/80 mt-1">engenharia e projetos</p>
                        </div>
                         <button onClick={() => setIsOpen(false)} className="md:hidden text-white">
                             {ICONS.close}
                         </button>
                    </div>
                </div>
                
                {/* Navigation (scrollable) */}
                <nav className="flex-1 flex flex-col space-y-2 overflow-y-auto">
                    {links.map(link => (
                        <NavLink key={link.label} icon={link.icon} label={link.label} onClick={() => handleNavigation(link.page)} />
                    ))}
                </nav>

                {/* Footer (non-scrolling) */}
                <div className="mt-4 flex-shrink-0">
                    <NavLink icon={ICONS.logout} label={'Logout'} onClick={onLogout} />
                </div>
            </aside>
        </>
    );
};

export default Sidebar;