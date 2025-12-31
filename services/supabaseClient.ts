import { createClient } from '@supabase/supabase-js';

// ATENÇÃO: As credenciais do Supabase foram atualizadas conforme solicitado.
// Verifique se a URL e a 'anon key' estão corretas, copiadas do painel do seu projeto em https://supabase.com/
// (em Configurações do Projeto > API). A 'anon key' (pública) é um token JWT longo.
const supabaseUrl = 'https://yktwketpygbqkrwldebp.supabase.co';
const supabaseAnonKey = 'sb_publishable_CkLjs4FCoCcQYkP5bZ9XNQ_4aZF05gJ';

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('As credenciais do Supabase (URL e Anon Key) são obrigatórias.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);