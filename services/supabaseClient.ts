import { createClient } from '@supabase/supabase-js';

// URL e Chave Anônima (pública) do seu projeto Supabase.
// Estes valores são seguros para serem expostos no lado do cliente.
const supabaseUrl = 'https://yaaqffcvpghdamtkzvea.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhYXFmZmN2cGdoZGFtdGt6dmVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Njk2NTAyMTcsImV4cCI6MTk4NTIyNjIxN30.8Sn0Zk4eZN0hKjMTGSUhg_Gx4dnP9Vw9PA9-i_f1rEY';

// Valida se as variáveis foram preenchidas para evitar erros de inicialização.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('A URL ou a Chave Anônima do Supabase não foram configuradas. Verifique o arquivo supabaseClient.ts.');
}

// Cria e exporta o cliente Supabase para ser usado em toda a aplicação.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);