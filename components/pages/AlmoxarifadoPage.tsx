
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Material, Ferramenta, MovimentacaoAlmoxarifado, Obra, Funcionario, MovimentacaoTipo, Page } from '../../types';
import { apiService } from '../../services/apiService';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal, { ConfirmationModal } from '../ui/Modal';
import { ICONS } from '../../constants';

interface AlmoxarifadoPageProps {
    navigateTo: (page: Page) => void;
}

const AlmoxarifadoPage: React.FC<AlmoxarifadoPageProps> = ({ navigateTo }) => {
    const [materiais, setMateriais] = useState<Material[]>([]);
    const [ferramentas, setFerramentas] = useState<Ferramenta[]>([]);
    const [movimentacoes, setMovimentacoes] = useState<MovimentacaoAlmoxarifado[]>([]);
    const [obras, setObras] = useState<Obra[]>([]);
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [loading, setLoading] = useState(true);

    // State for modals
    const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
    const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

    // Data for modals
    const [modalType, setModalType] = useState<'entrada' | 'saida' | null>(null);
    const [currentItem, setCurrentItem] = useState<{ id: string; type: 'material' | 'ferramenta' } | null>(null);
    const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
    const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'material' | 'ferramenta' } | null>(null);
    const [modalError, setModalError] = useState<string | null>(null);
    const [pageError, setPageError] = useState<string | null>(null);

    // Form states
    const [movementFormData, setMovementFormData] = useState({ quantidade: 1, obraId: '', responsavelRetiradaId: '', descricao: '' });
    const emptyNewMaterial: Omit<Material, 'id' | 'quantidade'> = { nome: '', unidade: '', estoqueMinimo: 0, fornecedor: '', valor: 0 };
    const [materialFormData, setMaterialFormData] = useState(emptyNewMaterial);
    

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [matData, ferData, movData, obrData, funcData] = await Promise.all([
                apiService.materiais.getAll(),
                apiService.ferramentas.getAll(),
                apiService.movimentacoesAlmoxarifado.getAll(),
                apiService.obras.getAll(),
                apiService.funcionarios.getAll()
            ]);
            setMateriais(matData);
            setFerramentas(ferData);
            setMovimentacoes(movData);
            setObras(obrData.filter(o => o.status === 'Ativa'));
            setFuncionarios(funcData.filter(f => f.ativo));
        } catch (error: any) {
            console.error("Failed to fetch almoxarifado data", error);
            setPageError(error.message || "Não foi possível carregar os dados do almoxarifado.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const estoqueCalculadoMateriais = useMemo(() => {
        const estoque: Record<string, number> = {};
        movimentacoes.forEach(mov => {
            if (mov.itemType === 'material') {
                let change = 0;
                if (mov.tipoMovimentacao === MovimentacaoTipo.Entrada || mov.tipoMovimentacao === MovimentacaoTipo.Retorno) {
                    change = mov.quantidade;
                } else if (mov.tipoMovimentacao === MovimentacaoTipo.Saida) {
                    change = -mov.quantidade;
                }
                
                if (change !== 0) {
                   estoque[mov.itemId] = (estoque[mov.itemId] || 0) + change;
                }
            }
        });
        return estoque;
    }, [movimentacoes]);
    
    const ferramentasEmEstoque = useMemo(() => {
        return ferramentas.filter(f => !f.obraId);
    }, [ferramentas]);
    
    const handleOpenMovementModal = (type: 'entrada' | 'saida', item: {id: string, type: 'material' | 'ferramenta'}) => {
        setModalError(null);
        setModalType(type);
        setCurrentItem(item);
        setMovementFormData({
            quantidade: 1,
            obraId: obras[0]?.id || '',
            responsavelRetiradaId: funcionarios[0]?.id || '',
            descricao: ''
        });
        setIsMovementModalOpen(true);
    };

    const handleSaveMovimentacao = async () => {
        setModalError(null);
        if (!currentItem || !modalType) return;

        try {
            const tipoMovimentacao = modalType === 'entrada' ? MovimentacaoTipo.Entrada : MovimentacaoTipo.Saida;

            const newMov: Omit<MovimentacaoAlmoxarifado, 'id'> = {
                itemId: currentItem.id,
                itemType: currentItem.type,
                tipoMovimentacao: tipoMovimentacao,
                quantidade: movementFormData.quantidade,
                data: new Date().toISOString().split('T')[0],
                ...(modalType === 'saida' && {
                    obraId: movementFormData.obraId,
                    responsavelRetiradaId: movementFormData.responsavelRetiradaId
                }),
                ...(modalType === 'entrada' && {
                    descricao: movementFormData.descricao
                })
            };
            await apiService.movimentacoesAlmoxarifado.create(newMov);
            
            if (currentItem.type === 'ferramenta' && modalType === 'saida') {
                await apiService.ferramentas.update(currentItem.id, {
                    obraId: movementFormData.obraId,
                    responsavelId: movementFormData.responsavelRetiradaId
                });
            }
            
            setIsMovementModalOpen(false);
            await fetchData();
        } catch (error: any) {
            console.error("Failed to save movement:", error);
            setModalError(error.message || "Ocorreu um erro desconhecido.");
        }
    };

    const handleOpenMaterialModal = (material: Material | null = null) => {
        setModalError(null);
        if (material) {
            setEditingMaterial(material);
            setMaterialFormData(material);
        } else {
            setEditingMaterial(null);
            setMaterialFormData(emptyNewMaterial);
        }
        setIsMaterialModalOpen(true);
    };
    
    const handleSaveMaterial = async () => {
        setModalError(null);
        try {
            if (editingMaterial) {
                await apiService.materiais.update(editingMaterial.id, materialFormData);
            } else {
                await apiService.materiais.create({ ...materialFormData, quantidade: 0 });
            }
            setIsMaterialModalOpen(false);
            await fetchData();
        } catch (error: any) {
            console.error("Failed to save material:", error);
            setModalError(error.message || "Ocorreu um erro desconhecido.");
        }
    };
    
    const triggerDelete = (id: string, type: 'material' | 'ferramenta') => {
        setItemToDelete({ id, type });
        setIsDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            if (itemToDelete.type === 'material') {
                await apiService.materiais.delete(itemToDelete.id);
            } else {
                await apiService.ferramentas.delete(itemToDelete.id);
            }
            await fetchData();
        } catch (error: any) {
            console.error("Failed to delete item:", error);
            setPageError(error.message || "Não foi possível excluir o item.");
        } finally {
            setIsDeleteConfirmOpen(false);
            setItemToDelete(null);
        }
    };

    const getNomeItem = (item: {id: string, type: 'material' | 'ferramenta'}) => {
        if (item.type === 'material') return materiais.find(m => m.id === item.id)?.nome || 'Item desconhecido';
        return ferramentas.find(f => f.id === item.id)?.nome || 'Item desconhecido';
    };

    if (loading) return <div>Carregando Almoxarifado...</div>;
    
    return (
        <div className="space-y-6">
             <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-2xl font-bold text-brand-blue">Almoxarifado Central</h2>
                <div className="flex gap-2">
                    <Button onClick={() => navigateTo('Ferramentas')} variant="secondary" className="flex items-center space-x-2">
                        {ICONS.ferramentas}
                        <span>Gerenciar Ferramentas</span>
                    </Button>
                    <Button onClick={() => handleOpenMaterialModal()} className="flex items-center space-x-2">
                        {ICONS.add}
                        <span>Novo Material</span>
                    </Button>
                </div>
            </div>
            
            {pageError && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{pageError}</p>}
            
            <Card title="Materiais em Estoque">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b-2 bg-brand-light-gray">
                                <th className="p-4 text-brand-blue font-semibold">Material</th>
                                <th className="p-4 text-brand-blue font-semibold">Estoque Atual</th>
                                <th className="p-4 text-brand-blue font-semibold">Ações</th>
                            </tr>
                        </thead>
                        <tbody>{materiais.map(m => (
                            <tr key={m.id} className="border-b hover:bg-gray-50">
                                <td className="p-4 font-bold text-brand-blue">{m.nome}</td>
                                <td className={`p-4 font-bold ${(estoqueCalculadoMateriais[m.id] || 0) <= m.estoqueMinimo ? 'text-red-500' : 'text-brand-blue'}`}>
                                    {estoqueCalculadoMateriais[m.id] || 0} {m.unidade}
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center space-x-2">
                                        <Button size="sm" onClick={() => handleOpenMovementModal('entrada', {id: m.id, type: 'material'})}>+ Entrada</Button>
                                        <Button size="sm" variant="secondary" onClick={() => handleOpenMovementModal('saida', {id: m.id, type: 'material'})} disabled={(estoqueCalculadoMateriais[m.id] || 0) <= 0}>- Saída</Button>
                                        <button onClick={() => handleOpenMaterialModal(m)} className="p-2 text-blue-600 hover:text-blue-800">{ICONS.edit}</button>
                                        <button onClick={() => triggerDelete(m.id, 'material')} className="p-2 text-red-600 hover:text-red-800">{ICONS.delete}</button>
                                    </div>
                                </td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            </Card>

            <Card title="Ferramentas em Estoque">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b-2 bg-brand-light-gray">
                                <th className="p-4 text-brand-blue font-semibold">Ferramenta</th>
                                <th className="p-4 text-brand-blue font-semibold">Código</th>
                                <th className="p-4 text-brand-blue font-semibold">Ações</th>
                            </tr>
                        </thead>
                        <tbody>{ferramentasEmEstoque.map(f => (
                            <tr key={f.id} className="border-b hover:bg-gray-50">
                                <td className="p-4 font-bold text-brand-blue">{f.nome}</td>
                                <td className="p-4 text-brand-gray">{f.codigo}</td>
                                <td className="p-4">
                                    <div className="flex items-center space-x-2">
                                         <Button size="sm" variant="secondary" onClick={() => handleOpenMovementModal('saida', {id: f.id, type: 'ferramenta'})}>- Saída</Button>
                                         <button onClick={() => triggerDelete(f.id, 'ferramenta')} className="p-2 text-red-600 hover:text-red-800">{ICONS.delete}</button>
                                    </div>
                                </td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            </Card>

            <Modal isOpen={isMovementModalOpen} onClose={() => setIsMovementModalOpen(false)} title={currentItem ? `${modalType === 'entrada' ? 'Registrar Entrada' : 'Registrar Saída'} de ${getNomeItem(currentItem)}` : 'Registrar Movimentação'}>
                {currentItem && (
                    <form onSubmit={e => {e.preventDefault(); handleSaveMovimentacao();}} className="space-y-4">
                        {currentItem.type === 'material' && (
                            <div><label>Quantidade</label><input type="number" min="1" value={movementFormData.quantidade} onChange={e => setMovementFormData({...movementFormData, quantidade: Number((e.target as HTMLInputElement).value)})} className="w-full p-2 border rounded" required /></div>
                        )}
                        {modalType === 'entrada' && (
                            <div><label>Descrição (Ex: Nota Fiscal, Fornecedor)</label><input type="text" value={movementFormData.descricao} onChange={e => setMovementFormData({...movementFormData, descricao: (e.target as HTMLInputElement).value})} className="w-full p-2 border rounded" /></div>
                        )}
                        {modalType === 'saida' && (<>
                            <div><label>Obra de Destino</label><select value={movementFormData.obraId} onChange={e => setMovementFormData({...movementFormData, obraId: (e.target as HTMLSelectElement).value})} className="w-full p-2 border rounded" required>{obras.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></div>
                            <div><label>Responsável</label><select value={movementFormData.responsavelRetiradaId} onChange={e => setMovementFormData({...movementFormData, responsavelRetiradaId: (e.target as HTMLSelectElement).value})} className="w-full p-2 border rounded" required>{funcionarios.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></div>
                        </>)}
                        {modalError && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{modalError}</p>}
                        <Button type="submit" className="w-full">Salvar Movimentação</Button>
                    </form>
                )}
            </Modal>
            
            <Modal isOpen={isMaterialModalOpen} onClose={() => setIsMaterialModalOpen(false)} title={editingMaterial ? "Editar Material" : "Novo Material"}>
                 <form onSubmit={e => { e.preventDefault(); handleSaveMaterial(); }} className="space-y-4">
                    <input type="text" placeholder="Nome do Material" value={materialFormData.nome} onChange={e => setMaterialFormData({...materialFormData, nome: (e.target as HTMLInputElement).value})} className="w-full p-2 border rounded" required/>
                    <input type="text" placeholder="Unidade (ex: un, m³, kg)" value={materialFormData.unidade} onChange={e => setMaterialFormData({...materialFormData, unidade: (e.target as HTMLInputElement).value})} className="w-full p-2 border rounded" required/>
                    <input type="number" placeholder="Estoque Mínimo" value={materialFormData.estoqueMinimo} onChange={e => setMaterialFormData({...materialFormData, estoqueMinimo: parseFloat((e.target as HTMLInputElement).value) || 0})} className="w-full p-2 border rounded" required/>
                    <input type="text" placeholder="Fornecedor" value={materialFormData.fornecedor || ''} onChange={e => setMaterialFormData({...materialFormData, fornecedor: (e.target as HTMLInputElement).value})} className="w-full p-2 border rounded"/>
                    <input type="number" step="0.01" placeholder="Valor Unitário" value={materialFormData.valor || ''} onChange={e => setMaterialFormData({...materialFormData, valor: parseFloat((e.target as HTMLInputElement).value) || 0})} className="w-full p-2 border rounded"/>
                    {modalError && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{modalError}</p>}
                    <Button type="submit" className="w-full">Salvar Material</Button>
                </form>
            </Modal>
            
            <ConfirmationModal
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                onConfirm={confirmDelete}
                title="Confirmar Exclusão"
                message={`Tem certeza que deseja excluir este ${itemToDelete?.type === 'material' ? 'material' : 'ferramenta'} do catálogo? Esta ação não pode ser desfeita.`}
                confirmText="Excluir Permanentemente"
            />
        </div>
    );
};

export default AlmoxarifadoPage;
