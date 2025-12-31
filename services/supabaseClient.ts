import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÃO DO SUPABASE ---
// IMPORTANTE: Substitua os valores abaixo pela URL e Chave Anônima (public anon key) do seu projeto Supabase.
// Você pode encontrar essas informações no painel do seu projeto em:
// Configurações do Projeto (ícone de engrenagem) > API

// 1. URL do seu projeto.
const supabaseUrl = 'https://yktwketpygbqkrwldebp.supabase.co';

// 2. Cole a Chave Anônima (public anon key) aqui.
//    Esta chave é segura para ser usada no navegador.
const supabaseAnonKey = 'sb_publishable_CkLjs4FCoCcQYkP5bZ9XNQ_4aZF05gJ'; // <-- SUBSTITUA ESTE VALOR

if (!supabaseUrl || supabaseAnonKey.startsWith('COLE_SUA')) {
    const errorMessage = `
        <div style="max-width: 600px;">
            <h1 style="font-size: 1.5rem; font-weight: bold; color: #b91c1c;">Erro de Configuração do Supabase</h1>
            <p style="margin-top: 1rem; color: #374151;">A chave de API (anon key) do seu projeto Supabase não foi configurada. O aplicativo não pode se conectar ao banco de dados sem ela.</p>
            <div style="text-align: left; background-color: #fff; padding: 1.5rem; border-radius: 0.5rem; margin-top: 1.5rem; border: 1px solid #fecaca; color: #374151;">
                <h2 style="font-weight: bold; font-size: 1.125rem; margin-bottom: 0.75rem;">Como resolver:</h2>
                <ol style="list-style-type: decimal; padding-left: 1.5rem; line-height: 1.75;">
                    <li>Acesse o painel do seu projeto em <strong>supabase.com</strong>.</li>
                    <li>Vá para <strong>Project Settings</strong> (ícone de engrenagem) > <strong>API</strong>.</li>
                    <li>Encontre a chave <strong>anon</strong> <strong>public</strong> na seção <strong>Project API keys</strong> e copie-a.</li>
                    <li>Abra o arquivo: <code>services/supabaseClient.ts</code>.</li>
                    <li>Substitua o texto <code>'COLE_SUA_CHAVE_PUBLICA_ANONIMA_AQUI'</code> pela chave que você copiou.</li>
                </ol>
            </div>
        </div>
    `;

    // Mostra um erro na tela se o app tentar carregar com credenciais faltando
    const rootEl = document.getElementById('root');
    if (rootEl) {
        rootEl.innerHTML = `<div style="font-family: sans-serif; padding: 2rem; text-align: center; background-color: #fef2f2; height: 100vh; display: flex; flex-flow: column; align-items: center; justify-content: center;">${errorMessage}</div>`;
    }
    
    throw new Error("As credenciais do Supabase não foram definidas! Edite o arquivo services/supabaseClient.ts.");
}


export const supabase = createClient(supabaseUrl, supabaseAnonKey);