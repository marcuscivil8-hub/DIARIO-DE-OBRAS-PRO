export enum UserRole {
    Admin = 'Admin',
    Encarregado = 'Encarregado',
    Cliente = 'Cliente',
}

export interface User {
    id: string;
    name: string;
    email: string;
    username: string;
    password?: string;
    role: UserRole;
    obraIds?: string[]; // For clients, to link them to specific projects
}

export type Page = 'Dashboard' | 'Obras' | 'ObraDetail' | 'GerenciarFuncionarios' | 'FolhaPonto' | 'Financeiro' | 'Materiais' | 'Ferramentas' | 'Relatorios' | 'Usuarios' | 'Almoxarifado' | 'Documentos';

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
    obraId: string;
    data: string; // YYY-MM-DD
    status: 'presente' | 'falta' | 'meio-dia';
}

export enum TransacaoTipo {
    Entrada = 'Entrada',
    Saida = 'Saída',
}

export enum CategoriaSaida {
    FolhaPagamento = 'Folha de Pagamento',
    Material = 'Material de Construção',
    Ferramenta = 'Compra de Ferramenta',
    Aluguel = 'Aluguel de Equipamento',
    Indiretos = 'Gastos Indiretos',
    Outros = 'Outros',
}

export interface TransacaoFinanceira {
    id: string;
    obraId: string;
    descricao: string;
    valor: number;
    tipoTransacao: TransacaoTipo;
    categoria: CategoriaSaida | 'Receita';
    data: string; // YYYY-MM-DD
}

export interface Material {
    id: string;
    nome: string;
    unidade: string;
    estoqueMinimo: number;
    fornecedor?: string;
    valor?: number;
}

export enum MovimentacaoTipo {
    Entrada = 'Entrada',   // From supplier to central warehouse
    Saida = 'Saída',       // From central warehouse to an obra
    Uso = 'Uso',           // Material consumed/used at an obra
    Retorno = 'Retorno'      // From an obra back to central warehouse
}

// This type is for CENTRAL WAREHOUSE movements
export interface MovimentacaoAlmoxarifado {
    id: string;
    itemId: string; // Can be material or ferramenta id
    itemType: 'material' | 'ferramenta';
    tipoMovimentacao: MovimentacaoTipo;
    quantidade: number;
    data: string; // YYYY-MM-DD
    obraId?: string; // Used for Saida, Uso, Retorno
    responsavelRetiradaId?: string;
    descricao?: string; // e.g., "Nota fiscal 123" for entry
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
    valor?: number;
    estoqueMinimo?: number;
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

export interface Documento {
    id: string;
    obraId: string;
    nome: string;
    tipoDocumento: 'Contrato' | 'Comprovante de Pagamento' | 'Projeto' | 'Outro';
    url: string; // base64 data URL
    dataUpload: string; // YYYY-MM-DD
}