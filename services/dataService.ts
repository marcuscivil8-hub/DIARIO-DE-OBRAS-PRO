import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabaseClient';
import { User, Obra, Funcionario, Ponto, TransacaoFinanceira, Material, Ferramenta, DiarioObra, Servico, MovimentacaoAlmoxarifado, Documento } from '../types';


// --- Generic CRUD Service for Supabase ---
const createCrudService = <T extends { id: string }>(tableName: string) => {
    
    return {
        async getAll(): Promise<T[]> {
            const { data, error } = await supabase.from(tableName).select('*');
            if (error) throw new Error(error.message);
            return data as T[];
        },
        async create(itemData: Omit<T, 'id'>): Promise<T> {
            const newItem = { ...itemData, id: uuidv4() } as Omit<T, 'id'>; // Supabase might autogenerate, but we use uuid for consistency with old structure
            const { data, error } = await supabase.from(tableName).insert([newItem]).select();
            if (error) throw new Error(error.message);
            return data[0] as T;
        },
        async update(itemId: string, updates: Partial<T>): Promise<T> {
            const { data, error } = await supabase.from(tableName).update(updates).eq('id', itemId).select();
            if (error) throw new Error(error.message);
            if (!data || data.length === 0) {
                 throw new Error(`Item with id ${itemId} not found in ${tableName}.`);
            }
            return data[0] as T;
        },
        async delete(itemId: string): Promise<void> {
            const { error } = await supabase.from(tableName).delete().eq('id', itemId);
            if (error) throw new Error(error.message);
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
        const { data, error } = await supabase
            .from('configuracoes')
            .select('lembretes_encarregado')
            .single();

        if (error) {
            console.error("Error fetching lembretes:", error.message);
            return [];
        }
        return data?.lembretes_encarregado || [];
    },
    async updateLembretes(lembretes: string[]): Promise<void> {
         const { error } = await supabase
            .from('configuracoes')
            .update({ lembretes_encarregado: lembretes })
            .eq('id', 1); // Assuming a single config row with id 1
        if(error) {
            console.error("Error updating lembretes:", error.message);
            throw new Error(error.message);
        }
    },
};
