import React, { useState } from 'react';
import Button from '../ui/Button';
import { initializeSupabase } from '../../services/supabaseClient';

interface SupabaseSetupPageProps {
    onConfigured: () => void;
    initialUrl?: string;
    initialKey?: string;
    error?: string;
}

const SupabaseSetupPage: React.FC<SupabaseSetupPageProps> = ({ onConfigured, initialUrl = '', initialKey = '', error: initialError }) => {
    const [url, setUrl] = useState(initialUrl);
    const [anonKey, setAnonKey] = useState(initialKey);
    const [error, setError] = useState(initialError || '');
    const [loading, setLoading] = useState(false);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            initializeSupabase(url, anonKey);
            onConfigured();
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro desconhecido ao tentar inicializar a conexão.');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="min-h-screen bg-brand-blue flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-lg">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white">Configuração Inicial</h1>
                    <p className="text-white/80 mt-1">Insira suas credenciais do Supabase para começar.</p>
                </div>
                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl p-8 space-y-6">
                    <p className="text-sm text-brand-gray bg-blue-50 p-3 rounded-lg border border-blue-200">
                        Suas credenciais são salvas <strong>apenas no seu navegador</strong>.
                        Você pode encontrá-las em seu painel Supabase em <code className="bg-gray-200 p-1 rounded">Project Settings &gt; API</code>.
                    </p>
                    <div>
                        <label htmlFor="url" className="block text-sm font-medium text-brand-gray mb-2">
                            Project URL
                        </label>
                        <input
                            id="url"
                            type="url"
                            placeholder="https://exemplo.supabase.co"
                            value={url}
                            onChange={(e) => setUrl((e.target as HTMLInputElement).value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-yellow focus:border-transparent transition"
                            required
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <label htmlFor="key" className="block text-sm font-medium text-brand-gray mb-2">
                            Project API Key (anon public)
                        </label>
                        <input
                            id="key"
                            type="text"
                            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                            value={anonKey}
                            onChange={(e) => setAnonKey((e.target as HTMLInputElement).value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-yellow focus:border-transparent transition"
                            required
                            disabled={loading}
                        />
                    </div>
                    
                    {error && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{error}</p>}

                    <Button type="submit" className="w-full !py-4 text-lg" disabled={loading}>
                        {loading ? 'Verificando...' : 'Salvar e Continuar'}
                    </Button>
                </form>
            </div>
        </div>
    );
}

export default SupabaseSetupPage;
