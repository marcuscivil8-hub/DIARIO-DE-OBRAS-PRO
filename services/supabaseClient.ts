import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

const SUPABASE_URL_KEY = 'diario-de-obra-pro-supabase-url';
const SUPABASE_ANON_KEY = 'diario-de-obra-pro-supabase-anon-key';

export function initializeSupabase(url: string, anonKey: string): SupabaseClient {
    if (!url || !anonKey) {
        throw new Error("URL e Chave Anon do Supabase são obrigatórias.");
    }
    // Basic validation
    if (!url.startsWith('http') || !url.includes('supabase.co')) {
        throw new Error("A URL do Supabase parece ser inválida. Deve começar com 'http' e incluir 'supabase.co'.");
    }
    supabaseInstance = createClient(url, anonKey);
    try {
        localStorage.setItem(SUPABASE_URL_KEY, url);
        localStorage.setItem(SUPABASE_ANON_KEY, anonKey);
    } catch (error) {
        console.warn("Não foi possível salvar as credenciais do Supabase no localStorage.", error);
    }
    return supabaseInstance;
};

export function getSupabaseClient(): SupabaseClient {
    if (!supabaseInstance) {
        throw new Error("O cliente Supabase não foi inicializado. Chame initializeSupabase primeiro.");
    }
    return supabaseInstance;
};

export function getCredentialsFromStorage(): { url: string | null; anonKey: string | null } {
    try {
        const url = localStorage.getItem(SUPABASE_URL_KEY);
        const anonKey = localStorage.getItem(SUPABASE_ANON_KEY);
        return { url, anonKey };
    } catch (error) {
        console.warn("Não foi possível ler as credenciais do Supabase do localStorage.", error);
        return { url: null, anonKey: null };
    }
};

export function clearCredentialsFromStorage(): void {
     try {
        localStorage.removeItem(SUPABASE_URL_KEY);
        localStorage.removeItem(SUPABASE_ANON_KEY);
        supabaseInstance = null; // Also reset the client instance
    } catch (error) {
        console.warn("Não foi possível limpar as credenciais do Supabase do localStorage.", error);
    }
}
