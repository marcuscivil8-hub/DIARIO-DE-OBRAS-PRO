
import React, { useState, useRef, useMemo, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Obra, DiarioObra, TransacaoFinanceira, TransacaoTipo, Ponto, Funcionario, PagamentoTipo } from '../../types';
import { apiService } from '../../services/apiService';
import Card from '../ui/Card';
import Button from '../ui/Button';

// --- Relatório Fotográfico Component ---
const RelatorioFotografico: React.FC<{ obra: Obra, diarios: DiarioObra[] }> = ({ obra, diarios }) => (
    <div className="p-8 bg-white text-black font-sans">
        <header className="text-right border-b-2 border-black pb-4 mb-8">
            <h1 className="text-3xl font-bold">{obra.construtora}</h1>
            <p>Relatório Fotográfico de Obra</p>
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
                                <p className="text-center text-sm mt-1">{foto.legenda}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </main>
    </div>
);

// --- Relatório Financeiro Component ---
const RelatorioFinanceiro: React.FC<{ obra: Obra | null, transacoes: TransacaoFinanceira[], custoMaoDeObra: number }> = ({ obra, transacoes, custoMaoDeObra }) => {
    const totalEntradas = transacoes.filter(t => t.tipo === TransacaoTipo.Entrada).reduce((sum, t) => sum + t.valor, 0);
    const totalSaidas = transacoes.filter(t => t.tipo === TransacaoTipo.Saida).reduce((sum, t) => sum + t.valor, 0) + custoMaoDeObra;
    const balanco = totalEntradas - totalSaidas;

    return (
        <div className="p-8 bg-white text-black font-sans">
            <header className="text-right border-b-2 border-black pb-4 mb-8">
                <h1 className="text-3xl font-bold">{obra?.construtora || 'Engetch Engenharia e Projetos'}</h1>
                <p>Relatório Financeiro de Obra</p>
            </header>
            <main>
                <div className="mb-8 p-4 border">
                    <h2 className="text-xl font-bold mb-2">{obra?.name || 'Todas as Obras'}</h2>
                    {obra && <p><strong>Cliente:</strong> {obra.cliente}</p>}
                    {obra && <p><strong>Endereço:</strong> {obra.endereco}</p>}
                    <p><strong>Data de Emissão:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-8 text-center">
                    <div className="p-4 bg-green-100 rounded">
                        <h3 className="font-bold text-green-800">Total Entradas</h3>
                        <p className="text-2xl font-bold text-green-800">R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="p-4 bg-red-100 rounded">
                        <h3 className="font-bold text-red-800">Total Saídas</h3>
                        <p className="text-2xl font-bold text-red-800">R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="p-4 bg-blue-100 rounded">
                        <h3 className="font-bold text-blue-800">Balanço</h3>
                        <p className={`text-2xl font-bold ${balanco >= 0 ? 'text-blue-800' : 'text-red-800'}`}>R$ {balanco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                </div>

                <h3 className="text-lg font-bold mb-2">Detalhamento das Saídas</h3>
                <table className="w-full text-sm border-collapse border">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="p-2 border">Data</th><th className="p-2 border text-left">Descrição</th><th className="p-2 border text-left">Categoria</th><th className="p-2 border text-right">Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transacoes.filter(t => t.tipo === TransacaoTipo.Saida).map(t => (
                            <tr key={t.id}><td className="p-2 border">{new Date(t.data).toLocaleDateString('pt-BR')}</td><td className="p-2 border">{t.descricao}</td><td className="p-2 border">{t.categoria}</td><td className="p-2 border text-right">- R$ {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td></tr>
                        ))}
                        {custoMaoDeObra > 0 && <tr className="font-bold bg-gray-100"><td className="p-2 border" colSpan={3}>Custo com Mão de Obra (do Ponto)</td><td className="p-2 border text-right">- R$ {custoMaoDeObra.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td></tr>}
                    </tbody>
                </table>
            </main>
        </div>
    );
};


// --- Main Page Component ---
const RelatoriosPage: React.FC = () => {
    const [obras, setObras] = useState<Obra[]>([]);
    const [diarios, setDiarios] = useState<DiarioObra[]>([]);
    const [transacoes, setTransacoes] = useState<TransacaoFinanceira[]>([]);
    const [pontos, setPontos] = useState<Ponto[]>([]);
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [pageLoading, setPageLoading] = useState(true);
    
    const [selectedObraId, setSelectedObraId] = useState<string>('all');
    const [reportType, setReportType] = useState<'fotografico' | 'financeiro'>('fotografico');
    const [pdfLoading, setPdfLoading] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const fetchAllData = async () => {
            setPageLoading(true);
            try {
                const [obrasData, diariosData, transacoesData, pontosData, funcionariosData] = await Promise.all([
                    apiService.obras.getAll(),
                    apiService.diarios.getAll(),
                    apiService.transacoes.getAll(),
                    apiService.pontos.getAll(),
                    apiService.funcionarios.getAll(),
                ]);
                setObras(obrasData);
                setDiarios(diariosData);
                setTransacoes(transacoesData);
                setPontos(pontosData);
                setFuncionarios(funcionariosData);
            } catch (error) {
                console.error("Failed to load report data", error);
            } finally {
                setPageLoading(false);
            }
        };
        fetchAllData();
    }, []);

    const obraSelecionada = obras.find(o => o.id === selectedObraId);
    
    const { diariosFiltrados, transacoesFiltradas, custoMaoDeObra } = useMemo(() => {
        const isAll = selectedObraId === 'all';
        const diariosFiltrados = isAll ? diarios : diarios.filter(d => d.obraId === selectedObraId);
        const transacoesFiltradas = isAll ? transacoes : transacoes.filter(t => t.obraId === selectedObraId);

        const funcionariosDaObra = isAll ? funcionarios : funcionarios.filter(f => f.obraId === selectedObraId);
        const pontosRelevantes = pontos.filter(p => funcionariosDaObra.some(f => f.id === p.funcionarioId) && p.status === 'presente');
        
        const custoMaoDeObra = pontosRelevantes.reduce((total, ponto) => {
            const func = funcionarios.find(f => f.id === ponto.funcionarioId);
            if(func) {
                if(func.tipoPagamento === PagamentoTipo.Diaria) return total + func.valor;
                if(func.tipoPagamento === PagamentoTipo.Salario) return total + (func.valor / 22);
            }
            return total;
        }, 0);

        return { diariosFiltrados, transacoesFiltradas, custoMaoDeObra };
    }, [selectedObraId, diarios, transacoes, pontos, funcionarios]);
    
    const handleGeneratePdf = () => {
        if (!reportRef.current) return;
        setPdfLoading(true);
        html2canvas(reportRef.current, { scale: 2 }).then((canvas) => {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgData = canvas.toDataURL('image/png');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            let heightLeft = pdfHeight;
            let position = 0;
            
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pdf.internal.pageSize.getHeight();

            while (heightLeft >= 0) {
              position = heightLeft - pdfHeight;
              pdf.addPage();
              pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
              heightLeft -= pdf.internal.pageSize.getHeight();
            }
            const obraName = obraSelecionada?.name || 'Geral';
            pdf.save(`relatorio_${reportType}_${obraName.replace(/\s/g, '_')}.pdf`);
            setPdfLoading(false);
        });
    };

    if (pageLoading) return <div className="text-center p-8">Carregando dados para relatórios...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-brand-blue">Gerar Relatórios</h2>
            
            <Card>
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="flex-grow w-full">
                        <label className="text-sm font-medium text-brand-gray">Filtrar por Obra</label>
                        <select value={selectedObraId} onChange={e => setSelectedObraId(e.target.value)} className="w-full p-3 border rounded-lg">
                             <option value="all">Todas as Obras</option>
                            {obras.map(obra => <option key={obra.id} value={obra.id}>{obra.name}</option>)}
                        </select>
                    </div>
                     <div className="flex-grow w-full">
                        <label className="text-sm font-medium text-brand-gray">Tipo de Relatório</label>
                        <select value={reportType} onChange={e => setReportType(e.target.value as any)} className="w-full p-3 border rounded-lg">
                            <option value="fotografico">Fotográfico</option>
                            <option value="financeiro">Financeiro</option>
                        </select>
                    </div>
                    <div className="w-full md:w-auto self-end">
                        <Button onClick={handleGeneratePdf} disabled={pdfLoading} className="w-full !py-3">
                            {pdfLoading ? 'Gerando...' : 'Gerar PDF'}
                        </Button>
                    </div>
                </div>
            </Card>

            <Card title="Pré-visualização do Relatório">
                <div className="border rounded-lg overflow-hidden max-h-[1000px] overflow-y-auto">
                    <div ref={reportRef}>
                        {reportType === 'fotografico' && obraSelecionada && <RelatorioFotografico obra={obraSelecionada} diarios={diariosFiltrados} />}
                        {reportType === 'fotografico' && !obraSelecionada && <div className="p-8 text-center text-brand-gray">Selecione uma obra para gerar o relatório fotográfico.</div>}
                        {reportType === 'financeiro' && <RelatorioFinanceiro obra={obraSelecionada || null} transacoes={transacoesFiltradas} custoMaoDeObra={custoMaoDeObra}/>}
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default RelatoriosPage;
