
import { createClient } from '@supabase/supabase-js';

// URL do seu projeto Supabase.
// Verifique se esta URL está correta. Você pode encontrá-la em:
// Painel do Supabase -> Project Settings -> API -> Project URL
const supabaseUrl = 'https://yaaqffcvpghdamtkzvea.supabase.co';

// Chave de API pública (anon) do seu projeto Supabase.
// =============================== ATENÇÃO ===============================
// O VALOR ABAIXO É UM EXEMPLO E PRECISA SER SUBSTITUÍDO PELA SUA CHAVE REAL.
// O erro "ERRO DE CONFIGURAÇÃO" acontece porque esta chave está incorreta.
//
// SIGA ESTES PASSOS PARA CORRIGIR:
// 1. Acesse seu projeto em https://supabase.com/
// 2. Vá para "Project Settings" (ícone de engrenagem no menu esquerdo).
// 3. Clique em "API" no menu lateral.
// 4. Na seção "Project API Keys", encontre a chave "anon" (public).
// 5. Clique no botão "Copy" para copiar a chave inteira.
// 6. Cole a chave AQUI, substituindo 'COLE_SUA_CHAVE_PUBLICA_ANON_DO_SUPABASE_AQUI'.
// =======================================================================
const supabaseAnonKey = 'sb_publishable_v8Sn0Zk4eZN0hKjMTGSUhg_Gx4dnP9V';

// Validação para ajudar a identificar o problema mais rápido no console.
if (supabaseAnonKey === 'sb_publishable_v8Sn0Zk4eZN0hKjMTGSUhg_Gx4dnP9V' || !supabaseAnonKey) {
    console.error(
        "ERRO DE CONFIGURAÇÃO: A chave de API do Supabase (supabaseAnonKey) não foi definida em services/supabaseClient.ts. " +
        "Por favor, substitua o valor de exemplo pela sua chave 'anon' pública real para que o aplicativo funcione."
    );
}


export const supabase = createClient(supabaseUrl, supabaseAnonKey);
