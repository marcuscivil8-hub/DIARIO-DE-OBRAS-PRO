import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zoujknplspwukrwokzka.supabase.co';
const supabaseAnonKey = 'sb_publishable_bhyL6X3yW21TKyZfAG-ZTg_MYmTJYGU';

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key must be provided.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
