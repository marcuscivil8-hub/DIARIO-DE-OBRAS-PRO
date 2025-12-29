import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole, Obra } from '../../types';
import { apiService } from '../../services/apiService';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal, { ConfirmationModal } from '../ui/Modal';
import { ICONS } from '../../constants';

const UsuariosPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [obras, setObras] = useState<Obra[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [userToDeleteId, setUserToDeleteId] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null); // State for modal errors
    const [pageError, setPageError] = useState<string | null>(null);
    const [isRlsError, setIsRlsError] = useState(false);
    const [isConfigError, setIsConfigError] = useState(false);
    const [isRpcError, setIsRpcError] = useState(false); // State for missing RPC function error
    
    const initialNewUserState: Omit<User, 'id'> = {
        name: '',
        email: '',
        username: '',
        password: '',
        role: UserRole.Encarregado,
        obraIds: [] as string[],
    };
    const [currentUserForm, setCurrentUserForm] = useState(initialNewUserState);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setIsRlsError(false);
        setIsConfigError(false);
        setIsRpcError(false);
        setPageError(null);
        try {
            const [usersData, obrasData] = await Promise.all([
                apiService.users.getAll(),
                apiService.obras.getAll()
            ]);
            setUsers(usersData);
            setObras(obrasData);
        } catch (error: any) {
             if (error.message.includes('get_users_with_email')) {
                setIsRpcError(true);
                setPageError(error.message);
            } else if (error.message.includes('RLS') || error.message.includes('recursion')) {
                setIsRlsError(true);
                setPageError(error.message);
            } else {
                setPageError("Falha ao carregar dados dos usuários.");
            }
            console.error("Failed to fetch data for user management", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);


    const handleOpenModal = (user: User | null = null) => {
        setFormError(null); // Reset error on modal open
        setPageError(null);
        setIsRlsError(false);
        setIsConfigError(false);
        setIsRpcError(false);
        if (user) {
            setEditingUser(user);
            setCurrentUserForm({
                name: user.name,
                email: user.email,
                username: user.username,
                password: '', // Password field is cleared for editing for security
                role: user.role,
                obraIds: user.obraIds || [],
            });
        } else {
            setEditingUser(null);
            setCurrentUserForm(initialNewUserState);
        }
        setIsModalOpen(true);
    };
    
    const handleSaveUser = async () => {
        setFormError(null);
        setPageError(null);
        setIsRlsError(false);
        setIsConfigError(false);
        setIsRpcError(false);

        if (!currentUserForm.name || !currentUserForm.username || !currentUserForm.email || (!editingUser && !currentUserForm.password)) {
            setFormError('Por favor, preencha nome, email, usuário e senha.');
            return;
        }

        const userData = {
            ...currentUserForm,
            obraIds: currentUserForm.role === UserRole.Cliente ? currentUserForm.obraIds : [],
        };

        try {
            if (editingUser) {
                const updates: Partial<User> = {
                    name: userData.name,
                    username: userData.username,
                    role: userData.role,
                    obraIds: userData.obraIds,
                };
                await apiService.users.update(editingUser.id, updates);
            } else {
                await apiService.users.createUser(userData);
            }
            setIsModalOpen(false);
            await fetchData();
        } catch (error: any) {
            console.error(`Erro ao salvar usuário: ${error.message}`);
            if (error.message.includes('CONFIG_ERROR')) {
                setIsConfigError(true);
                setPageError(error.message);
                setIsModalOpen(false);
            } else if (error.message.includes('RLS') || error.message.includes('recursion') || error.message.includes('permissão negada')) {
                setIsRlsError(true);
                setPageError(error.message);
                setIsModalOpen(false);
            } else {
                setFormError(error.message);
            }
        }
    };

    const triggerDeleteUser = (userId: string) => {
        setPageError(null);
        setIsRlsError(false);
        setIsConfigError(false);
        setIsRpcError(false);
        const user = users.find(u => u.id === userId);
        if (user?.email === 'admin@diariodeobra.pro') {
            setPageError('Não é possível excluir o administrador principal.');
            return;
        }
        setUserToDeleteId(userId);
        setIsConfirmModalOpen(true);
    };

    const confirmDeleteUser = async () => {
        if (!userToDeleteId) return;
        let hadError = false;
        try {
            await apiService.users.deleteUser(userToDeleteId);
        } catch (error: any) {
            hadError = true;
            if (error.message.includes('CONFIG_ERROR')) {
                setIsConfigError(true);
                setPageError(error.message);
            } else {
                setPageError(`Erro ao deletar usuário: ${error.message}`);
            }
        }
        
        setIsConfirmModalOpen(false);
        setUserToDeleteId(null);
        if (!hadError) {
            await fetchData();
        }
    };
    
    const handleObraIdChange = (obraId: string) => {
        setCurrentUserForm(prev => {
            const newObraIds = prev.obraIds?.includes(obraId)
                ? prev.obraIds.filter(id => id !== obraId)
                : [...(prev.obraIds || []), obraId];
            return { ...prev, obraIds: newObraIds };
        });
    };
    
    if(loading && !isRlsError) return <div className="text-center p-8">Carregando usuários...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-brand-blue">Gerenciamento de Usuários</h2>
                 <Button onClick={() => handleOpenModal()} className="flex items-center space-x-2">
                    {ICONS.add}
                    <span>Novo Usuário</span>
                </Button>
            </div>
            {pageError && !isRlsError && !isConfigError && !isRpcError && <div className="p-3 bg-red-50 text-red-700 rounded-lg mb-4">{pageError}</div>}
            
             {isRpcError && (
                 <Card className="mt-6 text-sm bg-red-50 border border-red-200">
                    <h4 className="font-bold text-red-800 mb-2 text-base">Erro Crítico: Função do Banco de Dados Ausente</h4>
                    <p className="text-red-700">A lista de usuários não pôde ser carregada. O aplicativo precisa de uma função especial no banco de dados chamada <code>get_users_with_email</code> para buscar os emails dos usuários de forma segura.</p>
                    <p className="text-red-700 mt-2">Para corrigir, execute o script SQL abaixo no <strong>SQL Editor</strong> do seu painel Supabase. Isso criará a função necessária e resolverá o problema imediatamente.</p>
                    
                    <div className="mt-4">
                        <h5 className="font-bold text-red-700">Script SQL para Criar a Função</h5>
                        <pre className="bg-gray-800 text-white p-3 rounded-md text-xs overflow-x-auto my-2">
                            <code>
{`-- Cria a função para buscar perfis de usuário junto com seus emails da tabela de autenticação.
CREATE OR REPLACE FUNCTION public.get_users_with_email()
RETURNS TABLE (
    id uuid,
    name text,
    email text,
    username text,
    role user_role, -- Certifique-se de que o tipo 'user_role' existe no seu banco de dados
    obra_ids text[]
)
LANGUAGE sql
SECURITY DEFINER -- Essencial para permitir o acesso à tabela auth.users
AS $$
  SELECT
    p.id,
    p.name,
    u.email,
    p.username,
    p.role,
    p.obra_ids
  FROM
    public.profiles AS p
  JOIN
    auth.users AS u ON p.id = u.id;
$$;`}
                            </code>
                        </pre>
                         <p className="text-xs text-red-700 mt-2"><strong>Nota:</strong> Se o tipo <code>user_role</code> não existir, você pode criá-lo com: <code>CREATE TYPE user_role AS ENUM ('Admin', 'Encarregado', 'Cliente');</code></p>
                    </div>
                </Card>
            )}

            {isConfigError && (
                 <Card className="mt-6 text-sm bg-red-50 border border-red-200">
                    <h4 className="font-bold text-red-800 mb-2 text-base">Erro Crítico: Falha de Conexão com o Servidor (Edge Function)</h4>
                    <p className="text-red-700">A criação ou exclusão de usuários falhou. Isso ocorre porque as funções do servidor (`create-user`, `delete-user`) não foram implantadas (deploy) ou não foram configuradas corretamente no Supabase.</p>
                    
                    <div className="mt-4 pt-3 border-t border-red-200">
                        <h5 className="font-bold text-red-700">Como Corrigir (Guia Completo):</h5>
                        
                        <div className="mt-3 p-3 bg-red-100 rounded-lg">
                             <h6 className="font-bold text-red-800">Passo 0: Implante (Deploy) as Funções</h6>
                             <p className="text-red-700 text-xs mt-1">Antes de adicionar "Secrets", as funções precisam existir. Se você não vir `create-user` e `delete-user` na sua lista de Edge Functions, siga estes passos para cada uma:</p>
                             <ol className="list-decimal list-inside text-red-700 space-y-1 mt-2 text-xs">
                                <li>No painel do Supabase, vá para <strong>Edge Functions</strong>.</li>
                                <li>Clique em <strong>"Deploy a new function"</strong>.</li>
                                <li>Dê o nome exato da função (ex: `create-user`).</li>
                                <li>Apague o código de exemplo e **cole o conteúdo completo** do arquivo correspondente que está na pasta `supabase/functions` do seu projeto.</li>
                                <li>Clique em <strong>"Save and Deploy"</strong> e aguarde a conclusão.</li>
                             </ol>
                        </div>

                        <div className="mt-4">
                            <h6 className="font-bold text-red-800">Passo 1: Configure os "Secrets" das Funções</h6>
                            <ol className="list-decimal list-inside text-red-700 space-y-2 mt-2">
                                <li>No menu <strong>Edge Functions</strong>, clique na função (ex: `create-user`).</li>
                                <li>Vá para a aba <strong>Secrets</strong>.</li>
                                <li>Adicione os dois "Secrets" abaixo (repita para `create-user` e `delete-user`):
                                    <ul className="list-disc list-inside ml-6 my-2 font-mono bg-red-100 p-2 rounded">
                                        <li className="font-bold">Nome: <code className="bg-gray-200 text-black px-1 rounded">PROJECT_URL</code>, Valor: <code className="bg-gray-200 text-black px-1 rounded">https://yaaqffcvpghdamtkzvea.supabase.co</code></li>
                                        <li className="font-bold">Nome: <code className="bg-gray-200 text-black px-1 rounded">SERVICE_ROLE_KEY</code>, Valor: <span className="italic">(Sua chave service_role)</span></li>
                                    </ul>
                                </li>
                                 <li>Para encontrar a chave <code className="font-mono bg-gray-200 text-black px-1 rounded">service_role</code>: vá em <strong>Project Settings</strong> (ícone de engrenagem) &rarr; <strong>API</strong> &rarr; copie o valor do campo <strong>`service_role` (secret)</strong>.</li>
                            </ol>
                        </div>
                        <p className="text-red-800 font-semibold mt-3">Após implantar as funções e configurar os Secrets, a funcionalidade será restaurada imediatamente.</p>
                    </div>
                </Card>
            )}

            {isRlsError && (
                 <Card className="mt-6 text-sm bg-red-50 border border-red-200">
                    <h4 className="font-bold text-red-800 mb-2 text-base">Erro Crítico: Permissão de Acesso Negada (RLS)</h4>
                    <p className="text-red-700">A operação falhou. Para que um <strong>Administrador</strong> possa gerenciar outros usuários, as <strong>Políticas de Segurança (RLS)</strong> da sua tabela <code>profiles</code> no Supabase precisam ser ajustadas para evitar um erro de recursão.</p>
                    <p className="text-red-700 mt-2">Execute o script SQL abaixo no <strong>SQL Editor</strong> do seu painel Supabase para corrigir o problema de forma definitiva.</p>
                    
                    <div className="mt-4">
                        <h5 className="font-bold text-red-700">1. (Obrigatório) Crie uma Função Auxiliar Segura</h5>
                        <p className="text-red-700 text-xs mb-1">Esta função verifica a permissão do usuário de forma segura, evitando o loop de recursão.</p>
                        <pre className="bg-gray-800 text-white p-3 rounded-md text-xs overflow-x-auto my-2">
                            <code>
{`CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;`}
                            </code>
                        </pre>
                    </div>

                    <div className="mt-4">
                        <h5 className="font-bold text-red-700">2. (Obrigatório) Crie as Políticas de Acesso</h5>
                        <p className="text-red-700 text-xs mb-1">Crie estas duas políticas para a tabela <code>profiles</code>. Este script é seguro para ser executado múltiplas vezes.</p>
                        <pre className="bg-gray-800 text-white p-3 rounded-md text-xs overflow-x-auto my-2">
                            <code>
{`-- (Opcional) Limpa políticas antigas para evitar o erro "policy already exists".
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins and users can update profiles" ON public.profiles;

-- Política para Visualizar (SELECT)
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING ((auth.uid() = id) OR (get_my_role() = 'Admin'));

-- Política para Atualizar (UPDATE)
CREATE POLICY "Admins and users can update profiles" ON public.profiles
FOR UPDATE USING ((auth.uid() = id) OR (get_my_role() = 'Admin'));`}
                            </code>
                        </pre>
                    </div>
                    <p className="text-red-700 mt-3">Após executar estes comandos, a página de usuários funcionará corretamente.</p>
                </Card>
            )}

            {!isRlsError && !isConfigError && !isRpcError && (
                 <Card>
                    <div className="overflow-x-auto">
                         <table className="w-full text-left">
                            <thead className="border-b-2 border-brand-light-gray">
                                <tr>
                                    <th className="p-4 text-brand-blue font-semibold">Nome</th>
                                    <th className="p-4 text-brand-blue font-semibold">Email</th>
                                    <th className="p-4 text-brand-blue font-semibold">Usuário</th>
                                    <th className="p-4 text-brand-blue font-semibold">Permissão</th>
                                    <th className="p-4 text-brand-blue font-semibold">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id} className="border-b border-brand-light-gray hover:bg-gray-50">
                                        <td className="p-4 font-bold text-brand-blue">{user.name}</td>
                                        <td className="p-4 text-gray-700">{user.email}</td>
                                        <td className="p-4 text-gray-700">{user.username}</td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                                                user.role === UserRole.Admin ? 'bg-red-100 text-red-800' :
                                                user.role === UserRole.Encarregado ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-blue-100 text-blue-800'
                                            }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex space-x-2">
                                                <button onClick={() => handleOpenModal(user)} className="text-blue-600 hover:text-blue-800 p-1">{ICONS.edit}</button>
                                                <button onClick={() => triggerDeleteUser(user.id)} className="text-red-600 hover:text-red-800 p-1">{ICONS.delete}</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? "Editar Usuário" : "Criar Novo Usuário"}>
                 <form onSubmit={e => { e.preventDefault(); handleSaveUser(); }} className="space-y-4">
                    <input type="text" placeholder="Nome Completo" value={currentUserForm.name} onChange={e => setCurrentUserForm({...currentUserForm, name: (e.target as HTMLInputElement).value})} className="w-full p-2 border rounded" required/>
                    <input type="email" placeholder="Email (para login)" value={currentUserForm.email} onChange={e => setCurrentUserForm({...currentUserForm, email: (e.target as HTMLInputElement).value})} className="w-full p-2 border rounded" required disabled={!!editingUser}/>
                    <input type="text" placeholder="Nome de Usuário (ex: joaosilva)" value={currentUserForm.username} onChange={e => setCurrentUserForm({...currentUserForm, username: (e.target as HTMLInputElement).value})} className="w-full p-2 border rounded" required/>
                    <input type="password" placeholder={editingUser ? "Nova Senha (deixe em branco para não alterar)" : "Senha"} value={currentUserForm.password} onChange={e => setCurrentUserForm({...currentUserForm, password: (e.target as HTMLInputElement).value})} className="w-full p-2 border rounded" required={!editingUser}/>
                    <select value={currentUserForm.role} onChange={e => setCurrentUserForm({...currentUserForm, role: (e.target as HTMLSelectElement).value as UserRole})} className="w-full p-2 border rounded">
                        <option value={UserRole.Admin}>Admin</option>
                        <option value={UserRole.Encarregado}>Encarregado</option>
                        <option value={UserRole.Cliente}>Cliente</option>
                    </select>

                    {currentUserForm.role === UserRole.Cliente && (
                        <div className="space-y-2 pt-2 border-t">
                             <h4 className="font-semibold text-brand-gray">Vincular Obras ao Cliente:</h4>
                             {obras.map(obra => (
                                <div key={obra.id} className="flex items-center">
                                    <input type="checkbox" id={`obra-${obra.id}`} checked={currentUserForm.obraIds?.includes(obra.id)} onChange={() => handleObraIdChange(obra.id)} className="h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue"/>
                                    <label htmlFor={`obra-${obra.id}`} className="ml-2 block text-sm text-gray-900">{obra.name}</label>
                                </div>
                             ))}
                        </div>
                    )}
                    
                    {formError && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{formError}</p>}

                    <Button type="submit" className="w-full">Salvar Usuário</Button>
                </form>
            </Modal>

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={confirmDeleteUser}
                title="Confirmar Exclusão"
                message="Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita."
                confirmText="Excluir Usuário"
            />
        </div>
    );
};

export default UsuariosPage;