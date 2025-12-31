import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole, Obra } from '../../types';
import { dataService } from '../../services/dataService';
import { supabase } from '../../services/supabaseClient';
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
        setPageError(null);
        try {
            const [usersData, obrasData] = await Promise.all([
                dataService.users.getAll(),
                dataService.obras.getAll()
            ]);
            setUsers(usersData);
            setObras(obrasData);
        } catch (error: any) {
            setPageError(error.message || "Falha ao carregar dados dos usuários.");
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
        if (user) {
            setEditingUser(user);
            setCurrentUserForm({
                name: user.name,
                email: user.email,
                username: user.username,
                password: '', // Password should not be displayed, only set if changed
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

        // Validations
        if (!currentUserForm.name || !currentUserForm.username || !currentUserForm.email) {
            setFormError('Por favor, preencha nome, email e usuário.');
            return;
        }

        if (!editingUser && !currentUserForm.password) {
             setFormError('A senha é obrigatória para novos usuários.');
            return;
        }

        if (currentUserForm.password && currentUserForm.password.length < 6) {
            setFormError('A senha deve ter no mínimo 6 caracteres.');
            return;
        }

        try {
            if (editingUser) {
                // UPDATE USER
                const profileUpdate: Partial<User> = {
                    name: currentUserForm.name,
                    username: currentUserForm.username,
                    role: currentUserForm.role,
                    obraIds: currentUserForm.role === UserRole.Cliente ? currentUserForm.obraIds : [],
                };
                await dataService.users.update(editingUser.id, profileUpdate);
                // Note: Password/Email updates are handled separately in real apps for security
            } else {
                // CREATE USER
                // 1. Invoke Edge Function to create user in Supabase Auth
                const { data: newUserAuth, error: createError } = await supabase.functions.invoke('create-user', {
                    body: { email: currentUserForm.email, password: currentUserForm.password },
                });

                if (createError) {
                    throw new Error(createError.message);
                }

                if (!newUserAuth.user?.id) {
                    throw new Error("Falha ao obter ID do novo usuário.");
                }

                // 2. Create user profile in 'users' table
                const profileData: Omit<User, 'password'> = {
                    id: newUserAuth.user.id,
                    name: currentUserForm.name,
                    email: currentUserForm.email,
                    username: currentUserForm.username,
                    role: currentUserForm.role,
                    obraIds: currentUserForm.role === UserRole.Cliente ? currentUserForm.obraIds : [],
                };
                
                // Use supabase directly to avoid uuid generation
                 const { error: profileError } = await supabase.from('users').insert(profileData);
                 if(profileError) throw profileError;
            }
            setIsModalOpen(false);
            await fetchData();
        } catch (error: any) {
            console.error(`Erro ao salvar usuário: ${error.message}`);
            setFormError(error.message);
        }
    };

    const triggerDeleteUser = (userId: string) => {
        setPageError(null);
        const user = users.find(u => u.id === userId);
        // This is a mock data check, in real supabase you would protect this via RLS or function logic
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
            // Invoke Edge Function to delete from Supabase Auth
            const { error: deleteAuthError } = await supabase.functions.invoke('delete-user', {
                body: { userId: userToDeleteId },
            });
            if (deleteAuthError) {
                throw new Error(deleteAuthError.message);
            }

            // Delete from public.users table
            await dataService.users.delete(userToDeleteId);

        } catch (error: any) {
            hadError = true;
            setPageError(`Erro ao deletar usuário: ${error.message}`);
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
    
    if(loading) return <div className="text-center p-8">Carregando usuários...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-brand-blue">Gerenciamento de Usuários</h2>
                 <Button onClick={() => handleOpenModal()} className="flex items-center space-x-2">
                    {ICONS.add}
                    <span>Novo Usuário</span>
                </Button>
            </div>
            {pageError && <div className="p-3 bg-red-50 text-red-700 rounded-lg mb-4">{pageError}</div>}
            
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
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? "Editar Usuário" : "Criar Novo Usuário"}>
                 <form onSubmit={e => { e.preventDefault(); handleSaveUser(); }} className="space-y-4">
                    <input type="text" placeholder="Nome Completo" value={currentUserForm.name} onChange={e => setCurrentUserForm({...currentUserForm, name: (e.target as HTMLInputElement).value})} className="w-full p-2 border rounded" required/>
                    <input type="email" placeholder="Email (para login)" value={currentUserForm.email} onChange={e => setCurrentUserForm({...currentUserForm, email: (e.target as HTMLInputElement).value})} className="w-full p-2 border rounded" required disabled={!!editingUser}/>
                    <input type="text" placeholder="Nome de Usuário (ex: joaosilva)" value={currentUserForm.username} onChange={e => setCurrentUserForm({...currentUserForm, username: (e.target as HTMLInputElement).value})} className="w-full p-2 border rounded" required/>
                    <input type="password" placeholder={editingUser ? "Nova Senha (deixe em branco para não alterar)" : "Senha"} value={currentUserForm.password} onChange={e => setCurrentUserForm({...currentUserForm, password: (e.target as HTMLInputElement).value})} className="w-full p-2 border rounded" />
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
