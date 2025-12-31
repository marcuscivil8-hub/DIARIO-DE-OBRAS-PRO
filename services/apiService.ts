import { mockUsers, mockObras, mockFuncionarios, mockPontos, mockTransacoes, mockMateriais, mockFerramentas, mockDiarios, mockServicos, mockMovimentacoes, mockDocumentos, mockLembretes } from '../data/mockData';
import { User, Obra, Funcionario, Ponto, TransacaoFinanceira, Material, Ferramenta, DiarioObra, Servico, MovimentacaoAlmoxarifado, Documento } from '../types';

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const SIMULATED_DELAY = 200;

// Helper to generate a simple unique ID
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

// Generic CRUD service factory for mock data
const createMockCrudService = <T extends { id: string }>(dataStore: T[]) => {
    return {
        async getAll(): Promise<T[]> {
            await delay(SIMULATED_DELAY);
            return [...dataStore];
        },
        async create(itemData: Omit<T, 'id'>): Promise<T> {
            await delay(SIMULATED_DELAY);
            const newItem = { ...itemData, id: generateId() } as T;
            dataStore.push(newItem);
            return newItem;
        },
        async update(itemId: string, updates: Partial<T>): Promise<T> {
            await delay(SIMULATED_DELAY);
            const itemIndex = dataStore.findIndex(item => item.id === itemId);
            if (itemIndex === -1) {
                throw new Error('Item não encontrado.');
            }
            const updatedItem = { ...dataStore[itemIndex], ...updates };
            dataStore[itemIndex] = updatedItem;
            return updatedItem;
        },
        async delete(itemId: string): Promise<void> {
            await delay(SIMULATED_DELAY);
            const itemIndex = dataStore.findIndex(item => item.id === itemId);
            if (itemIndex === -1) {
                throw new Error('Item não encontrado.');
            }
            dataStore.splice(itemIndex, 1);
        }
    };
};

export const apiService = {
    users: createMockCrudService<User>(mockUsers),
    obras: createMockCrudService<Obra>(mockObras),
    funcionarios: createMockCrudService<Funcionario>(mockFuncionarios),
    pontos: createMockCrudService<Ponto>(mockPontos),
    transacoes: createMockCrudService<TransacaoFinanceira>(mockTransacoes),
    materiais: createMockCrudService<Material>(mockMateriais),
    ferramentas: createMockCrudService<Ferramenta>(mockFerramentas),
    diarios: createMockCrudService<DiarioObra>(mockDiarios),
    servicos: createMockCrudService<Servico>(mockServicos),
    movimentacoesAlmoxarifado: createMockCrudService<MovimentacaoAlmoxarifado>(mockMovimentacoes),
    documentos: createMockCrudService<Documento>(mockDocumentos),

    async getLembretes(): Promise<string[]> {
        await delay(SIMULATED_DELAY);
        return [...mockLembretes];
    },
    async updateLembretes(newLembretes: string[]): Promise<void> {
        await delay(SIMULATED_DELAY);
        // Clear the array and push new values
        mockLembretes.length = 0;
        mockLembretes.push(...newLembretes);
    },
};