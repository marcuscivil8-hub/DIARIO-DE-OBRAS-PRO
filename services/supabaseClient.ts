import { createClient } from '@supabase/supabase-js';

// --- ATENÇÃO: CONFIGURAÇÃO MANUAL OBRIGATÓRIA DO SUPABASE ---
// O app está preso na tela de carregamento porque as credenciais abaixo estão incorretas ou são placeholders.
// Siga os passos para corrigir:

// 1. Acesse o painel do seu projeto no Supabase: https://supabase.com/dashboard
// 2. Vá para "Project Settings" (ícone de engrenagem no menu lateral) > "API".
// 3. Em "Project API keys", copie o valor da chave "anon" "public".
// 4. Cole a chave copiada na variável `supabaseAnonKey` abaixo.
// 5. Em "Project URL", copie a URL e cole na variável `supabaseUrl` abaixo.

const supabaseUrl = 'COLE_AQUI_SUA_URL_DO_SUPABASE';
const supabaseAnonKey = 'COLE_AQUI_SUA_CHAVE_ANON_PUBLICA_DO_SUPABASE';


if (supabaseUrl.startsWith('COLE_AQUI') || supabaseAnonKey.startsWith('COLE_AQUI') || supabaseAnonKey.startsWith('sb_publishable')) {
    const errorMessage = `
        <div style="font-family: sans-serif; padding: 2rem; text-align: center; background-color: #fef2f2; height: 100vh; display: flex; flex-flow: column; align-items: center; justify-content: center;">
            <div style="max-width: 600px;">
                <h1 style="font-size: 1.5rem; font-weight: bold; color: #b91c1c;">Erro Crítico: Configuração do Supabase Incompleta</h1>
                <p style="margin-top: 1rem; color: #374151;">O aplicativo não consegue se conectar ao banco de dados. Insira as credenciais corretas para continuar.</p>
                <div style="text-align: left; background-color: #fff; padding: 1.5rem; border-radius: 0.5rem; margin-top: 1.5rem; border: 1px solid #fecaca; color: #374151;">
                    <h2 style="font-weight: bold; font-size: 1.125rem; margin-bottom: 0.75rem;">Como resolver:</h2>
                    <ol style="list-style-type: decimal; padding-left: 1.5rem; line-height: 1.75;">
                        <li>No seu editor de código, abra o arquivo: <strong><code>services/supabaseClient.ts</code></strong>.</li>
                        <li>Acesse o painel do seu projeto no <strong>Supabase</strong>.</li>
                        <li>Vá para <strong>Project Settings</strong> > <strong>API</strong>.</li>
                        <li>Copie a <strong>Project URL</strong> e a chave <strong>anon public</strong>.</li>
                        <li>No arquivo <code>services/supabaseClient.ts</code>, substitua os valores de placeholder pelas suas credenciais:
                            <ul style="list-style-type: disc; padding-left: 1.5rem; margin-top: 0.5rem; font-family: monospace; background: #f3f4f6; padding: 0.5rem; border-radius: 4px;">
                                <li style="margin-bottom: 0.5rem;"><code>const supabaseUrl = 'SUA_URL_AQUI';</code></li>
                                <li><code>const supabaseAnonKey = 'SUA_CHAVE_AQUI';</code></li>
                            </ul>
                        </li>
                        <li>Salve o arquivo e faça um novo deploy.</li>
                    </ol>
                </div>
            </div>
        </div>
    `;

    const rootEl = document.getElementById('root');
    if (rootEl) {
        rootEl.innerHTML = errorMessage;
    }
    
    throw new Error("As credenciais do Supabase não foram definidas corretamente no arquivo services/supabaseClient.ts.");
}


export const supabase = createClient(supabaseUrl, supabaseAnonKey);