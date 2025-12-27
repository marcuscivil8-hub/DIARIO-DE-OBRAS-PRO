
import React, { useState, useEffect, useCallback } from 'react';
import { Material, User, UserRole, MovimentacaoTipo } from '../../types';
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
    const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
    const [movementData, setMovementData] = useState({ materialId: '', tipo: MovimentacaoTipo.Saida, quantidade: 0 });
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [materialToDeleteId, setMaterialToDeleteId] = useState<string | null>(null);
    
    const emptyMaterial: Omit<Material, 'id'> = { nome: '', unidade: '', quantidade: 0, estoqueMinimo: 0 };
    const [currentMaterial, setCurrentMaterial] = useState(emptyMaterial);

    const canEdit = user.role === UserRole.Admin;

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
            await apiService.materiais.create(currentMaterial);
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
    
    const handleOpenMovementModal = (materialId: string) => {
        setMovementData({ materialId, tipo: MovimentacaoTipo.Saida, quantidade: 1 });
        setIsMovementModalOpen(true);
    };

    const handleSaveMovement = async () => {
        const { materialId, tipo, quantidade } = movementData;
        const material = materiais.find(m => m.id === materialId);
        if (!material) return;
        
        const newQuantity = tipo === MovimentacaoTipo.Entrada
            ? material.quantidade + quantidade
            : material.quantidade - quantidade;
        
        await apiService.materiais.update(materialId, { quantidade: Math.max(0, newQuantity) });
        
        setIsMovementModalOpen(false);
        await fetchMateriais();
    };
    
    if (loading) return <div className="text-center p-8">Carregando materiais...</div>;


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-brand-blue">Controle de Materiais</h2>
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
                                <th className="p-4 text-brand-blue font-semibold">Estoque Atual</th>
                                <th className="p-4 text-brand-blue font-semibold">Unidade</th>
                                <th className="p-4 text-brand-blue font-semibold">Estoque Mínimo</th>
                                <th className="p-4 text-brand-blue font-semibold">Status</th>
                                {canEdit && <th className="p-4 text-brand-blue font-semibold">Ações</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {materiais.map(material => {
                                const isLowStock = material.quantidade <= material.estoqueMinimo;
                                return (
                                    <tr key={material.id} className="border-b border-brand-light-gray hover:bg-gray-50">
                                        <td className="p-4 font-medium text-gray-800">{material.nome}</td>
                                        <td className={`p-4 font-bold ${isLowStock ? 'text-red-500' : 'text-gray-800'}`}>{material.quantidade}</td>
                                        <td className="p-4 text-brand-gray">{material.unidade}</td>
                                        <td className="p-4 text-brand-gray">{material.estoqueMinimo}</td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                                                isLowStock ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                            }`}>
                                                {isLowStock ? 'Baixo' : 'OK'}
                                            </span>
                                        </td>
                                        {canEdit && (
                                            <td className="p-4">
                                                <div className="flex space-x-2">
                                                    <Button variant="secondary" size="sm" onClick={() => handleOpenMovementModal(material.id)}>Movimentar</Button>
                                                    <button onClick={() => handleOpenModal(material)} className="text-blue-600 hover:text-blue-800 p-1">{ICONS.edit}</button>
                                                    <button onClick={() => triggerDeleteMaterial(material.id)} className="text-red-600 hover:text-red-800 p-1">{ICONS.delete}</button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingMaterial ? "Editar Material" : "Novo Material"}>
                <form onSubmit={e => { e.preventDefault(); handleSaveMaterial(); }} className="space-y-4">
                    <input type="text" placeholder="Nome do Material" value={currentMaterial.nome} onChange={e => setCurrentMaterial({...currentMaterial, nome: e.target.value})} className="w-full p-2 border rounded" required/>
                    <input type="text" placeholder="Unidade (ex: un, m³, kg)" value={currentMaterial.unidade} onChange={e => setCurrentMaterial({...currentMaterial, unidade: e.target.value})} className="w-full p-2 border rounded" required/>
                    <input type="number" placeholder="Quantidade Inicial" value={currentMaterial.quantidade} onChange={e => setCurrentMaterial({...currentMaterial, quantidade: parseFloat(e.target.value) || 0})} className="w-full p-2 border rounded" required/>
                    <input type="number" placeholder="Estoque Mínimo" value={currentMaterial.estoqueMinimo} onChange={e => setCurrentMaterial({...currentMaterial, estoqueMinimo: parseFloat(e.target.value) || 0})} className="w-full p-2 border rounded" required/>
                    <Button type="submit" className="w-full">Salvar</Button>
                </form>
            </Modal>
            
            <Modal isOpen={isMovementModalOpen} onClose={() => setIsMovementModalOpen(false)} title="Movimentar Estoque">
                <form onSubmit={e => { e.preventDefault(); handleSaveMovement(); }} className="space-y-4">
                    <h3 className="font-bold">{materiais.find(m => m.id === movementData.materialId)?.nome}</h3>
                    <select value={movementData.tipo} onChange={e => setMovementData({...movementData, tipo: e.target.value as MovimentacaoTipo})} className="w-full p-2 border rounded">
                        <option value={MovimentacaoTipo.Saida}>Saída de Material</option>
                        <option value={MovimentacaoTipo.Entrada}>Entrada de Material</option>
                    </select>
                    <input type="number" placeholder="Quantidade" value={movementData.quantidade} onChange={e => setMovementData({...movementData, quantidade: parseInt(e.target.value) || 0})} min="1" className="w-full p-2 border rounded" required />
                    <Button type="submit" className="w-full">Confirmar Movimentação</Button>
                </form>
            </Modal>

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={confirmDeleteMaterial}
                title="Confirmar Exclusão"
                message="Tem certeza que deseja excluir este material? Esta ação não pode ser desfeita."
                confirmText="Excluir Material"
            />
        </div>
    );
};

export default MateriaisPage;
