import React, { useState } from 'react';
import { User, UserRole } from '../../types';
import { authService } from '../../services/authService';
// FIX: Import dataService to manage user profile data.
import { dataService } from '../../services/dataService';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal, { ConfirmationModal } from '../ui/Modal';
import { ICONS } from '../../constants';
import { useData } from '../../contexts/DataContext';

const UsuariosPage: React.FC = () => {
    const { users, obras, loading, refetchData } = useData();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isSaving, setIsSaving] = useState(false); // For modal save state
    
    const [formError, setFormError] = useState<string | null>(null); // State for modal errors
    const [pageError, setPageError] = useState<string | null>(null);
    
    // State for delete confirmation
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    const initialNewUserState: Omit<User, 'id'> = {
        name: '',
        email: '',
        username: '',
        password: '',
        role: UserRole.Encarregado,
        obraIds: [] as string[],
    };
    const [currentUserForm, setCurrentUserForm] = useState(initialNewUserState);

    const handleOpenModal = (user: User | null = null) => {
        setFormError(null);
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
        
        setIsSaving(true);
        try {
            if (editingUser) {
                // UPDATE USER
                const updateData = {
                    name: currentUserForm.name,
                    username: currentUserForm.username,
                    role: currentUserForm.role,
                    obraIds: currentUserForm.role === UserRole.Cliente ? currentUserForm.obraIds : [],
                };
                await dataService.users.update(editingUser.id, updateData);

                if (currentUserForm.password) {
                    await authService.updateUserPassword(editingUser.id, currentUserForm.password);
                }
            } else {
                // CREATE USER
                await authService.createUser(currentUserForm);
            }
            
            setIsModalOpen(false);
            await refetchData();

        } catch (error: any) {
            const errorMessage = error.message || "Ocorreu um erro desconhecido.";
            console.error("Failed to save user:", errorMessage);
            setFormError(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    const handleObraSelection = (obraId: string) => {
        const currentIds = currentUserForm.obraIds || [];
        const newIds = currentIds.includes(obraId)
            ? currentIds.filter(id => id !== obraId)
            : [...currentIds, obraId];
        setCurrentUserForm({ ...currentUserForm, obraIds: newIds });
    };

    const triggerDeleteUser = (user: User) => {
        setUserToDelete(user);
        setIsConfirmDeleteOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!userToDelete) return;
        setPageError(null);
        try {
            await authService.deleteUser(userToDelete.id);
            await refetchData();
        } catch (error: any) {
            console.error("Failed to delete user:", error);
            setPageError(error.message || "Falha ao excluir o usuário. Tente novamente.");
        } finally {
            setIsConfirmDeleteOpen(false);
            setUserToDelete(null);
        }
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
                                            <button onClick={() => triggerDeleteUser(user)} className="text-red-600 hover:text-red-800 p-1">{ICONS.delete}</button>
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
                    <input type="text" placeholder="Nome Completo" value={currentUserForm.name} onChange={e => setCurrentUserForm({ ...currentUserForm, name: (e.target as HTMLInputElement).value })} className="w-full p-2 border rounded" required disabled={isSaving}/>
                    <input type="email" placeholder="Email" disabled={!!editingUser || isSaving} value={currentUserForm.email} onChange={e => setCurrentUserForm({ ...currentUserForm, email: (e.target as HTMLInputElement).value })} className="w-full p-2 border rounded disabled:bg-gray-200" required />
                    <input type="text" placeholder="Nome de usuário" value={currentUserForm.username} onChange={e => setCurrentUserForm({ ...currentUserForm, username: (e.target as HTMLInputElement).value })} className="w-full p-2 border rounded" required disabled={isSaving}/>
                    <input type="password" placeholder={editingUser ? "Nova Senha (deixe em branco para não alterar)" : "Senha"} value={currentUserForm.password} onChange={e => setCurrentUserForm({ ...currentUserForm, password: (e.target as HTMLInputElement).value })} className="w-full p-2 border rounded" disabled={isSaving}/>
                    <select value={currentUserForm.role} onChange={e => setCurrentUserForm({ ...currentUserForm, role: (e.target as HTMLSelectElement).value as UserRole })} className="w-full p-2 border rounded" disabled={isSaving}>
                        {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                    {currentUserForm.role === UserRole.Cliente && (
                        <div>
                            <label className="block text-sm font-medium text-brand-gray mb-2">Obras Associadas</label>
                            <fieldset disabled={isSaving}>
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
                            </fieldset>
                        </div>
                    )}
                    {formError && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{formError}</p>}
                    <Button type="submit" className="w-full" disabled={isSaving}>
                        {isSaving ? 'Salvando...' : 'Salvar Usuário'}
                    </Button>
                </form>
            </Modal>
            
            <ConfirmationModal
                isOpen={isConfirmDeleteOpen}
                onClose={() => setIsConfirmDeleteOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirmar Exclusão de Usuário"
                message={
                    <>
                        <p>Tem certeza que deseja excluir o usuário <strong>{userToDelete?.name}</strong>?</p>
                        <p className="mt-2 text-sm text-red-600">Esta ação é irreversível. O usuário e todos os seus dados de acesso serão removidos permanentemente.</p>
                    </>
                }
                confirmText="Excluir Usuário"
                confirmVariant="danger"
            />

        </div>
    );
};

export default UsuariosPage;