
import { createClient } from '@supabase/supabase-js';

// URL do seu projeto Supabase.
// Verifique se esta URL está correta. Você pode encontrá-la em:
// Painel do Supabase -> Project Settings -> API -> Project URL
const supabaseUrl = 'https://yaaqffcvpghdamtkzvea.supabase.co';

// Chave de API pública (anon) do seu projeto Supabase.
// Esta chave foi fornecida por você e inserida aqui para corrigir os erros de conexão.
const supabaseAnonKey = 'sb_publishable_v8Sn0Zk4eZN0hKjMTGSUhg_Gx4dnP9V';

// A validação de erro anterior foi removida, pois estava configurada incorretamente
// e exibia uma mensagem de erro mesmo com a chave correta, o que causava a falha
// na comunicação com as funções do servidor (como a de criar usuários).
// 
// Se ainda encontrar problemas, verifique se a URL acima está correta e se as
// Edge Functions ('create-user', 'delete-user') estão devidamente implantadas
// e com as variáveis de ambiente configuradas no seu painel Supabase.

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
