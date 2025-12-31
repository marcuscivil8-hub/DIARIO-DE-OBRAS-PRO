import { v4 as uuidv4 } from 'uuid';
import { User, UserRole, Obra, Funcionario, Ponto, TransacaoFinanceira, Material, Ferramenta, DiarioObra, Servico, MovimentacaoAlmoxarifado, Documento, PagamentoTipo, TransacaoTipo, CategoriaSaida, MovimentacaoTipo, StatusFerramenta, Clima } from '../types';

// --- IDs ---
const obra1Id = 'obra-uuid-1';
const obra2Id = 'obra-uuid-2';
const func1Id = 'func-uuid-1';
const func2Id = 'func-uuid-2';
const mat1Id = 'mat-uuid-1';
const mat2Id = 'mat-uuid-2';
const ferr1Id = 'ferr-uuid-1';
const ferr2Id = 'ferr-uuid-2';

// --- Users ---
export const mockUsers: User[] = [
    { id: 'admin-uuid-1', name: 'Admin Geral', email: 'admin@diariodeobra.pro', username: 'admin', password: 'password', role: UserRole.Admin },
    { id: 'encarregado-uuid-1', name: 'João da Silva', email: 'joao@diariodeobra.pro', username: 'joao.silva', password: 'password', role: UserRole.Encarregado },
    { id: 'cliente-uuid-1', name: 'Maria Souza', email: 'maria@cliente.com', username: 'maria.souza', password: 'password', role: UserRole.Cliente, obraIds: [obra1Id] },
];

// --- Obras ---
export const mockObras: Obra[] = [
    { id: obra1Id, name: 'Residencial Bela Vista', cliente: 'Construtora Horizonte', endereco: 'Rua das Flores, 123, São Paulo', construtora: 'Engetch Engenharia e Projetos', logoConstrutora: '', status: 'Ativa', dataInicio: '2024-05-01', dataFimPrevista: '2025-02-28' },
    { id: obra2Id, name: 'Edifício Central Park', cliente: 'Investimentos Urbanos S.A.', endereco: 'Av. Principal, 456, Rio de Janeiro', construtora: 'Engetch Engenharia e Projetos', logoConstrutora: '', status: 'Ativa', dataInicio: '2024-07-15', dataFimPrevista: '2025-08-30' },
    { id: 'obra-uuid-3', name: 'Centro Comercial Plaza', cliente: 'Plaza Malls', endereco: 'Praça Central, 789, Belo Horizonte', construtora: 'Engetch Engenharia e Projetos', logoConstrutora: '', status: 'Concluída', dataInicio: '2023-01-10', dataFimPrevista: '2024-06-20' },
];

// --- Funcionários ---
export const mockFuncionarios: Funcionario[] = [
    { id: func1Id, name: 'Carlos Pereira', funcao: 'Pedreiro', tipoPagamento: PagamentoTipo.Diaria, valor: 150, ativo: true, telefone: '11987654321', obraId: obra1Id },
    { id: func2Id, name: 'Ana Costa', funcao: 'Engenheira Civil', tipoPagamento: PagamentoTipo.Salario, valor: 8500, ativo: true, telefone: '21912345678', obraId: obra2Id },
    { id: 'func-uuid-3', name: 'Pedro Martins', funcao: 'Ajudante', tipoPagamento: PagamentoTipo.Diaria, valor: 90, ativo: true, telefone: '31988887777', obraId: obra1Id },
    { id: 'func-uuid-4', name: 'Mariana Lima', funcao: 'Arquiteta', tipoPagamento: PagamentoTipo.Salario, valor: 7800, ativo: false, telefone: '11999998888', obraId: null },
];

// --- Pontos (Folha de Ponto) ---
export const mockPontos: Ponto[] = [
    { id: uuidv4(), funcionarioId: func1Id, obraId: obra1Id, data: '2024-08-01', status: 'presente' },
    { id: uuidv4(), funcionarioId: func2Id, obraId: obra2Id, data: '2024-08-01', status: 'presente' },
    { id: uuidv4(), funcionarioId: func1Id, obraId: obra1Id, data: '2024-08-02', status: 'falta' },
];

// --- Transações Financeiras ---
export const mockTransacoesFinanceiras: TransacaoFinanceira[] = [
    { id: uuidv4(), obraId: obra1Id, descricao: 'Recebimento da 1ª parcela', valor: 50000, tipoTransacao: TransacaoTipo.Entrada, categoria: 'Receita', data: '2024-05-05' },
    { id: uuidv4(), obraId: obra1Id, descricao: 'Compra de cimento', valor: 2500, tipoTransacao: TransacaoTipo.Saida, categoria: CategoriaSaida.Material, data: '2024-05-10' },
    { id: uuidv4(), obraId: obra2Id, descricao: 'Taxas de licença da prefeitura', valor: 3500, tipoTransacao: TransacaoTipo.Saida, categoria: CategoriaSaida.Indiretos, data: '2024-07-20' },
];

// --- Materiais ---
export const mockMateriais: Material[] = [
    { id: mat1Id, nome: 'Cimento Votoran CP II', unidade: 'saco 50kg', estoqueMinimo: 20, fornecedor: 'Casa do Construtor', valor: 48.50 },
    { id: mat2Id, nome: 'Vergalhão de Aço 10mm', unidade: 'barra 12m', estoqueMinimo: 50, fornecedor: 'Ferro & Aço Ltda', valor: 65.00 },
];

// --- Ferramentas ---
export const mockFerramentas: Ferramenta[] = [
    { id: ferr1Id, nome: 'Furadeira de Impacto Bosch', codigo: 'BOSCH-FI-001', status: StatusFerramenta.Funcionando, valor: 450, estoqueMinimo: 2 },
    { id: ferr2Id, nome: 'Betoneira 400L', codigo: 'CSM-BET-400', status: StatusFerramenta.Funcionando, valor: 2800, estoqueMinimo: 1 },
];

// --- Movimentações Almoxarifado ---
export const mockMovimentacoesAlmoxarifado: MovimentacaoAlmoxarifado[] = [
    { id: uuidv4(), itemId: mat1Id, itemType: 'material', tipoMovimentacao: MovimentacaoTipo.Entrada, quantidade: 100, data: '2024-05-02', descricao: 'NF 123' },
    { id: uuidv4(), itemId: mat1Id, itemType: 'material', tipoMovimentacao: MovimentacaoTipo.Saida, quantidade: 30, data: '2024-05-10', obraId: obra1Id, responsavelRetiradaId: func1Id },
    { id: uuidv4(), itemId: ferr1Id, itemType: 'ferramenta', tipoMovimentacao: MovimentacaoTipo.Entrada, quantidade: 5, data: '2024-04-20', descricao: 'Compra inicial' },
    { id: uuidv4(), itemId: ferr1Id, itemType: 'ferramenta', tipoMovimentacao: MovimentacaoTipo.Saida, quantidade: 2, data: '2024-05-15', obraId: obra1Id, responsavelRetiradaId: func1Id },
];

// --- Diários de Obra ---
export const mockDiariosObra: DiarioObra[] = [
    { id: uuidv4(), obraId: obra1Id, data: '2024-08-01 17:00', clima: Clima.Ensolarado, observacoes: 'Concretagem da laje do 2º andar finalizada. Equipe trabalhou bem.', fotos: [] },
    { id: uuidv4(), obraId: obra2Id, data: '2024-08-01 17:30', clima: Clima.Nublado, observacoes: 'Início da montagem da estrutura metálica da fachada.', fotos: [] },
];

// --- Serviços ---
export const mockServicos: Servico[] = [
    { id: uuidv4(), obraId: obra1Id, descricao: 'Fundação', dataInicioPrevista: '2024-05-01', dataFimPrevista: '2024-05-30', status: 'Concluído' },
    { id: uuidv4(), obraId: obra1Id, descricao: 'Alvenaria', dataInicioPrevista: '2024-06-01', dataFimPrevista: '2024-07-30', status: 'Em Andamento' },
];

// --- Documentos ---
export const mockDocumentos: Documento[] = [
    { id: uuidv4(), obraId: obra1Id, nome: 'Contrato Principal.pdf', tipoDocumento: 'Contrato', url: '#', dataUpload: '2024-04-25' },
    { id: uuidv4(), obraId: obra1Id, nome: 'Planta Baixa Térreo.pdf', tipoDocumento: 'Projeto', url: '#', dataUpload: '2024-05-02' },
];

// --- Lembretes ---
export const mockLembretes: string[] = [
    "Verificar o uso de EPIs pela equipe.",
    "Garantir a limpeza e organização do canteiro de obras.",
    "Realizar o Diário de Obra todos os dias ao final do expediente.",
    "Comunicar qualquer imprevisto à administração imediatamente."
];