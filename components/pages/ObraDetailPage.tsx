
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Obra, DiarioObra, Clima, User, UserRole, Page, Servico, StatusServico } from '../../types';
import { apiService } from '../../services/apiService';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal, { ConfirmationModal } from '../ui/Modal';
import { ICONS } from '../../constants';

// --- Sub-componente para Acompanhamento de Serviços ---
const AcompanhamentoServicos: React.FC<{ obraId: string; user: User }> = ({ obraId, user }) => {
    const [servicos, setServicos] = useState<Servico[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingServico, setEditingServico] = useState<Servico | null>(null);

    const emptyServico: Omit<Servico, 'id' | 'obraId'> = {
        descricao: '',
        dataInicioPrevista: '',
        dataFimPrevista: '',
        status: 'Não Iniciado',
    };
    const [currentServico, setCurrentServico] = useState(emptyServico);

    const fetchServicos = useCallback(async () => {
        setLoading(true);
        const allServicos = await apiService.servicos.getAll();
        const obraServicos = allServicos
            .filter(s => s.obraId === obraId)
            .sort((a,b) => new Date(a.dataInicioPrevista).getTime() - new Date(b.dataInicioPrevista).getTime());
        setServicos(obraServicos);
        setLoading(false);
    }, [obraId]);

    useEffect(() => {
        fetchServicos();
    }, [fetchServicos]);

    const canEdit = user.role === UserRole.Admin || user.role === UserRole.Encarregado;

    const getStatusInfo = (servico: Servico): { text: string; className: string } => {
        const isDelayed = new Date() > new Date(servico.dataFimPrevista) && servico.status !== 'Concluído';
        if (isDelayed) {
            return { text: 'Atrasado', className: 'bg-red-100 text-red-800' };
        }
        switch (servico.status) {
            case 'Não Iniciado': return { text: 'Não Iniciado', className: 'bg-gray-200 text-gray-800' };
            case 'Em Andamento': return { text: 'Em Andamento', className: 'bg-yellow-100 text-yellow-800' };
            case 'Concluído': return { text: 'Concluído', className: 'bg-green-100 text-green-800' };
            default: return { text: 'Desconhecido', className: 'bg-gray-100 text-gray-800' };
        }
    };

    const handleOpenModal = (servico: Servico | null = null) => {
        if (servico) {
            setEditingServico(servico);
            setCurrentServico(servico);
        } else {
            setEditingServico(null);
            setCurrentServico(emptyServico);
        }
        setIsModalOpen(true);
    };

    const handleSaveServico = async () => {
        if (editingServico) {
            await apiService.servicos.update(editingServico.id, currentServico);
        } else {
            await apiService.servicos.create({ ...currentServico, obraId });
        }
        setIsModalOpen(false);
        await fetchServicos();
    };

    const handleStatusChange = async (servicoId: string, newStatus: StatusServico) => {
        const servico = servicos.find(s => s.id === servicoId);
        if (!servico) return;
        
        const updatedServico: Partial<Servico> = { status: newStatus };
        if (newStatus === 'Em Andamento' && !servico.dataInicioReal) {
            updatedServico.dataInicioReal = new Date().toISOString().split('T')[0];
        }
        if (newStatus === 'Concluído') {
            updatedServico.dataFimReal = new Date().toISOString().split('T')[0];
        }
        await apiService.servicos.update(servicoId, updatedServico);
        await fetchServicos();
    };
    
    if (loading) return <div>Carregando serviços...</div>;

    return (
        <div className="space-y-4">
            {canEdit && (
                <div className="text-right">
                    <Button onClick={() => handleOpenModal()} className="flex items-center space-x-2 ml-auto">
                        {ICONS.add}
                        <span>Novo Serviço</span>
                    </Button>
                </div>
            )}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b-2">
                                <th className="p-4">Serviço</th>
                                <th className="p-4">Início Previsto</th>
                                <th className="p-4">Fim Previsto</th>
                                <th className="p-4">Status</th>
                                {canEdit && <th className="p-4">Ações</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {servicos.map(servico => {
                                const statusInfo = getStatusInfo(servico);
                                return (
                                <tr key={servico.id} className="border-b hover:bg-gray-50">
                                    <td className="p-4 font-medium">{servico.descricao}</td>
                                    <td className="p-4">{new Date(servico.dataInicioPrevista).toLocaleDateString()}</td>
                                    <td className="p-4">{new Date(servico.dataFimPrevista).toLocaleDateString()}</td>
                                    <td className="p-4"><span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusInfo.className}`}>{statusInfo.text}</span></td>
                                    {canEdit && (
                                        <td className="p-4">
                                            <div className="flex items-center space-x-2">
                                                {servico.status === 'Não Iniciado' && <Button size="sm" variant="secondary" onClick={() => handleStatusChange(servico.id, 'Em Andamento')}>Iniciar</Button>}
                                                {servico.status === 'Em Andamento' && <Button size="sm" onClick={() => handleStatusChange(servico.id, 'Concluído')}>Finalizar</Button>}
                                                <button onClick={() => handleOpenModal(servico)} className="p-2 text-blue-600 hover:text-blue-800">{ICONS.edit}</button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingServico ? 'Editar Serviço' : 'Novo Serviço'}>
                <form onSubmit={e => { e.preventDefault(); handleSaveServico(); }} className="space-y-4">
                    <input type="text" placeholder="Descrição do Serviço" value={currentServico.descricao} onChange={e => setCurrentServico({...currentServico, descricao: e.target.value})} className="w-full p-2 border rounded" required />
                    <div><label>Data Início Previsto</label><input type="date" value={currentServico.dataInicioPrevista} onChange={e => setCurrentServico({...currentServico, dataInicioPrevista: e.target.value})} className="w-full p-2 border rounded" required /></div>
                    <div><label>Data Fim Previsto</label><input type="date" value={currentServico.dataFimPrevista} onChange={e => setCurrentServico({...currentServico, dataFimPrevista: e.target.value})} className="w-full p-2 border rounded" required /></div>
                    <Button type="submit" className="w-full">Salvar Serviço</Button>
                </form>
            </Modal>
        </div>
    );
};


// --- Componente Principal da Página ---
interface ObraDetailPageProps {
    obraId: string;
    user: User;
    navigateTo: (page: Page) => void;
}

const ObraDetailPage: React.FC<ObraDetailPageProps> = ({ obraId, user, navigateTo }) => {
    const [obra, setObra] = useState<Obra | null>(null);
    const [diarios, setDiarios] = useState<DiarioObra[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'diario' | 'servicos'>('diario');
    const [newDiario, setNewDiario] = useState<Omit<DiarioObra, 'id' | 'obraId' | 'fotos'>>({
        data: '',
        clima: Clima.Ensolarado,
        observacoes: '',
    });
    const [photos, setPhotos] = useState<{ file: File; legenda: string }[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [photoToDelete, setPhotoToDelete] = useState<{ diarioId: string; photoIndex: number } | null>(null);

    const fetchPageData = useCallback(async () => {
        setLoading(true);
        try {
            const allObras = await apiService.obras.getAll();
            const allDiarios = await apiService.diarios.getAll();
            
            const currentObra = allObras.find(o => o.id === obraId) || null;
            const obraDiarios = allDiarios
                .filter(d => d.obraId === obraId)
                .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
            
            setObra(currentObra);
            setDiarios(obraDiarios);
        } catch (error) {
            console.error("Failed to fetch obra details", error);
        } finally {
            setLoading(false);
        }
    }, [obraId]);

    useEffect(() => {
        fetchPageData();
    }, [fetchPageData]);


    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const newPhotos = Array.from(event.target.files).map(file => ({ file, legenda: '' }));
            setPhotos(prev => [...prev, ...newPhotos]);
        }
    };

    const handleRemovePhotoPreview = (indexToRemove: number) => {
        setPhotos(photos.filter((_, index) => index !== indexToRemove));
    };

    const triggerDeleteExistingPhoto = (diarioId: string, photoIndex: number) => {
        setPhotoToDelete({ diarioId, photoIndex });
        setIsConfirmModalOpen(true);
    };

    const confirmDeleteExistingPhoto = async () => {
        if (!photoToDelete) return;
        const { diarioId, photoIndex } = photoToDelete;
        
        const diarioToUpdate = diarios.find(d => d.id === diarioId);
        if (diarioToUpdate) {
            const updatedFotos = diarioToUpdate.fotos.filter((_, index) => index !== photoIndex);
            await apiService.diarios.update(diarioId, { fotos: updatedFotos });
            await fetchPageData();
        }
        
        setIsConfirmModalOpen(false);
        setPhotoToDelete(null);
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const handleAddDiario = async () => {
        const photoDataPromises = photos.map(async (p) => {
            const base64Url = await fileToBase64(p.file);
            return { url: base64Url, legenda: p.legenda };
        });

        const photoData = await Promise.all(photoDataPromises);

        const diarioToAdd: Omit<DiarioObra, 'id'> = {
            obraId,
            ...newDiario,
            data: new Date().toLocaleString('sv-SE'),
            fotos: photoData,
        };

        await apiService.diarios.create(diarioToAdd);
        setIsModalOpen(false);
        setNewDiario({ data: '', clima: Clima.Ensolarado, observacoes: '' });
        setPhotos([]);
        await fetchPageData();
    };
    
    if (loading) return <div>Carregando detalhes da obra...</div>;
    if (!obra) return <div>Obra não encontrada. <button onClick={() => navigateTo('Obras')} className="text-blue-600">Voltar</button></div>;

    const canEdit = user.role === UserRole.Admin || user.role === UserRole.Encarregado;
    
    const TabButton: React.FC<{label: string, isActive: boolean, onClick: () => void}> = ({label, isActive, onClick}) => (
        <button onClick={onClick} className={`px-4 py-2 font-semibold rounded-t-lg ${isActive ? 'bg-white text-brand-blue' : 'bg-transparent text-gray-600 hover:bg-white/50'}`}>
            {label}
        </button>
    );

    return (
        <div className="space-y-6">
            <div>
                 <button onClick={() => navigateTo('Obras')} className="text-brand-blue font-semibold mb-2">&larr; Voltar para Obras</button>
                <h2 className="text-3xl font-bold text-brand-blue">{obra.name}</h2>
                <p className="text-brand-gray">{obra.endereco}</p>
            </div>
            
            <div className="border-b border-gray-300">
                <TabButton label="Diário de Obra" isActive={activeTab === 'diario'} onClick={() => setActiveTab('diario')} />
                <TabButton label="Acompanhamento de Serviços" isActive={activeTab === 'servicos'} onClick={() => setActiveTab('servicos')} />
            </div>

            {activeTab === 'diario' && (
                <div className="space-y-6">
                    <div className="text-right">
                        {canEdit && (
                            <Button onClick={() => setIsModalOpen(true)} className="flex items-center space-x-2 ml-auto">
                                {ICONS.add}
                                <span>Adicionar Registro no Diário</span>
                            </Button>
                        )}
                    </div>
                    {diarios.map(diario => (
                        <Card key={diario.id}>
                            <div className="flex justify-between items-center mb-4 pb-4 border-b">
                                <p className="font-semibold text-brand-blue text-lg">{new Date(diario.data).toLocaleString('pt-BR')}</p>
                                <div className="flex items-center space-x-2 text-brand-gray">
                                    {ICONS.weather}
                                    <span>{diario.clima}</span>
                                </div>
                            </div>
                            <p className="text-gray-700 mb-4 whitespace-pre-wrap">{diario.observacoes}</p>
                            {diario.fotos.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-brand-blue mb-2">Fotos:</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                        {diario.fotos.map((foto, index) => (
                                            <div key={index} className="group relative">
                                                <img src={foto.url} alt={foto.legenda || `Foto ${index + 1}`} className="rounded-lg object-cover w-full h-40" />
                                                {canEdit && (
                                                    <button
                                                        onClick={() => triggerDeleteExistingPhoto(diario.id, index)}
                                                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                                                        aria-label="Excluir foto"
                                                    >
                                                        {React.cloneElement(ICONS.delete, { className: "h-4 w-4" })}
                                                    </button>
                                                )}
                                                {foto.legenda && <p className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">{foto.legenda}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}
            
            {activeTab === 'servicos' && <AcompanhamentoServicos obraId={obraId} user={user} />}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Registro no Diário">
                <form onSubmit={e => { e.preventDefault(); handleAddDiario(); }} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-brand-gray">Clima</label>
                        <select value={newDiario.clima} onChange={e => setNewDiario({ ...newDiario, clima: e.target.value as Clima })} className="w-full p-2 border rounded mt-1">
                            {Object.values(Clima).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-brand-gray">Observações e Serviços</label>
                        <textarea value={newDiario.observacoes} onChange={e => setNewDiario({ ...newDiario, observacoes: e.target.value })} rows={5} className="w-full p-2 border rounded mt-1" placeholder="Descreva os serviços realizados, ocorrências, etc." required></textarea>
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-brand-gray mb-2">Fotos</label>
                         <input type="file" accept="image/*" multiple capture="environment" onChange={handleFileChange} ref={fileInputRef} className="hidden" />
                         <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()} className="flex items-center space-x-2">
                            {ICONS.camera} <span>Adicionar Fotos</span>
                         </Button>
                         <div className="mt-4 space-y-2">
                             {photos.map((p, i) => (
                                 <div key={i} className="relative flex items-center space-x-2 p-2 border rounded-lg">
                                     <img src={URL.createObjectURL(p.file)} alt="preview" className="w-16 h-16 object-cover rounded"/>
                                     <input type="text" placeholder="Legenda (opcional)" value={p.legenda} onChange={e => {
                                         const newPhotos = [...photos];
                                         newPhotos[i].legenda = e.target.value;
                                         setPhotos(newPhotos);
                                     }} className="w-full p-2 border rounded"/>
                                     <button
                                         type="button"
                                         onClick={() => handleRemovePhotoPreview(i)}
                                         className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-0.5 leading-none hover:bg-red-700"
                                         aria-label="Remover foto"
                                    >
                                        {React.cloneElement(ICONS.close, { className: "h-4 w-4" })}
                                     </button>
                                 </div>
                             ))}
                         </div>
                    </div>
                    <Button type="submit" className="w-full">Salvar Registro</Button>
                </form>
            </Modal>

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={confirmDeleteExistingPhoto}
                title="Confirmar Exclusão"
                message="Tem certeza que deseja excluir esta foto permanentemente?"
                confirmText="Excluir Foto"
            />
        </div>
    );
};

export default ObraDetailPage;