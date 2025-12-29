
import React, { useState, useEffect, useCallback } from 'react';
import { Material, User, UserRole } from '../../types';
import { apiService } from '../../services/apiService';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal, { ConfirmationModal } from '../ui/Modal';
import { ICONS } from '../../constants';

interface MateriaisPageProps {
    user: User;
}

const MateriaisPage: React.FC<MateriaisPageProps> = ({ user }) => {
    const [materiais, setMateriais] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [materialToDeleteId, setMaterialToDeleteId] = useState<string | null>(null);
    
    const emptyMaterial: Omit<Material, 'id' | 'quantidade'> = { nome: '', unidade: '', estoqueMinimo: 0 };
    const [currentMaterial, setCurrentMaterial] = useState(emptyMaterial);

    const canEdit = user.role === UserRole.Admin || user.role === UserRole.Encarregado;

    const fetchMateriais = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiService.materiais.getAll();
            setMateriais(data);
        } catch (error) {
            console.error("Failed to fetch materiais", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMateriais();
    }, [fetchMateriais]);


    const handleOpenModal = (material: Material | null = null) => {
        if (material) {
            setEditingMaterial(material);
            setCurrentMaterial(material);
        } else {
            setEditingMaterial(null);
            setCurrentMaterial(emptyMaterial);
        }
        setIsModalOpen(true);
    };

    const handleSaveMaterial = async () => {
        if (editingMaterial) {
            await apiService.materiais.update(editingMaterial.id, currentMaterial);
        } else {
            // New materials start with 0 quantity in central stock.
            const newMaterialData = { ...currentMaterial, quantidade: 0 };
            await apiService.materiais.create(newMaterialData);
        }
        setIsModalOpen(false);
        await fetchMateriais();
    };

    const triggerDeleteMaterial = (id: string) => {
        setMaterialToDeleteId(id);
        setIsConfirmModalOpen(true);
    };

    const confirmDeleteMaterial = async () => {
        if (!materialToDeleteId) return;
        await apiService.materiais.delete(materialToDeleteId);
        setIsConfirmModalOpen(false);
        setMaterialToDeleteId(null);
        await fetchMateriais();
    };
    
    if (loading) return <div className="text-center p-8">Carregando catálogo de materiais...</div>;


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-brand-blue">Catálogo de Materiais</h2>
                {canEdit && (
                    <Button onClick={() => handleOpenModal()} className="flex items-center space-x-2">
                        {ICONS.add}
                        <span>Novo Material</span>
                    </Button>
                )}
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b-2 border-brand-light-gray">
                            <tr>
                                <th className="p-4 text-brand-blue font-semibold">Material</th>
                                <th className="p-4 text-brand-blue font-semibold">Unidade</th>
                                <th className="p-4 text-brand-blue font-semibold">Estoque Mínimo</th>
                                {canEdit && <th className="p-4 text-brand-blue font-semibold">Ações</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {materiais.map(material => (
                                    <tr key={material.id} className="border-b border-brand-light-gray hover:bg-gray-50">
                                        <td className="p-4 font-bold text-brand-blue">{material.nome}</td>
                                        <td className="p-4 text-gray-700">{material.unidade}</td>
                                        <td className="p-4 text-gray-700">{material.estoqueMinimo}</td>
                                        {canEdit && (
                                            <td className="p-4">
                                                <div className="flex space-x-2">
                                                    <button onClick={() => handleOpenModal(material)} className="text-blue-600 hover:text-blue-800 p-1">{ICONS.edit}</button>
                                                    <button onClick={() => triggerDeleteMaterial(material.id)} className="text-red-600 hover:text-red-800 p-1">{ICONS.delete}</button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingMaterial ? "Editar Material" : "Novo Material"}>
                <form onSubmit={e => { e.preventDefault(); handleSaveMaterial(); }} className="space-y-4">
                    {/* FIX: Cast event target to HTMLInputElement to access value property. */}
                    <input type="text" placeholder="Nome do Material" value={currentMaterial.nome} onChange={e => setCurrentMaterial({...currentMaterial, nome: (e.target as HTMLInputElement).value})} className="w-full p-2 border rounded" required/>
                    {/* FIX: Cast event target to HTMLInputElement to access value property. */}
                    <input type="text" placeholder="Unidade (ex: un, m³, kg)" value={currentMaterial.unidade} onChange={e => setCurrentMaterial({...currentMaterial, unidade: (e.target as HTMLInputElement).value})} className="w-full p-2 border rounded" required/>
                    {/* FIX: Cast event target to HTMLInputElement to access value property. */}
                    <input type="number" placeholder="Estoque Mínimo" value={currentMaterial.estoqueMinimo} onChange={e => setCurrentMaterial({...currentMaterial, estoqueMinimo: parseFloat((e.target as HTMLInputElement).value) || 0})} className="w-full p-2 border rounded" required/>
                    <Button type="submit" className="w-full">Salvar</Button>
                </form>
            </Modal>
            
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={confirmDeleteMaterial}
                title="Confirmar Exclusão"
                message="Tem certeza que deseja excluir este material do catálogo? Todas as movimentações de estoque relacionadas também serão afetadas."
                confirmText="Excluir Material"
            />
        </div>
    );
};

export default MateriaisPage;