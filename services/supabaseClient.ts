import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÃO DO SUPABASE ---
// As credenciais abaixo foram preenchidas. A chave 'anon public' é segura para ser exposta no front-end.
const supabaseUrl = 'https://yktwketpygbqkrwldebp.supabase.co';
const supabaseAnonKey = 'sb_publishable_CkLjs4FCoCcQYkP5bZ9XNQ_4aZF05gJ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
