
export enum UserRole {
    Admin = 'Admin',
    Encarregado = 'Encarregado',
    Cliente = 'Cliente',
}

export interface User {
    id: string;
    name: string;
    username: string;
    // FIX: Made password optional as it's not stored in the database and not always present on User objects.
    password?: string;
    role: UserRole;
    obraIds?: string[]; // For clients, to link them to specific projects
}

export type Page = 'Dashboard' | 'Obras' | 'ObraDetail' | 'Funcionarios' | 'Financeiro' | 'Materiais' | 'Ferramentas' | 'Relatorios' | 'Usuarios';

export interface Obra {
    id: string;
    name: string;
    cliente: string;
    endereco: string;
    construtora: string;
    logoConstrutora: string; // URL or base64
    status: 'Ativa' | 'Pausada' | 'Concluída';
    dataInicio: string;
    dataFimPrevista: string;
}

export enum PagamentoTipo {
    Diaria = 'Diária',
    Salario = 'Salário Mensal'
}

export interface Funcionario {
    id: string;
    name: string;
    funcao: string;
    tipoPagamento: PagamentoTipo;
    valor: number;
    ativo: boolean;
    telefone: string;
    obraId: string | null;
}

export interface Ponto {
    id: string;
    funcionarioId: string;
    data: string; // YYYY-MM-DD
    status: 'presente' | 'falta';
}

export enum TransacaoTipo {
    Entrada = 'Entrada',
    Saida = 'Saída',
}

export interface TransacaoFinanceira {
    id: string;
    obraId: string;
    descricao: string;
    valor: number;
    tipo: TransacaoTipo;
    categoria: string;
    data: string; // YYYY-MM-DD
}

export interface Material {
    id: string;
    nome: string;
    unidade: string;
    quantidade: number;
    estoqueMinimo: number;
}

export enum MovimentacaoTipo {
    Entrada = 'Entrada',
    Saida = 'Saída'
}

export interface MovimentacaoMaterial {
    id: string;
    materialId: string;
    tipo: MovimentacaoTipo;
    quantidade: number;
    data: string; // YYYY-MM-DD
    responsavel: string;
}

export enum StatusFerramenta {
    Funcionando = 'Funcionando',
    Parada = 'Manutenção',
    Descartada = 'Descartada'
}

export interface Ferramenta {
    id: string;
    nome: string;
    codigo: string;
    status: StatusFerramenta;
    responsavelId: string | null;
}

export enum Clima {
    Ensolarado = 'Ensolarado',
    Nublado = 'Nublado',
    Chuvoso = 'Chuvoso',
    Tempestade = 'Tempestade'
}

export interface DiarioObra {
    id: string;
    obraId: string;
    data: string; // YYYY-MM-DD HH:mm
    clima: Clima;
    observacoes: string;
    fotos: { url: string; legenda: string }[];
}

export type StatusServico = 'Não Iniciado' | 'Em Andamento' | 'Concluído';

export interface Servico {
    id: string;
    obraId: string;
    descricao: string;
    dataInicioPrevista: string;
    dataFimPrevista: string;
    dataInicioReal?: string;
    dataFimReal?: string;
    status: StatusServico;
}