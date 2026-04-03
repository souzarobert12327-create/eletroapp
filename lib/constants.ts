// lib/constants.ts
// Tabelas normativas NBR 5410:2005 / NBR ISO/CIE 8995-1:2013 / Cemig ND-5.5
// Importado apenas por calculations.ts — nunca diretamente pelos componentes

import type { TipoComodo, TensaoAlimentacao } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// LUMINÁRIOS REAIS (dados de catálogo 2024/2025)
// Philips, Osram, Ledvance — eficiência 68–80 lm/W
// ─────────────────────────────────────────────────────────────────────────────

export interface DadosLuminario {
  tipo: string;
  potW: number;
  fluxoLm: number;
}

export const LUMINARIOS: Record<TipoComodo, DadosLuminario> = {
  Sala:              { tipo: "Plafon LED 25W", potW: 25, fluxoLm: 1700 },
  Cozinha:           { tipo: "Plafon LED 36W", potW: 36, fluxoLm: 2500 },
  Banheiro:          { tipo: "Plafon LED 18W", potW: 18, fluxoLm: 1200 },
  Quarto:            { tipo: "Plafon LED 25W", potW: 25, fluxoLm: 1700 },
  "Área de Serviço": { tipo: "Plafon LED 18W", potW: 18, fluxoLm: 1200 },
  Garagem:           { tipo: "Plafon LED 25W", potW: 25, fluxoLm: 1700 },
  "Hall/Circulação": { tipo: "Plafon LED 18W", potW: 18, fluxoLm: 1200 },
  Escritório:        { tipo: "Plafon LED 36W", potW: 36, fluxoLm: 2500 },
  Varanda:           { tipo: "Plafon LED 18W", potW: 18, fluxoLm: 1200 },
  Despensa:          { tipo: "Bulbo LED 9W",   potW:  9, fluxoLm:  800 },
};

// ─────────────────────────────────────────────────────────────────────────────
// ILUMINÂNCIAS DE REFERÊNCIA (lux)
// Fonte: NBR ISO/CIE 8995-1:2013 + NBR 5413:1992 (ainda referenciada)
// ─────────────────────────────────────────────────────────────────────────────

export interface NivelIluminancia {
  min: number;
  med: number;
  max: number;
}

export const ILUMINANCIA_COMODO: Record<TipoComodo, NivelIluminancia> = {
  Sala:              { min: 100, med: 150, max: 300 },
  Cozinha:           { min: 200, med: 300, max: 500 },
  Banheiro:          { min: 100, med: 150, max: 300 },
  Quarto:            { min:  50, med: 150, max: 300 },
  "Área de Serviço": { min: 100, med: 150, max: 200 },
  Garagem:           { min:  50, med:  75, max: 150 },
  "Hall/Circulação": { min: 100, med: 150, max: 200 },
  Escritório:        { min: 300, med: 500, max: 750 },
  Varanda:           { min:  50, med: 100, max: 150 },
  Despensa:          { min:  50, med: 100, max: 150 },
};

// ─────────────────────────────────────────────────────────────────────────────
// TOMADAS — NBR 5410:2005 Seção 9.4
// tugPor5m: true = 1 TUG a cada 5m de perímetro (NBR 9.4.1.1)
// ─────────────────────────────────────────────────────────────────────────────

export interface ConfigTomadas {
  tugMinimo: number;
  tugPor5m: boolean;
  tue: string[];
  alturaM: number;
}

export const TOMADAS_COMODO: Record<TipoComodo, ConfigTomadas> = {
  Sala: {
    tugMinimo: 2, tugPor5m: true,
    tue: [],
    alturaM: 0.30,
  },
  Cozinha: {
    tugMinimo: 2, tugPor5m: true,
    tue: ["Geladeira 200W", "Micro-ondas 1000W", "Fogão Elétrico 6000W"],
    alturaM: 1.10,
  },
  Banheiro: {
    tugMinimo: 1, tugPor5m: false,
    tue: ["Aquecedor Elétrico 3500W"],
    alturaM: 1.20,
  },
  Quarto: {
    tugMinimo: 2, tugPor5m: true,
    tue: ["Ar-condicionado 1800W"],
    alturaM: 0.30,
  },
  "Área de Serviço": {
    tugMinimo: 2, tugPor5m: true,
    tue: ["Máquina Lavar 2000W", "Ferro de Passar 1000W"],
    alturaM: 1.20,
  },
  Garagem: {
    tugMinimo: 1, tugPor5m: false,
    tue: [],
    alturaM: 1.20,
  },
  "Hall/Circulação": {
    tugMinimo: 1, tugPor5m: false,
    tue: [],
    alturaM: 0.30,
  },
  Escritório: {
    tugMinimo: 3, tugPor5m: true,
    tue: ["Computador 300W"],
    alturaM: 0.30,
  },
  Varanda: {
    tugMinimo: 1, tugPor5m: false,
    tue: [],
    alturaM: 0.30,
  },
  Despensa: {
    tugMinimo: 1, tugPor5m: false,
    tue: [],
    alturaM: 0.30,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// POTÊNCIAS E FATORES DE POTÊNCIA DOS EQUIPAMENTOS TUE
// ─────────────────────────────────────────────────────────────────────────────

export const POTENCIAS_TUE: Record<string, number> = {
  "Geladeira 200W":           200,
  "Micro-ondas 1000W":       1000,
  "Fogão Elétrico 6000W":    6000,
  "Aquecedor Elétrico 3500W": 3500,
  "Máquina Lavar 2000W":     2000,
  "Ar-condicionado 1800W":   1800,
  "Ferro de Passar 1000W":   1000,
  "Computador 300W":          300,
  "Chuveiro Elétrico 5500W": 5500,
};

// Resistivos (aquecimento Joule): FP = 1,0
// Indutivos / eletrônicos: FP = 0,92
export const FP_TUE: Record<string, number> = {
  "Geladeira 200W":           0.92,
  "Micro-ondas 1000W":        0.92,
  "Fogão Elétrico 6000W":     1.00,
  "Aquecedor Elétrico 3500W": 1.00,
  "Máquina Lavar 2000W":      0.92,
  "Ar-condicionado 1800W":    0.92,
  "Ferro de Passar 1000W":    1.00,
  "Computador 300W":          0.92,
  "Chuveiro Elétrico 5500W":  1.00,
};

// Carga mínima por ponto TUG — NBR 5410:2005 item 4.2.2.1
export const CARGA_TUG_W = 100;

// ─────────────────────────────────────────────────────────────────────────────
// FATORES DE DEMANDA — Cemig ND-5.5
// Tupla: [capacidade_da_faixa_W, fator_demanda]
// Cada faixa consome até 'capacidade' W da carga restante
// ─────────────────────────────────────────────────────────────────────────────

export const FATORES_DEMANDA_CEMIG: [number, number][] = [
  [1000, 1.00],
  [1000, 0.80],
  [1000, 0.70],
  [1000, 0.65],
  [1000, 0.60],
  [1000, 0.55],
  [1000, 0.50],
  [1000, 0.48],
  [1000, 0.46],
  [1000, 0.44],
  [99999, 0.40],
];

// ─────────────────────────────────────────────────────────────────────────────
// CONDUTORES — NBR 5410:2005 Tabela 36 (B1: embutido) e 38 (C: aparente)
// Temperatura de referência 30°C. Resistência: cobre, 20°C.
// ─────────────────────────────────────────────────────────────────────────────

export interface DadosBitola {
  iEmbutido: number;   // A — corrente admissível em eletroduto embutido
  iAparente: number;   // A — corrente admissível em eletroduto aparente
  rOhmKm: number;      // Ω/km — resistência do condutor
  precoM: number;      // R$/m — referência de preço
}

export const BITOLAS_DISPONIVEIS: Record<number, DadosBitola> = {
  1.5:  { iEmbutido: 15.5, iAparente:  19.5, rOhmKm: 12.10, precoM: 2.80 },
  2.5:  { iEmbutido: 21.0, iAparente:  27.0, rOhmKm:  7.41, precoM: 4.50 },
  4.0:  { iEmbutido: 28.0, iAparente:  36.0, rOhmKm:  4.61, precoM: 7.00 },
  6.0:  { iEmbutido: 36.0, iAparente:  46.0, rOhmKm:  3.08, precoM: 10.00 },
  10.0: { iEmbutido: 50.0, iAparente:  65.0, rOhmKm:  1.83, precoM: 16.00 },
  16.0: { iEmbutido: 66.0, iAparente:  87.0, rOhmKm:  1.15, precoM: 24.00 },
  25.0: { iEmbutido: 84.0, iAparente: 114.0, rOhmKm:  0.727,precoM: 38.00 },
  35.0: { iEmbutido:101.0, iAparente: 135.0, rOhmKm:  0.524,precoM: 52.00 },
  50.0: { iEmbutido:122.0, iAparente: 163.0, rOhmKm:  0.387,precoM: 70.00 },
  70.0: { iEmbutido:151.0, iAparente: 203.0, rOhmKm:  0.268,precoM: 98.00 },
};

// Bitolas ordenadas — usadas nas funções de dimensionamento
export const BITOLAS_ORDENADAS: number[] = Object.keys(BITOLAS_DISPONIVEIS)
  .map(Number)
  .sort((a, b) => a - b);

// ─────────────────────────────────────────────────────────────────────────────
// FATOR DE TEMPERATURA — NBR 5410:2005 Tabela 40 (isolação PVC)
// ─────────────────────────────────────────────────────────────────────────────

export const FATORES_TEMP: Record<number, number> = {
  25: 1.04,
  30: 1.00,
  35: 0.96,
  40: 0.91,
  45: 0.87,
  50: 0.82,
};

// ─────────────────────────────────────────────────────────────────────────────
// FATOR DE AGRUPAMENTO — NBR 5410:2005 Tabela 43
// ─────────────────────────────────────────────────────────────────────────────

export const FATORES_AGRUPAMENTO: Record<number, number> = {
  1: 1.00,
  2: 0.80,
  3: 0.70,
  4: 0.65,
  5: 0.60,
  6: 0.57,
  7: 0.54,
  8: 0.52,
  9: 0.50,
};

// ─────────────────────────────────────────────────────────────────────────────
// DISJUNTORES PADRONIZADOS — Curva C residencial
// ─────────────────────────────────────────────────────────────────────────────

export const DISJUNTORES_DISPONIVEIS: number[] = [
  6, 10, 16, 20, 25, 32, 40, 50, 63, 70, 80, 100, 125, 160, 200,
];

// ─────────────────────────────────────────────────────────────────────────────
// LIMITES DE FORNECIMENTO CEMIG — ND-5.5
// ─────────────────────────────────────────────────────────────────────────────

export const LIMITES_CEMIG: Record<string, number> = {
  Monofásico: 23000,
  Bifásico:   40000,
  Trifásico:  99999,
};

// ─────────────────────────────────────────────────────────────────────────────
// LISTA DE CÔMODOS DISPONÍVEIS (para select na interface)
// ─────────────────────────────────────────────────────────────────────────────

export const TIPOS_COMODO: TipoComodo[] = [
  "Sala",
  "Cozinha",
  "Quarto",
  "Banheiro",
  "Área de Serviço",
  "Garagem",
  "Hall/Circulação",
  "Escritório",
  "Varanda",
  "Despensa",
];

// ─────────────────────────────────────────────────────────────────────────────
// CORES DE FUNDO POR TIPO DE CÔMODO (para a planta elétrica)
// ─────────────────────────────────────────────────────────────────────────────

export const COR_COMODO: Record<TipoComodo, string> = {
  Sala:              "#E3F2FD",
  Cozinha:           "#FFF8E1",
  Banheiro:          "#E0F7FA",
  Quarto:            "#F3E5F5",
  "Área de Serviço": "#E8EAF6",
  Garagem:           "#EFEBE9",
  "Hall/Circulação": "#E8F5E9",
  Escritório:        "#FBE9E7",
  Varanda:           "#E0F2F1",
  Despensa:          "#FAFAFA",
};
