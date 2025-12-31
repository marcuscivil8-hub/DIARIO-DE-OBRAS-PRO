import { User } from '../types';
import { dataService } from './dataService';

const SESSION_KEY = 'diario_obra_user_session';

export const authService = {
    async login(email: string, password: string): Promise<User> {
        await new Promise(res => setTimeout(res, 500)); // Simulate network delay
        
        const users = dataService.users.getAllSync();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        // Plain text password check for mock environment
        if (user && user.password === password) {
            localStorage.setItem(SESSION_KEY, JSON.stringify(user));
            return user;
        } else {
            throw new Error('Invalid login credentials');
        }
    },

    async logout(): Promise<void> {
        localStorage.removeItem(SESSION_KEY);
        await new Promise(res => setTimeout(res, 200));
    },
    
    async createUser(userData: Omit<User, 'id'>): Promise<User> {
        await new Promise(res => setTimeout(res, 500));
        const users = dataService.users.getAllSync();
        if (users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
            throw new Error('Já existe um usuário com este email.');
        }
        // Use the synchronous create from the manager to add the user
        const newUser = dataService.users.createSync(userData);
        return newUser;
    },

    async getCurrentUser(): Promise<User | null> {
        try {
            const userJson = localStorage.getItem(SESSION_KEY);
            return userJson ? JSON.parse(userJson) : null;
        } catch (error) {
            console.error("Failed to parse user session", error);
            return null;
        }
    },
};