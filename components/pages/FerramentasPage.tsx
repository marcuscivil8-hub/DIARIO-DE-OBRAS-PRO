import React, { useState, useEffect, useCallback } from 'react';
import { Ferramenta, StatusFerramenta, User, UserRole, MovimentacaoTipo } from '../../types';
import { apiService } from '../../services/apiService';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal, { ConfirmationModal } from '../ui/Modal';
import { ICONS } from '../../constants';

interface FerramentasPageProps {
    user: User;
}

const FerramentasPage: React.FC<FerramentasPageProps> = ({ user }) => {
    const [ferramentas, setFerramentas] = useState<Ferramenta[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    // Data for modals
    const [editingFerramenta, setEditingFerramenta] = useState<Ferramenta | null>(null);
    const [ferramentaToDeleteId, setFerramentaToDeleteId] = useState<string | null>(null);
    const [modalError, setModalError] = useState<string | null>(null);
    const [pageError, setPageError] = useState<string | null>(null);

    // Form states
    const emptyFerramenta: Omit<Ferramenta, 'id'> & { quantidadeInicial: number } = { 
        nome: '', 
        codigo: '', 
        status: StatusFerramenta.Funcionando, 
        valor: 0,
        quantidadeInicial: 1
    };
    const [currentFerramenta, setCurrentFerramenta] = useState(emptyFerramenta);

    const canEdit = user.role === UserRole.Admin || user.role === UserRole.Encarregado;

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const ferramentasData = await apiService.ferramentas.getAll();
            setFerramentas(ferramentasData.sort((a,b) => a.nome.localeCompare(b.nome)));
        } catch (error: any) {
            console.error("Failed to fetch data", error);
            setPageError(error.message || "Não foi possível carregar os dados.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenModal = (ferramenta: Ferramenta | null = null) => {
        setModalError(null);
        if (ferramenta) {
            setEditingFerramenta(ferramenta);
            setCurrentFerramenta({...ferramenta, quantidadeInicial: 1 });
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
                await apiService.ferramentas.update(editingFerramenta.id, updateData);
            } else {
                const { quantidadeInicial, ...createData } = currentFerramenta;
                const newTool = await apiService.ferramentas.create(createData);

                if(quantidadeInicial > 0) {
                     await apiService.movimentacoesAlmoxarifado.create({
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
            await fetchData();
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
            await apiService.ferramentas.delete(ferramentaToDeleteId);
            await fetchData();
        } catch(error: any) {
            console.error("Failed to delete tool:", error);
            setPageError(error.message || "Não foi possível excluir a ferramenta.");
        } finally {
            setIsConfirmModalOpen(false);
            setFerramentaToDeleteId(null);
        }
    };
    
    if (loading) return <div className="text-center p-8">Carregando ferramentas...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-brand-blue">Catálogo de Ferramentas</h2>
                {canEdit && (
                    <Button onClick={() => handleOpenModal()} className="flex items-center space-x-2">
                        {ICONS.add}
                        <span>Nova Ferramenta</span>
                    </Button>
                )}
            </div>

            {pageError && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{pageError}</p>}

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b-2 border-brand-light-gray">
                            <tr>
                                <th className="p-4 text-brand-blue font-semibold">Ferramenta</th>
                                <th className="p-4 text-brand-blue font-semibold">Código</th>
                                <th className="p-4 text-brand-blue font-semibold">Valor</th>
                                <th className="p-4 text-brand-blue font-semibold">Status</th>
                                {canEdit && <th className="p-4 text-brand-blue font-semibold">Ações</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {ferramentas.map(ferramenta => (
                                <tr key={ferramenta.id} className="border-b border-brand-light-gray hover:bg-gray-50">
                                    <td className="p-4 font-bold text-brand-blue">{ferramenta.nome}</td>
                                    <td className="p-4 text-gray-700">{ferramenta.codigo}</td>
                                    <td className="p-4 text-gray-700">R$ {ferramenta.valor?.toLocaleString('pt-BR', {minimumFractionDigits: 2}) || '0,00'}</td>
                                    <td className="p-4 text-gray-700">{ferramenta.status}</td>
                                    {canEdit && (
                                        <td className="p-4">
                                            <div className="flex items-center space-x-2">
                                                 <button onClick={() => handleOpenModal(ferramenta)} className="text-blue-600 hover:text-blue-800 p-1">{ICONS.edit}</button>
                                                 <button onClick={() => triggerDeleteFerramenta(ferramenta.id)} className="text-red-600 hover:text-red-800 p-1">{ICONS.delete}</button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingFerramenta ? "Editar Ferramenta" : "Nova Ferramenta"}>
                <form onSubmit={e => { e.preventDefault(); handleSaveFerramenta(); }} className="space-y-4">
                    <input type="text" placeholder="Nome da Ferramenta" value={currentFerramenta.nome} onChange={e => setCurrentFerramenta({...currentFerramenta, nome: (e.target as HTMLInputElement).value})} className="w-full p-2 border rounded" required/>
                    <input type="text" placeholder="Código/Identificador" value={currentFerramenta.codigo} onChange={e => setCurrentFerramenta({...currentFerramenta, codigo: (e.target as HTMLInputElement).value})} className="w-full p-2 border rounded"/>
                    <input type="number" step="0.01" placeholder="Valor da Ferramenta" value={currentFerramenta.valor || ''} onChange={e => setCurrentFerramenta({...currentFerramenta, valor: parseFloat((e.target as HTMLInputElement).value) || 0})} className="w-full p-2 border rounded"/>
                     {!editingFerramenta && (
                         <input type="number" placeholder="Quantidade Inicial" value={currentFerramenta.quantidadeInicial} onChange={e => setCurrentFerramenta({...currentFerramenta, quantidadeInicial: parseInt((e.target as HTMLInputElement).value, 10) || 0})} className="w-full p-2 border rounded"/>
                     )}
                    <select value={currentFerramenta.status} onChange={e => setCurrentFerramenta({...currentFerramenta, status: (e.target as HTMLSelectElement).value as StatusFerramenta})} className="w-full p-2 border rounded">
                        {Object.values(StatusFerramenta).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {modalError && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{modalError}</p>}
                    <Button type="submit" className="w-full">Salvar</Button>
                </form>
            </Modal>
            
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={confirmDeleteFerramenta}
                title="Confirmar Exclusão"
                message="Tem certeza que deseja excluir esta ferramenta? Todas as movimentações de estoque associadas também serão perdidas. Esta ação não pode ser desfeita."
                confirmText="Excluir Ferramenta"
            />
        </div>
    );
};

export default FerramentasPage;