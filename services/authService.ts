import { User, UserRole } from '../types';
import { supabase } from './supabaseClient';
import { dataService } from './dataService';

export const authService = {
    async login(email: string, password: string): Promise<void> {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            console.error('Login error:', error.message);
            if (error instanceof TypeError && error.message === 'Failed to fetch') {
                 throw new Error('Falha de rede. Verifique sua conexão ou a configuração CORS do seu projeto Supabase.');
            }
            if (error.message.includes('Invalid login credentials')) {
                 throw new Error('Email ou senha inválidos.');
            }
            throw new Error(`Erro no login: ${error.message}`);
        }
    },

    async logout(): Promise<void> {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Logout error:', error.message);
            throw new Error('Não foi possível fazer logout.');
        }
    },

    async createUser(userData: Omit<User, 'id'>): Promise<void> {
        if (!userData.password) {
            throw new Error("A senha é obrigatória para criar um novo usuário.");
        }

        // O gatilho 'on_auth_user_created' no Supabase irá lidar com a criação do perfil do usuário na tabela 'public.users'.
        // Passamos todos os dados do perfil do usuário no campo 'options.data', que o gatilho irá ler.
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
                data: {
                    name: userData.name,
                    username: userData.username,
                    role: userData.role,
                    // Garante que obraIds seja um array, mesmo que esteja indefinido.
                    obraIds: userData.role === UserRole.Cliente ? (userData.obraIds || []) : [],
                }
            }
        });

        if (authError) {
            console.error('Sign up error:', authError.message);
            if (authError instanceof TypeError && authError.message === 'Failed to fetch') {
                 throw new Error('Falha de rede. Verifique sua conexão ou a configuração CORS do seu projeto Supabase.');
            }
            if (authError.message.includes('Database error creating new user')) {
                 throw new Error('Erro no banco de dados ao criar o perfil do usuário. Verifique se o trigger "handle_new_user" está configurado corretamente com o script SQL mais recente.');
            }
            if (authError.message.includes('unique constraint')) {
                 throw new Error('Este email já está em uso.');
            }
            throw new Error(`Erro ao criar usuário: ${authError.message}`);
        }
        
        if (!authData.user) {
            throw new Error('Não foi possível criar o usuário na autenticação.');
        }

        // A segunda etapa de criação do perfil foi removida, pois agora é gerenciada atomicamente pelo gatilho do Supabase.
    },

    async deleteUser(userId: string): Promise<void> {
        const { error } = await supabase.functions.invoke('delete-user', {
            body: { userId },
        });

        if (error) {
            console.error('Error deleting user function:', error);
            // The FunctionsError from Supabase can have a 'context' property
            // which might contain the raw response object. We check for it safely.
            if (error.context && typeof error.context.json === 'function') {
                try {
                    const errorBody = await error.context.json();
                    // Assumes the function returns a JSON with an 'error' key on failure
                    throw new Error(errorBody.error || 'Falha ao invocar a função de exclusão.');
                } catch (e) {
                    // If JSON parsing fails, fall back to the main error message.
                    throw new Error(error.message || 'Falha ao excluir usuário. Resposta da função inválida.');
                }
            }
            // For network errors or other cases where 'context' is not available.
            throw new Error(error.message || 'Falha ao excluir usuário.');
        }
    },
    
    async updateUserPassword(userId: string, password: string): Promise<void> {
        const { error } = await supabase.functions.invoke('update-user', {
            body: { userId, password },
        });

        if (error) {
            console.error('Error updating user password function:', error);
            if (error.context && typeof error.context.json === 'function') {
                try {
                    const errorBody = await error.context.json();
                    throw new Error(errorBody.error || 'Falha ao invocar a função de atualização de senha.');
                } catch (e) {
                    throw new Error(error.message || 'Falha ao atualizar senha. Resposta da função inválida.');
                }
            }
            throw new Error(error.message || 'Falha ao atualizar a senha do usuário.');
        }
    },

    async getCurrentUser(): Promise<User | null> {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
            console.error("Error getting session:", error.message);
            return null;
        }
        if (session?.user) {
             // Fetch the user profile from the 'users' table
            return await dataService.users.getById(session.user.id);
        }
        return null;
    },
};