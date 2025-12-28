
import { User, UserRole, Obra, Funcionario, PagamentoTipo, TransacaoFinanceira, TransacaoTipo, Material, Ferramenta, StatusFerramenta, DiarioObra, Clima, Ponto, Servico, CategoriaSaida, MovimentacaoAlmoxarifado, Documento } from '../types';

export const initialUsers: User[] = [
    { id: '1', name: 'Admin Geral', username: 'admin', password: '', role: UserRole.Admin },
    { id: '2', name: 'João Encarregado', username: 'joao', password: 'joao', role: UserRole.Encarregado },
    { id: '3', name: 'Maria Cliente', username: 'maria', password: 'maria', role: UserRole.Cliente, obraIds: ['101'] },
];

export const initialObras: Obra[] = [
    {
        id: '101',
        name: 'Residencial Bela Vista',
        cliente: 'Maria da Silva',
        endereco: 'Rua das Flores, 123, São Paulo, SP',
        construtora: 'Engetch Engenharia e Projetos',
        logoConstrutora: '',
        status: 'Ativa',
        dataInicio: '2024-05-01',
        dataFimPrevista: '2025-02-28',
    },
    {
        id: '102',
        name: 'Edifício Central Park',
        cliente: 'Carlos Souza',
        endereco: 'Av. Principal, 456, Rio de Janeiro, RJ',
        construtora: 'Engetch Engenharia e Projetos',
        logoConstrutora: '',
        status: 'Ativa',
        dataInicio: '2024-06-15',
        dataFimPrevista: '2025-06-30',
    },
];

export const initialFuncionarios: Funcionario[] = [
    { id: '201', name: 'Pedro Pedreiro', funcao: 'Pedreiro', tipoPagamento: PagamentoTipo.Diaria, valor: 150, ativo: true, telefone: '11987654321', obraId: '101' },
    { id: '202', name: 'Carlos Eletricista', funcao: 'Eletricista', tipoPagamento: PagamentoTipo.Salario, valor: 4500, ativo: true, telefone: '21912345678', obraId: '102' },
    { id: '203', name: 'Ana Servente', funcao: 'Servente', tipoPagamento: PagamentoTipo.Diaria, valor: 90, ativo: true, telefone: '11999998888', obraId: '101' },
    { id: '204', name: 'Mariano Azulejista', funcao: 'Azulejista', tipoPagamento: PagamentoTipo.Diaria, valor: 180, ativo: false, telefone: '11911112222', obraId: null },
];

export const initialPontos: Ponto[] = [];

export const initialTransacoes: TransacaoFinanceira[] = [];

// NOTE: `quantidade` is now calculated from movements. This is just the catalog.
export const initialMateriais: Material[] = [
    { id: '401', nome: 'Cimento (saco 50kg)', unidade: 'un', quantidade: 0, estoqueMinimo: 20 },
    { id: '402', nome: 'Areia (m³)', unidade: 'm³', quantidade: 0, estoqueMinimo: 5 },
    { id: '403', nome: 'Tijolo (unidade)', unidade: 'un', quantidade: 0, estoqueMinimo: 1000 },
];

export const initialFerramentas: Ferramenta[] = [
    { id: '501', nome: 'Furadeira de Impacto', codigo: 'FI-001', status: StatusFerramenta.Funcionando, responsavelId: null },
    { id: '502', nome: 'Betoneira', codigo: 'BT-001', status: StatusFerramenta.Funcionando, responsavelId: null },
    { id: '503', nome: 'Serra Circular', codigo: 'SC-001', status: StatusFerramenta.Parada, responsavelId: null },
];

export const initialDiarios: DiarioObra[] = [
    {
        id: '601',
        obraId: '101',
        data: '2024-07-22 17:00',
        clima: Clima.Ensolarado,
        observacoes: 'Início da concretagem da laje do primeiro pavimento. Tudo ocorrendo conforme o planejado.',
        fotos: [{ url: 'https://picsum.photos/seed/obra1/800/600', legenda: 'Vista geral da laje' }]
    },
    {
        id: '602',
        obraId: '101',
        data: '2024-07-23 16:30',
        clima: Clima.Nublado,
        observacoes: 'Montagem da alvenaria do segundo andar. Equipe rendendo bem.',
        fotos: [{ url: 'https://picsum.photos/seed/obra2/800/600', legenda: 'Parede sul sendo levantada' }, { url: 'https://picsum.photos/seed/obra3/800/600', legenda: 'Detalhe do alinhamento' }]
    },
];

export const initialServicos: Servico[] = [
    {
        id: 's1',
        obraId: '101',
        descricao: 'Fundações e Baldrame',
        dataInicioPrevista: '2024-05-05',
        dataFimPrevista: '2024-05-25',
        dataInicioReal: '2024-05-06',
        status: 'Em Andamento',
    },
    {
        id: 's2',
        obraId: '101',
        descricao: 'Alvenaria do Térreo',
        dataInicioPrevista: '2024-05-26',
        dataFimPrevista: '2024-06-15',
        status: 'Não Iniciado',
    },
    {
        id: 's3',
        obraId: '102',
        descricao: 'Instalações Elétricas Preliminares',
        dataInicioPrevista: '2024-06-20',
        dataFimPrevista: '2024-07-10', // Past date
        status: 'Não Iniciado',
    }
];

export const initialMovimentacoesAlmoxarifado: MovimentacaoAlmoxarifado[] = [];

export const initialLembretes: string[] = [
    "Verificar estoque de cimento.",
    "Confirmar entrega de areia para amanhã.",
    "Registrar ponto de todos os funcionários.",
];

export const initialDocumentos: Documento[] = [];