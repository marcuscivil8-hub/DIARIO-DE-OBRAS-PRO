
import React from 'react';
import { Page, User } from '../../types';
import { ICONS } from '../../constants';

interface HeaderProps {
    currentPage: Page;
    user: User;
    onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, user, onToggleSidebar }) => {
    return (
        <header className="bg-white shadow-md p-4 flex justify-between items-center">
            <div className="flex items-center">
                <button onClick={onToggleSidebar} className="text-gray-600 focus:outline-none md:hidden mr-4">
                    {ICONS.menu}
                </button>
                <h1 className="text-xl md:text-2xl font-semibold text-brand-blue">{currentPage}</h1>
            </div>
            <div className="text-right">
                <p className="text-gray-800 font-medium">{user.name}</p>
                <p className="text-sm text-brand-gray">{user.role}</p>
            </div>
        </header>
    );
};

export default Header;
