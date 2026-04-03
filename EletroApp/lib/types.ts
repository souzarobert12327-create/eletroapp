// lib/types.ts
// Tipos centrais do EletroApp Residencial
// Todos os outros arquivos importam daqui — nunca o contrário

// ─────────────────────────────────────────────────────────────────────────────
// CÔMODO
// ─────────────────────────────────────────────────────────────────────────────

export type TipoComodo =
  | "Sala"
  | "Cozinha"
  | "Quarto"
  | "Banheiro"
  | "Área de Serviço"
  | "Garagem"
  | "Hall/Circulação"
  | "Escritório"
  | "Varanda"
  | "Despensa";

export interface Comodo {
  id: string;            // uuid gerado no frontend
  nome: string;          // nome exibido ao usuário
  tipo: TipoComodo;
  comprimento: number;   // metros
  largura: number;       // metros
  peDireito: number;     // metros (default 2.70)
  area: number;          // m² = comprimento × largura
  perimetro: number;     // metros = 2 × (comp + larg)
}

// ─────────────────────────────────────────────────────────────────────────────
// ILUMINAÇÃO
// ─────────────────────────────────────────────────────────────────────────────

export interface ResultadoIluminacao {
  luxRequerido: number;
  numLampadas: number;
  numInterruptores: number;
  tipoLuminario: string;
  potenciaLampadaW: number;
  fluxoPorLampadaLm: number;
  potenciaTotalW: number;
  formula: string;        // texto da fórmula resolvida — memorial de cálculo
}

// ─────────────────────────────────────────────────────────────────────────────
// TOMADAS
// ─────────────────────────────────────────────────────────────────────────────

export interface ResultadoTomadas {
  numTomadas: number;
  numTug: number;
  numTue: number;
  tueEquipamentos: string[];
  alturaInstalacaoM: number;
  perimetroUsadoM: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// CARGA POR CÔMODO
// ─────────────────────────────────────────────────────────────────────────────

export interface CargaComodo {
  cargaIluminacaoW: number;
  cargaTugW: number;
  cargaTueW: number;
  cargaTotalW: number;
  numLampadas: number;
  numTug: number;
  numTue: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// RESULTADO POR CÔMODO (tabela exibida na interface)
// ─────────────────────────────────────────────────────────────────────────────

export interface ResultadoComodo {
  comodo: string;
  tipo: TipoComodo;
  areaM2: number;
  luxRequerido: number;
  luminario: string;
  numLampadas: number;
  potenciaIlumW: number;
  numTomadas: number;
  cargaIlumW: number;
  cargaTugW: number;
  cargaTueW: number;
  cargaTotalW: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// DEMANDA TOTAL
// ─────────────────────────────────────────────────────────────────────────────

export interface Demanda {
  cargaInstaladaW: number;
  demandaW: number;
  correnteA: number;
  disjuntorGeralA: number;
  bitolaEntradaMm2: number;
  izEntradaA: number;
  condutorEntrada: string;
  fases: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONDUTOR DIMENSIONADO
// ─────────────────────────────────────────────────────────────────────────────

export interface Condutor {
  bitolaMm2: number;
  neutroMm2: number;
  peMm2: number;
  correnteAdmissívelA: number;
  correnteProjetoA: number;
  correnteCorrigidaA: number;
  fatorTemp: number;
  fatorAgrupamento: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// QUEDA DE TENSÃO
// ─────────────────────────────────────────────────────────────────────────────

export interface QuedaTensao {
  deltaVV: number;
  deltaVPercent: number;
  aprovado: boolean;
  limitePercent: number;
  tensaoFinalV: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// CIRCUITO
// ─────────────────────────────────────────────────────────────────────────────

export type TipoCircuito = "Iluminação" | "TUG" | "TUE";

export interface Circuito {
  circ: string;             // "C01", "C02" ...
  tipo: TipoCircuito;
  descricao: string;
  cargaW: number;
  correnteA: number;
  bitolaMm2: string;        // "2.5mm²"
  condutor: string;         // "2×2,5mm² + 2,5mm²(PE)"
  disjuntorA: number;
  dr: string;               // "30mA"
  deltaVPercent: number;
  situacao: "✅ OK" | "⚠️ REVISAR";
}

// ─────────────────────────────────────────────────────────────────────────────
// MATERIAL
// ─────────────────────────────────────────────────────────────────────────────

export type UnidadeMaterial = "m" | "un" | "rl" | "pct";

export interface Material {
  item: string;
  descricao: string;
  unidade: UnidadeMaterial;
  quantidade: number;
  especificacao: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// DADOS DA OBRA
// ─────────────────────────────────────────────────────────────────────────────

export type SistemaEletrico =
  | "Monofásico (1F+N)"
  | "Bifásico (2F+N)"
  | "Trifásico (3F+N)";

export type TensaoAlimentacao = "127/220V" | "220/380V";

export interface DadosObra {
  proprietario: string;
  endereco: string;
  responsavel: string;
  crea: string;
  art: string;
  data: string;
  tensao: TensaoAlimentacao;
  fases: SistemaEletrico;
  concessionaria: string;
  norma: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// RESULTADO COMPLETO DO PROJETO (estado global da aplicação)
// ─────────────────────────────────────────────────────────────────────────────

export interface ProjetoEletrico {
  dadosObra: DadosObra;
  comodos: Comodo[];
  resultados: ResultadoComodo[];
  demanda: Demanda;
  circuitos: Circuito[];
  materiais: Material[];
  alertas: string[];
  calculado: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// PARÂMETROS DE CÁLCULO (configurações do usuário)
// ─────────────────────────────────────────────────────────────────────────────

export interface ParametrosCalculo {
  tensaoV: 127 | 220 | 380;
  fatorPotencia: number;       // 0.70 – 1.00
  quedaMaxPercent: number;     // padrão 4.0
  tempAmbiente: number;        // °C: 25/30/35/40/45/50
  tipoInstalacao: "Eletroduto embutido" | "Eletroduto aparente" | "Cabo em bandeja";
  numCircuitosAgrupados: number; // 1–9
}

// Valores padrão exportados para uso na interface
export const PARAMETROS_PADRAO: ParametrosCalculo = {
  tensaoV: 220,
  fatorPotencia: 0.92,
  quedaMaxPercent: 4.0,
  tempAmbiente: 35,
  tipoInstalacao: "Eletroduto embutido",
  numCircuitosAgrupados: 1,
};
