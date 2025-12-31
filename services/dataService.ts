import { v4 as uuidv4 } from 'uuid';
import { User, Obra, Funcionario, Ponto, TransacaoFinanceira, Material, Ferramenta, DiarioObra, Servico, MovimentacaoAlmoxarifado, Documento } from '../types';
import * as mock from '../data/mockData';

// --- In-memory Data Store ---
let users = [...mock.mockUsers];
let obras = [...mock.mockObras];
let funcionarios = [...mock.mockFuncionarios];
let pontos = [...mock.mockPontos];
let transacoes = [...mock.mockTransacoesFinanceiras];
let materiais = [...mock.mockMateriais];
let ferramentas = [...mock.mockFerramentas];
let diarios = [...mock.mockDiariosObra];
let servicos = [...mock.mockServicos];
let movimentacoes = [...mock.mockMovimentacoesAlmoxarifado];
let documentos = [...mock.mockDocumentos];
let lembretes = [...mock.mockLembretes];

// --- Generic CRUD Service for In-Memory Data ---
const createCrudService = <T extends { id: string }>(dataStore: T[]) => {
    
    return {
        async getAll(): Promise<T[]> {
            await new Promise(resolve => setTimeout(resolve, 50)); // Simulate latency
            return JSON.parse(JSON.stringify(dataStore)); // Return a deep copy
        },
        async create(itemData: Omit<T, 'id'>): Promise<T> {
            await new Promise(resolve => setTimeout(resolve, 50));
            const newItem = { ...itemData, id: uuidv4() } as T;
            dataStore.push(newItem);
            return JSON.parse(JSON.stringify(newItem));
        },
        async update(itemId: string, updates: Partial<T>): Promise<T> {
            await new Promise(resolve => setTimeout(resolve, 50));
            const itemIndex = dataStore.findIndex(item => item.id === itemId);
            if (itemIndex === -1) {
                throw new Error(`Item with id ${itemId} not found.`);
            }
            dataStore[itemIndex] = { ...dataStore[itemIndex], ...updates };
            return JSON.parse(JSON.stringify(dataStore[itemIndex]));
        },
        async delete(itemId: string): Promise<void> {
            await new Promise(resolve => setTimeout(resolve, 50));
            const itemIndex = dataStore.findIndex(item => item.id === itemId);
            if (itemIndex > -1) {
                dataStore.splice(itemIndex, 1);
            }
        }
    };
};

// --- Export all data services ---
export const dataService = {
    users: createCrudService<User>(users),
    obras: createCrudService<Obra>(obras),
    funcionarios: createCrudService<Funcionario>(funcionarios),
    pontos: createCrudService<Ponto>(pontos),
    transacoes: createCrudService<TransacaoFinanceira>(transacoes),
    materiais: createCrudService<Material>(materiais),
    ferramentas: createCrudService<Ferramenta>(ferramentas),
    diarios: createCrudService<DiarioObra>(diarios),
    servicos: createCrudService<Servico>(servicos),
    movimentacoesAlmoxarifado: createCrudService<MovimentacaoAlmoxarifado>(movimentacoes),
    documentos: createCrudService<Documento>(documentos),
    
    // Special functions that don't fit CRUD
    async getLembretes(): Promise<string[]> {
        await new Promise(resolve => setTimeout(resolve, 50));
        return [...lembretes];
    },
    async updateLembretes(newLembretes: string[]): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 50));
        lembretes = [...newLembretes];
    },
};