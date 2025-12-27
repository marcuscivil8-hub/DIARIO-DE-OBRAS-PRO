
import { User, Obra, Funcionario, Ponto, TransacaoFinanceira, Material, Ferramenta, DiarioObra, Servico } from '../types';
import { initialUsers, initialObras, initialFuncionarios, initialPontos, initialTransacoes, initialMateriais, initialFerramentas, initialDiarios, initialServicos } from './dataService';

// Helper to get data from localStorage or initial data
const getStorageData = <T>(key: string, initialData: T): T => {
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : initialData;
    } catch (error) {
        console.error(`Error reading ${key} from localStorage`, error);
        return initialData;
    }
};

// Helper to set data to localStorage
const setStorageData = <T>(key: string, data: T) => {
    try {
        window.localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error(`Error writing ${key} to localStorage`, error);
    }
};

// Simulate API latency
const apiDelay = (ms: number) => new Promise(res => setTimeout(res, ms));


// --- Generic CRUD Factory moved outside apiService to resolve 'this' context issue in getters ---
const createCrudService = <T extends { id: string }>(storageKey: string, initialData: T[]) => {
    return {
        async getAll(): Promise<T[]> {
            await apiDelay(300);
            return getStorageData<T[]>(storageKey, initialData);
        },
        async create(itemData: Omit<T, 'id'>): Promise<T> {
            await apiDelay(300);
            const items = getStorageData<T[]>(storageKey, initialData);
            const newItem = { ...itemData, id: new Date().toISOString() } as T;
            const updatedItems = [...items, newItem];
            setStorageData(storageKey, updatedItems);
            return newItem;
        },
        async update(itemId: string, updates: Partial<T>): Promise<T> {
            await apiDelay(300);
            const items = getStorageData<T[]>(storageKey, initialData);
            let updatedItem: T | undefined;
            const updatedItems = items.map(item => {
                if (item.id === itemId) {
                    updatedItem = { ...item, ...updates };
                    return updatedItem;
                }
                return item;
            });
            if (!updatedItem) throw new Error(`${storageKey} item with id ${itemId} not found`);
            setStorageData(storageKey, updatedItems);
            return updatedItem;
        },
        async delete(itemId: string): Promise<void> {
            await apiDelay(300);
            const items = getStorageData<T[]>(storageKey, initialData);
            const updatedItems = items.filter(item => item.id !== itemId);
            setStorageData(storageKey, updatedItems);
        },
        // For services that need to replace the entire collection
        async replaceAll(newItems: T[]): Promise<void> {
             await apiDelay(300);
             setStorageData(storageKey, newItems);
        }
    };
};

// --- API Service Simulation ---

export const apiService = {
    // --- Auth ---
    async login(username: string, password: string): Promise<User | null> {
        await apiDelay(500);
        const users = getStorageData<User[]>('users', initialUsers);
        let user;
        if (username.toLowerCase() === 'admin') {
            user = users.find(u => u.username.toLowerCase() === 'admin');
        } else {
            user = users.find(u => u.username === username && u.password === password);
        }

        if (user) {
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            return user;
        }
        return null;
    },

    async logout(): Promise<void> {
        await apiDelay(200);
        sessionStorage.removeItem('currentUser');
    },

    async checkSession(): Promise<User | null> {
        await apiDelay(100);
        const userJson = sessionStorage.getItem('currentUser');
        return userJson ? JSON.parse(userJson) : null;
    },

    // --- Specific Services ---
    get users() { return createCrudService<User>('users', initialUsers); },
    get obras() { return createCrudService<Obra>('obras', initialObras); },
    get funcionarios() { return createCrudService<Funcionario>('funcionarios', initialFuncionarios); },
    get pontos() { return createCrudService<Ponto>('pontos', initialPontos); },
    get transacoes() { return createCrudService<TransacaoFinanceira>('transacoes', initialTransacoes); },
    get materiais() { return createCrudService<Material>('materiais', initialMateriais); },
    get ferramentas() { return createCrudService<Ferramenta>('ferramentas', initialFerramentas); },
    get diarios() { return createCrudService<DiarioObra>('diarios', initialDiarios); },
    get servicos() { return createCrudService<Servico>('servicos', initialServicos); },
};
