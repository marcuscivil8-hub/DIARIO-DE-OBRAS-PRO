import { User } from '../types';
import { mockUsers } from '../data/mockData';
import { apiService } from './apiService';

const CURRENT_USER_KEY = 'diario-obra-user';

export const authService = {
    async login(email: string, password: string): Promise<User> {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const user = mockUsers.find(u => u.email === email && u.password === password);
                if (user) {
                    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
                    resolve(user);
                } else {
                    reject(new Error('Email ou senha inválidos.'));
                }
            }, 500);
        });
    },

    async logout(): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(() => {
                localStorage.removeItem(CURRENT_USER_KEY);
                resolve();
            }, 200);
        });
    },

    async createUser(userData: Omit<User, 'id'>): Promise<User> {
         const existing = mockUsers.find(u => u.email === userData.email);
         if (existing) {
             throw new Error("Este email já está em uso.");
         }
        // In a real app, password would be hashed. Here we store it as-is.
        const newUser = await apiService.users.create(userData);
        return newUser;
    },

    async deleteUser(userId: string): Promise<void> {
        await apiService.users.delete(userId);
        // Also log out if the deleted user is the current one
        const currentUser = await this.getCurrentUser();
        if (currentUser && currentUser.id === userId) {
            await this.logout();
        }
    },

    async getCurrentUser(): Promise<User | null> {
         return new Promise((resolve) => {
            setTimeout(() => {
                try {
                    const userJson = localStorage.getItem(CURRENT_USER_KEY);
                    if (userJson) {
                        resolve(JSON.parse(userJson));
                    } else {
                        resolve(null);
                    }
                } catch (error) {
                    console.error("Could not parse user from localStorage", error);
                    resolve(null);
                }
            }, 100);
        });
    },
};