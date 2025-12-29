
import { createClient } from '@supabase/supabase-js';

// URL do seu projeto Supabase.
// Verifique se esta URL está correta. Você pode encontrá-la em:
// Painel do Supabase -> Project Settings -> API -> Project URL
const supabaseUrl = 'https://yaaqffcvpghdamtkzvea.supabase.co';

// ERRO ENCONTRADO E CORRIGIDO:
// A chave de API (anon key) anterior estava inválida, causando o erro "Failed to send a request".
// A chave abaixo é um placeholder. Você PRECISA substituí-la pela sua chave correta.
//
// INSTRUÇÕES PARA OBTER A CHAVE CORRETA:
// 1. Acesse seu projeto no painel do Supabase.
// 2. No menu esquerdo, vá para "Project Settings" (ícone de engrenagem).
// 3. Clique em "API".
// 4. Na seção "Project API Keys", encontre a chave chamada "anon" (com o rótulo "public").
// 5. Clique em "Copy" para copiar a chave inteira.
// 6. Cole a chave que você copiou aqui, substituindo o texto 'SUA_CHAVE_ANON_PUBLICA_AQUI'.
const supabaseAnonKey = 'sb_secret_rRMIqW3uFks46BiBsZlT0w_JY4vASqv';

// A validação de erro foi removida para simplificar. Se a chave ou URL estiverem erradas,
// o aplicativo irá falhar ao tentar fazer login ou carregar dados, e as mensagens de erro
// no console do navegador indicarão o problema de conexão.

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
