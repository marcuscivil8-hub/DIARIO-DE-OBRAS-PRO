
import React, { useState, useRef, useMemo, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Obra, DiarioObra, TransacaoFinanceira, TransacaoTipo, Ponto, Funcionario, PagamentoTipo, MovimentacaoAlmoxarifado, Material, Ferramenta, Documento, MovimentacaoTipo } from '../../types';
import { apiService } from '../../services/apiService';
import Card from '../ui/Card';
import Button from '../ui/Button';

// --- Relatório de Consumo (Materiais e Ferramentas) ---
const RelatorioConsumo: React.FC<{
    obra: Obra,
    movimentacoes: MovimentacaoAlmoxarifado[],
    materiais: Material[],
    ferramentas: Ferramenta[]
}> = ({ obra, movimentacoes, materiais, ferramentas }) => {

    const materiaisUsados = useMemo(() => {
        const consumo: Record<string, { nome: string, unidade: string, quantidade: number, valorTotal: number }> = {};
        const movimentosUso = movimentacoes.filter(m => m.obraId === obra.id && m.itemType === 'material' && m.tipoMovimentacao === MovimentacaoTipo.Uso);
        // FIX: Add explicit type annotation for the map callback parameter to ensure correct type inference.
        const materiaisMap = new Map(materiais.map((m: Material) => [m.id, m]));

        // FIX: Add explicit type annotation for the forEach callback parameter to ensure correct type inference.
        movimentosUso.forEach((mov: MovimentacaoAlmoxarifado) => {
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

    const ferramentasNaObra = useMemo(() => {
        return ferramentas.filter(f => f.obraId === obra.id);
    }, [obra.id, ferramentas]);

    const custoTotalMateriais = materiaisUsados.reduce((sum, item) => sum + item.valorTotal, 0);
    // FIX: Add explicit type annotation for the reduce callback parameter to ensure correct type inference.
    const custoTotalFerramentas = ferramentasNaObra.reduce((sum, item: Ferramenta) => sum + (item.valor || 0), 0);

    return (
        <div className="p-8 bg-white text-gray-800 font-sans">
            <header className="text-right border-b-2 border-black pb-4 mb-8">
                <h1 className="text-3xl font-bold text-brand-blue">{obra.construtora}</h1>
                <p className="text-gray-600">Relatório de Consumo da Obra</p>
            </header>
            <main>
                <div className="mb-8 p-4 border border-gray-300 rounded">
                    <h2 className="text-xl font-bold mb-2 text-brand-blue">{obra.name}</h2>
                    <p><strong>Cliente:</strong> {obra.cliente}</p>
                    <p><strong>Data de Emissão:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
                </div>

                <div className="mb-8 break-inside-avoid">
                    <h3 className="text-lg font-bold mb-2 text-brand-blue border-b pb-1">Materiais Utilizados na Obra</h3>
                    <table className="w-full text-sm border-collapse border border-gray-300">
                        <thead className="bg-gray-200">
                            <tr>
                                <th className="p-2 border text-left text-brand-blue font-bold">Material</th>
                                <th className="p-2 border text-center text-brand-blue font-bold">Qtd. Usada</th>
                                <th className="p-2 border text-right text-brand-blue font-bold">Custo Total</th>
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
                                <td colSpan={2} className="p-2 border text-right">Custo Total de Materiais</td>
                                <td className="p-2 border text-right">R$ {custoTotalMateriais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                
                 <div className="mb-8 break-inside-avoid">
                    <h3 className="text-lg font-bold mb-2 text-brand-blue border-b pb-1">Ferramentas Alocadas na Obra</h3>
                     <table className="w-full text-sm border-collapse border border-gray-300">
                        <thead className="bg-gray-200">
                            <tr>
                                <th className="p-2 border text-left text-brand-blue font-bold">Ferramenta</th>
                                <th className="p-2 border text-left text-brand-blue font-bold">Código</th>
                                <th className="p-2 border text-right text-brand-blue font-bold">Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ferramentasNaObra.map(item => (
                                <tr key={item.id}>
                                    <td className="p-2 border">{item.nome}</td>
                                    <td className="p-2 border">{item.codigo}</td>
                                    <td className="p-2 border text-right">R$ {item.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</td>
                                </tr>
                            ))}
                        </tbody>
                         <tfoot className="bg-gray-200 font-bold">
                             <tr>
                                <td colSpan={2} className="p-2 border text-right">Valor Total de Ferramentas</td>
                                <td className="p-2 border text-right">R$ {custoTotalFerramentas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

            </main>
        </div>
    );
};


// --- Date Helpers for Payroll ---
const getPeriodDates = (periodo: 'semanal' | 'quinzenal' | 'mensal') => {
    const today = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (periodo) {
        case 'semanal':
            const firstDayOfWeek = today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1);
            startDate = new Date(today.setDate(firstDayOfWeek));
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            break;
        case 'quinzenal':
            const day = today.getDate();
            const year = today.getFullYear();
            const month = today.getMonth();
            if (day <= 15) {
                startDate = new Date(year, month, 1);
                endDate = new Date(year, month, 15);
            } else {
                startDate = new Date(year, month, 16);
                endDate = new Date(year, month + 1, 0);
            }
            break;
        case 'mensal':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            break;
    }
    return { startDate, endDate };
};

// --- Relatório Fotográfico Component ---
const RelatorioFotografico: React.FC<{ obra: Obra, diarios: DiarioObra[] }> = ({ obra, diarios }) => (
    <div className="p-8 bg-white text-gray-800 font-sans">
        <header className="text-right border-b-2 border-black pb-4 mb-8">
            <h1 className="text-3xl font-bold text-brand-blue">{obra.construtora}</h1>
            <p className="text-gray-600">Relatório Fotográfico de Obra</p>
        </header>
        <main>
            <div className="mb-8 p-4 border border-gray-300 rounded">
                <h2 className="text-xl font-bold mb-2 text-brand-blue">{obra.name}</h2>
                <p><strong>Cliente:</strong> {obra.cliente}</p>
                <p><strong>Endereço:</strong> {obra.endereco}</p>
                <p><strong>Data de Emissão:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
            
            {diarios.map(diario => (
                 <div key={diario.id} className="mb-8 break-inside-avoid">
                    <h3 className="text-lg font-semibold bg-gray-200 p-2 text-brand-blue rounded-t">Data: {new Date(diario.data).toLocaleString('pt-BR')}</h3>
                    <div className="border border-t-0 p-2 rounded-b">
                        <p><strong>Clima:</strong> {diario.clima}</p>
                        <p><strong>Observações:</strong> {diario.observacoes}</p>
                        <div className="mt-4 grid grid-cols-2 gap-4">
                            {diario.fotos.map((foto, index) => (
                                 <div key={index} className="border p-2 rounded">
                                    <img src={foto.url} alt={foto.legenda} className="w-full rounded" />
                                    <p className="text-center text-sm mt-1 text-gray-600">{foto.legenda}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </main>
    </div>
);

// --- Relatório Financeiro Component ---
const RelatorioFinanceiro: React.FC<{ obra: Obra | null, transacoes: TransacaoFinanceira[], custoMaoDeObra: number }> = ({ obra, transacoes, custoMaoDeObra }) => {
    const totalEntradas = transacoes.filter(t => t.tipoTransacao === TransacaoTipo.Entrada).reduce((sum, t) => sum + t.valor, 0);
    const totalSaidas = transacoes.filter(t => t.tipoTransacao === TransacaoTipo.Saida).reduce((sum, t) => sum + t.valor, 0) + custoMaoDeObra;
    const balanco = totalEntradas - totalSaidas;

    return (
        <div className="p-8 bg-white text-gray-800 font-sans">
            <header className="text-right border-b-2 border-black pb-4 mb-8">
                <h1 className="text-3xl font-bold text-brand-blue">{obra?.construtora || 'Engetch Engenharia e Projetos'}</h1>
                <p className="text-gray-600">Relatório Financeiro de Obra</p>
            </header>
            <main>
                <div className="mb-8 p-4 border border-gray-300 rounded">
                    <h2 className="text-xl font-bold mb-2 text-brand-blue">{obra?.name || 'Todas as Obras'}</h2>
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

                <h3 className="text-lg font-bold mb-2 text-brand-blue">Detalhamento das Saídas</h3>
                <table className="w-full text-sm border-collapse border border-gray-300">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="p-2 border border-gray-300 text-brand-blue font-bold">Data</th>
                            <th className="p-2 border border-gray-300 text-left text-brand-blue font-bold">Descrição</th>
                            <th className="p-2 border border-gray-300 text-left text-brand-blue font-bold">Categoria</th>
                            <th className="p-2 border border-gray-300 text-right text-brand-blue font-bold">Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transacoes.filter(t => t.tipoTransacao === TransacaoTipo.Saida).map(t => (
                            <tr key={t.id} className="text-gray-800"><td className="p-2 border border-gray-300">{new Date(t.data).toLocaleDateString('pt-BR')}</td><td className="p-2 border border-gray-300">{t.descricao}</td><td className="p-2 border border-gray-300">{t.categoria}</td><td className="p-2 border border-gray-300 text-right">- R$ {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td></tr>
                        ))}
                        {custoMaoDeObra > 0 && <tr className="font-bold bg-gray-100 text-gray-800"><td className="p-2 border border-gray-300" colSpan={3}>Custo com Mão de Obra (do Ponto)</td><td className="p-2 border border-gray-300 text-right">- R$ {custoMaoDeObra.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td></tr>}
                    </tbody>
                </table>
            </main>
        </div>
    );
};

// --- Relatório Folha de Pagamento ---
const RelatorioFolhaPagamento: React.FC<{ obra: Obra | null, funcionarios: Funcionario[], pontos: Ponto[], periodo: 'semanal' | 'quinzenal' | 'mensal' }> = ({ obra, funcionarios, pontos, periodo }) => {
    const { startDate, endDate } = getPeriodDates(periodo);
    const funcionariosDaObra = (obra ? funcionarios.filter(f => f.obraId === obra.id) : funcionarios).sort((a,b) => a.name.localeCompare(b.name));
    
    const payrollData = funcionariosDaObra.map(func => {
        const pontosNoPeriodo = pontos.filter(p => {
            const pontoDate = new Date(p.data + 'T00:00:00'); // Ensure correct date parsing
            return p.funcionarioId === func.id && 
                   pontoDate >= startDate && 
                   pontoDate <= endDate &&
                   (obra ? p.obraId === obra.id : true);
        });

        const diasTrabalhados = pontosNoPeriodo.filter(p => p.status === 'presente').length;
        const faltas = pontosNoPeriodo.filter(p => p.status === 'falta').length;
        
        let valorAPagar = 0;
        if (func.tipoPagamento === PagamentoTipo.Diaria) {
            valorAPagar = diasTrabalhados * func.valor;
        } else { // Salario Mensal
            valorAPagar = (func.valor / 22) * diasTrabalhados; // Pro-rata
        }
        return { ...func, diasTrabalhados, faltas, valorAPagar };
    });

    const totalFolha = payrollData.reduce((sum, data) => sum + data.valorAPagar, 0);

    return (
        <div className="p-8 bg-white text-gray-800 font-sans">
            <header className="text-right border-b-2 border-black pb-4 mb-8">
                 <h1 className="text-3xl font-bold text-brand-blue">{obra?.construtora || 'Engetch Engenharia e Projetos'}</h1>
                <p className="text-gray-600">Relatório de Folha de Pagamento</p>
            </header>
             <main>
                <div className="mb-8 p-4 border border-gray-300 rounded">
                    <h2 className="text-xl font-bold mb-2 text-brand-blue">{obra?.name || 'Todas as Obras'}</h2>
                     <p><strong>Período:</strong> {startDate.toLocaleDateString('pt-BR')} a {endDate.toLocaleDateString('pt-BR')}</p>
                    <p><strong>Data de Emissão:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
                </div>
                <table className="w-full text-sm border-collapse border border-gray-300">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="p-2 border border-gray-300 text-left text-brand-blue font-bold">Funcionário</th>
                            <th className="p-2 border border-gray-300 text-brand-blue font-bold">Dias Trabalhados</th>
                            <th className="p-2 border border-gray-300 text-brand-blue font-bold">Faltas</th>
                            <th className="p-2 border border-gray-300 text-right text-brand-blue font-bold">Valor a Pagar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payrollData.map(data => (
                            <tr key={data.id} className="text-gray-800">
                                <td className="p-2 border border-gray-300">{data.name}</td>
                                <td className="p-2 border border-gray-300 text-center">{data.diasTrabalhados}</td>
                                <td className="p-2 border border-gray-300 text-center">{data.faltas}</td>
                                <td className="p-2 border border-gray-300 text-right">R$ {data.valorAPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-200 font-bold text-gray-800">
                        <tr>
                            <td className="p-2 border border-gray-300 text-right" colSpan={3}>Total da Folha</td>
                            <td className="p-2 border border-gray-300 text-right">R$ {totalFolha.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        </tr>
                    </tfoot>
                </table>
            </main>
        </div>
    );
};

// --- Relatório Almoxarifado ---
const RelatorioAlmoxarifado: React.FC<{ 
    movimentacoes: MovimentacaoAlmoxarifado[],
    materiais: Material[],
    ferramentas: Ferramenta[],
    obras: Obra[],
    funcionarios: Funcionario[],
}> = ({ movimentacoes, materiais, ferramentas, obras, funcionarios }) => {
    
    const getNomeItem = (mov: MovimentacaoAlmoxarifado) => {
        if (mov.itemType === 'material') {
            return materiais.find(m => m.id === mov.itemId)?.nome || 'Item não encontrado';
        }
        return ferramentas.find(f => f.id === mov.itemId)?.nome || 'Item não encontrado';
    };

    const saidas = movimentacoes.filter(m => m.tipoMovimentacao === MovimentacaoTipo.Saida).sort((a,b) => new Date(b.data).getTime() - new Date(a.data).getTime());

    return (
        <div className="p-8 bg-white text-gray-800 font-sans">
            <header className="text-right border-b-2 border-black pb-4 mb-8">
                 <h1 className="text-3xl font-bold text-brand-blue">Engetch Engenharia e Projetos</h1>
                <p className="text-gray-600">Relatório de Saídas do Almoxarifado</p>
            </header>
             <main>
                <div className="mb-8 p-4 border border-gray-300 rounded">
                    <h2 className="text-xl font-bold mb-2 text-brand-blue">Controle de Retiradas</h2>
                    <p><strong>Data de Emissão:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
                </div>
                <table className="w-full text-sm border-collapse border border-gray-300">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="p-2 border border-gray-300 text-left text-brand-blue font-bold">Data</th>
                            <th className="p-2 border border-gray-300 text-left text-brand-blue font-bold">Item</th>
                            <th className="p-2 border border-gray-300 text-center text-brand-blue font-bold">Qtd.</th>
                            <th className="p-2 border border-gray-300 text-left text-brand-blue font-bold">Obra de Destino</th>
                            <th className="p-2 border border-gray-300 text-left text-brand-blue font-bold">Responsável</th>
                        </tr>
                    </thead>
                    <tbody>
                        {saidas.map(mov => (
                            <tr key={mov.id} className="text-gray-800">
                                <td className="p-2 border border-gray-300">{new Date(mov.data).toLocaleDateString('pt-BR')}</td>
                                <td className="p-2 border border-gray-300">{getNomeItem(mov)}</td>
                                <td className="p-2 border border-gray-300 text-center">{mov.quantidade}</td>
                                {/* FIX: Changed property from `obraDestinoId` to `obraId`. */}
                                <td className="p-2 border border-gray-300">{obras.find(o => o.id === mov.obraId)?.name || '-'}</td>
                                <td className="p-2 border border-gray-300">{funcionarios.find(f => f.id === mov.responsavelRetiradaId)?.name || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </main>
        </div>
    );
};

// --- Relatório de Documentos ---
const RelatorioDocumentos: React.FC<{ obra: Obra | null, documentos: Documento[] }> = ({ obra, documentos }) => {
    const groupedDocs = documentos.reduce((acc, doc) => {
        (acc[doc.tipoDocumento] = acc[doc.tipoDocumento] || []).push(doc);
        return acc;
    }, {} as Record<string, Documento[]>);
    
    const groupOrder: Documento['tipoDocumento'][] = ['Contrato', 'Comprovante de Pagamento', 'Projeto', 'Outro'];

    return (
        <div className="p-8 bg-white text-gray-800 font-sans">
            <header className="text-right border-b-2 border-black pb-4 mb-8">
                <h1 className="text-3xl font-bold text-brand-blue">{obra?.construtora || 'Engetch Engenharia e Projetos'}</h1>
                <p className="text-gray-600">Relatório de Documentos da Obra</p>
            </header>
            <main>
                <div className="mb-8 p-4 border border-gray-300 rounded">
                    <h2 className="text-xl font-bold mb-2 text-brand-blue">{obra?.name || 'Todas as Obras'}</h2>
                    {obra && <p><strong>Cliente:</strong> {obra.cliente}</p>}
                    <p><strong>Data de Emissão:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
                </div>
                
                {groupOrder.map(group => groupedDocs[group] && (
                    <div key={group} className="mb-6 break-inside-avoid">
                        <h3 className="text-lg font-bold mb-2 text-brand-blue border-b pb-1">{group}</h3>
                        <table className="w-full text-sm border-collapse">
                            <tbody>
                                {groupedDocs[group].map(doc => (
                                    <tr key={doc.id} className="text-gray-800 border-b">
                                        <td className="p-2">{doc.nome}</td>
                                        <td className="p-2 text-right">{new Date(doc.dataUpload).toLocaleDateString('pt-BR')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </main>
        </div>
    );
};


// --- Main Page Component ---
type ReportType = 'fotografico' | 'financeiro' | 'folhaPagamento' | 'almoxarifado' | 'documentos' | 'consumo';
type PeriodoFolha = 'semanal' | 'quinzenal' | 'mensal';

const RelatoriosPage: React.FC = () => {
    const [obras, setObras] = useState<Obra[]>([]);
    const [diarios, setDiarios] = useState<DiarioObra[]>([]);
    const [transacoes, setTransacoes] = useState<TransacaoFinanceira[]>([]);
    const [pontos, setPontos] = useState<Ponto[]>([]);
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [movimentacoes, setMovimentacoes] = useState<MovimentacaoAlmoxarifado[]>([]);
    const [materiais, setMateriais] = useState<Material[]>([]);
    const [ferramentas, setFerramentas] = useState<Ferramenta[]>([]);
    const [documentos, setDocumentos] = useState<Documento[]>([]);

    const [pageLoading, setPageLoading] = useState(true);
    
    const [selectedObraId, setSelectedObraId] = useState<string>('all');
    const [reportType, setReportType] = useState<ReportType>('fotografico');
    const [periodoFolha, setPeriodoFolha] = useState<PeriodoFolha>('semanal');
    const [pdfLoading, setPdfLoading] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const fetchAllData = async () => {
            setPageLoading(true);
            try {
                const [obrasData, diariosData, transacoesData, pontosData, funcionariosData, movsData, materiaisData, ferramentasData, documentosData] = await Promise.all([
                    apiService.obras.getAll(),
                    apiService.diarios.getAll(),
                    apiService.transacoes.getAll(),
                    apiService.pontos.getAll(),
                    apiService.funcionarios.getAll(),
                    apiService.movimentacoesAlmoxarifado.getAll(),
                    apiService.materiais.getAll(),
                    apiService.ferramentas.getAll(),
                    apiService.documentos.getAll()
                ]);
                setObras(obrasData);
                setDiarios(diariosData);
                setTransacoes(transacoesData);
                setPontos(pontosData);
                setFuncionarios(funcionariosData);
                setMovimentacoes(movsData);
                setMateriais(materiaisData);
                setFerramentas(ferramentasData);
                setDocumentos(documentosData);
            } catch (error) {
                console.error("Failed to load report data", error);
            } finally {
                setPageLoading(false);
            }
        };
        fetchAllData();
    }, []);

    const obraSelecionada = obras.find(o => o.id === selectedObraId);
    
    const { diariosFiltrados, transacoesFiltradas, custoMaoDeObra, documentosFiltrados } = useMemo(() => {
        const isAll = selectedObraId === 'all';
        const diariosFiltrados = isAll ? diarios : diarios.filter(d => d.obraId === selectedObraId);
        const transacoesFiltradas = isAll ? transacoes : transacoes.filter(t => t.obraId === selectedObraId);
        const documentosFiltrados = isAll ? documentos : documentos.filter(d => d.obraId === selectedObraId);

        const pontosRelevantes = pontos.filter(p => p.status === 'presente' && (isAll || p.obraId === selectedObraId));
        
        const custoMaoDeObra = pontosRelevantes.reduce((total, ponto) => {
            const func = funcionarios.find(f => f.id === ponto.funcionarioId);
            if(func) {
                if(func.tipoPagamento === PagamentoTipo.Diaria) return total + func.valor;
                if(func.tipoPagamento === PagamentoTipo.Salario) return total + (func.valor / 22);
            }
            return total;
        }, 0);

        return { diariosFiltrados, transacoesFiltradas, custoMaoDeObra, documentosFiltrados };
    }, [selectedObraId, diarios, transacoes, pontos, funcionarios, documentos]);
    
    const handleGeneratePdf = () => {
        if (!reportRef.current) return;
        setPdfLoading(true);
        html2canvas(reportRef.current, { scale: 2, useCORS: true }).then((canvas) => {
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

    const needsObraSelection = ['fotografico', 'financeiro', 'folhaPagamento', 'documentos', 'consumo'].includes(reportType) && selectedObraId === 'all' && reportType !== 'financeiro';

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-brand-blue">Gerar Relatórios</h2>
            
            <Card>
                <div className="grid grid-cols-1 md:grid-cols-4 items-end gap-4">
                    <div className="md:col-span-1">
                        <label className="text-sm font-medium text-brand-gray">Tipo de Relatório</label>
                        <select value={reportType} onChange={e => setReportType((e.target as HTMLSelectElement).value as ReportType)} className="w-full p-3 border rounded-lg">
                            <option value="fotografico">Fotográfico</option>
                            <option value="financeiro">Financeiro</option>
                            <option value="folhaPagamento">Folha de Pagamento</option>
                            <option value="almoxarifado">Almoxarifado (Saídas)</option>
                            <option value="consumo">Consumo (Materiais e Ferramentas)</option>
                            <option value="documentos">Documentos da Obra</option>
                        </select>
                    </div>
                    { (reportType !== 'almoxarifado') &&
                    <div className="md:col-span-1">
                        <label className="text-sm font-medium text-brand-gray">Filtrar por Obra</label>
                        <select value={selectedObraId} onChange={e => setSelectedObraId((e.target as HTMLSelectElement).value)} className="w-full p-3 border rounded-lg">
                             <option value="all">Todas as Obras</option>
                            {obras.map(obra => <option key={obra.id} value={obra.id}>{obra.name}</option>)}
                        </select>
                    </div>
                    }
                    {reportType === 'folhaPagamento' && (
                        <div className="md:col-span-1">
                            <label className="text-sm font-medium text-brand-gray">Período da Folha</label>
                            <select value={periodoFolha} onChange={e => setPeriodoFolha((e.target as HTMLSelectElement).value as PeriodoFolha)} className="w-full p-3 border rounded-lg">
                                <option value="semanal">Semanal</option>
                                <option value="quinzenal">Quinzenal</option>
                                <option value="mensal">Mensal</option>
                            </select>
                        </div>
                    )}
                    <div className="w-full md:col-start-4">
                        <Button onClick={handleGeneratePdf} disabled={pdfLoading || needsObraSelection} className="w-full !py-3">
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
                        
                        {reportType === 'folhaPagamento' && <RelatorioFolhaPagamento obra={obraSelecionada || null} funcionarios={funcionarios} pontos={pontos} periodo={periodoFolha} />}
                        
                        {reportType === 'almoxarifado' && <RelatorioAlmoxarifado movimentacoes={movimentacoes} materiais={materiais} ferramentas={ferramentas} obras={obras} funcionarios={funcionarios} />}

                        {reportType === 'consumo' && obraSelecionada && <RelatorioConsumo obra={obraSelecionada} movimentacoes={movimentacoes} materiais={materiais} ferramentas={ferramentas} />}
                        {reportType === 'consumo' && !obraSelecionada && <div className="p-8 text-center text-brand-gray">Selecione uma obra para gerar o relatório de consumo.</div>}
                        
                        {reportType === 'documentos' && obraSelecionada && <RelatorioDocumentos obra={obraSelecionada} documentos={documentosFiltrados} />}
                        {reportType === 'documentos' && !obraSelecionada && <div className="p-8 text-center text-brand-gray">Selecione uma obra para listar os documentos.</div>}
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default RelatoriosPage;
