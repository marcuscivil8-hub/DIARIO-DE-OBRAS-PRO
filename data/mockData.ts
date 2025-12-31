import { User, UserRole, Obra, Funcionario, PagamentoTipo, DiarioObra, Clima, Servico, TransacaoFinanceira, TransacaoTipo, CategoriaSaida, Material, Ferramenta, StatusFerramenta, MovimentacaoAlmoxarifado, MovimentacaoTipo, Documento, Ponto } from '../types';

export const MOCK_USERS: User[] = [
    { id: 'user-1', name: 'Admin Geral', email: 'admin@diariodeobra.pro', username: 'admin', password: 'password', role: UserRole.Admin },
    { id: 'user-2', name: 'João Encarregado', email: 'joao@diariodeobra.pro', username: 'joao.enc', password: 'password', role: UserRole.Encarregado },
    { id: 'user-3', name: 'Maria Cliente', email: 'maria@cliente.com', username: 'maria.cliente', password: 'password', role: UserRole.Cliente, obraIds: ['obra-1'] },
];

export const MOCK_DATA = {
    obras: [
        { id: 'obra-1', name: 'Edifício Sol Nascente', cliente: 'Maria Cliente', endereco: 'Rua das Flores, 123', construtora: 'Engetch Engenharia e Projetos', logoConstrutora: '', status: 'Ativa', dataInicio: '2024-05-01', dataFimPrevista: '2025-05-01' },
        { id: 'obra-2', name: 'Residencial Bela Vista', cliente: 'Construtora Parceira', endereco: 'Av. Principal, 456', construtora: 'Engetch Engenharia e Projetos', logoConstrutora: '', status: 'Ativa', dataInicio: '2024-06-15', dataFimPrevista: '2025-12-20' },
        { id: 'obra-3', name: 'Centro Comercial', cliente: 'Investidores SA', endereco: 'Praça Central, 789', construtora: 'Engetch Engenharia e Projetos', logoConstrutora: '', status: 'Concluída', dataInicio: '2023-01-10', dataFimPrevista: '2024-03-30' },
    ] as Obra[],
    funcionarios: [
        { id: 'func-1', name: 'Carlos Pedreiro', funcao: 'Pedreiro', tipoPagamento: PagamentoTipo.Diaria, valor: 150, ativo: true, telefone: '11987654321', obraId: 'obra-1' },
        { id: 'func-2', name: 'Marcos Eletricista', funcao: 'Eletricista', tipoPagamento: PagamentoTipo.Diaria, valor: 200, ativo: true, telefone: '11987654322', obraId: 'obra-1' },
        { id: 'func-3', name: 'Ana Pintora', funcao: 'Pintora', tipoPagamento: PagamentoTipo.Diaria, valor: 120, ativo: true, telefone: '11987654323', obraId: 'obra-2' },
        { id: 'func-4', name: 'Ricardo Mestre de Obras', funcao: 'Mestre de Obras', tipoPagamento: PagamentoTipo.Salario, valor: 6000, ativo: true, telefone: '11987654324', obraId: null },
        { id: 'func-5', name: 'José Ajudante', funcao: 'Ajudante Geral', tipoPagamento: PagamentoTipo.Diaria, valor: 80, ativo: false, telefone: '11987654325', obraId: 'obra-1' },
    ] as Funcionario[],
    diarios_obra: [
        { id: 'diario-1', obraId: 'obra-1', data: '2024-07-28 17:00', clima: Clima.Ensolarado, observacoes: 'Concretagem da laje do 2º andar finalizada com sucesso. Equipe de elétrica iniciou a passagem dos conduítes.', fotos: [] },
        { id: 'diario-2', obraId: 'obra-1', data: '2024-07-29 17:00', clima: Clima.Nublado, observacoes: 'Início da alvenaria do 3º andar. Recebimento de 5m³ de areia e 100 sacos de cimento.', fotos: [] },
        { id: 'diario-3', obraId: 'obra-2', data: '2024-07-29 17:00', clima: Clima.Chuvoso, observacoes: 'Serviços internos de instalação hidráulica devido à chuva. Produtividade reduzida.', fotos: [] },
    ] as DiarioObra[],
    servicos: [
        { id: 'serv-1', obraId: 'obra-1', descricao: 'Fundação', dataInicioPrevista: '2024-05-01', dataFimPrevista: '2024-05-30', status: 'Concluído', dataInicioReal: '2024-05-02', dataFimReal: '2024-05-28' },
        { id: 'serv-2', obraId: 'obra-1', descricao: 'Alvenaria Estrutural', dataInicioPrevista: '2024-06-01', dataFimPrevista: '2024-08-30', status: 'Em Andamento', dataInicioReal: '2024-06-03' },
        { id: 'serv-3', obraId: 'obra-1', descricao: 'Instalações Elétricas', dataInicioPrevista: '2024-07-15', dataFimPrevista: '2024-09-15', status: 'Não Iniciado' },
    ] as Servico[],
    transacoes_financeiras: [
        { id: 'trans-1', obraId: 'obra-1', descricao: 'Primeira parcela do contrato', valor: 150000, tipoTransacao: TransacaoTipo.Entrada, categoria: 'Receita', data: '2024-05-01' },
        { id: 'trans-2', obraId: 'obra-1', descricao: 'Compra de Cimento Votoran', valor: 2500, tipoTransacao: TransacaoTipo.Saida, categoria: CategoriaSaida.Material, data: '2024-05-10' },
        { id: 'trans-3', obraId: 'obra-2', descricao: 'Aluguel de Betoneira', valor: 800, tipoTransacao: TransacaoTipo.Saida, categoria: CategoriaSaida.Aluguel, data: '2024-06-20' },
    ] as TransacaoFinanceira[],
    materiais: [
        { id: 'mat-1', nome: 'Cimento CPII 50kg', unidade: 'saco', estoqueMinimo: 50, fornecedor: 'Casa do Construtor', valor: 35.50 },
        { id: 'mat-2', nome: 'Areia Média', unidade: 'm³', estoqueMinimo: 10, fornecedor: 'Areeiro do Vale', valor: 120 },
        { id: 'mat-3', nome: 'Tijolo Baiano 9 furos', unidade: 'milheiro', estoqueMinimo: 5, fornecedor: 'Cerâmica Estrela', valor: 950 },
    ] as Material[],
    ferramentas: [
        { id: 'fer-1', nome: 'Furadeira de Impacto Bosch', codigo: 'BOSCH-FI-001', status: StatusFerramenta.Funcionando, valor: 450, estoqueMinimo: 2 },
        { id: 'fer-2', nome: 'Betoneira 400L', codigo: 'CSM-B400-001', status: StatusFerramenta.Funcionando, valor: 2800, estoqueMinimo: 1 },
        { id: 'fer-3', nome: 'Martelete Rompedor Makita', codigo: 'MAK-MR-001', status: StatusFerramenta.Parada, valor: 1200, estoqueMinimo: 1 },
    ] as Ferramenta[],
    movimentacoes_almoxarifado: [
        // Cimento
        { id: 'mov-1', itemId: 'mat-1', itemType: 'material', tipoMovimentacao: MovimentacaoTipo.Entrada, quantidade: 200, data: '2024-05-05', descricao: 'NF 123' },
        { id: 'mov-2', itemId: 'mat-1', itemType: 'material', tipoMovimentacao: MovimentacaoTipo.Saida, quantidade: 100, data: '2024-05-10', obraId: 'obra-1', responsavelRetiradaId: 'func-4' },
        { id: 'mov-3', itemId: 'mat-1', itemType: 'material', tipoMovimentacao: MovimentacaoTipo.Uso, quantidade: 80, data: '2024-05-15', obraId: 'obra-1' },
        // Furadeira
        { id: 'mov-4', itemId: 'fer-1', itemType: 'ferramenta', tipoMovimentacao: MovimentacaoTipo.Entrada, quantidade: 5, data: '2024-05-01', descricao: 'Compra inicial' },
        { id: 'mov-5', itemId: 'fer-1', itemType: 'ferramenta', tipoMovimentacao: MovimentacaoTipo.Saida, quantidade: 2, data: '2024-05-12', obraId: 'obra-1', responsavelRetiradaId: 'func-2' },
        { id: 'mov-6', itemId: 'fer-1', itemType: 'ferramenta', tipoMovimentacao: MovimentacaoTipo.Retorno, quantidade: 1, data: '2024-06-20', obraId: 'obra-1', responsavelRetiradaId: 'func-2' },
    ] as MovimentacaoAlmoxarifado[],
    documentos: [
        { id: 'doc-1', obraId: 'obra-1', nome: 'Contrato_Assinado.pdf', tipoDocumento: 'Contrato', url: '#', dataUpload: '2024-05-01' },
        { id: 'doc-2', obraId: 'obra-1', nome: 'Planta_Baixa_Aprovada.pdf', tipoDocumento: 'Projeto', url: '#', dataUpload: '2024-05-02' },
    ] as Documento[],
    pontos: [
        {id: 'ponto-1', funcionarioId: 'func-1', obraId: 'obra-1', data: '2024-07-29', status: 'presente' },
        {id: 'ponto-2', funcionarioId: 'func-2', obraId: 'obra-1', data: '2024-07-29', status: 'presente' },
    ] as Ponto[],
    configuracoes: {
        lembretes_encarregado: [
            "Verificar o uso de EPIs diariamente.",
            "Garantir a organização e limpeza do canteiro.",
            "Realizar o Diário de Obra ao final do expediente."
        ]
    }
};
