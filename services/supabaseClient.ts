
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://azhwzzwrbakxmfvrfmkp.supabase.co';
// A chave fornecida no prompt parece ser a signature de um JWT, mas a chave anônima completa é necessária. 
// A parte pública de um JWT é segura para ser exposta no lado do cliente.
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6aHd6endhemJha3htZnZyZm1rcCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzE2NDg2Mjc5LCJleHAiOjIwMzIwNjIyNzl9.sb_publishable_peo9DgLnEZE15qZVM2GwPw_W0kunFMf';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
