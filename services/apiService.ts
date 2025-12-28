
import { supabase } from './supabaseClient';
import { User, Obra, Funcionario, Ponto, TransacaoFinanceira, Material, Ferramenta, DiarioObra, Servico, MovimentacaoAlmoxarifado, Documento } from '../types';

const handleSupabaseError = (error: any, context: string) => {
    if (error) {
        console.error(`Error in ${context}:`, error.message);
        throw error;
    }
};

const createCrudService = <T extends { id: string }>(tableName: string) => {
    // Mapeia nomes de campos JS para nomes de colunas do banco (convenção snake_case)
    const toSnakeCase = (data: Record<string, any>) => {
        const snakeCaseData: Record<string, any> = {};
        for (const key in data) {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            snakeCaseData[snakeKey] = data[key];
        }
        return snakeCaseData;
    };
    
    // Mapeia nomes de colunas do banco para nomes de campos JS
    const toCamelCase = (data: Record<string, any>): T => {
        const camelCaseData: Record<string, any> = {};
        for (const key in data) {
            const camelKey = key.replace(/_([a-z])/g, g => g[1].toUpperCase());
            camelCaseData[camelKey] = data[key];
        }
        return camelCaseData as T;
    };
    
    return {
        async getAll(): Promise<T[]> {
            const { data, error } = await supabase.from(tableName).select('*');
            handleSupabaseError(error, `getAll ${tableName}`);
            return data ? data.map(toCamelCase) : [];
        },
        async create(itemData: Omit<T, 'id'>): Promise<T> {
            const { data, error } = await supabase.from(tableName).insert(toSnakeCase(itemData)).select().single();
            handleSupabaseError(error, `create ${tableName}`);
            return toCamelCase(data);
        },
        async update(itemId: string, updates: Partial<T>): Promise<T> {
            const { data, error } = await supabase.from(tableName).update(toSnakeCase(updates)).eq('id', itemId).select().single();
            handleSupabaseError(error, `update ${tableName}`);
            return toCamelCase(data);
        },
        async delete(itemId: string): Promise<void> {
            const { error } = await supabase.from(tableName).delete().eq('id', itemId);
            handleSupabaseError(error, `delete ${tableName}`);
        },
    };
};

export const apiService = {
    async login(email: string, password: string): Promise<User | null> {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError || !authData.user) {
            console.error('Login error:', authError?.message);
            return null;
        }

        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (profileError || !profileData) {
            console.error('Error fetching profile:', profileError?.message);
            await supabase.auth.signOut();
            return null;
        }

        const user: User = {
            id: authData.user.id,
            name: profileData.name,
            email: authData.user.email || '',
            username: profileData.username,
            role: profileData.role,
            obraIds: profileData.obra_ids || [],
        };
        
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        return user;
    },

    async logout(): Promise<void> {
        await supabase.auth.signOut();
        sessionStorage.removeItem('currentUser');
    },

    async checkSession(): Promise<User | null> {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            sessionStorage.removeItem('currentUser');
            return null;
        }

        const userJson = sessionStorage.getItem('currentUser');
        if (userJson) return JSON.parse(userJson);
        
        // Se a sessão existe mas não há nada no sessionStorage, busca o perfil
        const { data: profileData, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (error || !profileData) return null;

         const user: User = {
            id: session.user.id,
            name: profileData.name,
            email: session.user.email || '',
            username: profileData.username,
            role: profileData.role,
            obraIds: profileData.obra_ids || [],
        };
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        return user;
    },

    async getLembretes(): Promise<string[]> {
        const { data, error } = await supabase.from('configuracoes').select('lembretes_encarregado').eq('id', 1).single();
        handleSupabaseError(error, 'getLembretes');
        return data?.lembretes_encarregado || [];
    },

    async updateLembretes(lembretes: string[]): Promise<void> {
        const { error } = await supabase.from('configuracoes').update({ lembretes_encarregado: lembretes }).eq('id', 1);
        handleSupabaseError(error, 'updateLembretes');
    },
    
    pontos: {
        ...createCrudService<Ponto>('pontos'),
        async replaceAll(newItems: Ponto[]): Promise<void> {
            // This is inefficient but necessary to replicate the localStorage logic.
            // A better backend approach would be a single bulk upsert endpoint.
            // FIX: Explicitly type the result of the select call to avoid 'any' type issues downstream.
            const { data: existing } = await supabase.from('pontos').select('id, funcionario_id, data').returns<{ id: string; funcionario_id: string; data: string }[]>();
            const existingMap = new Map(existing?.map(p => [`${p.funcionario_id}-${p.data}`, p.id]));
            const newMap = new Map(newItems.map(p => [`${p.funcionarioId}-${p.data}`, p]));

            const toDelete = Array.from(existingMap.keys()).filter(key => !newMap.has(key));
            const toUpsert = newItems.map(p => ({
                id: existingMap.get(`${p.funcionarioId}-${p.data}`), // may be undefined for new items
                funcionario_id: p.funcionarioId,
                data: p.data,
                status: p.status,
            }));

            if(toDelete.length > 0) {
                const idsToDelete = toDelete.map(key => existingMap.get(key)).filter((id): id is string => !!id);
                if (idsToDelete.length > 0) {
                    await supabase.from('pontos').delete().in('id', idsToDelete);
                }
            }
            if(toUpsert.length > 0) {
                 await supabase.from('pontos').upsert(toUpsert);
            }
        }
    },
    
    documentos: {
        ...createCrudService<Documento>('documentos'),
        // FIX: Adjusted type to Omit 'nome' as it's derived from the file object inside the function.
        async create(docData: Omit<Documento, 'id' | 'obraId' | 'url' | 'nome'>, obraId: string, file: File): Promise<Documento> {
            const filePath = `${obraId}/${Date.now()}-${file.name}`;
            const { error: uploadError } = await supabase.storage.from('documentos').upload(filePath, file);
            handleSupabaseError(uploadError, 'document upload');

            const { data: urlData } = supabase.storage.from('documentos').getPublicUrl(filePath);

            const newDocForDb = { ...docData, obra_id: obraId, nome: file.name, url: urlData.publicUrl };
            const { data, error } = await supabase.from('documentos').insert(newDocForDb).select().single();
            handleSupabaseError(error, 'create document db entry');
            return data as Documento;
        },
         async delete(docId: string): Promise<void> {
            const { data: doc } = await supabase.from('documentos').select('url').eq('id', docId).single();
            if (doc?.url) {
                const filePath = new URL(doc.url).pathname.split('/documentos/')[1];
                await supabase.storage.from('documentos').remove([filePath]);
            }
            await supabase.from('documentos').delete().eq('id', docId);
        }
    },

    get users() { return createCrudService<User>('profiles'); },
    get obras() { return createCrudService<Obra>('obras'); },
    get funcionarios() { return createCrudService<Funcionario>('funcionarios'); },
    get transacoes() { return createCrudService<TransacaoFinanceira>('transacoes_financeiras'); },
    get materiais() { return createCrudService<Material>('materiais'); },
    get ferramentas() { return createCrudService<Ferramenta>('ferramentas'); },
    get diarios() { return createCrudService<DiarioObra>('diarios_obra'); },
    get servicos() { return createCrudService<Servico>('servicos'); },
    get movimentacoesAlmoxarifado() { return createCrudService<MovimentacaoAlmoxarifado>('movimentacoes_almoxarifado'); },
};
