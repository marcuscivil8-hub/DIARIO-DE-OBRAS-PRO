
import React, { useState } from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface LoginPageProps {
    onLogin: (email: string, password: string) => Promise<void>;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [testResult, setTestResult] = useState<string | null>(null);


    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setTestResult(null);
        setLoading(true);
        try {
            await onLogin(email, password);
            // O sucesso é implícito; a navegação é tratada pelo App.tsx
        } catch (err: any) {
            // A mensagem de erro agora vem diretamente da apiService, mais específica.
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAdminTest = async () => {
        setError('');
        setTestResult(null);
        setLoading(true);
        try {
            // Se o login for bem-sucedido, o App.tsx navegará para o dashboard.
            await onLogin('admin@diariodeobra.pro', '12345678');
        } catch (err: any) {
            if (err.message.includes('Email ou senha inválidos')) {
                setTestResult("Falha no Teste: As credenciais 'admin@diariodeobra.pro' / '12345678' estão incorretas no Supabase. Por favor, recrie o usuário com atenção à senha e ativando a opção 'Auto confirm user'.");
            } else {
                 setTestResult(`Falha no Teste com um erro inesperado: ${err.message}`);
            }
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
                            // FIX: Cast event target to HTMLInputElement to access value property.
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
                            // FIX: Cast event target to HTMLInputElement to access value property.
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

                <div className="bg-white rounded-xl shadow-2xl p-8 mt-4">
                    <Button type="button" variant="secondary" onClick={handleAdminTest} className="w-full" disabled={loading}>
                        {loading ? 'Testando...' : 'Testar Login Admin Padrão'}
                    </Button>
                     {testResult && (
                        <div className="mt-4 text-sm text-center p-3 rounded-lg bg-red-50 text-red-800 border border-red-200">
                            {testResult}
                        </div>
                    )}
                </div>

                 <Card className="mt-6 text-sm bg-blue-50 border border-blue-200">
                    <h4 className="font-bold text-brand-blue mb-2">Problemas para acessar?</h4>
                    <p className="text-brand-gray">
                        Certifique-se de que o usuário administrador foi criado no painel do Supabase.
                    </p>
                    <ul className="list-disc list-inside text-brand-gray space-y-1 mt-2">
                        <li>Email: <code className="bg-gray-200 px-1 rounded">admin@diariodeobra.pro</code></li>
                        <li>Senha: <code className="bg-gray-200 px-1 rounded">12345678</code></li>
                        <li>A opção <strong>"Auto confirm user"</strong> deve estar ativada durante a criação.</li>
                    </ul>
                </Card>
            </div>
        </div>
    );
};

export default LoginPage;
