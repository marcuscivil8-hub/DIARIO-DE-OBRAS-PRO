
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

const NavLink: React.FC<{ icon: React.ReactNode; label: Page; onClick: () => void; }> = ({ icon, label, onClick }) => (
    <button onClick={onClick} className="w-full flex items-center space-x-3 text-white/90 hover:bg-brand-yellow hover:text-brand-blue rounded-lg p-3 transition-colors duration-200">
        {icon}
        <span className="font-medium">{label}</span>
    </button>
);

const Sidebar: React.FC<SidebarProps> = ({ user, navigateTo, onLogout, isOpen, setIsOpen }) => {
    const commonLinks = [
        { icon: ICONS.dashboard, label: 'Dashboard' as Page },
        { icon: ICONS.obras, label: 'Obras' as Page },
    ];

    const userLinks = [
        { icon: ICONS.funcionarios, label: 'Funcionarios' as Page },
        { icon: ICONS.materiais, label: 'Materiais' as Page },
        { icon: ICONS.ferramentas, label: 'Ferramentas' as Page },
    ];
    
    const adminLinks = [
        { icon: ICONS.financeiro, label: 'Financeiro' as Page },
        { icon: ICONS.relatorios, label: 'Relatorios' as Page },
        { icon: ICONS.usuarios, label: 'Usuarios' as Page },
    ];
    
    let links = [...commonLinks];
    if (user.role === UserRole.Admin) {
        links = [...commonLinks, ...userLinks, ...adminLinks];
    } else if (user.role === UserRole.Encarregado) {
        links = [...commonLinks, ...userLinks, { icon: ICONS.relatorios, label: 'Relatorios' as Page }];
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
            <aside className={`bg-brand-blue text-white w-64 min-h-screen flex-col justify-between p-4 fixed md:relative z-40 transform transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 flex`}>
                <div>
                    <div className="flex items-center justify-between mb-8">
                         <div className="flex flex-col">
                            <h1 className="text-2xl font-bold text-white">Engetch</h1>
                            <p className="text-white/80 mt-1">engenharia e projetos</p>
                        </div>
                         <button onClick={() => setIsOpen(false)} className="md:hidden text-white">
                             {ICONS.close}
                         </button>
                    </div>
                    <nav className="flex flex-col space-y-2">
                        {links.map(link => (
                            <NavLink key={link.label} icon={link.icon} label={link.label} onClick={() => handleNavigation(link.label)} />
                        ))}
                    </nav>
                </div>
                <div className="mt-auto">
                    <NavLink icon={ICONS.logout} label={'Logout' as Page} onClick={onLogout} />
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
