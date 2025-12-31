import React, { useState, useRef, useEffect, useCallback } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Obra, DiarioObra, Clima, User, UserRole, Page, Servico, StatusServico, TransacaoFinanceira, TransacaoTipo, CategoriaSaida, Documento } from '../../types';
import { dataService } from '../../services/dataService';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal, { ConfirmationModal } from '../ui/Modal';
import { ICONS } from '../../constants';

// Helper to convert a file blob to a base64 data URL
const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

// --- Relatório Fotográfico Component (para PDF do Cliente) ---
const RelatorioFotografico: React.FC<{ obra: Obra, diarios: DiarioObra[] }> = ({ obra, diarios }) => (
    <div className="p-8 bg-white text-black font-sans" style={{ width: '210mm' }}>
        <header className="text-right border-b-2 border-black pb-4 mb-8">
            <h1 className="text-3xl font-bold">{obra.construtora}</h1>
            <p className="text-gray-800">Relatório Fotográfico de Obra</p>
        </header>
        <main>
            <div className="mb-8 p-4 border">
                <h2 className="text-xl font-bold mb-2">{obra.name}</h2>
                <p><strong>Cliente:</strong> {obra.cliente}</p>
                <p><strong>Endereço:</strong> {obra.endereco}</p>
                <p><strong>Data de Emissão:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
            
            {diarios.map(diario => (
                 <div key={diario.id} className="mb-8 break-inside-avoid">
                    <h3 className="text-lg font-semibold bg-gray-200 p-2">Data: {new Date(diario.data).toLocaleString('pt-BR')}</h3>
                    <p className="p-2"><strong>Clima:</strong> {diario.clima}</p>
                    <p className="p-2"><strong>Observações:</strong> {diario.observacoes}</p>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                        {diario.fotos.map((foto, index) => (
                             <div key={index} className="border p-2">
                                <img src={foto.url} alt={foto.legenda} className="w-full" />
                                <p className="text-center text-sm mt-1 text-gray-800">{foto.legenda}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </main>
    </div>
);

// --- Sub-componente Documentos ---
const AcompanhamentoDocumentos: React.FC<{ obraId: string }> = ({ obraId }) => {
    const [documentos, setDocumentos] = useState<Documento[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDocumentos = async () => {
            setLoading(true);
            const allDocs = await dataService.documentos.getAll();
            setDocumentos(allDocs.filter(d => d.obraId === obraId));
            setLoading(false);
        };
        fetchDocumentos();
    }, [obraId]);

    const handleDownload = (doc: Documento) => {
        window.open(doc.url, '_blank');
    };

    if (loading) return <div>Carregando documentos...</div>;

    return (
        <Card title="Documentos da Obra">
            {documentos.length === 0 ? (
                <p className="text-brand-gray">Nenhum documento encontrado para esta obra.</p>
            ) : (
                <ul className="space-y-3">
                    {documentos.map(doc => (
                        <li key={doc.id} className="flex items-center justify-between p-3 bg-brand-light-gray rounded-lg">
                            <div className="flex flex-col">
                                <span className="font-semibold text-brand-blue">{doc.nome}</span>
                                <span className="text-sm text-brand-gray">{doc.tipoDocumento} - {new Date(doc.dataUpload).toLocaleDateString()}</span>
                            </div>
                            <Button size="sm" onClick={() => handleDownload(doc)}>Baixar</Button>
                        </li>
                    ))}
                </ul>
            )}
        </Card>
    );
};


// --- Sub-componente Financeiro ---
const AcompanhamentoFinanceiro: React.FC<{ obraId: string; user: User }> = ({ obraId, user }) => {
    const [transacoes, setTransacoes] = useState<TransacaoFinanceira[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransacao, setEditingTransacao] = useState<TransacaoFinanceira | null>(null);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [transacaoToDeleteId, setTransacaoToDeleteId] = useState<string | null>(null);

    const [currentTransacao, setCurrentTransacao] = useState<Omit<TransacaoFinanceira, 'id' | 'obraId'>>({
        descricao: '', valor: 0, tipoTransacao: TransacaoTipo.Saida, categoria: CategoriaSaida.Outros, data: new Date().toISOString().split('T')[0]
    });

    const fetchTransacoes = useCallback(async () => {
        setLoading(true);
        const all = await dataService.transacoes.getAll();
        let obraTransacoes = all.filter(t => t.obraId === obraId);

        if (user.role === UserRole.Encarregado) {
            obraTransacoes = obraTransacoes.filter(t => t.tipoTransacao === TransacaoTipo.Saida);
        }

        setTransacoes(obraTransacoes.sort((a,b) => new Date(b.data).getTime() - new Date(a.data).getTime()));
        setLoading(false);
    }, [obraId, user.role]);

    useEffect(() => { fetchTransacoes(); }, [fetchTransacoes]);

    const handleOpenModal = (transacao: TransacaoFinanceira | null = null) => {
        if (transacao) {
            setEditingTransacao(transacao);
            setCurrentTransacao(transacao);
        } else {
            const defaultTipo = user.role === UserRole.Encarregado ? TransacaoTipo.Saida : TransacaoTipo.Entrada;
            const defaultCategoria = defaultTipo === TransacaoTipo.Saida ? CategoriaSaida.Outros : 'Receita';
            
            setEditingTransacao(null);
            setCurrentTransacao({
                descricao: '',
                valor: 0,
                tipoTransacao: defaultTipo,
                categoria: defaultCategoria,
                data: new Date().toISOString().split('T')[0],
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        const dataToSave = { ...currentTransacao, obraId };
        if (editingTransacao) {
            await dataService.transacoes.update(editingTransacao.id, dataToSave);
        } else {
            await dataService.transacoes.create(dataToSave);
        }
        setIsModalOpen(false);
        await fetchTransacoes();
    };
    
    const triggerDelete = (id: string) => {
        setTransacaoToDeleteId(id);
        setIsConfirmDeleteOpen(true);
    };

    const confirmDelete = async () => {
        if (transacaoToDeleteId) {
            await dataService.transacoes.delete(transacaoToDeleteId);
            await fetchTransacoes();
        }
        setIsConfirmDeleteOpen(false);
        setTransacaoToDeleteId(null);
    };
    
    if (loading) return <div>Carregando dados financeiros...</div>;

    const canEdit = user.role === UserRole.Admin || user.role === UserRole.Encarregado;

    return (
        <div className="space-y-4">
            {canEdit && (
                 <div className="text-right">
                    <Button onClick={() => handleOpenModal()} className="flex items-center space-x-2 ml-auto">
                        {ICONS.add}
                        <span>{user.role === UserRole.Admin ? 'Nova Transação' : 'Nova Despesa'}</span>
                    </Button>
                </div>
            )}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b-2">
                                <th className="p-4 text-brand-blue font-semibold">Data</th><th className="p-4 text-brand-blue font-semibold">Descrição</th><th className="p-4 text-brand-blue font-semibold">Categoria</th><th className="p-4 text-brand-blue font-semibold">Valor</th>{canEdit && <th className="p-4 text-brand-blue font-semibold">Ações</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {transacoes.map(t => (
                                <tr key={t.id} className="border-b hover:bg-gray-50">
                                    <td className="p-4 font-bold text-brand-blue">{new Date(t.data).toLocaleDateString()}</td>
                                    <td className="p-4 font-bold text-brand-blue">{t.descricao}</td>
                                    <td className="p-4 font-bold text-brand-blue">{t.categoria}</td>
                                    <td className={`p-4 font-bold ${t.tipoTransacao === TransacaoTipo.Entrada ? 'text-green-600' : 'text-red-600'}`}>
                                        {t.tipoTransacao === TransacaoTipo.Entrada ? '+' : '-'} R$ {t.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                                    </td>
                                    {canEdit && (
                                        <td className="p-4">
                                            {(user.role === UserRole.Admin || t.tipoTransacao === TransacaoTipo.Saida) && (
                                                <div className="flex space-x-2">
                                                    <button onClick={() => handleOpenModal(t)} className="p-1 text-blue-600 hover:text-blue-800">{ICONS.edit}</button>
                                                    <button onClick={() => triggerDelete(t.id)} className="p-1 text-red-600 hover:text-red-800">{ICONS.delete}</button>
                                                </div>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTransacao ? 'Editar Transação' : 'Nova Transação'}>
                <form onSubmit={e => { e.preventDefault(); handleSave(); }} className="space-y-4">
                    <input type="text" placeholder="Descrição" value={currentTransacao.descricao} onChange={e => setCurrentTransacao({...currentTransacao, descricao: (e.target as HTMLInputElement).value})} className="w-full p-2 border rounded" required />
                    <input type="number" step="0.01" placeholder="Valor" value={currentTransacao.valor} onChange={e => setCurrentTransacao({...currentTransacao, valor: parseFloat((e.target as HTMLInputElement).value) || 0})} className="w-full p-2 border rounded" required />
                    <input type="date" value={currentTransacao.data} onChange={e => setCurrentTransacao({...currentTransacao, data: (e.target as HTMLInputElement).value})} className="w-full p-2 border rounded" required />
                    
                    {user.role === UserRole.Admin && (
                        <select value={currentTransacao.tipoTransacao} onChange={e => setCurrentTransacao({...currentTransacao, tipoTransacao: (e.target as HTMLSelectElement).value as TransacaoTipo, categoria: (e.target as HTMLSelectElement).value === TransacaoTipo.Entrada ? 'Receita' : CategoriaSaida.Outros })} className="w-full p-2 border rounded">
                            <option value={TransacaoTipo.Entrada}>Entrada</option>
                            <option value={TransacaoTipo.Saida}>Saída</option>
                        </select>
                    )}

                    {currentTransacao.tipoTransacao === TransacaoTipo.Saida && (
                         <select value={currentTransacao.categoria} onChange={e => setCurrentTransacao({...currentTransacao, categoria: (e.target as HTMLSelectElement).value as CategoriaSaida})} className="w-full p-2 border rounded">
                           {Object.values(CategoriaSaida).filter(c => c !== CategoriaSaida.FolhaPagamento).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    )}
                    <Button type="submit" className="w-full">Salvar Transação</Button>
                </form>
            </Modal>
            
            <ConfirmationModal 
                isOpen={isConfirmDeleteOpen}
                onClose={() => setIsConfirmDeleteOpen(false)}
                onConfirm={confirmDelete}
                title="Confirmar Exclusão"
                message="Tem certeza que deseja excluir esta transação permanentemente?"
                confirmText="Excluir Transação"
            />
        </div>
    );
};

// --- Sub-componente para Acompanhamento de Serviços ---
const AcompanhamentoServicos: React.FC<{ obraId: string; user: User }> = ({ obraId, user }) => {
    const [servicos, setServicos] = useState<Servico[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingServico, setEditingServico] = useState<Servico | null>(null);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [servicoToDeleteId, setServicoToDeleteId] = useState<string | null>(null);

    const emptyServico: Omit<Servico, 'id' | 'obraId'> = {
        descricao: '',
        dataInicioPrevista: '',
        dataFimPrevista: '',
        status: 'Não Iniciado',
    };
    const [currentServico, setCurrentServico] = useState(emptyServico);

    const fetchServicos = useCallback(async () => {
        setLoading(true);
        const allServicos = await dataService.servicos.getAll();
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
            await dataService.servicos.update(editingServico.id, currentServico);
        } else {
            await dataService.servicos.create({ ...currentServico, obraId });
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
        await dataService.servicos.update(servicoId, updatedServico);
        await fetchServicos();
    };

    const triggerDeleteServico = (id: string) => {
        setServicoToDeleteId(id);
        setIsConfirmDeleteOpen(true);
    };

    const confirmDeleteServico = async () => {
        if (servicoToDeleteId) {
            await dataService.servicos.delete(servicoToDeleteId);
            await fetchServicos();
        }
        setIsConfirmDeleteOpen(false);
        setServicoToDeleteId(null);
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
                                <th className="p-4 text-brand-blue font-semibold">Serviço</th>
                                <th className="p-4 text-brand-blue font-semibold">Início Previsto</th>
                                <th className="p-4 text-brand-blue font-semibold">Fim Previsto</th>
                                <th className="p-4 text-brand-blue font-semibold">Status</th>
                                {canEdit && <th className="p-4 text-brand-blue font-semibold">Ações</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {servicos.map(servico => {
                                const statusInfo = getStatusInfo(servico);
                                return (
                                <tr key={servico.id} className="border-b hover:bg-gray-50">
                                    <td className="p-4 font-bold text-brand-blue">{servico.descricao}</td>
                                    <td className="p-4 text-gray-700">{new Date(servico.dataInicioPrevista).toLocaleDateString()}</td>
                                    <td className="p-4 text-gray-700">{new Date(servico.dataFimPrevista).toLocaleDateString()}</td>
                                    <td className="p-4"><span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusInfo.className}`}>{statusInfo.text}</span></td>
                                    {canEdit && (
                                        <td className="p-4">
                                            <div className="flex items-center space-x-2">
                                                {servico.status === 'Não Iniciado' && <Button size="sm" variant="secondary" onClick={() => handleStatusChange(servico.id, 'Em Andamento')}>Iniciar</Button>}
                                                {servico.status === 'Em Andamento' && <Button size="sm" onClick={() => handleStatusChange(servico.id, 'Concluído')}>Finalizar</Button>}
                                                <button onClick={() => handleOpenModal(servico)} className="p-2 text-blue-600 hover:text-blue-800">{ICONS.edit}</button>
                                                <button onClick={() => triggerDeleteServico(servico.id)} className="p-2 text-red-600 hover:text-red-800">{ICONS.delete}</button>
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
                    <input type="text" placeholder="Descrição do Serviço" value={currentServico.descricao} onChange={e => setCurrentServico({...currentServico, descricao: (e.target as HTMLInputElement).value})} className="w-full p-2 border rounded" required />
                    <div><label>Data Início Previsto</label><input type="date" value={currentServico.dataInicioPrevista} onChange={e => setCurrentServico({...currentServico, dataInicioPrevista: (e.target as HTMLInputElement).value})} className="w-full p-2 border rounded" required /></div>
                    <div><label>Data Fim Previsto</label><input type="date" value={currentServico.dataFimPrevista} onChange={e => setCurrentServico({...currentServico, dataFimPrevista: (e.target as HTMLInputElement).value})} className="w-full p-2 border rounded" required /></div>
                    <Button type="submit" className="w-full">Salvar Serviço</Button>
                </form>
            </Modal>

             <ConfirmationModal 
                isOpen={isConfirmDeleteOpen}
                onClose={() => setIsConfirmDeleteOpen(false)}
                onConfirm={confirmDeleteServico}
                title="Confirmar Exclusão"
                message="Tem certeza que deseja excluir este serviço permanentemente?"
                confirmText="Excluir Serviço"
            />
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
    const [pdfLoading, setPdfLoading] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'diario' | 'servicos' | 'financeiro' | 'documentos'>('diario');
    const [newDiario, setNewDiario] = useState<Omit<DiarioObra, 'id' | 'obraId' | 'fotos'>>({
        data: '',
        clima: Clima.Ensolarado,
        observacoes: '',
    });
    const [photos, setPhotos] = useState<{ file: File; legenda: string }[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [photoToDelete, setPhotoToDelete] = useState<{ diarioId: string; photoIndex: number; url: string } | null>(null);
    
    // State for editing an existing diary entry
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingDiario, setEditingDiario] = useState<DiarioObra | null>(null);
    const [currentDiarioEdit, setCurrentDiarioEdit] = useState({ clima: Clima.Ensolarado, observacoes: '' });

    const fetchPageData = useCallback(async () => {
        setLoading(true);
        try {
            const [allObras, allDiarios] = await Promise.all([
                 dataService.obras.getAll(),
                 dataService.diarios.getAll()
            ]);
            setObra(allObras.find(o => o.id === obraId) || null);
            setDiarios(allDiarios.filter(d => d.obraId === obraId).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()));
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

    const triggerDeleteExistingPhoto = (diarioId: string, photoIndex: number, url: string) => {
        setPhotoToDelete({ diarioId, photoIndex, url });
        setIsConfirmModalOpen(true);
    };

    const confirmDeleteExistingPhoto = async () => {
        if (!photoToDelete) return;
        const { diarioId, url } = photoToDelete;
        
        const diarioToUpdate = diarios.find(d => d.id === diarioId);
        if (diarioToUpdate) {
            const updatedFotos = diarioToUpdate.fotos.filter(foto => foto.url !== url);
            // AUTO-DELETE LOGIC: if no photos left and no text, delete the whole entry
            if (updatedFotos.length === 0 && diarioToUpdate.observacoes.trim() === '') {
                await dataService.diarios.delete(diarioId);
            } else {
                // Otherwise, just update the photos array
                await dataService.diarios.update(diarioId, { fotos: updatedFotos });
            }
            await fetchPageData(); // Refresh data from server
        }
        
        setIsConfirmModalOpen(false);
        setPhotoToDelete(null);
    };

    const handleAddDiario = async () => {
        const photoDataPromises = photos.map(async (p) => {
            const base64Url = await blobToBase64(p.file);
            return { url: base64Url, legenda: p.legenda };
        });

        const photoData = await Promise.all(photoDataPromises);

        const diarioToAdd: Omit<DiarioObra, 'id'> = {
            obraId,
            ...newDiario,
            data: new Date().toLocaleString('sv-SE'),
            fotos: photoData,
        };

        await dataService.diarios.create(diarioToAdd);
        setIsModalOpen(false);
        setNewDiario({ data: '', clima: Clima.Ensolarado, observacoes: '' });
        setPhotos([]);
        await fetchPageData();
    };

    const handleOpenEditModal = (diario: DiarioObra) => {
        setEditingDiario(diario);
        setCurrentDiarioEdit({ clima: diario.clima, observacoes: diario.observacoes });
        setIsEditModalOpen(true);
    };
    
    const handleUpdateDiario = async () => {
        if (!editingDiario) return;
    
        const updatedData = {
            clima: currentDiarioEdit.clima,
            observacoes: currentDiarioEdit.observacoes,
        };
    
        try {
            // AUTO-DELETE LOGIC: if text is cleared and no photos exist, delete the entry
            if (updatedData.observacoes.trim() === '' && editingDiario.fotos.length === 0) {
                await dataService.diarios.delete(editingDiario.id);
            } else {
                // Otherwise, just update the entry
                await dataService.diarios.update(editingDiario.id, updatedData);
            }
        } catch (error) {
            console.error("Failed to update or delete diary entry", error);
            // Optionally, set an error state to show in the UI
        } finally {
            setIsEditModalOpen(false);
            setEditingDiario(null);
            await fetchPageData(); // Refresh data from server
        }
    };
    
    const handleGeneratePdf = () => {
        if (!reportRef.current) return;
        setPdfLoading(true);
        html2canvas(reportRef.current, { scale: 2, useCORS: true }).then((canvas) => {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgData = canvas.toDataURL('image/png');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`relatorio_fotografico_${obra?.name.replace(/\s/g, '_')}.pdf`);
            setPdfLoading(false);
        });
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
            <div className="flex justify-between items-center">
                <div>
                    <button onClick={() => navigateTo('Obras')} className="text-brand-blue font-semibold mb-2">&larr; Voltar para Obras</button>
                    <h2 className="text-3xl font-bold text-brand-blue">{obra.name}</h2>
                    <p className="text-brand-gray">{obra.endereco}</p>
                </div>
                {user.role === UserRole.Cliente && (
                    <Button onClick={handleGeneratePdf} disabled={pdfLoading}>
                        {pdfLoading ? 'Gerando PDF...' : 'Gerar Relatório Fotográfico'}
                    </Button>
                )}
            </div>
            
            <div className="border-b border-gray-300">
                <TabButton label="Diário de Obra" isActive={activeTab === 'diario'} onClick={() => setActiveTab('diario')} />
                <TabButton label="Acompanhamento de Serviços" isActive={activeTab === 'servicos'} onClick={() => setActiveTab('servicos')} />
                <TabButton label="Documentos" isActive={activeTab === 'documentos'} onClick={() => setActiveTab('documentos')} />
                {user.role !== UserRole.Cliente && (
                    <TabButton label="Financeiro" isActive={activeTab === 'financeiro'} onClick={() => setActiveTab('financeiro')} />
                )}
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
                                    {canEdit && (
                                        <button onClick={() => handleOpenEditModal(diario)} className="text-blue-600 hover:text-blue-800 p-1 ml-2">
                                            {React.cloneElement(ICONS.edit, { className: "h-4 w-4" })}
                                        </button>
                                    )}
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
                                                        onClick={() => triggerDeleteExistingPhoto(diario.id, index, foto.url)}
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
            {activeTab === 'documentos' && <AcompanhamentoDocumentos obraId={obraId} />}
            {activeTab === 'financeiro' && user.role !== UserRole.Cliente && <AcompanhamentoFinanceiro obraId={obraId} user={user} />}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Registro no Diário">
                <form onSubmit={e => { e.preventDefault(); handleAddDiario(); }} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-brand-gray">Clima</label>
                        <select value={newDiario.clima} onChange={e => setNewDiario({ ...newDiario, clima: (e.target as HTMLSelectElement).value as Clima })} className="w-full p-2 border rounded mt-1">
                            {Object.values(Clima).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-brand-gray">Observações e Serviços</label>
                        <textarea value={newDiario.observacoes} onChange={e => setNewDiario({ ...newDiario, observacoes: (e.target as HTMLTextAreaElement).value })} rows={5} className="w-full p-2 border rounded mt-1" placeholder="Descreva os serviços realizados, ocorrências, etc." required></textarea>
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
                                         newPhotos[i].legenda = (e.target as HTMLInputElement).value;
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
            
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Registro do Diário">
                <form onSubmit={e => { e.preventDefault(); handleUpdateDiario(); }} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-brand-gray">Clima</label>
                        <select value={currentDiarioEdit.clima} onChange={e => setCurrentDiarioEdit({ ...currentDiarioEdit, clima: (e.target as HTMLSelectElement).value as Clima })} className="w-full p-2 border rounded mt-1">
                            {Object.values(Clima).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-brand-gray">Observações e Serviços</label>
                        <textarea value={currentDiarioEdit.observacoes} onChange={e => setCurrentDiarioEdit({ ...currentDiarioEdit, observacoes: (e.target as HTMLTextAreaElement).value })} rows={5} className="w-full p-2 border rounded mt-1" placeholder="Descreva os serviços realizados, ocorrências, etc."></textarea>
                    </div>
                    <p className="text-sm text-gray-500 pt-2 border-t">Para adicionar ou remover fotos, use os controles na página principal.</p>
                    <Button type="submit" className="w-full">Salvar Alterações</Button>
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
            
            {/* Hidden container for PDF generation */}
            <div className="hidden">
                <div ref={reportRef}>
                    {obra && <RelatorioFotografico obra={obra} diarios={diarios} />}
                </div>
            </div>
        </div>
    );
};

export default ObraDetailPage;