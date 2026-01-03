import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÃO DO SUPABASE ---
// O código agora lê as credenciais das Variáveis de Ambiente, que são seguras para produção.
// Você PRECISA configurar essas variáveis no painel da Vercel para que o app funcione online.

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    const errorMessage = `
        <div style="max-width: 600px;">
            <h1 style="font-size: 1.5rem; font-weight: bold; color: #b91c1c;">Erro de Configuração do Supabase</h1>
            <p style="margin-top: 1rem; color: #374151;">As variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY não foram configuradas no ambiente de produção (Vercel).</p>
            <div style="text-align: left; background-color: #fff; padding: 1.5rem; border-radius: 0.5rem; margin-top: 1.5rem; border: 1px solid #fecaca; color: #374151;">
                <h2 style="font-weight: bold; font-size: 1.125rem; margin-bottom: 0.75rem;">Como resolver:</h2>
                <ol style="list-style-type: decimal; padding-left: 1.5rem; line-height: 1.75;">
                    <li>Acesse o painel do seu projeto no <strong>Supabase</strong>.</li>
                    <li>Vá para <strong>Project Settings</strong> (ícone de engrenagem) > <strong>API</strong>.</li>
                    <li>Copie a <strong>Project URL</strong> e a chave <strong>anon public</strong>.</li>
                    <li>Acesse o seu projeto na <strong>Vercel</strong>.</li>
                    <li>Vá para <strong>Settings</strong> > <strong>Environment Variables</strong>.</li>
                    <li>Crie duas variáveis:
                        <ul>
                            <li><strong>Name:</strong> <code>SUPABASE_URL</code>, <strong>Value:</strong> (cole a URL que você copiou)</li>
                            <li><strong>Name:</strong> <code>SUPABASE_ANON_KEY</code>, <strong>Value:</strong> (cole a chave 'anon public' que você copiou)</li>
                        </ul>
                    </li>
                    <li>Faça um novo deploy do seu projeto na Vercel para aplicar as alterações.</li>
                </ol>
            </div>
        </div>
    `;

    // Mostra um erro claro na tela se o app for publicado sem as variáveis.
    const rootEl = document.getElementById('root');
    if (rootEl) {
        rootEl.innerHTML = `<div style="font-family: sans-serif; padding: 2rem; text-align: center; background-color: #fef2f2; height: 100vh; display: flex; flex-flow: column; align-items: center; justify-content: center;">${errorMessage}</div>`;
    }
    
    throw new Error("As credenciais do Supabase não foram definidas nas variáveis de ambiente! Siga as instruções na tela.");
}


export const supabase = createClient(supabaseUrl, supabaseAnonKey);