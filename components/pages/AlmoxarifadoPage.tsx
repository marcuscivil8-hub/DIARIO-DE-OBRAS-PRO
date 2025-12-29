import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Material, Ferramenta, MovimentacaoAlmoxarifado, Obra, Funcionario, MovimentacaoTipo, Page } from '../../types';
import { apiService } from '../../services/apiService';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { ICONS } from '../../constants';

interface AlmoxarifadoPageProps {
    navigateTo: (page: Page) => void;
}

const AlmoxarifadoPage: React.FC<AlmoxarifadoPageProps> = ({ navigateTo }) => {
    const [materiais, setMateriais] = useState<Material[]>([]);
    const [ferramentas, setFerramentas] = useState<Ferramenta[]>([]);
    const [movimentacoes, setMovimentacoes] = useState<MovimentacaoAlmoxarifado[]>([]);
    const [obras, setObras] = useState<Obra[]>([]);
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [loading, setLoading] = useState(true);

    // State for movement modal
    const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'entrada' | 'saida' | null>(null);
    const [currentItem, setCurrentItem] = useState<{ id: string; type: 'material' | 'ferramenta' } | null>(null);
    const [formData, setFormData] = useState({
        quantidade: 1,
        obraId: '',
        responsavelRetiradaId: '',
        descricao: ''
    });

    // State for new material modal
    const [isNewMaterialModalOpen, setIsNewMaterialModalOpen] = useState(false);
    const emptyNewMaterial: Omit<Material, 'id' | 'quantidade'> = { nome: '', unidade: '', estoqueMinimo: 0 };
    const [newMaterialData, setNewMaterialData] = useState(emptyNewMaterial);


    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [matData, ferData, movData, obrData, funcData] = await Promise.all([
                apiService.materiais.getAll(),
                apiService.ferramentas.getAll(),
                apiService.movimentacoesAlmoxarifado.getAll(),
                apiService.obras.getAll(),
                apiService.funcionarios.getAll()
            ]);
            setMateriais(matData);
            setFerramentas(ferData);
            setMovimentacoes(movData);
            setObras(obrData.filter(o => o.status === 'Ativa'));
            setFuncionarios(funcData.filter(f => f.ativo));
        } catch (error) {
            console.error("Failed to fetch almoxarifado data", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const estoqueCalculadoMateriais = useMemo(() => {
        const estoque: Record<string, number> = {};
        movimentacoes.forEach(mov => {
            if (mov.itemType === 'material') {
                let change = 0;
                // Estoque central aumenta com Entradas (de fornecedor) e Retornos (da obra).
                if (mov.tipoMovimentacao === MovimentacaoTipo.Entrada || mov.tipoMovimentacao === MovimentacaoTipo.Retorno) {
                    change = mov.quantidade;
                // Estoque central diminui apenas com Saídas (para a obra).
                // O 'Uso' do material ocorre na obra e afeta apenas o estoque da obra.
                } else if (mov.tipoMovimentacao === MovimentacaoTipo.Saida) {
                    change = -mov.quantidade;
                }
                
                if (change !== 0) {
                   estoque[mov.itemId] = (estoque[mov.itemId] || 0) + change;
                }
            }
        });
        return estoque;
    }, [movimentacoes]);
    
    const ferramentasEmEstoque = useMemo(() => {
        return ferramentas.filter(f => !f.obraId);
    }, [ferramentas]);
    
    const handleOpenMovementModal = (type: 'entrada' | 'saida', item: {id: string, type: 'material' | 'ferramenta'}) => {
        setModalType(type);
        setCurrentItem(item);
        setFormData({
            quantidade: 1,
            obraId: obras[0]?.id || '',
            responsavelRetiradaId: funcionarios[0]?.id || '',
            descricao: ''
        });
        setIsMovementModalOpen(true);
    };

    const handleSaveMovimentacao = async () => {
        if (!currentItem) return;

        const newMov: Omit<MovimentacaoAlmoxarifado, 'id'> = {
            itemId: currentItem.id,
            itemType: currentItem.type,
            tipoMovimentacao: modalType === 'entrada' ? MovimentacaoTipo.Entrada : MovimentacaoTipo.Saida,
            quantidade: formData.quantidade,
            data: new Date().toISOString().split('T')[0],
            ...(modalType === 'saida' && {
                obraId: formData.obraId,
                responsavelRetiradaId: formData.responsavelRetiradaId
            }),
            ...(modalType === 'entrada' && {
                descricao: formData.descricao
            })
        };
        await apiService.movimentacoesAlmoxarifado.create(newMov);
        
        // If it's a tool going out, update its location
        if (currentItem.type === 'ferramenta' && modalType === 'saida') {
            await apiService.ferramentas.update(currentItem.id, {
                obraId: formData.obraId,
                responsavelId: formData.responsavelRetiradaId
            });
        }
        
        setIsMovementModalOpen(false);
        await fetchData();
    };
    
    const handleSaveNewMaterial = async () => {
        const newMaterialDataWithQuantity = { ...newMaterialData, quantidade: 0 };
        await apiService.materiais.create(newMaterialDataWithQuantity);
        setIsNewMaterialModalOpen(false);
        setNewMaterialData(emptyNewMaterial);
        await fetchData();
    };

    const getNomeItem = (item: {id: string, type: 'material' | 'ferramenta'}) => {
        if (item.type === 'material') return materiais.find(m => m.id === item.id)?.nome || 'Item desconhecido';
        return ferramentas.find(f => f.id === item.id)?.nome || 'Item desconhecido';
    };

    if (loading) return <div>Carregando Almoxarifado...</div>;
    
    return (
        <div className="space-y-6">
             <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-2xl font-bold text-brand-blue">Almoxarifado Central</h2>
                <div className="flex gap-2">
                    <Button onClick={() => navigateTo('Ferramentas')} variant="secondary" className="flex items-center space-x-2">
                        {ICONS.ferramentas}
                        <span>Cadastrar Ferramenta</span>
                    </Button>
                    <Button onClick={() => setIsNewMaterialModalOpen(true)} className="flex items-center space-x-2">
                        {ICONS.add}
                        <span>Cadastrar Material</span>
                    </Button>
                </div>
            </div>
            
            <Card title="Materiais em Estoque">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b-2 bg-brand-light-gray">
                                <th className="p-4 text-brand-blue font-semibold">Material</th>
                                <th className="p-4 text-brand-blue font-semibold">Estoque Atual</th>
                                <th className="p-4 text-brand-blue font-semibold">Ações</th>
                            </tr>
                        </thead>
                        <tbody>{materiais.map(m => (
                            <tr key={m.id} className="border-b hover:bg-gray-50">
                                <td className="p-4 font-bold text-brand-blue">{m.nome}</td>
                                <td className={`p-4 font-bold ${(estoqueCalculadoMateriais[m.id] || 0) <= m.estoqueMinimo ? 'text-red-500' : 'text-brand-blue'}`}>
                                    {estoqueCalculadoMateriais[m.id] || 0} {m.unidade}
                                </td>
                                <td className="p-4">
                                    <div className="flex space-x-2">
                                        <Button size="sm" onClick={() => handleOpenMovementModal('entrada', {id: m.id, type: 'material'})}>+ Entrada</Button>
                                        <Button size="sm" variant="secondary" onClick={() => handleOpenMovementModal('saida', {id: m.id, type: 'material'})} disabled={(estoqueCalculadoMateriais[m.id] || 0) === 0}>- Saída</Button>
                                    </div>
                                </td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            </Card>

            <Card title="Ferramentas em Estoque">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b-2 bg-brand-light-gray">
                                <th className="p-4 text-brand-blue font-semibold">Ferramenta</th>
                                <th className="p-4 text-brand-blue font-semibold">Código</th>
                                <th className="p-4 text-brand-blue font-semibold">Ações</th>
                            </tr>
                        </thead>
                        <tbody>{ferramentasEmEstoque.map(f => (
                            <tr key={f.id} className="border-b hover:bg-gray-50">
                                <td className="p-4 font-bold text-brand-blue">{f.nome}</td>
                                <td className="p-4 text-brand-gray">{f.codigo}</td>
                                <td className="p-4">
                                    <div className="flex space-x-2">
                                         <Button size="sm" variant="secondary" onClick={() => handleOpenMovementModal('saida', {id: f.id, type: 'ferramenta'})}>- Saída</Button>
                                    </div>
                                </td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            </Card>

            <Modal 
                isOpen={isMovementModalOpen} 
                onClose={() => setIsMovementModalOpen(false)} 
                title={currentItem ? `${modalType === 'entrada' ? 'Registrar Entrada' : 'Registrar Saída'} de ${getNomeItem(currentItem)}` : 'Registrar Movimentação'}
            >
                {currentItem && (
                    <form onSubmit={e => {e.preventDefault(); handleSaveMovimentacao();}} className="space-y-4">
                        {currentItem.type === 'material' && (
                            // FIX: Cast event target to HTMLInputElement to access value property.
                            <div><label>Quantidade</label><input type="number" min="1" value={formData.quantidade} onChange={e => setFormData({...formData, quantidade: Number((e.target as HTMLInputElement).value)})} className="w-full p-2 border rounded" required /></div>
                        )}
                        {modalType === 'entrada' && (
                            // FIX: Cast event target to HTMLInputElement to access value property.
                            <div><label>Descrição (Ex: Nota Fiscal, Fornecedor)</label><input type="text" value={formData.descricao} onChange={e => setFormData({...formData, descricao: (e.target as HTMLInputElement).value})} className="w-full p-2 border rounded" /></div>
                        )}
                        {modalType === 'saida' && (<>
                            {/* FIX: Cast event target to HTMLSelectElement to access value property. */}
                            <div><label>Obra de Destino</label><select value={formData.obraId} onChange={e => setFormData({...formData, obraId: (e.target as HTMLSelectElement).value})} className="w-full p-2 border rounded" required>{obras.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></div>
                            {/* FIX: Cast event target to HTMLSelectElement to access value property. */}
                            <div><label>Responsável pela Retirada</label><select value={formData.responsavelRetiradaId} onChange={e => setFormData({...formData, responsavelRetiradaId: (e.target as HTMLSelectElement).value})} className="w-full p-2 border rounded" required>{funcionarios.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></div>
                        </>)}
                        <Button type="submit" className="w-full">Salvar Movimentação</Button>
                    </form>
                )}
            </Modal>
            
            <Modal isOpen={isNewMaterialModalOpen} onClose={() => setIsNewMaterialModalOpen(false)} title="Cadastrar Novo Material no Catálogo">
                 <form onSubmit={e => { e.preventDefault(); handleSaveNewMaterial(); }} className="space-y-4">
                    {/* FIX: Cast event target to HTMLInputElement to access value property. */}
                    <input type="text" placeholder="Nome do Material" value={newMaterialData.nome} onChange={e => setNewMaterialData({...newMaterialData, nome: (e.target as HTMLInputElement).value})} className="w-full p-2 border rounded" required/>
                    {/* FIX: Cast event target to HTMLInputElement to access value property. */}
                    <input type="text" placeholder="Unidade (ex: un, m³, kg)" value={newMaterialData.unidade} onChange={e => setNewMaterialData({...newMaterialData, unidade: (e.target as HTMLInputElement).value})} className="w-full p-2 border rounded" required/>
                    {/* FIX: Cast event target to HTMLInputElement to access value property. */}
                    <input type="number" placeholder="Estoque Mínimo" value={newMaterialData.estoqueMinimo} onChange={e => setNewMaterialData({...newMaterialData, estoqueMinimo: parseFloat((e.target as HTMLInputElement).value) || 0})} className="w-full p-2 border rounded" required/>
                    <Button type="submit" className="w-full">Salvar Novo Material</Button>
                </form>
            </Modal>
        </div>
    );
};

export default AlmoxarifadoPage;