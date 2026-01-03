import React, { useState, useMemo } from 'react';
import { Ferramenta, StatusFerramenta, User, UserRole, MovimentacaoTipo, MovimentacaoAlmoxarifado } from '../../types';
import { dataService } from '../../services/dataService';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal, { ConfirmationModal } from '../ui/Modal';
import { ICONS } from '../../constants';
import { useData } from '../../contexts/DataContext';

interface FerramentasPageProps {
    user: User;
}

const FerramentasPage: React.FC<FerramentasPageProps> = ({ user }) => {
    const { ferramentas, obras: allObras, movimentacoes, loading, refetchData } = useData();
    const obras = allObras.filter(o => o.status === 'Ativa');
    
    const [selectedObraId, setSelectedObraId] = useState<string>(obras[0]?.id || '');
    
    // Modal states for catalog editing
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    // Modal states for stock actions (devolução)
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    
    // Data for modals
    const [editingFerramenta, setEditingFerramenta] = useState<Ferramenta | null>(null);
    const [ferramentaToDeleteId, setFerramentaToDeleteId] = useState<string | null>(null);
    const [currentFerramentaForAction, setCurrentFerramentaForAction] = useState<Ferramenta | null>(null);
    const [actionQuantity, setActionQuantity] = useState(1);
    const [modalError, setModalError] = useState<string | null>(null);
    const [pageError, setPageError] = useState<string | null>(null);
    const [stockAdjustment, setStockAdjustment] = useState(0);

    // Form states
    const emptyFerramenta: Omit<Ferramenta, 'id'> & { quantidadeInicial: number } = { 
        nome: '', 
        codigo: '', 
        status: StatusFerramenta.Funcionando, 
        valor: 0,
        quantidadeInicial: 1,
        estoqueMinimo: 1,
    };
    const [currentFerramenta, setCurrentFerramenta] = useState(emptyFerramenta);

    const canEdit = user.role === UserRole.Admin || user.role === UserRole.Encarregado;

    const estoquePorObra = useMemo(() => {
        if (!selectedObraId) return {};
        
        const estoque: Record<string, number> = {};
        const movsDaObra = movimentacoes.filter(m => m.obraId === selectedObraId && m.itemType === 'ferramenta');
        
        movsDaObra.forEach(mov => {
            let change = 0;
            if (mov.tipoMovimentacao === MovimentacaoTipo.Saida) change = mov.quantidade;
            if (mov.tipoMovimentacao === MovimentacaoTipo.Retorno) change = -mov.quantidade; // Return decreases stock at obra
            estoque[mov.itemId] = (estoque[mov.itemId] || 0) + change;
        });
        
        return estoque;
    }, [movimentacoes, selectedObraId]);

    const handleOpenModal = (ferramenta: Ferramenta | null = null) => {
        setModalError(null);
        setStockAdjustment(0);
        if (ferramenta) {
            setEditingFerramenta(ferramenta);
            setCurrentFerramenta({
                nome: ferramenta.nome,
                codigo: ferramenta.codigo,
                status: ferramenta.status,
                valor: ferramenta.valor,
                estoqueMinimo: ferramenta.estoqueMinimo,
                quantidadeInicial: 0, // Not used in edit mode
            });
        } else {
            setEditingFerramenta(null);
            setCurrentFerramenta(emptyFerramenta);
        }
        setIsModalOpen(true);
    };

    const handleSaveFerramenta = async () => {
        setModalError(null);
        try {
            if (editingFerramenta) {
                const { quantidadeInicial, ...updateData } = currentFerramenta;
                await dataService.ferramentas.update(editingFerramenta.id, updateData);

                if (stockAdjustment !== 0) {
                    const movData: Omit<MovimentacaoAlmoxarifado, 'id'> = {
                        itemId: editingFerramenta.id,
                        itemType: 'ferramenta',
                        tipoMovimentacao: stockAdjustment > 0 ? MovimentacaoTipo.Entrada : MovimentacaoTipo.Saida,
                        quantidade: Math.abs(stockAdjustment),
                        data: new Date().toISOString().split('T')[0],
                        descricao: 'Ajuste manual de estoque'
                    };
                    await dataService.movimentacoesAlmoxarifado.create(movData);
                }
            } else {
                const { quantidadeInicial, ...createData } = currentFerramenta;
                const newTool = await dataService.ferramentas.create(createData);

                if(quantidadeInicial > 0) {
                     await dataService.movimentacoesAlmoxarifado.create({
                        itemId: newTool.id,
                        itemType: 'ferramenta',
                        tipoMovimentacao: MovimentacaoTipo.Entrada,
                        quantidade: quantidadeInicial,
                        data: new Date().toISOString().split('T')[0],
                        descricao: 'Estoque inicial'
                    });
                }
            }
            setIsModalOpen(false);
            await refetchData();
        } catch (error: any) {
            console.error("Failed to save tool:", error);
            setModalError(error.message || "Ocorreu um erro ao salvar a ferramenta.");
        }
    };

    const triggerDeleteFerramenta = (id: string) => {
        setFerramentaToDeleteId(id);
        setIsConfirmModalOpen(true);
    };

    const confirmDeleteFerramenta = async () => {
        if (!ferramentaToDeleteId) return;
        try {
            await dataService.ferramentas.delete(ferramentaToDeleteId);
            await refetchData();
        } catch(error: any) {
            console.error("Failed to delete tool:", error);
            setPageError(error.message || "Não foi possível excluir a ferramenta.");
        } finally {
            setIsConfirmModalOpen(false);
            setFerramentaToDeleteId(null);
        }
    };
    
    const handleOpenActionModal = (ferramenta: Ferramenta) => {
        setModalError(null);
        setCurrentFerramentaForAction(ferramenta);
        setActionQuantity(1);
        setIsActionModalOpen(true);
    };

    const handleSaveAction = async () => {
        setModalError(null);
        if (!currentFerramentaForAction || !selectedObraId) return;
        
        const estoqueAtual = estoquePorObra[currentFerramentaForAction.id] || 0;
        if(actionQuantity > estoqueAtual) {
            setModalError('A quantidade a devolver não pode ser maior que o estoque na obra.');
            return;
        }

        try {
            const newMov: Omit<MovimentacaoAlmoxarifado, 'id'> = {
                itemId: currentFerramentaForAction.id,
                itemType: 'ferramenta',
                tipoMovimentacao: MovimentacaoTipo.Retorno,
                quantidade: actionQuantity,
                data: new Date().toISOString().split('T')[0],
                obraId: selectedObraId,
                descricao: `Devolução da obra`
            };

            await dataService.movimentacoesAlmoxarifado.create(newMov);
            setIsActionModalOpen(false);
            await refetchData();
        } catch (error: any) {
            console.error("Failed to save action:", error);
            setModalError(error.message || `Não foi possível registrar a devolução.`);
        }
    };

    if (loading) return <div className="text-center p-8">Carregando ferramentas...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-brand-blue">Estoque de Ferramentas por Obra</h2>
                <div className="flex items-center gap-4">
                     <div className="flex items-center space-x-2">
                        <label htmlFor="obra-filter" className="font-semibold text-brand-blue">Obra:</label>
                        <select id="obra-filter" value={selectedObraId} onChange={e => setSelectedObraId((e.target as HTMLSelectElement).value)} className="p-2 border rounded-lg">
                            {obras.map(obra => <option key={obra.id} value={obra.id}>{obra.name}</option>)}
                        </select>
                    </div>
                    {canEdit && (
                        <Button onClick={() => handleOpenModal()} className="flex items-center space-x-2">
                            {ICONS.add}
                            <span>Nova Ferramenta</span>
                        </Button>
                    )}
                </div>
            </div>

            {pageError && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{pageError}</p>}

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b-2 border-brand-light-gray">
                            <tr>
                                <th className="p-4 text-brand-blue font-semibold">Ferramenta</th>
                                <th className="p-4 text-brand-blue font-semibold">Código</th>
                                <th className="p-4 text-brand-blue font-semibold">Status do Catálogo</th>
                                <th className="p-4 text-brand-blue font-semibold">Estoque na Obra</th>
                                {canEdit && <th className="p-4 text-brand-blue font-semibold">Ações</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {ferramentas.map(ferramenta => {
                                const estoqueAtual = estoquePorObra[ferramenta.id] || 0;
                                return (
                                    <tr key={ferramenta.id} className="border-b border-brand-light-gray hover:bg-gray-50">
                                        <td className="p-4 font-bold text-brand-blue">{ferramenta.nome}</td>
                                        <td className="p-4 text-gray-700">{ferramenta.codigo}</td>
                                        <td className="p-4 text-gray-700">{ferramenta.status}</td>
                                        <td className={`p-4 font-bold ${estoqueAtual <= 0 ? 'text-red-500' : 'text-gray-700'}`}>
                                            {estoqueAtual} un
                                        </td>
                                        {canEdit && (
                                            <td className="p-4">
                                                <div className="flex items-center space-x-2">
                                                    <Button size="sm" variant="secondary" onClick={() => handleOpenActionModal(ferramenta)} disabled={estoqueAtual <= 0}>Devolver</Button>
                                                    <button onClick={() => handleOpenModal(ferramenta)} className="text-blue-600 hover:text-blue-800 p-1">{ICONS.edit}</button>
                                                    <button onClick={() => triggerDeleteFerramenta(ferramenta.id)} className="text-red-600 hover:text-red-800 p-1">{ICONS.delete}</button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>

             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingFerramenta ? "Editar Ferramenta" : "Nova Ferramenta"}>
                <form onSubmit={e => { e.preventDefault(); handleSaveFerramenta(); }} className="space-y-4">
                    <input type="text" placeholder="Nome da Ferramenta" value={currentFerramenta.nome} onChange={e => setCurrentFerramenta({...currentFerramenta, nome: (e.target as HTMLInputElement).value})} className="w-full p-2 border rounded" required/>
                    <input type="text" placeholder="Código/Identificador" value={currentFerramenta.codigo} onChange={e => setCurrentFerramenta({...currentFerramenta, codigo: (e.target as HTMLInputElement).value})} className="w-full p-2 border rounded"/>
                    <input type="number" step="0.01" placeholder="Valor da Ferramenta" value={currentFerramenta.valor || ''} onChange={e => setCurrentFerramenta({...currentFerramenta, valor: parseFloat((e.target as HTMLInputElement).value) || 0})} className="w-full p-2 border rounded"/>
                    <input type="number" step="1" placeholder="Estoque Mínimo (Alerta)" value={currentFerramenta.estoqueMinimo || ''} onChange={e => setCurrentFerramenta({...currentFerramenta, estoqueMinimo: parseInt((e.target as HTMLInputElement).value, 10) || 0})} className="w-full p-2 border rounded"/>
                     
                     {editingFerramenta && (
                        <div className="pt-4 mt-4 border-t">
                            <label className="block text-sm font-medium text-brand-gray mb-1">Ajustar Estoque no Almoxarifado</label>
                            <input
                                type="number"
                                placeholder="Ex: 5 (adicionar), -3 (remover)"
                                value={stockAdjustment}
                                onChange={(e) => setStockAdjustment(parseInt((e.target as HTMLInputElement).value, 10) || 0)}
                                className="w-full p-2 border rounded"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Insira um valor para ajustar o estoque central. Deixe 0 para não alterar.
                            </p>
                        </div>
                    )}

                     {!editingFerramenta && (
                         <input type="number" placeholder="Quantidade Inicial (Entrada no Almoxarifado)" value={currentFerramenta.quantidadeInicial} onChange={e => setCurrentFerramenta({...currentFerramenta, quantidadeInicial: parseInt((e.target as HTMLInputElement).value, 10) || 0})} className="w-full p-2 border rounded"/>
                     )}
                    <select value={currentFerramenta.status} onChange={e => setCurrentFerramenta({...currentFerramenta, status: (e.target as HTMLSelectElement).value as StatusFerramenta})} className="w-full p-2 border rounded">
                        {Object.values(StatusFerramenta).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {modalError && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{modalError}</p>}
                    <Button type="submit" className="w-full">Salvar</Button>
                </form>
            </Modal>
            
            <Modal isOpen={isActionModalOpen} onClose={() => setIsActionModalOpen(false)} title={`Devolver ${currentFerramentaForAction?.nome}`}>
                 <form onSubmit={e => { e.preventDefault(); handleSaveAction(); }} className="space-y-4">
                    <div>
                         <label htmlFor="quantity" className="block text-sm font-medium text-brand-gray mb-1">Quantidade a devolver</label>
                         <input
                            type="number"
                            id="quantity"
                            value={actionQuantity}
                            onChange={e => setActionQuantity(Number((e.target as HTMLInputElement).value))}
                            className="w-full p-2 border rounded"
                            min="1"
                            max={estoquePorObra[currentFerramentaForAction?.id || ''] || 1}
                            required
                        />
                    </div>
                    {modalError && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{modalError}</p>}
                    <Button type="submit" className="w-full">Confirmar Devolução</Button>
                </form>
            </Modal>
            
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={confirmDeleteFerramenta}
                title="Confirmar Exclusão"
                message="Tem certeza que deseja excluir esta ferramenta do catálogo? Todas as movimentações de estoque associadas também serão perdidas. Esta ação não pode ser desfeita."
                confirmText="Excluir Ferramenta"
            />
        </div>
    );
};

export default FerramentasPage;