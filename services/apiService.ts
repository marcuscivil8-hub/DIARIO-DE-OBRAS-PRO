
import { supabase } from './supabaseClient';
import { User, Obra, Funcionario, Ponto, TransacaoFinanceira, Material, Ferramenta, DiarioObra, Servico, MovimentacaoAlmoxarifado, Documento } from '../types';

// FIX: Aprimorado o tratamento de erros para Edge Functions para extrair a mensagem de erro específica.
const handleFunctionError = (error: any, context: string) => {
    if (error) {
        console.error(`Raw error from Edge Function '${context}':`, error);

        // A biblioteca supabase-js geralmente coloca o corpo da resposta de erro na propriedade 'context'.
        // A nossa função de backend retorna um objeto JSON como { "error": "mensagem específica" }.
        // Esta lógica tenta extrair essa mensagem específica.
        let specificMessage = '';

        if (error.context && typeof error.context.error === 'string') {
            // Caso o `context` seja um objeto já parseado com a propriedade `error`.
            specificMessage = error.context.error;
        } else if (error.context && typeof error.context === 'string') {
            // Caso o `context` seja uma string JSON crua.
            try {
                const parsedBody = JSON.parse(error.context);
                if (parsedBody.error) {
                    specificMessage = parsedBody.error;
                }
            } catch (e) {
                // Não é um JSON válido, ignora.
            }
        }
        
        // Se uma mensagem específica foi encontrada, a usamos. Caso contrário, usamos a mensagem genérica do erro.
        throw new Error(specificMessage || error.message);
    }
}

const handleSupabaseError = (error: any, context: string) => {
    if (error) {
        console.error(`Error in ${context}:`, error.message);
        throw error;
    }
};

// Mapeia nomes de campos JS para nomes de colunas do banco (convenção snake_case)
// FIX: Adicionado mapeamento para o campo 'tipo' para colunas mais específicas
// como 'tipo_transacao' para corresponder a um schema de banco de dados mais
// provável, resolvendo o erro "column 'tipo' does not exist".
const toSnakeCase = (data: Record<string, any>) => {
    const snakeCaseData: Record<string, any> = {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            // Mapeamento especial para o campo 'tipo' com base em outros campos presentes no objeto
            if (key === 'tipo') {
                if ('valor' in data && 'categoria' in data) { // Heurística para TransacaoFinanceira
                    snakeCaseData['tipo_transacao'] = data[key];
                    continue; // Pula o processamento normal para esta chave
                }
                if ('itemId' in data && 'itemType' in data) { // Heurística para MovimentacaoAlmoxarifado
                    snakeCaseData['tipo_movimentacao'] = data[key];
                    continue;
                }
                 if ('dataUpload' in data) { // Heurística para Documento
                    snakeCaseData['tipo_documento'] = data[key];
                    continue;
                }
            }

            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            snakeCaseData[snakeKey] = data[key];
        }
    }
    return snakeCaseData;
};

// Mapeia nomes de colunas do banco para nomes de campos JS
// FIX: Adicionado mapeamento reverso para colunas como 'tipo_transacao'
// para o campo 'tipo' do lado do cliente, garantindo consistência.
const toCamelCase = <T>(data: Record<string, any>): T => {
    if (!data) return data as T;
    const camelCaseData: Record<string, any> = {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            let keyToConvert = key;
            if (key === 'tipo_transacao' || key === 'tipo_movimentacao' || key === 'tipo_documento') {
                keyToConvert = 'tipo';
            }
            const camelKey = keyToConvert.replace(/_([a-z])/g, g => g[1].toUpperCase());
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
            const { data, error } = await supabase.from(tableName).insert(toSnakeCase(itemData)).select().single();
            handleSupabaseError(error, `create ${tableName}`);
            return toCamelCase<T>(data);
        },
        async update(itemId: string, updates: Partial<T>): Promise<T> {
            const { data, error } = await supabase.from(tableName).update(toSnakeCase(updates)).eq('id', itemId).select().single();
            handleSupabaseError(error, `update ${tableName}`);
            return toCamelCase<T>(data);
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
            throw new Error('Email ou senha inválidos.');
        }
        if (!authData.user) {
            throw new Error("Login falhou: Nenhum usuário retornado após a autenticação.");
        }

        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (profileError || !profileData) {
            console.error('Error fetching profile:', profileError?.message);
            await supabase.auth.signOut();
            
            const detailedError = profileError?.message.includes('recursion')
                ? "Erro de configuração no banco (recursão de RLS). Contacte o administrador."
                : `Falha ao buscar perfil do usuário: ${profileError?.message}`;
            throw new Error(detailedError);
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
            const { data: existing } = await supabase.from('pontos').select('id, funcionario_id, data, obra_id').returns<{ id: string; funcionario_id: string; data: string; obra_id: string }[]>();
            // FIX: Explicitly type the Map to prevent type inference issues when `existing` is null.
            const existingMap = new Map<string, string>(existing?.map(p => [`${p.funcionario_id}-${p.data}-${p.obra_id}`, p.id]));
            const newMap = new Map(newItems.map(p => [`${p.funcionarioId}-${p.data}-${p.obraId}`, p]));

            const toDelete = Array.from(existingMap.keys()).filter(key => !newMap.has(key));
            
            // FIX: Explicitly type the array for upsert to handle potential type inference issues.
            const toUpsert: Array<{ id?: string; funcionario_id: string; data: string; status: 'presente' | 'falta'; obra_id: string; }> = newItems.map(p => ({
                id: existingMap.get(`${p.funcionarioId}-${p.data}-${p.obraId}`),
                funcionario_id: p.funcionarioId,
                data: p.data,
                status: p.status,
                obra_id: p.obraId,
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
        async create(docData: Omit<Documento, 'id' | 'obraId' | 'url' | 'nome'>, obraId: string, file: File): Promise<Documento> {
            const filePath = `${obraId}/${Date.now()}-${file.name}`;
            const { error: uploadError } = await supabase.storage.from('documentos').upload(filePath, file);
            handleSupabaseError(uploadError, 'document upload');

            const { data: urlData } = supabase.storage.from('documentos').getPublicUrl(filePath);

            // FIX: Aplicado toSnakeCase para converter 'tipo' em 'tipo_documento'
            // e 'dataUpload' em 'data_upload', alinhando com o schema do banco de dados.
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
        async createUser(userData: Omit<User, 'id'>): Promise<any> {
            const { data, error } = await supabase.functions.invoke('create-user', {
                body: userData,
            });
            handleFunctionError(error, 'createUser');
            return data;
        },
        async updateUser(userId: string, updates: Partial<User>): Promise<any> {
             const { data, error } = await supabase.from('profiles').update(toSnakeCase(updates)).eq('id', userId).select().single();
             handleSupabaseError(error, `updateUser`);
             return toCamelCase<User>(data);
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
