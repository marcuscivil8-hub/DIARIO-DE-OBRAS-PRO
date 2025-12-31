import { User } from '../types';
import { mockUsers } from '../data/mockData';

const SESSION_KEY = 'currentUser';

export const authService = {
    async login(email: string, password: string): Promise<User> {
        // Simula uma busca no banco de dados local
        const user = mockUsers.find(u => u.email === email && u.password === password);

        // Simula uma pequena latência de rede
        await new Promise(resolve => setTimeout(resolve, 500));

        if (!user) {
            throw new Error('Credenciais inválidas. Verifique o email e a senha.');
        }

        // Remove a senha antes de salvar na sessão por segurança
        const { password: _, ...userToStore } = user;
        
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(userToStore));
        return userToStore as User;
    },

    async logout(): Promise<void> {
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