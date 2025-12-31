import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole, Obra } from '../../types';
import { dataService } from '../../services/dataService';
import { authService } from '../../services/authService';
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
                password: '', // Password should not be displayed, only set
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
                // UPDATE USER PROFILE
                const profileUpdate: Partial<User> = {
                    name: currentUserForm.name,
                    username: currentUserForm.username,
                    role: currentUserForm.role,
                    obraIds: currentUserForm.role === UserRole.Cliente ? currentUserForm.obraIds : [],
                };
                
                // NOTE: Supabase password updates require special handling and can't be done directly
                // from a client with just anon key if RLS is on. This is a simplification.
                // A server-side function would be needed for a secure implementation.
                
                await dataService.users.update(editingUser.id, profileUpdate);

            } else {
                // CREATE USER
                const newUserData: Omit<User, 'id'> = {
                    name: currentUserForm.name,
                    email: currentUserForm.email,
                    username: currentUserForm.username,
                    password: currentUserForm.password,
                    role: currentUserForm.role,
                    obraIds: currentUserForm.role === UserRole.Cliente ? currentUserForm.obraIds : [],
                };
                await authService.createUser(newUserData);
            }
            
            setIsModalOpen(false);
            await fetchData();

        } catch (error: any) {
            const errorMessage = error.message || "Ocorreu um erro desconhecido.";
            console.error("Failed to save user:", errorMessage);
            setFormError(errorMessage);
        }
    };

    const handleObraSelection = (obraId: string) => {
        const currentIds = currentUserForm.obraIds || [];
        const newIds = currentIds.includes(obraId)
            ? currentIds.filter(id => id !== obraId)
            : [...currentIds, obraId];
        setCurrentUserForm({ ...currentUserForm, obraIds: newIds });
    };

    if (loading) return <div className="text-center p-8">Carregando usuários...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-brand-blue">Gestão de Usuários</h2>
                <Button onClick={() => handleOpenModal()} className="flex items-center space-x-2">
                    {ICONS.add}
                    <span>Novo Usuário</span>
                </Button>
            </div>

            {pageError && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{pageError}</p>}

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b-2 bg-brand-light-gray">
                                <th className="p-4 text-brand-blue font-semibold">Nome</th>
                                <th className="p-4 text-brand-blue font-semibold">Email</th>
                                <th className="p-4 text-brand-blue font-semibold">Perfil</th>
                                <th className="p-4 text-brand-blue font-semibold">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} className="border-b hover:bg-gray-50">
                                    <td className="p-4 font-bold text-brand-blue">{user.name}</td>
                                    <td className="p-4 text-gray-700">{user.email}</td>
                                    <td className="p-4 text-gray-700">{user.role}</td>
                                    <td className="p-4">
                                        <div className="flex space-x-2">
                                            <button onClick={() => handleOpenModal(user)} className="text-blue-600 hover:text-blue-800 p-1">{ICONS.edit}</button>
                                             <p className="text-sm text-gray-400">(Excluir no painel Supabase)</p>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? 'Editar Usuário' : 'Novo Usuário'}>
                <form onSubmit={e => { e.preventDefault(); handleSaveUser(); }} className="space-y-4">
                    <input type="text" placeholder="Nome Completo" value={currentUserForm.name} onChange={e => setCurrentUserForm({ ...currentUserForm, name: (e.target as HTMLInputElement).value })} className="w-full p-2 border rounded" required />
                    <input type="email" placeholder="Email" disabled={!!editingUser} value={currentUserForm.email} onChange={e => setCurrentUserForm({ ...currentUserForm, email: (e.target as HTMLInputElement).value })} className="w-full p-2 border rounded disabled:bg-gray-200" required />
                    <input type="text" placeholder="Nome de usuário" value={currentUserForm.username} onChange={e => setCurrentUserForm({ ...currentUserForm, username: (e.target as HTMLInputElement).value })} className="w-full p-2 border rounded" required />
                    <input type="password" placeholder={editingUser ? "Nova Senha (deixe em branco para não alterar)" : "Senha"} value={currentUserForm.password} onChange={e => setCurrentUserForm({ ...currentUserForm, password: (e.target as HTMLInputElement).value })} className="w-full p-2 border rounded" />
                    <select value={currentUserForm.role} onChange={e => setCurrentUserForm({ ...currentUserForm, role: (e.target as HTMLSelectElement).value as UserRole })} className="w-full p-2 border rounded">
                        {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                    {currentUserForm.role === UserRole.Cliente && (
                        <div>
                            <label className="block text-sm font-medium text-brand-gray mb-2">Obras Associadas</label>
                            <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-2">
                                {obras.map(obra => (
                                    <div key={obra.id} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id={`obra-${obra.id}`}
                                            checked={currentUserForm.obraIds?.includes(obra.id)}
                                            onChange={() => handleObraSelection(obra.id)}
                                            className="h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
                                        />
                                        <label htmlFor={`obra-${obra.id}`} className="ml-2 text-sm text-gray-700">{obra.name}</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {formError && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{formError}</p>}
                    <Button type="submit" className="w-full">Salvar Usuário</Button>
                </form>
            </Modal>
        </div>
    );
};

export default UsuariosPage;