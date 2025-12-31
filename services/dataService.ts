import { supabase } from './supabaseClient';
import { User, Obra, Funcionario, Ponto, TransacaoFinanceira, Material, Ferramenta, DiarioObra, Servico, MovimentacaoAlmoxarifado, Documento } from '../types';

const handleSupabaseError = (error: any, context: string) => {
    if (error) {
        console.error(`Supabase error in ${context}:`, error);
        throw new Error(error.message);
    }
};

const createCrudService = <T extends { id: string }>(tableName: string) => {
    return {
        async getAll(): Promise<T[]> {
            const { data, error } = await supabase.from(tableName).select('*');
            handleSupabaseError(error, `getAll from ${tableName}`);
            return data as T[] || [];
        },
        async create(itemData: Omit<T, 'id'>): Promise<T> {
            const { data, error } = await supabase.from(tableName).insert(itemData).select().single();
            handleSupabaseError(error, `create in ${tableName}`);
            return data as T;
        },
        async update(itemId: string, updates: Partial<T>): Promise<T> {
            const { data, error } = await supabase.from(tableName).update(updates).eq('id', itemId).select().single();
            handleSupabaseError(error, `update in ${tableName}`);
            return data as T;
        },
        async delete(itemId: string): Promise<void> {
            const { error } = await supabase.from(tableName).delete().eq('id', itemId);
            handleSupabaseError(error, `delete in ${tableName}`);
        }
    };
};

// Custom user service to handle secure deletion via Edge Function
const userService = {
    ...createCrudService<User>('users'),
    async delete(userId: string): Promise<void> {
        const { error } = await supabase.functions.invoke('delete-user', {
            body: { userId },
        });

        if (error) {
            const errorBody = await (error as any).context?.json();
            console.error(`Supabase Function error in delete user:`, errorBody?.error || error.message);
            throw new Error(errorBody?.error || error.message);
        }
    }
};


export const dataService = {
    users: userService,
    obras: createCrudService<Obra>('obras'),
    funcionarios: createCrudService<Funcionario>('funcionarios'),
    pontos: createCrudService<Ponto>('pontos'),
    transacoes: createCrudService<TransacaoFinanceira>('transacoes'),
    materiais: createCrudService<Material>('materiais'),
    ferramentas: createCrudService<Ferramenta>('ferramentas'),
    diarios: createCrudService<DiarioObra>('diarios'),
    servicos: createCrudService<Servico>('servicos'),
    movimentacoesAlmoxarifado: createCrudService<MovimentacaoAlmoxarifado>('movimentacoes_almoxarifado'),
    documentos: createCrudService<Documento>('documentos'),
    
    // Special functions for 'lembretes'
    async getLembretes(): Promise<string[]> {
        // Assuming a table 'lembretes' with a column 'texto'
        const { data, error } = await supabase.from('lembretes').select('texto');
        handleSupabaseError(error, 'getLembretes');
        return data ? data.map((item: { texto: string }) => item.texto) : [];
    },
    async updateLembretes(newLembretes: string[]): Promise<void> {
        // Deletes all existing and inserts new ones.
        const { error: deleteError } = await supabase.from('lembretes').delete().not('id', 'is', null);
        handleSupabaseError(deleteError, 'updateLembretes (delete)');
        
        if (newLembretes.length > 0) {
            const rowsToInsert = newLembretes.map(texto => ({ texto }));
            const { error: insertError } = await supabase.from('lembretes').insert(rowsToInsert);
            handleSupabaseError(insertError, 'updateLembretes (insert)');
        }
    },
};