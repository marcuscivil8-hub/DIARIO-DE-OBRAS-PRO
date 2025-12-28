
import React, { useState, useEffect, useCallback } from 'react';
import { Ferramenta, Funcionario, StatusFerramenta, User, UserRole } from '../../types';
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
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFerramenta, setEditingFerramenta] = useState<Ferramenta | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [ferramentaToDeleteId, setFerramentaToDeleteId] = useState<string | null>(null);

    const emptyFerramenta: Omit<Ferramenta, 'id'> = {
        nome: '',
        codigo: '',
        status: StatusFerramenta.Funcionando,
        responsavelId: null
    };
    const [currentFerramenta, setCurrentFerramenta] = useState(emptyFerramenta);

    const canEdit = user.role === UserRole.Admin || user.role === UserRole.Encarregado;

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [ferramentasData, funcionariosData] = await Promise.all([
                apiService.ferramentas.getAll(),
                apiService.funcionarios.getAll(),
            ]);
            setFerramentas(ferramentasData);
            setFuncionarios(funcionariosData);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);


    const getResponsavelName = (id: string | null) => {
        if (!id) return 'Ninguém';
        return funcionarios.find(f => f.id === id)?.name || 'Desconhecido';
    };
    
    const handleOpenModal = (ferramenta: Ferramenta | null = null) => {
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
        if (editingFerramenta) {
            await apiService.ferramentas.update(editingFerramenta.id, currentFerramenta);
        } else {
            await apiService.ferramentas.create(currentFerramenta);
        }
        setIsModalOpen(false);
        await fetchData();
    };

    const triggerDeleteFerramenta = (id: string) => {
        setFerramentaToDeleteId(id);
        setIsConfirmModalOpen(true);
    };

    const confirmDeleteFerramenta = async () => {
        if (!ferramentaToDeleteId) return;
        await apiService.ferramentas.delete(ferramentaToDeleteId);
        setIsConfirmModalOpen(false);
        setFerramentaToDeleteId(null);
        await fetchData();
    };
    
    if (loading) return <div className="text-center p-8">Carregando ferramentas...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-brand-blue">Controle de Ferramentas</h2>
                {canEdit && (
                    <Button onClick={() => handleOpenModal()} className="flex items-center space-x-2">
                        {ICONS.add}
                        <span>Nova Ferramenta</span>
                    </Button>
                )}
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b-2 border-brand-light-gray">
                            <tr>
                                <th className="p-4 text-brand-blue font-semibold">Ferramenta</th>
                                <th className="p-4 text-brand-blue font-semibold">Código</th>
                                <th className="p-4 text-brand-blue font-semibold">Status</th>
                                <th className="p-4 text-brand-blue font-semibold">Responsável</th>
                                {canEdit && <th className="p-4 text-brand-blue font-semibold">Ações</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {ferramentas.map(ferramenta => (
                                <tr key={ferramenta.id} className="border-b border-brand-light-gray hover:bg-gray-50">
                                    <td className="p-4 font-bold text-brand-blue">{ferramenta.nome}</td>
                                    <td className="p-4 text-gray-700">{ferramenta.codigo}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                                            ferramenta.status === StatusFerramenta.Funcionando ? 'bg-green-100 text-green-800' :
                                            ferramenta.status === StatusFerramenta.Parada ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-200 text-gray-800'
                                        }`}>
                                            {ferramenta.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-700">{getResponsavelName(ferramenta.responsavelId)}</td>
                                    {canEdit && (
                                        <td className="p-4">
                                            <div className="flex space-x-2">
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
                    <input type="text" placeholder="Nome da Ferramenta" value={currentFerramenta.nome} onChange={e => setCurrentFerramenta({...currentFerramenta, nome: e.target.value})} className="w-full p-2 border rounded" required/>
                    <input type="text" placeholder="Código/Identificador" value={currentFerramenta.codigo} onChange={e => setCurrentFerramenta({...currentFerramenta, codigo: e.target.value})} className="w-full p-2 border rounded"/>
                    <select value={currentFerramenta.status} onChange={e => setCurrentFerramenta({...currentFerramenta, status: e.target.value as StatusFerramenta})} className="w-full p-2 border rounded">
                        {Object.values(StatusFerramenta).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                     <select value={currentFerramenta.responsavelId || ''} onChange={e => setCurrentFerramenta({...currentFerramenta, responsavelId: e.target.value || null})} className="w-full p-2 border rounded">
                        <option value="">Ninguém</option>
                        {funcionarios.filter(f => f.ativo).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                    <Button type="submit" className="w-full">Salvar</Button>
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
