
import React, { useState } from 'react';
import { Obra, User, UserRole, Page, DiarioObra, Servico, TransacaoFinanceira, Funcionario } from '../../types';
import useLocalStorage from '../../hooks/useLocalStorage';
import { initialObras, initialDiarios, initialServicos, initialTransacoes, initialFuncionarios, initialUsers } from '../../services/dataService';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal, { ConfirmationModal } from '../ui/Modal';
import { ICONS } from '../../constants';

interface ObrasPageProps {
    user: User;
    navigateTo: (page: Page, obraId: string) => void;
}

const ObrasPage: React.FC<ObrasPageProps> = ({ user, navigateTo }) => {
    const [obras, setObras] = useLocalStorage<Obra[]>('obras', initialObras);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingObra, setEditingObra] = useState<Obra | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [obraToDeleteId, setObraToDeleteId] = useState<string | null>(null);
    
    // Hooks for cascading delete
    const [, setDiarios] = useLocalStorage<DiarioObra[]>('diarios', initialDiarios);
    const [, setServicos] = useLocalStorage<Servico[]>('servicos', initialServicos);
    const [, setTransacoes] = useLocalStorage<TransacaoFinanceira[]>('transacoes', initialTransacoes);
    const [, setFuncionarios] = useLocalStorage<Funcionario[]>('funcionarios', initialFuncionarios);
    const [, setUsers] = useLocalStorage<User[]>('users', initialUsers);

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

    const handleSaveObra = () => {
        if (editingObra) {
            setObras(obras.map(o => o.id === editingObra.id ? { ...o, ...currentObra } : o));
        } else {
            const obraToAdd: Obra = {
                id: new Date().toISOString(),
                ...currentObra,
            };
            setObras([...obras, obraToAdd]);
        }
        setIsModalOpen(false);
        setEditingObra(null);
        setCurrentObra(emptyObra);
    };
    
    const triggerDeleteObra = (obraId: string) => {
        setObraToDeleteId(obraId);
        setIsConfirmModalOpen(true);
    };

    const confirmDeleteObra = () => {
        if (!obraToDeleteId) return;

        // 1. Delete the obra itself
        setObras(currentObras => currentObras.filter(o => o.id !== obraToDeleteId));

        // 2. Delete associated data
        setDiarios(currentDiarios => currentDiarios.filter(d => d.obraId !== obraToDeleteId));
        setServicos(currentServicos => currentServicos.filter(s => s.obraId !== obraToDeleteId));
        setTransacoes(currentTransacoes => currentTransacoes.filter(t => t.obraId !== obraToDeleteId));

        // 3. Disassociate funcionarios
        setFuncionarios(currentFuncionarios =>
            currentFuncionarios.map(f =>
                f.obraId === obraToDeleteId ? { ...f, obraId: null } : f
            )
        );

        // 4. Disassociate client users
        setUsers(currentUsers =>
            currentUsers.map(u =>
                u.obraIds?.includes(obraToDeleteId)
                    ? { ...u, obraIds: u.obraIds.filter(id => id !== obraToDeleteId) }
                    : u
            )
        );
        
        setIsConfirmModalOpen(false);
        setObraToDeleteId(null);
    };

    const userObras = user.role === UserRole.Cliente
        ? obras.filter(obra => user.obraIds?.includes(obra.id))
        : obras;

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
                            <p className="text-brand-gray mt-2">{obra.endereco}</p>
                            <p className="text-sm text-gray-500 mt-1">Cliente: {obra.cliente}</p>
                        </div>
                        <div className="mt-4 pt-4 border-t flex justify-between items-center">
                             <div>
                                <p className="text-sm text-gray-600">Início: {new Date(obra.dataInicio).toLocaleDateString()}</p>
                                <p className="text-sm text-gray-600">Previsão: {new Date(obra.dataFimPrevista).toLocaleDateString()}</p>
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
                    <input type="text" placeholder="Nome da Obra" value={currentObra.name} onChange={e => setCurrentObra({...currentObra, name: e.target.value})} className="w-full p-2 border rounded" required/>
                    <input type="text" placeholder="Nome do Cliente" value={currentObra.cliente} onChange={e => setCurrentObra({...currentObra, cliente: e.target.value})} className="w-full p-2 border rounded" required/>
                    <input type="text" placeholder="Endereço" value={currentObra.endereco} onChange={e => setCurrentObra({...currentObra, endereco: e.target.value})} className="w-full p-2 border rounded" required/>
                    <input type="date" placeholder="Data de Início" value={currentObra.dataInicio} onChange={e => setCurrentObra({...currentObra, dataInicio: e.target.value})} className="w-full p-2 border rounded" required/>
                    <input type="date" placeholder="Data de Fim Previsto" value={currentObra.dataFimPrevista} onChange={e => setCurrentObra({...currentObra, dataFimPrevista: e.target.value})} className="w-full p-2 border rounded" required/>
                    <select value={currentObra.status} onChange={e => setCurrentObra({...currentObra, status: e.target.value as Obra['status']})} className="w-full p-2 border rounded">
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
                message={<>Tem certeza que deseja excluir esta obra? <strong className="font-bold">Todos os dados associados</strong> (diários, serviços, finanças, etc.) serão perdidos permanentemente.</>}
                confirmText="Excluir Obra"
            />
        </div>
    );
};

export default ObrasPage;
