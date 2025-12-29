
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
    const [isApiKeyError, setIsApiKeyError] = useState(false);
    const [isRlsError, setIsRlsError] = useState(false);


    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsApiKeyError(false);
        setIsRlsError(false);
        setLoading(true);
        try {
            await onLogin(email, password);
            // O sucesso é implícito; a navegação é tratada pelo App.tsx
        } catch (err: any) {
            if (err.message.includes('Invalid API key')) {
                setIsApiKeyError(true);
                setError('A chave de API configurada é inválida. Veja as instruções abaixo.');
            } else if (err.message.includes('RLS_POLICY_ERROR')) {
                setIsRlsError(true);
                setError(err.message.split(': ')[1]); // Extrai a mensagem amigável
            } else {
                // A mensagem de erro agora vem diretamente da apiService, mais específica.
                setError(err.message);
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
                    
                    {error && !isApiKeyError && !isRlsError && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{error}</p>}

                    <Button type="submit" className="w-full !py-4 text-lg" disabled={loading}>
                        {loading ? 'Entrando...' : 'Entrar'}
                    </Button>
                </form>

                {isApiKeyError && (
                    <Card className="mt-6 text-sm bg-red-50 border border-red-200">
                        <h4 className="font-bold text-red-800 mb-2 text-base">Erro Crítico: Chave de API Inválida</h4>
                        <p className="text-red-700">A chave de conexão com o banco de dados (Supabase) está incorreta ou foi revogada. Para corrigir, por favor siga os passos:</p>
                        <ol className="list-decimal list-inside text-red-700 space-y-1 mt-2">
                            <li>Acesse seu projeto no <a href="https://supabase.com/" target="_blank" rel="noopener noreferrer" className="underline font-semibold">painel do Supabase</a>.</li>
                            <li>Navegue até <strong>Project Settings</strong> (ícone de engrenagem) &rarr; <strong>API</strong>.</li>
                            <li>Na seção <strong>Project API Keys</strong>, encontre a chave <code className="bg-gray-200 text-black px-1 rounded">anon</code> (public).</li>
                            <li>Clique para copiar a chave inteira.</li>
                            <li>Abra o arquivo <code className="bg-gray-200 text-black px-1 rounded">services/supabaseClient.ts</code> no seu projeto.</li>
                            <li>Cole a chave que você copiou, substituindo o valor atual da constante <code className="bg-gray-200 text-black px-1 rounded">supabaseAnonKey</code>.</li>
                        </ol>
                    </Card>
                )}
                
                {isRlsError && (
                     <Card className="mt-6 text-sm bg-red-50 border border-red-200">
                        <h4 className="font-bold text-red-800 mb-2 text-base">Erro Crítico: Falha ao Carregar Perfil</h4>
                        <p className="text-red-700">A autenticação funcionou, mas o app não conseguiu carregar os dados do perfil (nome, permissões). Isso quase sempre é causado pela falta de <strong>Políticas de Segurança (RLS)</strong> na sua tabela <strong>profiles</strong> no Supabase.</p>
                        <p className="text-red-700 mt-2">Para corrigir, siga os passos:</p>
                        <ol className="list-decimal list-inside text-red-700 space-y-2 mt-2">
                            <li>Acesse seu projeto no Supabase e vá para <strong>Authentication &rarr; Policies</strong>.</li>
                            <li>Na tabela <strong>profiles</strong>, clique em <strong>"Enable RLS"</strong> se estiver desativado.</li>
                            <li>Clique em <strong>"New Policy"</strong> &rarr; <strong>"For full customization"</strong> e crie a política abaixo para permitir que usuários leiam seus próprios dados:</li>
                        </ol>
                         <pre className="bg-gray-800 text-white p-3 rounded-md mt-2 text-xs overflow-x-auto">
                            <code>
{`-- Nome da Política:
-- Permite que usuários leiam seus próprios perfis.

-- Aplicar para a operação:
-- SELECT

-- Usando a expressão (USING expression):
auth.uid() = id`}
                            </code>
                         </pre>
                         <p className="text-red-700 mt-2">Após salvar a política, o login deve funcionar imediatamente.</p>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default LoginPage;
