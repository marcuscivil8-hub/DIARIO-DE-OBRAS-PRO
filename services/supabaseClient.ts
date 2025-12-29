import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://glvtwaiobvdqojahitwn.supabase.co';

// INTEGRAÇÃO: A chave anônima (public) do Supabase foi inserida diretamente
// conforme solicitado, substituindo a leitura da variável de ambiente.
// Isso garante a conexão com o banco de dados especificado pelo usuário.
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsdnR3YWlvYnZkcW9qYWhpdHduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjE0MDYyMjksImV4cCI6MjAzNjk4MjIyOX0.5-NfNKv23lHnFGJZyV40vQ_GTZn7EeU';

// O bloco de verificação da variável de ambiente não é mais necessário,
// pois a chave foi fornecida e está definida diretamente no código.
if (!supabaseUrl || !supabaseAnonKey) {
    const errorMessage = "ERRO: A URL ou a chave de API do Supabase não foi configurada. A aplicação não pode ser inicializada.";
    console.error(errorMessage);
    
    // Exibe um erro amigável na UI para o usuário em vez de uma tela em branco.
    const rootElement = document.getElementById('root');
    if (rootElement) {
        rootElement.innerHTML = `
            <div style="font-family: sans-serif; padding: 2rem; text-align: center; background-color: #fef2f2; color: #991b1b; border: 1px solid #fecaca; border-radius: 0.5rem; margin: 2rem auto; max-width: 600px;">
                <h1 style="font-size: 1.25rem; font-weight: bold;">Erro de Configuração</h1>
                <p>A aplicação não pôde se conectar ao banco de dados. A URL ou chave de API não foi encontrada.</p>
            </div>
        `;
    }
    // Lança um erro para interromper a execução do script.
    throw new Error(errorMessage);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);