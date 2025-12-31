import { User } from '../types';
import { MOCK_USERS } from '../data/mockData';

const SESSION_KEY = 'currentUser';

const getLocalStorage = <T>(key: string, defaultValue: T): T => {
    try {
        const storedValue = localStorage.getItem(key);
        return storedValue ? JSON.parse(storedValue) : defaultValue;
    } catch (error) {
        console.error(`Error reading from localStorage key “${key}”:`, error);
        return defaultValue;
    }
};

export const authService = {
    async login(email: string, password: string): Promise<User> {
        // Em um app real, aqui você faria uma chamada de API.
        // Para simulação, vamos buscar os usuários do nosso "banco de dados" local.
        const users = getLocalStorage<User[]>('db_users', MOCK_USERS);
        
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            // Salva o usuário na sessionStorage para manter o login na aba atual
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
            return user;
        } else {
            throw new Error('Email ou senha inválidos.');
        }
    },

    logout(): void {
        sessionStorage.removeItem(SESSION_KEY);
    },

    getCurrentUser(): User | null {
        const userJson = sessionStorage.getItem(SESSION_KEY);
        if (userJson) {
            try {
                return JSON.parse(userJson);
            } catch (error) {
                console.error("Failed to parse user from sessionStorage", error);
                return null;
            }
        }
        return null;
    }
};
