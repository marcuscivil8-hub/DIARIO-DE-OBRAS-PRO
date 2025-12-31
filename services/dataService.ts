import { v4 as uuidv4 } from 'uuid';
import { MOCK_DATA, MOCK_USERS } from '../data/mockData';
import { User, Obra, Funcionario, Ponto, TransacaoFinanceira, Material, Ferramenta, DiarioObra, Servico, MovimentacaoAlmoxarifado, Documento } from '../types';

// --- LocalStorage Helper Functions ---
const getLocalStorage = <T>(key: string, defaultValue: T): T => {
    try {
        const storedValue = localStorage.getItem(key);
        return storedValue ? JSON.parse(storedValue) : defaultValue;
    } catch (error) {
        console.error(`Error reading from localStorage key “${key}”:`, error);
        return defaultValue;
    }
};

const setLocalStorage = <T>(key: string, value: T): void => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error writing to localStorage key “${key}”:`, error);
    }
};

// --- Initialize with Mock Data if LocalStorage is Empty ---
const initializeData = () => {
    Object.keys(MOCK_DATA).forEach(key => {
        const localStorageKey = `db_${key}`;
        if (localStorage.getItem(localStorageKey) === null) {
            // @ts-ignore
            setLocalStorage(localStorageKey, MOCK_DATA[key]);
        }
    });
     if (localStorage.getItem('db_users') === null) {
        setLocalStorage('db_users', MOCK_USERS);
    }
};

initializeData();

// --- Generic CRUD Service for LocalStorage ---
const createCrudService = <T extends { id: string }>(tableName: string) => {
    const storageKey = `db_${tableName}`;
    
    return {
        async getAll(): Promise<T[]> {
            return getLocalStorage<T[]>(storageKey, []);
        },
        async create(itemData: Omit<T, 'id'>): Promise<T> {
            const items = getLocalStorage<T[]>(storageKey, []);
            const newItem = { ...itemData, id: uuidv4() } as T;
            const updatedItems = [...items, newItem];
            setLocalStorage(storageKey, updatedItems);
            return newItem;
        },
        async update(itemId: string, updates: Partial<T>): Promise<T> {
            const items = getLocalStorage<T[]>(storageKey, []);
            let updatedItem: T | null = null;
            const updatedItems = items.map(item => {
                if (item.id === itemId) {
                    updatedItem = { ...item, ...updates };
                    return updatedItem;
                }
                return item;
            });
            if (!updatedItem) {
                throw new Error(`Item with id ${itemId} not found in ${tableName}.`);
            }
            setLocalStorage(storageKey, updatedItems);
            return updatedItem!;
        },
        async delete(itemId: string): Promise<void> {
            const items = getLocalStorage<T[]>(storageKey, []);
            const updatedItems = items.filter(item => item.id !== itemId);
            setLocalStorage(storageKey, updatedItems);
        }
    };
};

// --- Export all data services ---
export const dataService = {
    users: createCrudService<User>('users'),
    obras: createCrudService<Obra>('obras'),
    funcionarios: createCrudService<Funcionario>('funcionarios'),
    pontos: createCrudService<Ponto>('pontos'),
    transacoes: createCrudService<TransacaoFinanceira>('transacoes_financeiras'),
    materiais: createCrudService<Material>('materiais'),
    ferramentas: createCrudService<Ferramenta>('ferramentas'),
    diarios: createCrudService<DiarioObra>('diarios_obra'),
    servicos: createCrudService<Servico>('servicos'),
    movimentacoesAlmoxarifado: createCrudService<MovimentacaoAlmoxarifado>('movimentacoes_almoxarifado'),
    documentos: createCrudService<Documento>('documentos'),
    
    // Special functions that don't fit CRUD
    async getLembretes(): Promise<string[]> {
        const config = getLocalStorage<{lembretes_encarregado: string[]}>('db_configuracoes', { lembretes_encarregado: [] });
        return config.lembretes_encarregado;
    },
    async updateLembretes(lembretes: string[]): Promise<void> {
        setLocalStorage('db_configuracoes', { lembretes_encarregado: lembretes });
    },
};
