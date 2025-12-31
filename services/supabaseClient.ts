import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zoujknplspwukrwokzka.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvdWprbnBsc3B3dWtyd29remthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjI0NDUyMjMsImV4cCI6MjAzODAyMTIyM30.bhyL6X3yW21TKyZfAG-ZTg_MYmTJYGUf2w2A9PNbXow';

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key must be provided.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
