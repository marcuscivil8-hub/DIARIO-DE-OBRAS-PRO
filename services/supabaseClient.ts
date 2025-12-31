import { createClient } from '@supabase/supabase-js';

// As credenciais do Supabase foram inseridas abaixo, conforme solicitado.
const supabaseUrl = 'https://sphraxpfsyfzdrcrowzw.supabase.co';
const supabaseAnonKey = 'sb_publishable_mAHMRJVrHM77GBXLJg9Z2w_sA0MxfCD';

// Cria e exporta o cliente Supabase para ser usado em toda a aplicação.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
