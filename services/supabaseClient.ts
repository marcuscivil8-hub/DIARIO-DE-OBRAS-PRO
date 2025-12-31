import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kffziehuiiyqmoncnhgu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmZnppZWh1aWl5cW1vbmNuaGd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjI0NzE3NTAsImV4cCI6MjAzODA0Nzc1MH0.b-uM7w3i_3AqD4dT8q-0SADoT8TC32Jq1tO7vP2tn-k';

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key must be provided.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
