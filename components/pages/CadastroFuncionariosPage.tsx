import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Funcionario, Obra, User, PagamentoTipo, UserRole } from '../../types';
import { apiService } from '../../services/apiService';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal, { ConfirmationModal } from '../ui/Modal';
import { ICONS } from '../../constants';

interface GerenciarFuncionariosPageProps {
    user: User;
}

const GerenciarFuncionariosPage: React.FC<GerenciarFuncionariosPageProps> = ({ user }) => {
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [obras, setObras] = useState<Obra[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFuncionario, setEditingFuncionario] = useState<Funcionario | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [funcionarioToDeactivate, setFuncionarioToDeactivate] = useState<Funcionario | null>(null);
    const [selectedObraId, setSelectedObraId] = useState<string>('all');

    const emptyFuncionario: Omit<Funcionario, 'id'> = { name: '', funcao: '', tipoPagamento: PagamentoTipo.Diaria, valor: 0, ativo: true, telefone: '', obraId: null };
    const [currentFuncionario, setCurrentFuncionario] = useState(emptyFuncionario);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [funcData, obrasData] = await Promise.all([
                apiService.funcionarios.getAll(),
                apiService.obras.getAll()
            ]);
            setFuncionarios(funcData);
            setObras(obrasData.filter(o => o.status === 'Ativa'));
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenModal = (func: Funcionario | null = null) => {
        if (func) {
            setEditingFuncionario(func);
            setCurrentFuncionario(func);
        } else {
            setEditingFuncionario(null);
            setCurrentFuncionario(emptyFuncionario);
        }
        setIsModalOpen(true);
    };

    const handleSaveFuncionario = async () => {
        if (editingFuncionario) {
            await apiService.funcionarios.update(editingFuncionario.id, currentFuncionario);
        } else {
            await apiService.funcionarios.create(currentFuncionario);
        }
        setIsModalOpen(false);
        await fetchData();
    };

    const triggerDeactivateFuncionario = (func: Funcionario) => {
        setFuncionarioToDeactivate(func);
        setIsConfirmModalOpen(true);
    };

    const confirmDeactivateFuncionario = async () => {
        if (!funcionarioToDeactivate) return;
        await apiService.funcionarios.update(funcionarioToDeactivate.id, { ativo: !funcionarioToDeactivate.ativo });
        setIsConfirmModalOpen(false);
        setFuncionarioToDeactivate(null);
        await fetchData();
    };

    const visibleFuncionarios = useMemo(() =>
        funcionarios
            .filter(f => selectedObraId === 'all' || f.obraId === selectedObraId)
            .sort((a, b) => a.name.localeCompare(b.name)),
    [funcionarios, selectedObraId]);

    const getObraName = (obraId: string | null) => obraId ? obras.find(o => o.id === obraId)?.name || 'N/A' : 'Sem Vínculo';

    if (loading) return <div className="text-center p-8">Carregando funcionários...</div>;

    const canEdit = user.role === UserRole.Admin || user.role === UserRole.Encarregado;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-brand-blue">Gerenciar Funcionários</h2>
                <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                        <label htmlFor="obra-filter" className="font-semibold text-brand-blue">Obra:</label>
                        <select id="obra-filter" value={selectedObraId} onChange={e => setSelectedObraId((e.target as HTMLSelectElement).value)} className="p-2 border rounded-lg">
                            <option value="all">Todas as Obras</option>
                            {obras.map(obra => <option key={obra.id} value={obra.id}>{obra.name}</option>)}
                        </select>
                    </div>
                    {canEdit && (
                        <Button onClick={() => handleOpenModal()} className="flex items-center space-x-2">
                            {ICONS.add}
                            <span>Novo Funcionário</span>
                        </Button>
                    )}
                </div>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b-2 bg-brand-light-gray">
                            <tr>
                                <th className="p-4 text-brand-blue font-semibold">Nome</th>
                                <th className="p-4 text-brand-blue font-semibold">Função</th>
                                <th className="p-4 text-brand-blue font-semibold">Telefone</th>
                                <th className="p-4 text-brand-blue font-semibold">Obra</th>
                                <th className="p-4 text-brand-blue font-semibold">Status</th>
                                {canEdit && <th className="p-4 text-brand-blue font-semibold">Ações</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {visibleFuncionarios.map(func => (
                                <tr key={func.id} className="border-b hover:bg-gray-50">
                                    <td className="p-4 font-bold text-brand-blue">{func.name}</td>
                                    <td className="p-4 text-gray-700">{func.funcao}</td>
                                    <td className="p-4 text-gray-700">{func.telefone}</td>
                                    <td className="p-4 text-gray-700">{getObraName(func.obraId)}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${func.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {func.ativo ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </td>
                                    {canEdit && (
                                        <td className="p-4">
                                            <div className="flex space-x-2">
                                                <button onClick={() => handleOpenModal(func)} className="text-blue-600 hover:text-blue-800 p-1">{ICONS.edit}</button>
                                                <button onClick={() => triggerDeactivateFuncionario(func)} className="text-red-600 hover:text-red-800 p-1">{ICONS.delete}</button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingFuncionario ? 'Editar Funcionário' : 'Novo Funcionário'}>
                <form onSubmit={e => { e.preventDefault(); handleSaveFuncionario(); }} className="space-y-4">
                    <input type="text" placeholder="Nome Completo" value={currentFuncionario.name} onChange={e => setCurrentFuncionario({ ...currentFuncionario, name: (e.target as HTMLInputElement).value })} className="w-full p-2 border rounded" required />
                    <input type="text" placeholder="Função" value={currentFuncionario.funcao} onChange={e => setCurrentFuncionario({ ...currentFuncionario, funcao: (e.target as HTMLInputElement).value })} className="w-full p-2 border rounded" required />
                    <input type="text" placeholder="Telefone" value={currentFuncionario.telefone} onChange={e => setCurrentFuncionario({ ...currentFuncionario, telefone: (e.target as HTMLInputElement).value })} className="w-full p-2 border rounded" />
                    <select value={currentFuncionario.tipoPagamento} onChange={e => setCurrentFuncionario({ ...currentFuncionario, tipoPagamento: (e.target as HTMLSelectElement).value as PagamentoTipo })} className="w-full p-2 border rounded">
                        {Object.values(PagamentoTipo).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <input type="number" placeholder="Valor" value={currentFuncionario.valor} onChange={e => setCurrentFuncionario({ ...currentFuncionario, valor: parseFloat((e.target as HTMLInputElement).value) || 0 })} className="w-full p-2 border rounded" required />
                    <select value={currentFuncionario.obraId || ''} onChange={e => setCurrentFuncionario({ ...currentFuncionario, obraId: (e.target as HTMLSelectElement).value || null })} className="w-full p-2 border rounded">
                        <option value="">Nenhuma Obra</option>
                        {obras.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                    <div className="flex items-center">
                        <input type="checkbox" id="ativo" checked={currentFuncionario.ativo} onChange={e => setCurrentFuncionario({ ...currentFuncionario, ativo: (e.target as HTMLInputElement).checked })} className="h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue" />
                        <label htmlFor="ativo" className="ml-2 block text-sm text-gray-900">Ativo</label>
                    </div>
                    <Button type="submit" className="w-full">Salvar Funcionário</Button>
                </form>
            </Modal>

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={confirmDeactivateFuncionario}
                title={`Confirmar ${funcionarioToDeactivate?.ativo ? 'Desativação' : 'Reativação'}`}
                message={`Tem certeza que deseja ${funcionarioToDeactivate?.ativo ? 'desativar' : 'reativar'} este funcionário?`}
                confirmText={funcionarioToDeactivate?.ativo ? 'Desativar' : 'Reativar'}
                confirmVariant={funcionarioToDeactivate?.ativo ? 'danger' : 'primary'}
            />
        </div>
    );
};

export default GerenciarFuncionariosPage;