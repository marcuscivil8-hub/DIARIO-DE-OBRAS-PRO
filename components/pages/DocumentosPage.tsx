import React, { useState, useMemo } from 'react';
import { Obra, Documento, User, UserRole } from '../../types';
import { dataService } from '../../services/dataService';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal, { ConfirmationModal } from '../ui/Modal';
import { ICONS } from '../../constants';
import { useData } from '../../contexts/DataContext';

interface DocumentosPageProps {
    user: User;
}

const DocumentosPage: React.FC<DocumentosPageProps> = ({ user }) => {
    const { documentos, obras: allObras, loading, refetchData } = useData();
    
    const obras = useMemo(() => {
        return user.role === UserRole.Cliente 
            ? allObras.filter(obra => user.obraIds?.includes(obra.id)) 
            : allObras;
    }, [allObras, user]);
    
    const [selectedObraId, setSelectedObraId] = useState<string>(obras[0]?.id || '');
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [docToDelete, setDocToDelete] = useState<Documento | null>(null);
    const [modalError, setModalError] = useState<string | null>(null);

    const initialFormState: Omit<Documento, 'id' | 'obraId' | 'url' | 'dataUpload'> = {
        nome: '',
        tipoDocumento: 'Outro',
    };
    const [formData, setFormData] = useState(initialFormState);
    const [file, setFile] = useState<File | null>(null);

    const filteredDocuments = useMemo(() => {
        if (!selectedObraId) return [];
        return documentos
            .filter(d => d.obraId === selectedObraId)
            .sort((a, b) => new Date(b.dataUpload).getTime() - new Date(a.dataUpload).getTime());
    }, [documentos, selectedObraId]);

    const handleOpenModal = () => {
        setFormData(initialFormState);
        setFile(null);
        setModalError(null);
        setIsModalOpen(true);
    };

    const handleSaveDocument = async () => {
        setModalError(null);
        if (!file || !selectedObraId) {
            setModalError("Por favor, selecione um arquivo e uma obra.");
            return;
        }

        try {
            const fileUrl = await dataService.uploadFile('documentos', file);
            
            const newDoc: Omit<Documento, 'id'> = {
                ...formData,
                nome: file.name,
                obraId: selectedObraId,
                url: fileUrl,
                dataUpload: new Date().toISOString().split('T')[0]
            };

            await dataService.documentos.create(newDoc);
            setIsModalOpen(false);
            await refetchData();
        } catch(error: any) {
            console.error(error);
            setModalError(`Falha no upload do documento: ${error.message}`);
        }
    };
    
    const triggerDelete = (doc: Documento) => {
        setDocToDelete(doc);
        setIsConfirmModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!docToDelete) return;
        await dataService.documentos.delete(docToDelete.id);
        setIsConfirmModalOpen(false);
        setDocToDelete(null);
        await refetchData();
    };
    
    const handleDownload = (doc: Documento) => {
        window.open(doc.url, '_blank');
    };

    if (loading) return <div className="text-center p-8">Carregando documentos...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-brand-blue">Documentos da Obra</h2>
                <div className="flex items-center space-x-2">
                    <label htmlFor="obra-filter" className="font-semibold text-brand-blue">Obra:</label>
                    <select id="obra-filter" value={selectedObraId} onChange={e => setSelectedObraId((e.target as HTMLSelectElement).value)} className="p-2 border rounded-lg">
                        {obras.map(obra => <option key={obra.id} value={obra.id}>{obra.name}</option>)}
                    </select>
                </div>
            </div>

            <Card>
                {user.role === UserRole.Admin && (
                    <div className="text-right mb-4">
                        <Button onClick={handleOpenModal} className="flex items-center space-x-2 ml-auto" disabled={!selectedObraId}>
                            {ICONS.add}
                            <span>Adicionar Documento</span>
                        </Button>
                    </div>
                )}
                
                {filteredDocuments.length === 0 ? (
                    <p className="text-brand-gray text-center py-8">Nenhum documento encontrado para esta obra.</p>
                ) : (
                    <ul className="space-y-3">
                        {filteredDocuments.map(doc => (
                            <li key={doc.id} className="flex items-center justify-between p-3 bg-brand-light-gray rounded-lg hover:bg-gray-200 transition-colors">
                                <div className="flex flex-col">
                                    <span className="font-semibold text-brand-blue">{doc.nome}</span>
                                    <span className="text-sm text-brand-gray">{doc.tipoDocumento} - {new Date(doc.dataUpload).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button size="sm" onClick={() => handleDownload(doc)}>Visualizar</Button>
                                    {user.role === UserRole.Admin && (
                                        <button onClick={() => triggerDelete(doc)} className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-100">{ICONS.delete}</button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Adicionar Novo Documento">
                <form onSubmit={e => { e.preventDefault(); handleSaveDocument(); }} className="space-y-4">
                    <div>
                        <label>Tipo de Documento</label>
                        <select value={formData.tipoDocumento} onChange={e => setFormData({...formData, tipoDocumento: (e.target as HTMLSelectElement).value as Documento['tipoDocumento']})} className="w-full p-2 border rounded" required>
                            <option value="Contrato">Contrato</option>
                            <option value="Comprovante de Pagamento">Comprovante de Pagamento</option>
                            <option value="Projeto">Projeto</option>
                            <option value="Outro">Outro</option>
                        </select>
                    </div>
                    <div>
                        <label>Arquivo (PDF, JPEG)</label>
                        <input type="file" onChange={e => setFile(e.target.files ? e.target.files[0] : null)} className="w-full p-2 border rounded" accept=".pdf,.jpeg,.jpg,.png" required />
                    </div>
                    {modalError && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{modalError}</p>}
                    <Button type="submit" className="w-full">Salvar Documento</Button>
                </form>
            </Modal>
            
            <ConfirmationModal 
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={confirmDelete}
                title="Confirmar Exclusão"
                message={`Tem certeza que deseja excluir o documento "${docToDelete?.nome}" permanentemente?`}
                confirmText="Excluir"
            />
        </div>
    );
};

export default DocumentosPage;