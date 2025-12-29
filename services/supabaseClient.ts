
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://glvtwaiobvdqojahitwn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsdnR3YWlvYnZkcW9qYWhpdHduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5Njg4MDgsImV4cCI6MjA4MjU0NDgwOH0.ztI6grGxlyjaQy9WH_PlvL-qXCHZQjQIlv2TLmC8n9U';

if (!supabaseUrl || !supabaseAnonKey) {
    const errorMessage = "ERRO DE CONFIGURAÇÃO: A URL ou a chave de API do Supabase não foram definidas.";
    console.error(errorMessage);
    
    // Exibe um erro amigável na UI
    const rootElement = document.getElementById('root');
    if (rootElement) {
        rootElement.innerHTML = `
            <div style="font-family: sans-serif; padding: 2rem; text-align: center; background-color: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; border-radius: 0.5rem; margin: 2rem auto; max-width: 600px;">
                <h1 style="font-size: 1.25rem; font-weight: bold;">Erro de Configuração</h1>
                <p>A URL ou a Chave de API do Supabase estão ausentes no arquivo <strong>services/supabaseClient.ts</strong>.</p>
            </div>
        `;
    }
    throw new Error(errorMessage);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);