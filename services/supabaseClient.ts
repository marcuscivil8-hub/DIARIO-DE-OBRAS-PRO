
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

// A verificação de chave inválida agora é tratada na página de Login para fornecer
// uma experiência de usuário melhor com instruções claras.
// Se a chave estiver errada, o Supabase retornará um erro 'Invalid API key'
// que será capturado e exibido na tela de login.

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
