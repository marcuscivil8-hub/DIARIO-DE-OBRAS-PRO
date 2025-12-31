import { User } from '../types';
import { supabase } from './supabaseClient';

const SESSION_KEY = 'currentUser';

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
            throw new Error('Usuário não encontrado.');
        }

        // After successful auth, get user profile from 'users' table
        const { data: profileData, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (profileError || !profileData) {
            await supabase.auth.signOut(); // Sign out if profile doesn't exist
            throw new Error(profileError?.message || 'Perfil de usuário não encontrado.');
        }
        
        // Combine auth info (like email) with profile info (role, name)
        const user: User = {
            id: profileData.id,
            name: profileData.name,
            email: authData.user.email!,
            username: profileData.username,
            role: profileData.role,
            obraIds: profileData.obraIds,
        };

        sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
        return user;
    },

    async logout(): Promise<void> {
        await supabase.auth.signOut();
        sessionStorage.removeItem(SESSION_KEY);
    },

    getCurrentUser(): User | null {
        const userJson = sessionStorage.getItem(SESSION_KEY);
        if (userJson) {
            try {
                return JSON.parse(userJson);
            } catch (error) {
                console.error("Failed to parse user from sessionStorage", error);
                this.logout();
                return null;
            }
        }
        return null;
    }
};
