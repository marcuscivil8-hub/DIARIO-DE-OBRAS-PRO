import React, { useState, useRef, useMemo, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Obra, DiarioObra, TransacaoFinanceira, TransacaoTipo, Ponto, Funcionario, PagamentoTipo, MovimentacaoAlmoxarifado, Material, Ferramenta, Documento, MovimentacaoTipo } from '../../types';
import { dataService } from '../../services/dataService';
import Card from '../ui/Card';
import Button from '../ui/Button';

// --- Relatórios Individuais ---

const RelatorioConsumo: React.FC<{
    obra: Obra,
    movimentacoes: MovimentacaoAlmoxarifado[],
    materiais: Material[],
    ferramentas: Ferramenta[]
}> = ({ obra, movimentacoes, materiais, ferramentas }) => {
    const materiaisUsados = useMemo(() => {
        const consumo: Record<string, { nome: string, unidade: string, quantidade: number, valorTotal: number }> = {};
        const movimentosUso = movimentacoes.filter((m) => m.obraId === obra.id && m.itemType === 'material' && m.tipoMovimentacao === MovimentacaoTipo.Uso);
        const materiaisMap = new Map<string, Material>(materiais.map((m) => [m.id, m]));

        movimentosUso.forEach((mov) => {
            const material = materiaisMap.get(mov.itemId);
            if (material) {
                if (!consumo[material.id]) {
                    consumo[material.id] = { nome: material.nome, unidade: material.unidade, quantidade: 0, valorTotal: 0 };
                }
                consumo[material.id].quantidade += mov.quantidade;
                consumo[material.id].valorTotal += (material.valor || 0) * mov.quantidade;
            }
        });
        return Object.values(consumo);
    }, [obra.id, movimentacoes, materiais]);

    const custoTotalMateriais = materiaisUsados.reduce((sum, item) => sum + item.valorTotal, 0);

    return (
        <div className="p-8 bg-white text-black font-sans">
            <header className="text-right border-b-2 border-black pb-4 mb-8">
                <h1 className="text-3xl font-bold text-brand-blue">{obra.construtora}</h1>
                <p className="text-gray-800">Relatório de Consumo da Obra</p>
            </header>
            <main>
                <div className="mb-8 p-4 border border-gray-300 rounded">
                    <h2 className="text-xl font-bold mb-2 text-brand-blue">{obra.name}</h2>
                    <p><strong>Cliente:</strong> {obra.cliente}</p>
                    <p><strong>Data de Emissão:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="mb-8">
                    <h3 className="text-lg font-bold mb-2 text-brand-blue border-b pb-1">Materiais Utilizados</h3>
                    <table className="w-full text-sm border-collapse border border-gray-300">
                        <thead className="bg-gray-200">
                            <tr>
                                <th className="p-2 border text-left">Material</th>
                                <th className="p-2 border text-center">Qtd. Usada</th>
                                <th className="p-2 border text-right">Custo Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {materiaisUsados.map(item => (
                                <tr key={item.nome}>
                                    <td className="p-2 border">{item.nome}</td>
                                    <td className="p-2 border text-center">{item.quantidade} {item.unidade}</td>
                                    <td className="p-2 border text-right">R$ {item.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-200 font-bold">
                             <tr>
                                <td colSpan={2} className="p-2 border text-right">Total</td>
                                <td className="p-2 border text-right">R$ {custoTotalMateriais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </main>
        </div>
    );
};

const RelatorioFinanceiro: React.FC<{ obra: Obra | null, transacoes: TransacaoFinanceira[], custoMaoDeObra: number }> = ({ obra, transacoes, custoMaoDeObra }) => {
    const totalEntradas = transacoes.filter(t => t.tipoTransacao === TransacaoTipo.Entrada).reduce((sum, t) => sum + (t.valor || 0), 0);
    const totalSaidas = transacoes.filter(t => t.tipoTransacao === TransacaoTipo.Saida).reduce((sum, t) => sum + (t.valor || 0), 0) + custoMaoDeObra;
    const balanco = totalEntradas - totalSaidas;

    return (
        <div className="p-8 bg-white text-black font-sans">
            <h1 className="text-3xl font-bold text-brand-blue mb-4">Relatório Financeiro</h1>
            <div className="grid grid-cols-3 gap-4 mb-8 text-center">
                <div className="p-4 bg-green-50 rounded border border-green-200">
                    <h3 className="font-bold text-green-800">Entradas</h3>
                    <p className="text-xl">R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="p-4 bg-red-50 rounded border border-red-200">
                    <h3 className="font-bold text-red-800">Saídas</h3>
                    <p className="text-xl">R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded border border-blue-200">
                    <h3 className="font-bold text-blue-800">Balanço</h3>
                    <p className="text-xl">R$ {balanco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
            </div>
            <table className="w-full text-sm border-collapse border border-gray-300">
                <thead className="bg-gray-100 font-bold">
                    <tr>
                        <th className="p-2 border text-left">Descrição</th>
                        <th className="p-2 border text-left">Categoria</th>
                        <th className="p-2 border text-right">Valor</th>
                    </tr>
                </thead>
                <tbody>
                    {transacoes.map(t => (
                        <tr key={t.id}>
                            <td className="p-2 border">{t.descricao}</td>
                            <td className="p-2 border">{t.categoria}</td>
                            <td className={`p-2 border text-right ${t.tipoTransacao === TransacaoTipo.Entrada ? 'text-green-700' : 'text-red-700'}`}>
                                {t.tipoTransacao === TransacaoTipo.Entrada ? '+' : '-'} R$ {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                        </tr>
                    ))}
                    {custoMaoDeObra > 0 && (
                        <tr>
                            <td className="p-2 border italic">Mão de Obra (Folha de Ponto)</td>
                            <td className="p-2 border">Operacional</td>
                            <td className="p-2 border text-right text-red-700">- R$ {custoMaoDeObra.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

// --- Página Principal de Relatórios ---

const RelatoriosPage: React.FC = () => {
    const [obras, setObras] = useState<Obra[]>([]);
    const [transacoes, setTransacoes] = useState<TransacaoFinanceira[]>([]);
    const [pontos, setPontos] = useState<Ponto[]>([]);
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [movimentacoes, setMovimentacoes] = useState<MovimentacaoAlmoxarifado[]>([]);
    const [materiais, setMateriais] = useState<Material[]>([]);
    const [ferramentas, setFerramentas] = useState<Ferramenta[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [selectedObraId, setSelectedObraId] = useState<string>('all');
    const [reportType, setReportType] = useState<string>('consumo');
    const reportRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                const [obrasData, transData, pontosData, funcsData, movsData, matsData, ferrsData] = await Promise.all([
                    dataService.obras.getAll(),
                    dataService.transacoes.getAll(),
                    dataService.pontos.getAll(),
                    dataService.funcionarios.getAll(),
                    dataService.movimentacoesAlmoxarifado.getAll(),
                    dataService.materiais.getAll(),
                    dataService.ferramentas.getAll()
                ]);
                setObras(obrasData);
                setTransacoes(transData);
                setPontos(pontosData);
                setFuncionarios(funcsData);
                setMovimentacoes(movsData);
                setMateriais(matsData);
                setFerramentas(ferrsData);
            } catch (error) {
                console.error("Erro ao carregar dados dos relatórios", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, []);

    const dataFiltrada = useMemo(() => {
        const isAll = selectedObraId === 'all';
        const transFiltradas = isAll ? transacoes : transacoes.filter(t => t.obraId === selectedObraId);
        
        const pontosRelevantes = pontos.filter(p => p.status !== 'falta' && (isAll || p.obraId === selectedObraId));
        const custoMaoDeObra = pontosRelevantes.reduce((total, ponto) => {
            const func = funcionarios.find(f => f.id === ponto.funcionarioId);
            if(func && typeof func.valor === 'number') {
                const baseDailyValue = func.tipoPagamento === PagamentoTipo.Diaria ? func.valor : (func.valor / 22);
                const dailyCost = ponto.status === 'meio-dia' ? baseDailyValue / 2 : baseDailyValue;
                return total + dailyCost;
            }
            return total;
        }, 0);

        return { transFiltradas, custoMaoDeObra };
    }, [selectedObraId, transacoes, pontos, funcionarios]);

    const handleDownloadPdf = async () => {
        if (!reportRef.current) return;
        const canvas = await html2canvas(reportRef.current);
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`relatorio_${reportType}.pdf`);
    };

    if (loading) return <div className="p-8 text-center">Carregando dados...</div>;

    const obraSelecionada = obras.find(o => o.id === selectedObraId);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-brand-blue">Relatórios</h2>
            <Card>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Obra</label>
                        <select value={selectedObraId} onChange={e => setSelectedObraId(e.target.value)} className="w-full p-2 border rounded">
                            <option value="all">Todas as Obras</option>
                            {obras.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Tipo</label>
                        <select value={reportType} onChange={e => setReportType(e.target.value)} className="w-full p-2 border rounded">
                            <option value="consumo">Consumo de Materiais</option>
                            <option value="financeiro">Financeiro</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <Button onClick={handleDownloadPdf} className="w-full">Baixar PDF</Button>
                    </div>
                </div>
            </Card>

            <div className="bg-white border rounded-lg shadow-inner overflow-hidden" style={{ minHeight: '600px' }}>
                <div ref={reportRef}>
                    {reportType === 'consumo' && obraSelecionada && (
                        <RelatorioConsumo obra={obraSelecionada} movimentacoes={movimentacoes} materiais={materiais} ferramentas={ferramentas} />
                    )}
                    {reportType === 'financeiro' && (
                        <RelatorioFinanceiro obra={obraSelecionada || null} transacoes={dataFiltrada.transFiltradas} custoMaoDeObra={dataFiltrada.custoMaoDeObra} />
                    )}
                    {reportType === 'consumo' && !obraSelecionada && (
                        <div className="p-12 text-center text-gray-500">Selecione uma obra para gerar o relatório de consumo.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RelatoriosPage;