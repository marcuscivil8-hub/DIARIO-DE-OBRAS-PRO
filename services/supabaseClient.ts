import { createClient } from '@supabase/supabase-js';

// --- ATENÇÃO: CONFIGURAÇÃO MANUAL OBRIGATÓRIA DO SUPABASE ---
// Para que o aplicativo funcione online (na Vercel ou em qualquer lugar),
// você PRECISA substituir os valores de placeholder abaixo pelas suas
// credenciais reais do Supabase.

// 1. Acesse o painel do seu projeto no Supabase.
// 2. Vá para "Project Settings" (ícone de engrenagem) > "API".
// 3. Copie o valor de "Project URL" e cole na variável `supabaseUrl`.
// 4. Copie o valor da chave "anon" "public" e cole na variável `supabaseAnonKey`.

const supabaseUrl = 'https://yktwketpygbqkrwldebp.supabase.co';
const supabaseAnonKey = 'sb_publishable_CkLjs4FCoCcQYkP5bZ9XNQ_4aZF05gJ';


if (supabaseUrl.startsWith('https://yktwketpygbqkrwldebp.supabase.co') || supabaseAnonKey.startsWith('sb_publishable_CkLjs4FCoCcQYkP5bZ9XNQ_4aZF05gJ
        <div style="max-width: 600px;">
            <h1 style="font-size: 1.5rem; font-weight: bold; color: #b91c1c;">Erro Crítico: Configuração Manual do Supabase Necessária</h1>
            <p style="margin-top: 1rem; color: #374151;">As credenciais de acesso ao Supabase não foram inseridas no código-fonte do aplicativo.</p>
            <div style="text-align: left; background-color: #fff; padding: 1.5rem; border-radius: 0.5rem; margin-top: 1.5rem; border: 1px solid #fecaca; color: #374151;">
                <h2 style="font-weight: bold; font-size: 1.125rem; margin-bottom: 0.75rem;">Como resolver:</h2>
                <ol style="list-style-type: decimal; padding-left: 1.5rem; line-height: 1.75;">
                    <li>No seu editor de código, abra o arquivo: <strong><code>services/supabaseClient.ts</code></strong>.</li>
                    <li>Acesse o painel do seu projeto no <strong>Supabase</strong>.</li>
                    <li>Vá para <strong>Project Settings</strong> (ícone de engrenagem) > <strong>API</strong>.</li>
                    <li>Copie a <strong>Project URL</strong> e a chave <strong>anon public</strong>.</li>
                    <li>No arquivo <code>services/supabaseClient.ts</code>, substitua os valores de placeholder pelas suas credenciais:
                        <ul style="list-style-type: disc; padding-left: 1.5rem; margin-top: 0.5rem; font-family: monospace; background: #f3f4f6; padding: 0.5rem; border-radius: 4px;">
                            <li style="margin-bottom: 0.5rem;"><code>const supabaseUrl = 'SUA_URL_AQUI';</code></li>
                            <li><code>const supabaseAnonKey = 'SUA_CHAVE_AQUI';</code></li>
                        </ul>
                    </li>
                    <li>Salve o arquivo e faça um novo deploy na Vercel.</li>
                </ol>
                <p style="margin-top: 1rem; font-size: 0.875rem; color: #4b5563;"><strong>Nota:</strong> A chave 'anon public' é segura para ser usada no front-end.</p>
            </div>
        </div>
    `;

    // Mostra um erro claro na tela se o app for publicado sem as variáveis.
    const rootEl = document.getElementById('root');
    if (rootEl) {
        rootEl.innerHTML = `<div style="font-family: sans-serif; padding: 2rem; text-align: center; background-color: #fef2f2; height: 100vh; display: flex; flex-flow: column; align-items: center; justify-content: center;">${errorMessage}</div>`;
    }
    
    throw new Error("As credenciais do Supabase não foram definidas no arquivo services/supabaseClient.ts. Siga as instruções na tela.");
}


export const supabase = createClient(supabaseUrl, supabaseAnonKey);