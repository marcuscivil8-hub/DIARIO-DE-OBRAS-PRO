import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { dataService } from '../services/dataService';
import { Obra, Funcionario, Ponto, TransacaoFinanceira, Material, Ferramenta, DiarioObra, Servico, MovimentacaoAlmoxarifado, Documento, User } from '../types';

interface DataContextState {
    obras: Obra[];
    funcionarios: Funcionario[];
    pontos: Ponto[];
    transacoes: TransacaoFinanceira[];
    materiais: Material[];
    ferramentas: Ferramenta[];
    diarios: DiarioObra[];
    servicos: Servico[];
    movimentacoes: MovimentacaoAlmoxarifado[];
    documentos: Documento[];
    users: User[];
    lembretes: string[];
    loading: boolean;
    error: string | null;
    refetchData: () => Promise<void>;
}

const DataContext = createContext<DataContextState | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<Omit<DataContextState, 'refetchData'>>({
        obras: [],
        funcionarios: [],
        pontos: [],
        transacoes: [],
        materiais: [],
        ferramentas: [],
        diarios: [],
        servicos: [],
        movimentacoes: [],
        documentos: [],
        users: [],
        lembretes: [],
        loading: true,
        error: null,
    });

    const fetchData = useCallback(async () => {
        setState(prevState => ({ ...prevState, loading: true, error: null }));
        try {
            const [
                obras, funcionarios, pontos, transacoes, materiais, ferramentas,
                diarios, servicos, movimentacoes, documentos, users, lembretes
            ] = await Promise.all([
                dataService.obras.getAll(),
                dataService.funcionarios.getAll(),
                dataService.pontos.getAll(),
                dataService.transacoes.getAll(),
                dataService.materiais.getAll(),
                dataService.ferramentas.getAll(),
                dataService.diarios.getAll(),
                dataService.servicos.getAll(),
                dataService.movimentacoesAlmoxarifado.getAll(),
                dataService.documentos.getAll(),
                dataService.users.getAll(),
                dataService.getLembretes()
            ]);

            setState({
                obras, funcionarios, pontos, transacoes, materiais, ferramentas,
                diarios, servicos, movimentacoes, documentos, users, lembretes,
                loading: false, error: null
            });
        } catch (err: any) {
            console.error("Failed to fetch global data:", err);
            setState(prevState => ({ ...prevState, loading: false, error: err.message || "Failed to fetch data" }));
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const contextValue: DataContextState = {
        ...state,
        refetchData: fetchData
    };

    return (
        <DataContext.Provider value={contextValue}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = (): DataContextState => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};