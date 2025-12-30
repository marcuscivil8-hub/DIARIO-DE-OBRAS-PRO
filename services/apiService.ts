
import { supabase } from './supabaseClient';
import { User, Obra, Funcionario, Ponto, TransacaoFinanceira, Material, Ferramenta, DiarioObra, Servico, MovimentacaoAlmoxarifado, Documento } from '../types';

const handleFunctionError = (error: any, context: string) => {
    if (error) {
        console.error(`Error in Edge Function ${context}:`, error);
        const errorMessage = error.context?.error || error.message;
        throw new Error(errorMessage);
    }
}

const handleSupabaseError = (error: any, context: string) => {
    if (error) {
        console.error(`Error in ${context}:`, error.message);
        throw error;
    }
};

// Mapeia nomes de campos JS (camelCase) para nomes de colunas do banco (snake_case)
const toSnakeCase = (data: Record<string, any>) => {
    const snakeCaseData: Record<string, any> = {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            snakeCaseData[snakeKey] = data[key];
        }
    }
    return snakeCaseData;
};

// Mapeia nomes de colunas do banco (snake_case) para nomes de campos JS (camelCase)
const toCamelCase = <T>(data: Record<string, any>): T => {
    if (!data) return data as T;
    const camelCaseData: Record<string, any> = {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const camelKey = key.replace(/_([a-z])/g, g => g[1].toUpperCase());
            camelCaseData[camelKey] = data[key];
        }
    }
    return camelCaseData as T;
};


const createCrudService = <T extends { id: string }>(tableName: string) => {
    return {
        async getAll(): Promise<T[]> {
            const { data, error } = await supabase.from(tableName).select('*');
            handleSupabaseError(error, `getAll ${tableName}`);
            return data ? data.map(item => toCamelCase<T>(item)) : [];
        },
        async create(itemData: Omit<T, 'id'>): Promise<T> {
            const { data, error } = await supabase.from(tableName).insert(toSnakeCase(itemData)).select();
            handleSupabaseError(error, `create ${tableName}`);
            if (!data || data.length !== 1) {
                console.error(`Supabase create did not return a single row for table ${tableName}.`, data);
                throw new Error(`Falha ao criar item na tabela '${tableName}'. A inserção não retornou o registro esperado.`);
            }
            return toCamelCase<T>(data[0]);
        },
        async update(itemId: string, updates: Partial<T>): Promise<T> {
            const { data, error } = await supabase.from(tableName).update(toSnakeCase(updates)).eq('id', itemId).select();
            handleSupabaseError(error, `update ${tableName}`);
            if (!data || data.length === 0) {
                throw new Error(`Nenhum item encontrado na tabela '${tableName}' para atualizar, ou permissão negada.`);
            }
            if (data.length > 1) {
                console.warn(`A atualização na tabela '${tableName}' afetou múltiplas linhas. Retornando o primeiro resultado.`, data);
            }
            return toCamelCase<T>(data[0]);
        },
        async delete(itemId: string): Promise<void> {
            const { error } = await supabase.from(tableName).delete().eq('id', itemId);
            handleSupabaseError(error, `delete ${tableName}`);
        },
    };
};

export const apiService = {
    async login(email: string, password: string): Promise<User> {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) {
            // A mensagem de erro padrão do Supabase para credenciais erradas é "Invalid login credentials".
            // Retornar a mensagem original pode ajudar na depuração.
            throw new Error(authError.message === 'Invalid login credentials' ? 'Email ou senha inválidos.' : authError.message);
        }
        if (!authData.user) {
            throw new Error("Login falhou: Nenhum usuário retornado após a autenticação.");
        }

        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .limit(1) // Safeguard against multiple profiles
            .single();

        if (profileError || !profileData) {
            console.error('Error fetching profile:', profileError?.message);
            await supabase.auth.signOut();
            throw new Error(`PROFILE_ERROR: ${profileError?.message || 'Perfil não encontrado.'}`);
        }

        const user: User = {
            ...toCamelCase<User>(profileData),
            email: authData.user.email || '', // O email do Auth é a fonte da verdade
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
        
        const { data: profileData, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .limit(1) // Safeguard against multiple profiles
            .single();

        if (error || !profileData) return null;

         const user: User = {
            ...toCamelCase<User>(profileData),
            email: session.user.email || '', // O email do Auth é a fonte da verdade
        };
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        return user;
    },

    async getLembretes(): Promise<string[]> {
        const { data, error } = await supabase.from('configuracoes').select('lembretes_encarregado').eq('id', 1).maybeSingle();
        handleSupabaseError(error, 'getLembretes');
        return data?.lembretes_encarregado || [];
    },

    async updateLembretes(lembretes: string[]): Promise<void> {
        const { error } = await supabase.from('configuracoes').update({ lembretes_encarregado: lembretes }).eq('id', 1);
        handleSupabaseError(error, 'updateLembretes');
    },
    
    pontos: createCrudService<Ponto>('pontos'),
    
    documentos: {
        ...createCrudService<Documento>('documentos'),
        async create(docData: Omit<Documento, 'id' | 'obraId' | 'url' | 'nome'>, obraId: string, file: File): Promise<Documento> {
            const filePath = `${obraId}/${Date.now()}-${file.name}`;
            const { error: uploadError } = await supabase.storage.from('documentos').upload(filePath, file);
            handleSupabaseError(uploadError, 'document upload');

            const { data: urlData } = supabase.storage.from('documentos').getPublicUrl(filePath);

            const newDocForDb = { 
                ...toSnakeCase(docData),
                obra_id: obraId, 
                nome: file.name, 
                url: urlData.publicUrl 
            };

            const { data, error } = await supabase.from('documentos').insert(newDocForDb).select().single();
            handleSupabaseError(error, 'create document db entry');
            return toCamelCase<Documento>(data);
        },
         async delete(docId: string): Promise<void> {
            const { data: doc } = await supabase.from('documentos').select('url').eq('id', docId).single<{ url: string }>();
            if (doc?.url) {
                const filePath = new URL(doc.url).pathname.split('/documentos/')[1];
                await supabase.storage.from('documentos').remove([filePath]);
            }
            await supabase.from('documentos').delete().eq('id', docId);
        }
    },

    users: {
        ...createCrudService<User>('profiles'),
        async getAll(): Promise<User[]> {
            // Use an RPC function for security and efficiency. This avoids calling admin functions from the client.
            const { data, error } = await supabase.rpc('get_users_with_email');
            handleSupabaseError(error, 'getAll users via RPC');
            // The RPC is expected to return snake_case columns, so we convert them.
            return data ? data.map((item: any) => toCamelCase<User>(item)) : [];
        },
        async createUser(userData: Omit<User, 'id'>): Promise<any> {
            const { data, error } = await supabase.functions.invoke('create-user', {
                body: userData,
            });
            handleFunctionError(error, 'createUser');
            return data;
        },
        async deleteUser(userId: string): Promise<any> {
            const { data, error } = await supabase.functions.invoke('delete-user', {
                body: { user_id: userId },
            });
            handleFunctionError(error, 'deleteUser');
            return data;
        },
    },
    get obras() { return createCrudService<Obra>('obras'); },
    get funcionarios() { return createCrudService<Funcionario>('funcionarios'); },
    get transacoes() { return createCrudService<TransacaoFinanceira>('transacoes_financeiras'); },
    get materiais() { return createCrudService<Material>('materiais'); },
    get ferramentas() { return createCrudService<Ferramenta>('ferramentas'); },
    get diarios() { return createCrudService<DiarioObra>('diarios_obra'); },
    get servicos() { return createCrudService<Servico>('servicos'); },
    get movimentacoesAlmoxarifado() { return createCrudService<MovimentacaoAlmoxarifado>('movimentacoes_almoxarifado'); },
};
