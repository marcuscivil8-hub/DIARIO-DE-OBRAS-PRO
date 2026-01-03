
import { supabase } from './supabaseClient';
// FIX: Import all necessary types to provide them to the generic CRUD service.
import { User, Obra, Funcionario, Ponto, TransacaoFinanceira, Material, Ferramenta, DiarioObra, Servico, MovimentacaoAlmoxarifado, Documento } from '../types';

// Generic error handler
const handleSupabaseError = (error: any, context: string) => {
    if (error) {
        console.error(`Error in ${context}:`, error.message);
        throw new Error(`Falha na operação de ${context}: ${error.message}`);
    }
};

// Generic CRUD factory for Supabase tables
const createCrudService = <T extends { id: string }>(tableName: string) => {
    return {
        async getAll(): Promise<T[]> {
            const { data, error } = await supabase.from(tableName).select('*');
            handleSupabaseError(error, `busca em ${tableName}`);
            return data as T[] || [];
        },
        async getById(id: string): Promise<T | null> {
            const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single();
            handleSupabaseError(error, `busca por id em ${tableName}`);
            return data as T | null;
        },
        async create(itemData: Omit<T, 'id'>): Promise<T> {
            const { data, error } = await supabase.from(tableName).insert([itemData]).select().single();
            handleSupabaseError(error, `criação em ${tableName}`);
            return data as T;
        },
        async update(itemId: string, updates: Partial<T>): Promise<T> {
            const { data, error } = await supabase.from(tableName).update(updates).eq('id', itemId).select().single();
            handleSupabaseError(error, `atualização em ${tableName}`);
            return data as T;
        },
        async delete(itemId: string): Promise<void> {
            const { error } = await supabase.from(tableName).delete().eq('id', itemId);
            handleSupabaseError(error, `deleção em ${tableName}`);
        }
    };
};

const uploadFile = async (bucket: string, file: File): Promise<string> => {
    const fileName = `${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file);
    handleSupabaseError(uploadError, `upload de arquivo para ${bucket}`);

    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    if (!data.publicUrl) {
        throw new Error('Não foi possível obter a URL pública do arquivo.');
    }
    return data.publicUrl;
}

// Lembretes are not a table, so they need a custom implementation
// We can use a single row in a 'config' table for this
const lembretesService = {
     async getLembretes(): Promise<string[]> {
        const { data, error } = await supabase
            .from('config')
            .select('value')
            .eq('key', 'lembretes')
            .single();
        
        // Don't throw if not found, just return empty array
        if (error && error.code !== 'PGRST116') { // PGRST116 = single row not found
             handleSupabaseError(error, 'busca de lembretes');
        }
        return data?.value || [];
    },
    async updateLembretes(newLembretes: string[]): Promise<void> {
        const { error } = await supabase
            .from('config')
            .upsert({ key: 'lembretes', value: newLembretes }); // Upsert will create if not exists
        handleSupabaseError(error, 'atualização de lembretes');
    }
}


export const dataService = {
    users: {
        ...createCrudService<User>('users'),
        // Supabase auth user is separate from our public 'users' table.
        // We get the user profile from our table using the auth user's ID.
        async getById(id: string): Promise<User | null> {
             const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
            // Don't throw error if user profile not found yet
            if (error && error.code !== 'PGRST116') {
                console.error("Error fetching user profile:", error);
                return null;
            }
            return data;
        }
    },
    obras: createCrudService<Obra>('obras'),
    funcionarios: createCrudService<Funcionario>('funcionarios'),
    pontos: createCrudService<Ponto>('pontos'),
    transacoes: {
        ...createCrudService<TransacaoFinanceira>('transacoes_financeiras'),
        async getByObraId(obraId: string): Promise<TransacaoFinanceira[]> {
            const { data, error } = await supabase
                .from('transacoes_financeiras')
                .select('*')
                .eq('obraId', obraId);
            handleSupabaseError(error, `busca de transações por obraId`);
            return (data as TransacaoFinanceira[]) || [];
        }
    },
    materiais: createCrudService<Material>('materiais'),
    ferramentas: createCrudService<Ferramenta>('ferramentas'),
    diarios: {
        ...createCrudService<DiarioObra>('diarios_obra'),
        async getByObraId(obraId: string): Promise<DiarioObra[]> {
            const { data, error } = await supabase
                .from('diarios_obra')
                .select('*')
                .eq('obraId', obraId);
            handleSupabaseError(error, `busca de diarios por obraId`);
            return (data as DiarioObra[]) || [];
        }
    },
    servicos: {
        ...createCrudService<Servico>('servicos'),
        async getByObraId(obraId: string): Promise<Servico[]> {
            const { data, error } = await supabase
                .from('servicos')
                .select('*')
                .eq('obraId', obraId);
            handleSupabaseError(error, `busca de serviços por obraId`);
            return (data as Servico[]) || [];
        }
    },
    movimentacoesAlmoxarifado: createCrudService<MovimentacaoAlmoxarifado>('movimentacoes_almoxarifado'),
    documentos: {
        ...createCrudService<Documento>('documentos'),
        async getByObraId(obraId: string): Promise<Documento[]> {
            const { data, error } = await supabase
                .from('documentos')
                .select('*')
                .eq('obraId', obraId);
            handleSupabaseError(error, `busca de documentos por obraId`);
            return (data as Documento[]) || [];
        }
    },
    ...lembretesService,
    uploadFile,
};