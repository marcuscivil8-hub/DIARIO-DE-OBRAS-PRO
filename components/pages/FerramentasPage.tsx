
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Ferramenta, Funcionario, StatusFerramenta, User, UserRole, Obra, MovimentacaoAlmoxarifado, MovimentacaoTipo } from '../../types';
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
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [obras, setObras] = useState<Obra[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

    // Data for modals
    const [editingFerramenta, setEditingFerramenta] = useState<Ferramenta | null>(null);
    const [ferramentaToDeleteId, setFerramentaToDeleteId] = useState<string | null>(null);
    const [ferramentaToReturn, setFerramentaToReturn] = useState<Ferramenta | null>(null);
    const [modalError, setModalError] = useState<string | null>(null);
    const [pageError, setPageError] = useState<string | null>(null);

    // Form states
    const [selectedLocation, setSelectedLocation] = useState<string>('all'); // 'all', 'almoxarifado', or obraId
    const emptyFerramenta: Omit<Ferramenta, 'id'> = { nome: '', codigo: '', status: StatusFerramenta.Funcionando, responsavelId: null, obraId: null, valor: 0, };
    const [currentFerramenta, setCurrentFerramenta] = useState(emptyFerramenta);
    const [depositoManagerId, setDepositoManagerId] = useState<string>('');


    const canEdit = user.role === UserRole.Admin || user.role === UserRole.Encarregado;

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [ferramentasData, funcionariosData, obrasData] = await Promise.all([
                apiService.ferramentas.getAll(),
                apiService.funcionarios.getAll(),
                apiService.obras.getAll(),
            ]);
            setFerramentas(ferramentasData);
            setFuncionarios(funcionariosData.filter(f => f.ativo));
            setObras(obrasData.filter(o => o.status === 'Ativa'));
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

    const visibleFerramentas = useMemo(() => {
        if (selectedLocation === 'all') return ferramentas;
        if (selectedLocation === 'almoxarifado') return ferramentas.filter(f => f.obraId === null);
        return ferramentas.filter(f => f.obraId === selectedLocation);
    }, [ferramentas, selectedLocation]);

    const getResponsavelName = (id: string | null) => id ? funcionarios.find(f => f.id === id)?.name || 'Desconhecido' : 'N/A';
    const getObraName = (id: string | null) => id ? obras.find(o => o.id === id)?.name || 'Desconhecida' : 'Almoxarifado';
    
    const handleOpenModal = (ferramenta: Ferramenta | null = null) => {
        setModalError(null);
        if (ferramenta) {
            setEditingFerramenta(ferramenta);
            setCurrentFerramenta(ferramenta);
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
                await apiService.ferramentas.update(editingFerramenta.id, currentFerramenta);
            } else {
                await apiService.ferramentas.create(currentFerramenta);
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

    const handleOpenReturnModal = (ferramenta: Ferramenta) => {
        setModalError(null);
        setFerramentaToReturn(ferramenta);
        setDepositoManagerId(funcionarios[0]?.id || '');
        setIsReturnModalOpen(true);
    };

    const handleConfirmReturn = async () => {
        setModalError(null);
        if (!ferramentaToReturn) return;

        try {
            await apiService.ferramentas.update(ferramentaToReturn.id, {
                obraId: null,
                responsavelId: depositoManagerId
            });
            
            const newMov: Omit<MovimentacaoAlmoxarifado, 'id'> = {
                itemId: ferramentaToReturn.id, itemType: 'ferramenta', tipoMovimentacao: MovimentacaoTipo.Retorno,
                quantidade: 1, data: new Date().toISOString().split('T')[0], obraId: ferramentaToReturn.obraId || undefined,
                responsavelRetiradaId: ferramentaToReturn.responsavelId || undefined,
                descricao: `Devolvido para o almoxarifado. Recebido por: ${getResponsavelName(depositoManagerId)}`
            };
            await apiService.movimentacoesAlmoxarifado.create(newMov);
            
            setIsReturnModalOpen(false);
            await fetchData();
        } catch(error: any) {
             console.error("Failed to return tool:", error);
            setModalError(error.message || "Não foi possível registrar a devolução.");
        }
    };
    
    if (loading) return <div className="text-center p-8">Carregando ferramentas...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-brand-blue">Controle de Ferramentas</h2>
                <div className="flex items-center gap-4">
                     <div className="flex items-center space-x-2">
                        <label htmlFor="location-filter" className="font-semibold text-brand-blue">Local:</label>
                        <select id="location-filter" value={selectedLocation} onChange={e => setSelectedLocation((e.target as HTMLSelectElement).value)} className="p-2 border rounded-lg">
                            <option value="all">Todos os Locais</option>
                            <option value="almoxarifado">Almoxarifado Central</option>
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
                                <th className="p-4 text-brand-blue font-semibold">Valor</th>
                                <th className="p-4 text-brand-blue font-semibold">Localização</th>
                                <th className="p-4 text-brand-blue font-semibold">Responsável</th>
                                {canEdit && <th className="p-4 text-brand-blue font-semibold">Ações</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {visibleFerramentas.map(ferramenta => (
                                <tr key={ferramenta.id} className="border-b border-brand-light-gray hover:bg-gray-50">
                                    <td className="p-4 font-bold text-brand-blue">{ferramenta.nome} ({ferramenta.codigo})</td>
                                    <td className="p-4 text-gray-700">R$ {ferramenta.valor?.toLocaleString('pt-BR', {minimumFractionDigits: 2}) || '0,00'}</td>
                                    <td className="p-4 text-gray-700">{getObraName(ferramenta.obraId)}</td>
                                    <td className="p-4 text-gray-700">{getResponsavelName(ferramenta.responsavelId)}</td>
                                    {canEdit && (
                                        <td className="p-4">
                                            <div className="flex items-center space-x-2">
                                                 <button onClick={() => handleOpenModal(ferramenta)} className="text-blue-600 hover:text-blue-800 p-1">{ICONS.edit}</button>
                                                 <button onClick={() => triggerDeleteFerramenta(ferramenta.id)} className="text-red-600 hover:text-red-800 p-1">{ICONS.delete}</button>
                                                 {ferramenta.obraId && <Button size="sm" onClick={() => handleOpenReturnModal(ferramenta)}>Devolver</Button>}
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
                    <select value={currentFerramenta.status} onChange={e => setCurrentFerramenta({...currentFerramenta, status: (e.target as HTMLSelectElement).value as StatusFerramenta})} className="w-full p-2 border rounded">
                        {Object.values(StatusFerramenta).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                     <select value={currentFerramenta.obraId || ''} onChange={e => setCurrentFerramenta({...currentFerramenta, obraId: (e.target as HTMLSelectElement).value || null})} className="w-full p-2 border rounded">
                        <option value="">Almoxarifado Central</option>
                        {obras.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                     <select value={currentFerramenta.responsavelId || ''} onChange={e => setCurrentFerramenta({...currentFerramenta, responsavelId: (e.target as HTMLSelectElement).value || null})} className="w-full p-2 border rounded">
                        <option value="">Ninguém</option>
                        {funcionarios.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                    {modalError && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{modalError}</p>}
                    <Button type="submit" className="w-full">Salvar</Button>
                </form>
            </Modal>
            
            <Modal isOpen={isReturnModalOpen} onClose={() => setIsReturnModalOpen(false)} title={`Devolver ${ferramentaToReturn?.nome}`}>
                <form onSubmit={e => { e.preventDefault(); handleConfirmReturn(); }} className="space-y-4">
                    <div>
                        <label htmlFor="manager" className="block text-sm font-medium text-brand-gray mb-1">Recebido por (Chefe de Depósito)</label>
                        <select id="manager" value={depositoManagerId} onChange={e => setDepositoManagerId((e.target as HTMLSelectElement).value)} className="w-full p-2 border rounded" required>
                            {funcionarios.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
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
                message="Tem certeza que deseja excluir esta ferramenta? Esta ação não pode ser desfeita."
                confirmText="Excluir Ferramenta"
            />
        </div>
    );
};

export default FerramentasPage;
