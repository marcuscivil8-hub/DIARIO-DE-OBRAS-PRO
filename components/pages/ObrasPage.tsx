import React, { useState, useEffect, useCallback } from 'react';
import { Obra, User, UserRole, Page } from '../../types';
import { dataService } from '../../services/dataService';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal, { ConfirmationModal } from '../ui/Modal';
import { ICONS } from '../../constants';

interface ObrasPageProps {
    user: User;
    navigateTo: (page: Page, obraId: string) => void;
}

const ObrasPage: React.FC<ObrasPageProps> = ({ user, navigateTo }) => {
    const [obras, setObras] = useState<Obra[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingObra, setEditingObra] = useState<Obra | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [obraToDeleteId, setObraToDeleteId] = useState<string | null>(null);
    const [pageError, setPageError] = useState<string | null>(null);
    
    const emptyObra: Omit<Obra, 'id'> = {
        name: '',
        cliente: '',
        endereco: '',
        construtora: 'Engetch Engenharia e Projetos',
        logoConstrutora: '',
        status: 'Ativa',
        dataInicio: '',
        dataFimPrevista: '',
    };

    const [currentObra, setCurrentObra] = useState<Omit<Obra, 'id'>>(emptyObra);
    
    const fetchObras = useCallback(async () => {
        setLoading(true);
        setPageError(null);
        try {
            const data = await dataService.obras.getAll();
            setObras(data);
        } catch (error) {
            console.error("Failed to fetch obras", error);
            setPageError("Não foi possível carregar as obras.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchObras();
    }, [fetchObras]);


    const handleOpenModal = (obra: Obra | null = null) => {
        if (obra) {
            setEditingObra(obra);
            setCurrentObra(obra);
        } else {
            setEditingObra(null);
            setCurrentObra(emptyObra);
        }
        setIsModalOpen(true);
    };

    const handleSaveObra = async () => {
        try {
            if (editingObra) {
                await dataService.obras.update(editingObra.id, currentObra);
            } else {
                await dataService.obras.create(currentObra);
            }
            setIsModalOpen(false);
            setEditingObra(null);
            setCurrentObra(emptyObra);
            await fetchObras(); // Refresh data
        } catch (error) {
            console.error("Failed to save obra", error);
        }
    };
    
    const triggerDeleteObra = (obraId: string) => {
        setObraToDeleteId(obraId);
        setIsConfirmModalOpen(true);
    };

    const confirmDeleteObra = async () => {
        if (!obraToDeleteId) return;
        setPageError(null);
        try {
            await dataService.obras.delete(obraToDeleteId);
        } catch (error) {
            console.error("Failed to delete obra", error);
            setPageError("Falha ao excluir a obra. Tente novamente.");
        } finally {
            setIsConfirmModalOpen(false);
            setObraToDeleteId(null);
            await fetchObras();
        }
    };

    const userObras = user.role === UserRole.Cliente
        ? obras.filter(obra => user.obraIds?.includes(obra.id))
        : obras;
        
    if (loading) return <div className="text-center p-8">Carregando obras...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-brand-blue">Gestão de Obras</h2>
                {user.role === UserRole.Admin && (
                    <Button onClick={() => handleOpenModal()} className="flex items-center space-x-2">
                        {ICONS.add}
                        <span>Nova Obra</span>
                    </Button>
                )}
            </div>
            
            {pageError && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{pageError}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userObras.map((obra) => (
                    <Card key={obra.id} className="flex flex-col justify-between">
                        <div className="cursor-pointer" onClick={() => navigateTo('ObraDetail', obra.id)}>
                            <div className="flex justify-between items-start">
                                <h3 className="text-xl font-bold text-brand-blue">{obra.name}</h3>
                                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                                    obra.status === 'Ativa' ? 'bg-green-100 text-green-800' :
                                    obra.status === 'Concluída' ? 'bg-blue-100 text-blue-800' :
                                    'bg-yellow-100 text-yellow-800'
                                }`}>{obra.status}</span>
                            </div>
                            <p className="text-gray-700 mt-2">{obra.endereco}</p>
                            <p className="text-sm text-gray-600 mt-1">Cliente: {obra.cliente}</p>
                        </div>
                        <div className="mt-4 pt-4 border-t flex justify-between items-center">
                             <div>
                                <p className="text-sm text-gray-700">Início: {new Date(obra.dataInicio).toLocaleDateString()}</p>
                                <p className="text-sm text-gray-700">Previsão: {new Date(obra.dataFimPrevista).toLocaleDateString()}</p>
                             </div>
                             {user.role === UserRole.Admin && (
                                <div className="flex items-center space-x-2">
                                    <button onClick={(e) => {e.stopPropagation(); handleOpenModal(obra);}} className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-100">
                                        {ICONS.edit}
                                    </button>
                                     <button onClick={(e) => {e.stopPropagation(); triggerDeleteObra(obra.id);}} className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-100">
                                        {ICONS.delete}
                                    </button>
                                </div>
                             )}
                        </div>
                    </Card>
                ))}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingObra ? "Editar Obra" : "Cadastrar Nova Obra"}>
                <form onSubmit={e => { e.preventDefault(); handleSaveObra(); }} className="space-y-4">
                    <input type="text" placeholder="Nome da Obra" value={currentObra.name} onChange={e => setCurrentObra({...currentObra, name: (e.target as HTMLInputElement).value})} className="w-full p-2 border rounded" required/>
                    <input type="text" placeholder="Nome do Cliente" value={currentObra.cliente} onChange={e => setCurrentObra({...currentObra, cliente: (e.target as HTMLInputElement).value})} className="w-full p-2 border rounded" required/>
                    <input type="text" placeholder="Endereço" value={currentObra.endereco} onChange={e => setCurrentObra({...currentObra, endereco: (e.target as HTMLInputElement).value})} className="w-full p-2 border rounded" required/>
                    <input type="date" placeholder="Data de Início" value={currentObra.dataInicio} onChange={e => setCurrentObra({...currentObra, dataInicio: (e.target as HTMLInputElement).value})} className="w-full p-2 border rounded" required/>
                    <input type="date" placeholder="Data de Fim Previsto" value={currentObra.dataFimPrevista} onChange={e => setCurrentObra({...currentObra, dataFimPrevista: (e.target as HTMLInputElement).value})} className="w-full p-2 border rounded" required/>
                    <select value={currentObra.status} onChange={e => setCurrentObra({...currentObra, status: (e.target as HTMLSelectElement).value as Obra['status']})} className="w-full p-2 border rounded">
                        <option value="Ativa">Ativa</option>
                        <option value="Pausada">Pausada</option>
                        <option value="Concluída">Concluída</option>
                    </select>
                    <Button type="submit" className="w-full">Salvar Obra</Button>
                </form>
            </Modal>

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={confirmDeleteObra}
                title="Confirmar Exclusão"
                message={<>Tem certeza que deseja excluir esta obra? Todos os dados associados (diários, finanças, etc.) também serão removidos se a cascata estiver configurada no backend.</>}
                confirmText="Excluir Obra"
            />
        </div>
    );
};

export default ObrasPage;