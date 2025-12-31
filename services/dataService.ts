import { v4 as uuidv4 } from 'uuid';
import { User, Obra, Funcionario, Ponto, TransacaoFinanceira, Material, Ferramenta, DiarioObra, Servico, MovimentacaoAlmoxarifado, Documento } from '../types';
import { mockUsers, mockObras, mockFuncionarios, mockPontos, mockTransacoesFinanceiras, mockMateriais, mockFerramentas, mockDiariosObra, mockServicos, mockMovimentacoesAlmoxarifado, mockDocumentos, mockLembretes } from '../data/mockData';

// Helper to simulate network delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Helper to manage a collection in localStorage
const createStorageManager = <T extends { id: string }>(key: string, initialData: T[]) => {
    let items: T[] = [];
    try {
        const storedItems = localStorage.getItem(key);
        if (storedItems) {
            items = JSON.parse(storedItems);
        } else {
            items = initialData;
            localStorage.setItem(key, JSON.stringify(items));
        }
    } catch (e) {
        console.error(`Could not initialize storage for ${key}`, e);
        items = initialData;
    }
    
    const save = () => {
        localStorage.setItem(key, JSON.stringify(items));
    };

    return {
        getAll: () => items,
        create: (newItemData: Omit<T, 'id'>) => {
            const newItem = { ...newItemData, id: uuidv4() } as T;
            items.push(newItem);
            save();
            return newItem;
        },
        update: (id: string, updates: Partial<T>) => {
            const index = items.findIndex(item => item.id === id);
            if (index > -1) {
                items[index] = { ...items[index], ...updates };
                save();
                return items[index];
            }
            return null;
        },
        delete: (id: string) => {
            const initialLength = items.length;
            items = items.filter(item => item.id !== id);
            if(items.length < initialLength) {
                save();
                return true;
            }
            return false;
        },
        get: (id: string) => items.find(item => item.id === id) || null,
    };
};

const usersManager = createStorageManager<User>('db_users', mockUsers);
const obrasManager = createStorageManager<Obra>('db_obras', mockObras);
const funcionariosManager = createStorageManager<Funcionario>('db_funcionarios', mockFuncionarios);
const pontosManager = createStorageManager<Ponto>('db_pontos', mockPontos);
const transacoesManager = createStorageManager<TransacaoFinanceira>('db_transacoes', mockTransacoesFinanceiras);
const materiaisManager = createStorageManager<Material>('db_materiais', mockMateriais);
const ferramentasManager = createStorageManager<Ferramenta>('db_ferramentas', mockFerramentas);
const diariosManager = createStorageManager<DiarioObra>('db_diarios', mockDiariosObra);
const servicosManager = createStorageManager<Servico>('db_servicos', mockServicos);
const movimentacoesManager = createStorageManager<MovimentacaoAlmoxarifado>('db_movimentacoes', mockMovimentacoesAlmoxarifado);
const documentosManager = createStorageManager<Documento>('db_documentos', mockDocumentos);

const createCrudService = <T extends { id: string }>(manager: ReturnType<typeof createStorageManager<T>>) => {
    return {
        async getAll(): Promise<T[]> {
            await delay(100);
            return manager.getAll();
        },
        async create(itemData: Omit<T, 'id'>): Promise<T> {
            await delay(100);
            return manager.create(itemData);
        },
        async update(itemId: string, updates: Partial<T>): Promise<T> {
            await delay(100);
            const updated = manager.update(itemId, updates);
            if (updated) {
                return updated;
            }
            throw new Error('Item not found for update');
        },
        async delete(itemId: string): Promise<void> {
            await delay(100);
            manager.delete(itemId);
        }
    };
};

// Lembretes manager (special case as it's a string array)
let lembretes: string[] = [];
try {
    const stored = localStorage.getItem('db_lembretes');
    lembretes = stored ? JSON.parse(stored) : mockLembretes;
    if (!stored) localStorage.setItem('db_lembretes', JSON.stringify(lembretes));
} catch(e) {
    lembretes = mockLembretes;
}
const saveLembretes = () => localStorage.setItem('db_lembretes', JSON.stringify(lembretes));


export const dataService = {
    users: {
        ...createCrudService(usersManager),
        createSync: usersManager.create,
        getAllSync: usersManager.getAll,
    },
    obras: createCrudService(obrasManager),
    funcionarios: createCrudService(funcionariosManager),
    pontos: createCrudService(pontosManager),
    transacoes: createCrudService(transacoesManager),
    materiais: createCrudService(materiaisManager),
    ferramentas: createCrudService(ferramentasManager),
    diarios: createCrudService(diariosManager),
    servicos: createCrudService(servicosManager),
    movimentacoesAlmoxarifado: createCrudService(movimentacoesManager),
    documentos: createCrudService(documentosManager),
    
    async getLembretes(): Promise<string[]> {
        await delay(50);
        return lembretes;
    },
    async updateLembretes(newLembretes: string[]): Promise<void> {
        await delay(50);
        lembretes = newLembretes;
        saveLembretes();
    },
};