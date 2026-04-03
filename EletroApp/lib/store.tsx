// lib/store.tsx
// Estado global da aplicação via React Context
// Sem bibliotecas externas — Context + useReducer nativo do React

"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from "react";

import type {
  Comodo,
  DadosObra,
  ResultadoComodo,
  Demanda,
  Circuito,
  Material,
  ParametrosCalculo,
  TipoComodo,
  SistemaEletrico,
  TensaoAlimentacao,
} from "./types";

import { PARAMETROS_PADRAO } from "./types";

import {
  calcularResultadosComodos,
  calcularDemandaTotal,
  calcularCircuitos,
  gerarListaMateriais,
  validarSistema,
} from "./calculations";

// ─────────────────────────────────────────────────────────────────────────────
// ESTADO
// ─────────────────────────────────────────────────────────────────────────────

interface AppState {
  dadosObra: DadosObra;
  comodos: Comodo[];
  params: ParametrosCalculo;
  resultados: ResultadoComodo[];
  demanda: Demanda | null;
  circuitos: Circuito[];
  materiais: Material[];
  alertas: string[];
  calculado: boolean;
}

const DADOS_OBRA_PADRAO: DadosObra = {
  proprietario: "",
  endereco: "",
  responsavel: "",
  crea: "",
  art: "",
  data: new Date().toLocaleDateString("pt-BR"),
  tensao: "127/220V",
  fases: "Bifásico (2F+N)",
  concessionaria: "Cemig",
  norma: "NBR 5410:2005 / ND-5.5 Cemig",
};

const ESTADO_INICIAL: AppState = {
  dadosObra: DADOS_OBRA_PADRAO,
  comodos: [],
  params: PARAMETROS_PADRAO,
  resultados: [],
  demanda: null,
  circuitos: [],
  materiais: [],
  alertas: [],
  calculado: false,
};

// ─────────────────────────────────────────────────────────────────────────────
// ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

type Action =
  | { type: "SET_DADOS_OBRA"; payload: Partial<DadosObra> }
  | { type: "ADD_COMODO"; payload: Omit<Comodo, "id"> }
  | { type: "REMOVE_COMODO"; payload: string }
  | { type: "UPDATE_COMODO"; payload: Comodo }
  | { type: "CLEAR_COMODOS" }
  | { type: "LOAD_EXEMPLO" }
  | { type: "SET_PARAMS"; payload: Partial<ParametrosCalculo> }
  | { type: "CALCULAR" }
  | { type: "RESET" };

// ─────────────────────────────────────────────────────────────────────────────
// REDUCER
// ─────────────────────────────────────────────────────────────────────────────

function gerarId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function criarComodo(dados: Omit<Comodo, "id">): Comodo {
  return {
    ...dados,
    id: gerarId(),
    area: parseFloat((dados.comprimento * dados.largura).toFixed(2)),
    perimetro: parseFloat((2 * (dados.comprimento + dados.largura)).toFixed(2)),
  };
}

const COMODOS_EXEMPLO: Omit<Comodo, "id">[] = [
  { nome: "Sala de Estar",    tipo: "Sala",            comprimento: 5.5, largura: 4.0, peDireito: 2.7, area: 22.0, perimetro: 19.0 },
  { nome: "Cozinha",          tipo: "Cozinha",          comprimento: 3.5, largura: 3.0, peDireito: 2.7, area: 10.5, perimetro: 13.0 },
  { nome: "Quarto 1 (Casal)", tipo: "Quarto",           comprimento: 4.0, largura: 3.5, peDireito: 2.7, area: 14.0, perimetro: 15.0 },
  { nome: "Quarto 2",         tipo: "Quarto",           comprimento: 3.5, largura: 3.0, peDireito: 2.7, area: 10.5, perimetro: 13.0 },
  { nome: "Quarto 3",         tipo: "Quarto",           comprimento: 3.0, largura: 2.8, peDireito: 2.7, area: 8.4,  perimetro: 11.6 },
  { nome: "Banheiro Social",  tipo: "Banheiro",         comprimento: 2.5, largura: 2.0, peDireito: 2.7, area: 5.0,  perimetro: 9.0  },
  { nome: "Banheiro Suíte",   tipo: "Banheiro",         comprimento: 2.0, largura: 1.8, peDireito: 2.7, area: 3.6,  perimetro: 7.6  },
  { nome: "Área de Serviço",  tipo: "Área de Serviço",  comprimento: 3.0, largura: 2.0, peDireito: 2.7, area: 6.0,  perimetro: 10.0 },
  { nome: "Garagem",          tipo: "Garagem",          comprimento: 5.5, largura: 3.0, peDireito: 2.7, area: 16.5, perimetro: 17.0 },
  { nome: "Hall / Corredor",  tipo: "Hall/Circulação",  comprimento: 4.0, largura: 1.2, peDireito: 2.7, area: 4.8,  perimetro: 10.4 },
];

function executarCalculo(state: AppState): Partial<AppState> {
  if (state.comodos.length === 0) return {};

  const resultados = calcularResultadosComodos(
    state.comodos.map((c) => ({
      nome: c.nome,
      tipo: c.tipo as TipoComodo,
      area: c.area,
      perimetro: c.perimetro,
    }))
  );

  const cargaTotal = resultados.reduce((s, r) => s + r.cargaTotalW, 0);
  const demanda = calcularDemandaTotal(
    cargaTotal,
    state.params.tensaoV,
    state.dadosObra.fases
  );

  const circuitos = calcularCircuitos(resultados, state.params.tensaoV, state.params);

  const materiais = gerarListaMateriais(
    state.comodos.map((c) => ({
      tipo: c.tipo as TipoComodo,
      area: c.area,
      perimetro: c.perimetro,
    })),
    circuitos,
    demanda
  );

  const alertas = validarSistema(
    cargaTotal,
    state.dadosObra.fases,
    state.dadosObra.tensao
  );

  return { resultados, demanda, circuitos, materiais, alertas, calculado: true };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_DADOS_OBRA":
      return {
        ...state,
        dadosObra: { ...state.dadosObra, ...action.payload },
      };

    case "ADD_COMODO":
      return {
        ...state,
        comodos: [...state.comodos, criarComodo(action.payload)],
        calculado: false,
      };

    case "REMOVE_COMODO":
      return {
        ...state,
        comodos: state.comodos.filter((c) => c.id !== action.payload),
        calculado: false,
      };

    case "UPDATE_COMODO": {
      const updated = {
        ...action.payload,
        area: parseFloat(
          (action.payload.comprimento * action.payload.largura).toFixed(2)
        ),
        perimetro: parseFloat(
          (2 * (action.payload.comprimento + action.payload.largura)).toFixed(2)
        ),
      };
      return {
        ...state,
        comodos: state.comodos.map((c) =>
          c.id === updated.id ? updated : c
        ),
        calculado: false,
      };
    }

    case "CLEAR_COMODOS":
      return {
        ...state,
        comodos: [],
        calculado: false,
        resultados: [],
        demanda: null,
        circuitos: [],
        materiais: [],
        alertas: [],
      };

    case "LOAD_EXEMPLO":
      return {
        ...state,
        comodos: COMODOS_EXEMPLO.map(criarComodo),
        calculado: false,
      };

    case "SET_PARAMS":
      return {
        ...state,
        params: { ...state.params, ...action.payload },
        calculado: false,
      };

    case "CALCULAR": {
      const resultado = executarCalculo(state);
      return { ...state, ...resultado };
    }

    case "RESET":
      return ESTADO_INICIAL;

    default:
      return state;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  setDadosObra: (dados: Partial<DadosObra>) => void;
  addComodo: (comodo: Omit<Comodo, "id">) => void;
  removeComodo: (id: string) => void;
  updateComodo: (comodo: Comodo) => void;
  clearComodos: () => void;
  loadExemplo: () => void;
  setParams: (params: Partial<ParametrosCalculo>) => void;
  calcular: () => void;
  reset: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, ESTADO_INICIAL);

  const setDadosObra = useCallback(
    (dados: Partial<DadosObra>) => dispatch({ type: "SET_DADOS_OBRA", payload: dados }),
    []
  );
  const addComodo = useCallback(
    (comodo: Omit<Comodo, "id">) => dispatch({ type: "ADD_COMODO", payload: comodo }),
    []
  );
  const removeComodo = useCallback(
    (id: string) => dispatch({ type: "REMOVE_COMODO", payload: id }),
    []
  );
  const updateComodo = useCallback(
    (comodo: Comodo) => dispatch({ type: "UPDATE_COMODO", payload: comodo }),
    []
  );
  const clearComodos = useCallback(() => dispatch({ type: "CLEAR_COMODOS" }), []);
  const loadExemplo = useCallback(() => dispatch({ type: "LOAD_EXEMPLO" }), []);
  const setParams = useCallback(
    (params: Partial<ParametrosCalculo>) => dispatch({ type: "SET_PARAMS", payload: params }),
    []
  );
  const calcular = useCallback(() => dispatch({ type: "CALCULAR" }), []);
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return (
    <AppContext.Provider
      value={{
        state,
        setDadosObra,
        addComodo,
        removeComodo,
        updateComodo,
        clearComodos,
        loadExemplo,
        setParams,
        calcular,
        reset,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp deve ser usado dentro de <AppProvider>");
  return ctx;
}
