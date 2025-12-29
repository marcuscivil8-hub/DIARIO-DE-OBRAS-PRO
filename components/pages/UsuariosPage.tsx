
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
    
    // FIX: Added 'email' property to satisfy the User type.
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
        setIsRlsError(false); // Reset on every fetch
        setIsConfigError(false);
        setPageError(null);
        try {
            const [usersData, obrasData] = await Promise.all([
                apiService.users.getAll(),
                apiService.obras.getAll()
            ]);
            setUsers(usersData);
            setObras(obrasData);
        } catch (error: any) {
             if (error.message.includes('RLS') || error.message.includes('recursion')) {
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
        if (user) {
            setEditingUser(user);
            // FIX: Added 'email' property when setting form state for an existing user.
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
            {pageError && !isRlsError && !isConfigError && <div className="p-3 bg-red-50 text-red-700 rounded-lg mb-4">{pageError}</div>}
            
            {isConfigError && (
                 <Card className="mt-6 text-sm bg-red-50 border border-red-200">
                    <h4 className="font-bold text-red-800 mb-2 text-base">Erro Crítico: Falha de Conexão com o Servidor (Edge Function)</h4>
                    <p className="text-red-700">A criação ou exclusão de usuários falhou porque o aplicativo não conseguiu se comunicar com o servidor Supabase.</p>
                    <p className="text-red-700 mt-2"><strong>Causa Mais Comum:</strong> A chave de API pública (<code className="bg-gray-200 text-black px-1 rounded">supabaseAnonKey</code>) no arquivo de configuração não foi definida.</p>
                    
                    <div className="mt-3 pt-3 border-t border-red-200">
                        <h5 className="font-bold text-red-700">Como Corrigir:</h5>
                        <ol className="list-decimal list-inside text-red-700 space-y-1 mt-1">
                            <li>Abra o arquivo <code className="bg-gray-200 text-black px-1 rounded">services/supabaseClient.ts</code> no seu projeto.</li>
                            <li>Siga as instruções nos comentários para copiar sua chave de API pública (anon) do painel do Supabase.</li>
                            <li>Cole sua chave no lugar do texto <code className="bg-gray-200 text-black px-1 rounded">'SUA_CHAVE_PUBLICA_ANON_AQUI'</code>.</li>
                            <li>Salve o arquivo. A funcionalidade será restaurada imediatamente.</li>
                        </ol>
                    </div>
                     <p className="text-red-700 mt-3 text-xs"><strong>Outras Causas:</strong> A URL do Supabase no mesmo arquivo pode estar incorreta, ou seu projeto no painel do Supabase pode estar pausado por inatividade.</p>
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
                        <p className="text-red-700 text-xs mb-1">Crie estas duas políticas para a tabela <code>profiles</code>. Elas usarão a função acima e são seguras.</p>
                        <pre className="bg-gray-800 text-white p-3 rounded-md text-xs overflow-x-auto my-2">
                            <code>
{`-- Política para Visualizar (SELECT)
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

            {!isRlsError && !isConfigError && (
                 <Card>
                    <div className="overflow-x-auto">
                         <table className="w-full text-left">
                            <thead className="border-b-2 border-brand-light-gray">
                                <tr>
                                    <th className="p-4 text-brand-blue font-semibold">Nome</th>
                                    <th className="p-4 text-brand-blue font-semibold">Email</th>
                                    <th className="p-4 text-brand-blue font-semibold">Permissão</th>
                                    <th className="p-4 text-brand-blue font-semibold">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id} className="border-b border-brand-light-gray hover:bg-gray-50">
                                        <td className="p-4 font-bold text-brand-blue">{user.name}</td>
                                        <td className="p-4 text-gray-700">{user.email}</td>
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
                    {/* FIX: Cast event target to HTMLInputElement to access value property. */}
                    <input type="text" placeholder="Nome Completo" value={currentUserForm.name} onChange={e => setCurrentUserForm({...currentUserForm, name: (e.target as HTMLInputElement).value})} className="w-full p-2 border rounded" required/>
                    {/* FIX: Added email input and changed username placeholder. */}
                    {/* FIX: Cast event target to HTMLInputElement to access value property. */}
                    <input type="email" placeholder="Email (para login)" value={currentUserForm.email} onChange={e => setCurrentUserForm({...currentUserForm, email: (e.target as HTMLInputElement).value})} className="w-full p-2 border rounded" required disabled={!!editingUser}/>
                    {/* FIX: Cast event target to HTMLInputElement to access value property. */}
                    <input type="text" placeholder="Nome de Usuário (ex: joaosilva)" value={currentUserForm.username} onChange={e => setCurrentUserForm({...currentUserForm, username: (e.target as HTMLInputElement).value})} className="w-full p-2 border rounded" required/>
                    {/* FIX: Cast event target to HTMLInputElement to access value property. */}
                    <input type="password" placeholder={editingUser ? "Nova Senha (deixe em branco para não alterar)" : "Senha"} value={currentUserForm.password} onChange={e => setCurrentUserForm({...currentUserForm, password: (e.target as HTMLInputElement).value})} className="w-full p-2 border rounded" required={!editingUser}/>
                    {/* FIX: Cast event target to HTMLSelectElement to access value property. */}
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