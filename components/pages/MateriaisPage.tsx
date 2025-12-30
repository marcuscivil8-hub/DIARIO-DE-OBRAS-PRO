
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Material, User, UserRole, Obra, MovimentacaoAlmoxarifado, MovimentacaoTipo } from '../../types';
import { apiService } from '../../services/apiService';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { ICONS } from '../../constants';

interface MateriaisPageProps {
    user: User;
}

const MateriaisPage: React.FC<MateriaisPageProps> = ({ user }) => {
    const [materiais, setMateriais] = useState<Material[]>([]);
    const [obras, setObras] = useState<Obra[]>([]);
    const [movimentacoes, setMovimentacoes] = useState<MovimentacaoAlmoxarifado[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedObraId, setSelectedObraId] = useState<string>('');
    
    // Modal for Usage/Return
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [modalAction, setModalAction] = useState<MovimentacaoTipo.Uso | MovimentacaoTipo.Retorno | null>(null);
    const [currentMaterial, setCurrentMaterial] = useState<Material | null>(null);
    const [actionQuantity, setActionQuantity] = useState(1);
    const [modalError, setModalError] = useState<string | null>(null);


    const canEdit = user.role === UserRole.Admin || user.role === UserRole.Encarregado;

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [matData, obrasData, movData] = await Promise.all([
                apiService.materiais.getAll(),
                apiService.obras.getAll(),
                apiService.movimentacoesAlmoxarifado.getAll(),
            ]);
            
            const activeObras = obrasData.filter(o => o.status === 'Ativa');
            setMateriais(matData.sort((a,b) => a.nome.localeCompare(b.nome)));
            setObras(activeObras);
            setMovimentacoes(movData);
            
            if (activeObras.length > 0 && !selectedObraId) {
                setSelectedObraId(activeObras[0].id);
            }
            
        } catch (error) {
            console.error("Failed to fetch materiais data", error);
        } finally {
            setLoading(false);
        }
    }, [selectedObraId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const estoquePorObra = useMemo(() => {
        if (!selectedObraId) return {};
        
        const estoque: Record<string, number> = {};
        const movsDaObra = movimentacoes.filter(m => m.obraId === selectedObraId && m.itemType === 'material');
        
        movsDaObra.forEach(mov => {
            let change = 0;
            if (mov.tipoMovimentacao === MovimentacaoTipo.Saida) change = mov.quantidade;
            // Retorno para o almoxarifado e Uso na obra diminuem o estoque da obra.
            if (mov.tipoMovimentacao === MovimentacaoTipo.Uso || mov.tipoMovimentacao === MovimentacaoTipo.Retorno) change = -mov.quantidade;
            estoque[mov.itemId] = (estoque[mov.itemId] || 0) + change;
        });
        
        return estoque;
    }, [movimentacoes, selectedObraId]);
    
    const handleOpenActionModal = (material: Material, action: MovimentacaoTipo.Uso | MovimentacaoTipo.Retorno) => {
        setModalError(null);
        setCurrentMaterial(material);
        setModalAction(action);
        setActionQuantity(1);
        setIsActionModalOpen(true);
    };
    
    const handleSaveAction = async () => {
        setModalError(null);
        if (!currentMaterial || !modalAction || !selectedObraId) return;

        try {
            const newMov: Omit<MovimentacaoAlmoxarifado, 'id'> = {
                itemId: currentMaterial.id,
                itemType: 'material',
                tipoMovimentacao: modalAction,
                quantidade: actionQuantity,
                data: new Date().toISOString().split('T')[0],
                obraId: selectedObraId,
                descricao: `Registro de ${modalAction} na obra`
            };

            await apiService.movimentacoesAlmoxarifado.create(newMov);
            setIsActionModalOpen(false);
            await fetchData();
        } catch (error: any) {
            console.error("Failed to save action:", error);
            setModalError(error.message || `Não foi possível registrar a ação.`);
        }
    };
    
    if (loading) return <div className="text-center p-8">Carregando estoque de materiais...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-brand-blue">Estoque de Materiais por Obra</h2>
                <div className="flex items-center space-x-2">
                    <label htmlFor="obra-filter" className="font-semibold text-brand-blue">Obra:</label>
                    <select id="obra-filter" value={selectedObraId} onChange={e => setSelectedObraId((e.target as HTMLSelectElement).value)} className="p-2 border rounded-lg">
                        {obras.map(obra => <option key={obra.id} value={obra.id}>{obra.name}</option>)}
                    </select>
                </div>
            </div>

            <Card>
                {!selectedObraId ? <p className="text-center text-brand-gray">Selecione uma obra para ver o estoque.</p> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b-2 border-brand-light-gray">
                                <tr>
                                    <th className="p-4 text-brand-blue font-semibold">Material</th>
                                    <th className="p-4 text-brand-blue font-semibold">Fornecedor</th>
                                    <th className="p-4 text-brand-blue font-semibold">Valor Unit.</th>
                                    <th className="p-4 text-brand-blue font-semibold">Estoque na Obra</th>
                                    {canEdit && <th className="p-4 text-brand-blue font-semibold">Ações</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {materiais.map(material => {
                                    const estoqueAtual = estoquePorObra[material.id] || 0;
                                    return (
                                        <tr key={material.id} className="border-b border-brand-light-gray hover:bg-gray-50">
                                            <td className="p-4 font-bold text-brand-blue">{material.nome}</td>
                                            <td className="p-4 text-gray-700">{material.fornecedor || '-'}</td>
                                            <td className="p-4 text-gray-700">R$ {material.valor?.toLocaleString('pt-BR', {minimumFractionDigits: 2}) || '0,00'}</td>
                                            <td className={`p-4 font-bold ${estoqueAtual <= 0 ? 'text-red-500' : 'text-gray-700'}`}>
                                                {estoqueAtual} {material.unidade}
                                            </td>
                                            {canEdit && (
                                                <td className="p-4">
                                                    <div className="flex space-x-2">
                                                        <Button size="sm" variant="danger" onClick={() => handleOpenActionModal(material, MovimentacaoTipo.Uso)} disabled={estoqueAtual <= 0}>Registrar Uso</Button>
                                                        <Button size="sm" variant="secondary" onClick={() => handleOpenActionModal(material, MovimentacaoTipo.Retorno)} disabled={estoqueAtual <= 0}>Devolver</Button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
            
            <Modal isOpen={isActionModalOpen} onClose={() => setIsActionModalOpen(false)} title={`${modalAction} de ${currentMaterial?.nome}`}>
                 <form onSubmit={e => { e.preventDefault(); handleSaveAction(); }} className="space-y-4">
                    <div>
                         <label htmlFor="quantity" className="block text-sm font-medium text-brand-gray mb-1">Quantidade</label>
                         <input
                            type="number"
                            id="quantity"
                            value={actionQuantity}
                            onChange={e => setActionQuantity(Number((e.target as HTMLInputElement).value))}
                            className="w-full p-2 border rounded"
                            min="1"
                            max={estoquePorObra[currentMaterial?.id || ''] || 1}
                            required
                        />
                    </div>
                    {modalError && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{modalError}</p>}
                    <Button type="submit" className="w-full">Confirmar {modalAction}</Button>
                </form>
            </Modal>
        </div>
    );
};

export default MateriaisPage;
