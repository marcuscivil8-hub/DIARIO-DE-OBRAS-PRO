import React, { useState } from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface LoginPageProps {
    onLogin: (email: string, password: string) => Promise<void>;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('admin@diariodeobra.pro');
    const [password, setPassword] = useState('password');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await onLogin(email, password);
            // O sucesso é implícito; a navegação é tratada pelo App.tsx
        } catch (err: any) {
            // A mensagem de erro agora vem diretamente da authService, mais específica.
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-blue flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white">Engetch</h1>
                    <p className="text-white/80 mt-1">engenharia e projetos</p>
                </div>
                <form onSubmit={handleLogin} className="bg-white rounded-xl shadow-2xl p-8 space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-brand-gray mb-2">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-yellow focus:border-transparent transition"
                            required
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-brand-gray mb-2">
                            Senha
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-yellow focus:border-transparent transition"
                            required
                            disabled={loading}
                        />
                    </div>
                    
                    {error && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{error}</p>}

                    <Button type="submit" className="w-full !py-4 text-lg" disabled={loading}>
                        {loading ? 'Entrando...' : 'Entrar'}
                    </Button>
                </form>

                 <div className="text-center mt-4 text-white/80 text-sm">
                    <p className="font-bold">Usuários de Teste:</p>
                    <p>admin@diariodeobra.pro (Admin)</p>
                    <p>joao@diariodeobra.pro (Encarregado)</p>
                    <p>maria@cliente.com (Cliente)</p>
                    <p>Senha para todos: <strong>password</strong></p>
                </div>

            </div>
        </div>
    );
};

export default LoginPage;
