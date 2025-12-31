import { createClient } from '@supabase/supabase-js';

// As credenciais do Supabase foram inseridas abaixo, conforme solicitado.
const supabaseUrl = 'https://edjrigyftruuqbqevrnh.supabase.co';
const supabaseAnonKey = 'sb_publishable_N19TVJwmwBxjWif7HL9K8Q_z8sHC2Q7';

// Cria e exporta o cliente Supabase para ser usado em toda a aplicação.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);