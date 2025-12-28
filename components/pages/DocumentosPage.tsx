
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Obra, Documento, User, UserRole } from '../../types';
import { apiService } from '../../services/apiService';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal, { ConfirmationModal } from '../ui/Modal';
import { ICONS } from '../../constants';

interface DocumentosPageProps {
    user: User;
}

const DocumentosPage: React.FC<DocumentosPageProps> = ({ user }) => {
    const [documentos, setDocumentos] = useState<Documento[]>([]);
    const [obras, setObras] = useState<Obra[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedObraId, setSelectedObraId] = useState<string>('');
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [docToDelete, setDocToDelete] = useState<Documento | null>(null);

    const initialFormState: Omit<Documento, 'id' | 'obraId' | 'url'> = {
        nome: '',
        tipo: 'Outro',
        dataUpload: new Date().toISOString().split('T')[0]
    };
    const [formData, setFormData] = useState(initialFormState);
    const [file, setFile] = useState<File | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [docsData, obrasData] = await Promise.all([
                apiService.documentos.getAll(),
                apiService.obras.getAll()
            ]);
            
            const userObras = user.role === UserRole.Cliente 
                ? obrasData.filter(obra => user.obraIds?.includes(obra.id)) 
                : obrasData;
            
            setObras(userObras);
            setDocumentos(docsData);
            
            if (userObras.length > 0) {
                setSelectedObraId(userObras[0].id);
            }
        } catch (error) {
            console.error("Failed to fetch documents data", error);
        } finally {
            setLoading(false);
        }
    }, [user.role, user.obraIds]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const filteredDocuments = useMemo(() => {
        if (!selectedObraId) return [];
        return documentos
            .filter(d => d.obraId === selectedObraId)
            .sort((a, b) => new Date(b.dataUpload).getTime() - new Date(a.dataUpload).getTime());
    }, [documentos, selectedObraId]);

    const handleOpenModal = () => {
        setFormData(initialFormState);
        setFile(null);
        setIsModalOpen(true);
    };
    
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const handleSaveDocument = async () => {
        if (!file || !formData.nome || !selectedObraId) {
            alert("Por favor, preencha o nome do arquivo, selecione um arquivo e uma obra.");
            return;
        }

        const fileUrl = await fileToBase64(file);
        
        const newDoc: Omit<Documento, 'id'> = {
            ...formData,
            obraId: selectedObraId,
            url: fileUrl,
            nome: file.name // Use the actual file name
        };

        await apiService.documentos.create(newDoc);
        setIsModalOpen(false);
        await fetchData();
    };
    
    const triggerDelete = (doc: Documento) => {
        setDocToDelete(doc);
        setIsConfirmModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!docToDelete) return;
        await apiService.documentos.delete(docToDelete.id);
        setIsConfirmModalOpen(false);
        setDocToDelete(null);
        await fetchData();
    };
    
    const handleDownload = (doc: Documento) => {
        const link = document.createElement('a');
        link.href = doc.url;
        link.download = doc.nome;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className="text-center p-8">Carregando documentos...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-brand-blue">Documentos da Obra</h2>
                <div className="flex items-center space-x-2">
                    <label htmlFor="obra-filter" className="font-semibold text-brand-blue">Obra:</label>
                    <select id="obra-filter" value={selectedObraId} onChange={e => setSelectedObraId(e.target.value)} className="p-2 border rounded-lg">
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
                                    <span className="text-sm text-brand-gray">{doc.tipo} - {new Date(doc.dataUpload).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button size="sm" onClick={() => handleDownload(doc)}>Baixar</Button>
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
                    <div><label>Tipo de Documento</label><select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value as Documento['tipo']})} className="w-full p-2 border rounded" required><option value="Contrato">Contrato</option><option value="Comprovante de Pagamento">Comprovante de Pagamento</option><option value="Projeto">Projeto</option><option value="Outro">Outro</option></select></div>
                    <div><label>Arquivo (PDF, JPEG)</label><input type="file" onChange={e => setFile(e.target.files ? e.target.files[0] : null)} className="w-full p-2 border rounded" accept=".pdf,.jpeg,.jpg,.png" required /></div>
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