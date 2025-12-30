
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'danger';
    size?: 'sm' | 'md';
    className?: string;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
    const baseClasses = 'font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-4';

    const sizeClasses = {
        md: 'px-6 py-3',
        sm: 'px-3 py-1 text-sm',
    };

    const variantClasses = {
        primary: 'bg-brand-yellow text-brand-blue focus:ring-yellow-300',
        secondary: 'bg-brand-blue text-white focus:ring-blue-300',
        danger: 'bg-red-600 text-white focus:ring-red-300',
    };

    return (
        <button className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
};

export default Button;
