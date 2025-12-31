import { User, Obra, Funcionario, Ponto, TransacaoFinanceira, Material, Ferramenta, DiarioObra, Servico, MovimentacaoAlmoxarifado, Documento, UserRole, PagamentoTipo, StatusFerramenta } from '../types';

// To fix the "is not a module" error, this file needs to export its variables.
// The content was missing, so this placeholder data is provided based on the types
// to allow the application to compile and run.

export const mockLembretes: string[] = [
    "Verificar a programação de concretagem para amanhã.",
    "Realizar a integração de segurança com os novos funcionários.",
    "Checar o estoque de Equipamentos de Proteção Individual (EPIs).",
    "Garantir que todas as áreas de trabalho estejam limpas e organizadas ao final do dia."
];

export const mockUsers: User[] = [
    { 
        id: 'user-admin-01', 
        name: 'Admin Geral', 
        email: 'admin@diariodeobra.pro', 
        username: 'admin', 
        password: 'password', 
        role: UserRole.Admin 
    },
    { 
        id: 'user-encarregado-01', 
        name: 'João Silva', 
        email: 'joao@diariodeobra.pro', 
        username: 'joao', 
        password: 'password', 
        role: UserRole.Encarregado 
    },
    { 
        id: 'user-cliente-01', 
        name: 'Maria Souza', 
        email: 'maria@cliente.com', 
        username: 'maria', 
        password: 'password', 
        role: UserRole.Cliente, 
        obraIds: ['obra-01'] 
    },
];

export const mockObras: Obra[] = [
    { 
        id: 'obra-01', 
        name: 'Residencial Vista Verde', 
        cliente: 'Maria Souza', 
        endereco: 'Rua das Palmeiras, 123, Bairro Alto', 
        construtora: 'Engetch Engenharia e Projetos', 
        logoConstrutora: '', 
        status: 'Ativa', 
        dataInicio: '2023-08-01T03:00:00.000Z', 
        dataFimPrevista: '2024-07-31T03:00:00.000Z'
    },
    { 
        id: 'obra-02', 
        name: 'Edifício Comercial Central', 
        cliente: 'ACME Corp', 
        endereco: 'Av. Principal, 456, Centro', 
        construtora: 'Engetch Engenharia e Projetos', 
        logoConstrutora: '', 
        status: 'Concluída', 
        dataInicio: '2022-03-15T03:00:00.000Z', 
        dataFimPrevista: '2023-09-30T03:00:00.000Z' 
    },
];

export const mockFuncionarios: Funcionario[] = [
    { id: 'func-01', name: 'Carlos Pereira', funcao: 'Pedreiro', tipoPagamento: PagamentoTipo.Diaria, valor: 180, ativo: true, telefone: '(11) 98877-6655', obraId: 'obra-01' },
    { id: 'func-02', name: 'Ana Costa', funcao: 'Servente', tipoPagamento: PagamentoTipo.Salario, valor: 2350, ativo: true, telefone: '(11) 97766-5544', obraId: 'obra-01' },
    { id: 'func-03', name: 'Roberto Lima', funcao: 'Eletricista', tipoPagamento: PagamentoTipo.Diaria, valor: 250, ativo: true, telefone: '(11) 96655-4433', obraId: 'obra-01' },
    { id: 'func-04', name: 'Sandra Almeida', funcao: 'Pintora', tipoPagamento: PagamentoTipo.Diaria, valor: 200, ativo: false, telefone: '(11) 95544-3322', obraId: null },
];

export const mockPontos: Ponto[] = [];
export const mockTransacoes: TransacaoFinanceira[] = [];
export const mockDiarios: DiarioObra[] = [];
export const mockServicos: Servico[] = [];

export const mockMateriais: Material[] = [
    { id: 'mat-01', nome: 'Cimento Votoran Todas as Obras', unidade: 'saco 50kg', estoqueMinimo: 20, fornecedor: 'Depósito Central', valor: 32.50 },
    { id: 'mat-02', nome: 'Areia Média Lavada', unidade: 'm³', estoqueMinimo: 5, fornecedor: 'Areial do Vale', valor: 130.00 },
    { id: 'mat-03', nome: 'Vergalhão de Aço CA50 10mm', unidade: 'barra 12m', estoqueMinimo: 50, fornecedor: 'Aço Forte', valor: 45.00 },
];

export const mockFerramentas: Ferramenta[] = [
    { id: 'fer-01', nome: 'Martelete Rompedor 5kg', codigo: 'MAK-001', status: StatusFerramenta.Funcionando, valor: 1200.00, estoqueMinimo: 1 },
    { id: 'fer-02', nome: 'Betoneira 400L', codigo: 'CSM-400', status: StatusFerramenta.Funcionando, valor: 3500.00, estoqueMinimo: 1 },
    { id: 'fer-03', nome: 'Serra Circular de Bancada', codigo: 'DEW-7492', status: StatusFerramenta.Parada, valor: 2800.00, estoqueMinimo: 0 },
];

export const mockMovimentacoes: MovimentacaoAlmoxarifado[] = [];
export const mockDocumentos: Documento[] = [];
