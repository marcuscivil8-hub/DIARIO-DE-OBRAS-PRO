
import { createClient } from '@supabase/supabase-js';

// ATENÇÃO: A URL foi corrigida para apontar para o seu projeto Supabase correto.
const supabaseUrl = 'https://yaaqffcvpghdamtkzvea.supabase.co';

// IMPORTANTE: Você PRECISA substituir o valor abaixo pela sua chave de API 'anon' (pública).
// Siga estes passos para encontrá-la:
// 1. Acesse seu projeto no painel do Supabase.
// 2. Vá para "Project Settings" (ícone de engrenagem) -> "API".
// 3. Na seção "Project API Keys", copie a chave "anon" (public).
// 4. Cole a chave aqui, substituindo todo este texto entre as aspas.
const supabaseAnonKey = 'sb_publishable_v8Sn0Zk4eZN0hKjMTGSUhg_Gx4dnP9V';

if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey === 'sb_publishable_v8Sn0Zk4eZN0hKjMTGSUhg_Gx4dnP9V') {
    const errorMessage = "ERRO DE CONFIGURAÇÃO: A URL ou a chave de API do Supabase não foram definidas corretamente.";
    console.error(errorMessage);
    
    // Exibe um erro amigável na UI
    const rootElement = document.getElementById('root');
    if (rootElement) {
        rootElement.innerHTML = `
            <div style="font-family: sans-serif; padding: 2rem; text-align: center; background-color: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; border-radius: 0.5rem; margin: 2rem auto; max-width: 600px;">
                <h1 style="font-size: 1.25rem; font-weight: bold;">Erro de Configuração</h1>
                <p>A URL ou a Chave de API do Supabase estão ausentes ou incorretas no arquivo <strong>services/supabaseClient.ts</strong>.</p>
                <p style="margin-top: 1rem;">Por favor, abra este arquivo no código e siga as instruções para inserir a chave de API correta do seu projeto.</p>
            </div>
        `;
    }
    throw new Error(errorMessage);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
