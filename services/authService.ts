import { supabase } from './supabaseClient';
import { User } from '../types';
import { Session, Subscription } from '@supabase/supabase-js';

export const authService = {
    async login(email: string, password: string): Promise<User> {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            throw new Error(authError.message);
        }
        if (!authData.user) {
            throw new Error('Login falhou: nenhum dado de usuário retornado.');
        }

        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (userError) {
            console.error("Erro ao buscar perfil do usuário:", userError);
            throw new Error('Não foi possível encontrar o perfil do usuário.');
        }

        return userData as User;
    },

    async logout(): Promise<void> {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Erro ao fazer logout:', error);
        }
    },
    
    // Invokes a Supabase Edge Function to securely create a new user
    async createUser(userData: Omit<User, 'id'>): Promise<any> {
        const { data, error } = await supabase.functions.invoke('create-user', {
            body: userData,
        });

        if (error) {
            // The function might return a specific error message in the response body
            const errorBody = await (error as any).context?.json();
            throw new Error(errorBody?.error || error.message);
        }
        
        return data;
    },

    async getSession(): Promise<Session | null> {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
            console.error("Erro ao obter sessão:", error);
            return null;
        }
        return data.session;
    },

    async getUserFromSession(session: Session | null): Promise<User | null> {
        if (!session?.user) {
            return null;
        }

        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (userError) {
            console.error("Erro ao buscar perfil do usuário:", userError);
            // Isso pode acontecer se o perfil ainda não foi criado, então retornamos nulo.
            return null;
        }
        
        return userData as User;
    },

    onAuthStateChange(callback: (user: User | null) => void): Subscription | undefined {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const user = await this.getUserFromSession(session);
            callback(user);
        });
        return subscription;
    }
};