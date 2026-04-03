// lib/calculations.ts
// Motor de cálculo elétrico — NBR 5410:2005 / NBR ISO/CIE 8995-1 / Cemig ND-5.5
// Portado do Python validado (calculations.py v2.2) para TypeScript
// Zero dependências externas — matemática pura

import type {
  TipoComodo,
  ResultadoIluminacao,
  ResultadoTomadas,
  CargaComodo,
  Demanda,
  Condutor,
  QuedaTensao,
  Circuito,
  ResultadoComodo,
  Material,
  UnidadeMaterial,
  ParametrosCalculo,
} from "./types";

import {
  LUMINARIOS,
  ILUMINANCIA_COMODO,
  TOMADAS_COMODO,
  POTENCIAS_TUE,
  FP_TUE,
  CARGA_TUG_W,
  FATORES_DEMANDA_CEMIG,
  BITOLAS_DISPONIVEIS,
  BITOLAS_ORDENADAS,
  FATORES_TEMP,
  FATORES_AGRUPAMENTO,
  DISJUNTORES_DISPONIVEIS,
  LIMITES_CEMIG,
} from "./constants";

// ═════════════════════════════════════════════════════════════════════════════
// HELPERS INTERNOS
// ═════════════════════════════════════════════════════════════════════════════

/** Arredonda para N casas decimais */
function round(n: number, decimais = 2): number {
  return Math.round(n * 10 ** decimais) / 10 ** decimais;
}

/** Próximo disjuntor padronizado ≥ corrente */
function proximoDisjuntor(correnteA: number): number {
  const found = DISJUNTORES_DISPONIVEIS.find((d) => d >= correnteA);
  return found ?? DISJUNTORES_DISPONIVEIS[DISJUNTORES_DISPONIVEIS.length - 1];
}

/**
 * Condutor de proteção (PE) — NBR 5410:2005 Tabela 54
 *   fase ≤ 16mm²  → PE = fase
 *   fase 25–35mm² → PE = 16mm²
 *   fase > 35mm²  → PE = fase / 2
 */
function calcularPE(bitolaMm2: number): number {
  if (bitolaMm2 <= 16) return bitolaMm2;
  if (bitolaMm2 <= 35) return 16;
  return bitolaMm2 / 2;
}

/** Fator de temperatura (fallback: valor mais próximo) */
function fatorTemp(tempAmbiente: number): number {
  const chave = [25, 30, 35, 40, 45, 50].reduce((prev, curr) =>
    Math.abs(curr - tempAmbiente) < Math.abs(prev - tempAmbiente) ? curr : prev
  );
  return FATORES_TEMP[chave] ?? 0.96;
}

/** Fator de agrupamento (clampado em 9) */
function fatorAgrupamento(n: number): number {
  const chave = Math.min(Math.max(1, Math.round(n)), 9);
  return FATORES_AGRUPAMENTO[chave] ?? 0.50;
}

// ═════════════════════════════════════════════════════════════════════════════
// 1. ILUMINAÇÃO — NBR ISO/CIE 8995-1:2013 / NBR 5410:2005 Seção 9.3
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Método dos Lúmens:  N = (E × A) / (Φ × FU × FM)
 *
 * E  = Iluminância requerida [lux] — valor médio da tabela
 * A  = Área do cômodo [m²]
 * Φ  = Fluxo luminoso real do luminário [lm] — catálogo
 * FU = 0,65 (fator de utilização)
 * FM = 0,80 (fator de manutenção — limpeza semestral)
 */
export function calcularIluminacao(
  tipo: TipoComodo,
  areaM2: number
): ResultadoIluminacao {
  const lux = ILUMINANCIA_COMODO[tipo];
  const lum = LUMINARIOS[tipo];

  const FU = 0.65;
  const FM = 0.80;

  const luxRequerido = lux.med;
  const fluxoLm = lum.fluxoLm;
  const potenciaW = lum.potW;

  // N = ⌈(E × A) / (Φ × FU × FM)⌉
  const numLampadas = Math.max(
    1,
    Math.ceil((luxRequerido * areaM2) / (fluxoLm * FU * FM))
  );

  const potenciaTotalW = numLampadas * potenciaW;

  // Interruptores — NBR 5410:2005 item 9.3.2
  // Área > 10m² com ≥ 2 lâmpadas → interruptor paralelo (2 pontos)
  const numInterruptores = areaM2 > 10 && numLampadas >= 2 ? 2 : 1;

  return {
    luxRequerido,
    numLampadas,
    numInterruptores,
    tipoLuminario: lum.tipo,
    potenciaLampadaW: potenciaW,
    fluxoPorLampadaLm: fluxoLm,
    potenciaTotalW,
    formula: `N = (${luxRequerido} × ${areaM2}) / (${fluxoLm} × ${FU} × ${FM}) = ${numLampadas}`,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. TOMADAS — NBR 5410:2005 Seção 9.4
// ═════════════════════════════════════════════════════════════════════════════

/**
 * TUG: 1 ponto a cada 5m de PERÍMETRO (NBR 9.4.1.1), mínimo 2 por cômodo
 * TUE: circuito exclusivo por equipamento de grande potência (NBR 9.4.2)
 *
 * Se perímetro não informado, estima √A × 4 (cômodo quadrado equivalente)
 */
export function calcularTomadas(
  tipo: TipoComodo,
  areaM2: number,
  perimetroM?: number
): ResultadoTomadas {
  const config = TOMADAS_COMODO[tipo];

  // Estimativa conservadora se perímetro não fornecido
  const perim = perimetroM && perimetroM > 0
    ? perimetroM
    : round(4 * Math.sqrt(areaM2), 2);

  let numTug: number;
  if (config.tugPor5m) {
    const tugPorPerim = Math.ceil(perim / 5);
    numTug = Math.max(config.tugMinimo, tugPorPerim);
  } else {
    numTug = config.tugMinimo;
  }

  const numTue = config.tue.length;

  return {
    numTomadas: numTug,
    numTug,
    numTue,
    tueEquipamentos: config.tue,
    alturaInstalacaoM: config.alturaM,
    perimetroUsadoM: perim,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. CARGA POR CÔMODO — NBR 5410:2005 item 4.2 / Cemig ND-5.5
// ═════════════════════════════════════════════════════════════════════════════

export function calcularCargaComodo(
  tipo: TipoComodo,
  areaM2: number,
  perimetroM?: number
): CargaComodo {
  const il = calcularIluminacao(tipo, areaM2);
  const tom = calcularTomadas(tipo, areaM2, perimetroM);

  const cargaIluminacaoW = il.potenciaTotalW;
  const cargaTugW = tom.numTug * CARGA_TUG_W;
  const cargaTueW = tom.tueEquipamentos.reduce(
    (acc, eq) => acc + (POTENCIAS_TUE[eq] ?? 500),
    0
  );
  const cargaTotalW = cargaIluminacaoW + cargaTugW + cargaTueW;

  return {
    cargaIluminacaoW,
    cargaTugW,
    cargaTueW,
    cargaTotalW,
    numLampadas: il.numLampadas,
    numTug: tom.numTug,
    numTue: tom.numTue,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 4. DEMANDA TOTAL — Cemig ND-5.5
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Aplica fatores de demanda por faixas (Cemig ND-5.5).
 * Garante Iz_entrada ≥ In_DG (NBR 5410 item 6.2.6).
 */
export function calcularDemandaTotal(
  cargaInstaladaW: number,
  tensaoV: number,
  fases: string
): Demanda {
  // Fatores de demanda por faixas
  let demandaW = 0;
  let restante = cargaInstaladaW;
  for (const [capacidade, fd] of FATORES_DEMANDA_CEMIG) {
    if (restante <= 0) break;
    const consumido = Math.min(restante, capacidade);
    demandaW += consumido * fd;
    restante -= consumido;
  }

  // Corrente de demanda
  const FP = 0.92;
  const correnteA =
    fases.includes("Trifásico") || fases.includes("3F")
      ? demandaW / (tensaoV * Math.sqrt(3) * FP)
      : demandaW / (tensaoV * FP);

  // Disjuntor geral
  const disjuntorGeralA = proximoDisjuntor(correnteA * 1.25);

  // Bitola de entrada — garante Iz ≥ In_DG
  const condDem = dimensionarCondutor(correnteA, "Eletroduto embutido", 35, 1);
  let bitolaEntrada = condDem.bitolaMm2;

  while (
    (BITOLAS_DISPONIVEIS[bitolaEntrada]?.iEmbutido ?? 0) < disjuntorGeralA
  ) {
    const idx = BITOLAS_ORDENADAS.indexOf(bitolaEntrada);
    if (idx < 0 || idx >= BITOLAS_ORDENADAS.length - 1) break;
    bitolaEntrada = BITOLAS_ORDENADAS[idx + 1];
  }

  const izFinal = BITOLAS_DISPONIVEIS[bitolaEntrada]?.iEmbutido ?? 0;
  const peMm2 = calcularPE(bitolaEntrada);

  // Formata bitola com vírgula (padrão brasileiro): 25.0 → 25,0
  const bitolaFmt = String(bitolaEntrada).replace(".", ",");
  const descCond =
    fases.includes("Trifásico") || fases.includes("3F")
      ? `3×${bitolaFmt}mm² + ${peMm2}mm²(PE)`
      : `2×${bitolaFmt}mm² + ${peMm2}mm²(PE)`;

  return {
    cargaInstaladaW: round(cargaInstaladaW, 1),
    demandaW: round(demandaW, 1),
    correnteA: round(correnteA, 2),
    disjuntorGeralA,
    bitolaEntradaMm2: bitolaEntrada,
    izEntradaA: izFinal,
    condutorEntrada: descCond,
    fases,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 5. CONDUTOR — NBR 5410:2005 Seção 6.2
// ═════════════════════════════════════════════════════════════════════════════

export function dimensionarCondutor(
  correnteProjetoA: number,
  tipoInstalacao: string,
  tempAmbiente: number,
  numCircuitosAgrupados: number
): Condutor {
  const FT = fatorTemp(tempAmbiente);
  const FA = fatorAgrupamento(numCircuitosAgrupados);
  const correnteCorrigida = correnteProjetoA / (FT * FA);

  const chave = tipoInstalacao.toLowerCase().includes("embutido")
    ? "iEmbutido"
    : "iAparente";

  const bitolaSelecionada = BITOLAS_ORDENADAS.find(
    (b) => (BITOLAS_DISPONIVEIS[b]?.[chave] ?? 0) >= correnteCorrigida
  ) ?? BITOLAS_ORDENADAS[BITOLAS_ORDENADAS.length - 1];

  const dados = BITOLAS_DISPONIVEIS[bitolaSelecionada];

  return {
    bitolaMm2: bitolaSelecionada,
    neutroMm2: bitolaSelecionada,
    peMm2: calcularPE(bitolaSelecionada),
    correnteAdmissívelA: dados?.[chave] ?? 0,
    correnteProjetoA: round(correnteProjetoA, 2),
    correnteCorrigidaA: round(correnteCorrigida, 2),
    fatorTemp: FT,
    fatorAgrupamento: FA,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 6. QUEDA DE TENSÃO — NBR 5410:2005 Seção 6.3
// ═════════════════════════════════════════════════════════════════════════════

/**
 * ΔV = 2 × L × I × R × cosφ   [V]
 * ΔV% = (ΔV / Vn) × 100
 * Limite: ΔV ≤ 4% (circuitos terminais)
 */
export function calcularQuedaTensao(
  correnteA: number,
  comprimentoM: number,
  bitolaMm2: number,
  tensaoV: number,
  fatorPotencia = 0.92
): QuedaTensao {
  const dados = BITOLAS_DISPONIVEIS[bitolaMm2] ?? BITOLAS_DISPONIVEIS[2.5];
  const rOhmM = dados.rOhmKm / 1000;

  const deltaV = 2 * comprimentoM * correnteA * rOhmM * fatorPotencia;
  const deltaVPercent = (deltaV / tensaoV) * 100;

  return {
    deltaVV: round(deltaV, 3),
    deltaVPercent: round(deltaVPercent, 2),
    aprovado: deltaVPercent <= 4.0,
    limitePercent: 4.0,
    tensaoFinalV: round(tensaoV - deltaV, 2),
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 7. CIRCUITOS — NBR 5410:2005 Seção 6 / Cemig ND-5.5
// ═════════════════════════════════════════════════════════════════════════════

const COMP_REF_M = 15; // comprimento médio estimado por circuito

function formatarCondutor(bitola: number): string {
  const pe = calcularPE(bitola);
  const bitolaFmt = String(bitola).replace(".", ",");
  const peFmt = String(pe).replace(".", ",");
  return `2×${bitolaFmt}mm² + ${peFmt}mm²(PE)`;
}

function montarCircuitoIluminacao(
  num: number,
  comodos: string[],
  cargaW: number,
  tensaoV: number,
  params: ParametrosCalculo
): Circuito {
  const correnteA = cargaW / (tensaoV * 0.92);
  const cond = dimensionarCondutor(
    correnteA, params.tipoInstalacao, params.tempAmbiente,
    params.numCircuitosAgrupados
  );
  const bitola = Math.max(1.5, cond.bitolaMm2);
  const disj = Math.min(proximoDisjuntor(correnteA * 1.25), 16);
  const qv = calcularQuedaTensao(correnteA, COMP_REF_M, bitola, tensaoV);
  const desc = comodos.slice(0, 3).join(", ") + (comodos.length > 3 ? "…" : "");

  return {
    circ: `C${String(num).padStart(2, "0")}`,
    tipo: "Iluminação",
    descricao: desc,
    cargaW,
    correnteA: round(correnteA, 2),
    bitolaMm2: `${bitola}mm²`,
    condutor: formatarCondutor(bitola),
    disjuntorA: disj,
    dr: "30mA",
    deltaVPercent: qv.deltaVPercent,
    situacao: qv.aprovado ? "✅ OK" : "⚠️ REVISAR",
  };
}

function montarCircuitoTug(
  num: number,
  comodos: string[],
  cargaW: number,
  tensaoV: number,
  params: ParametrosCalculo
): Circuito {
  const correnteA = cargaW / (tensaoV * 0.92);
  const cond = dimensionarCondutor(
    correnteA, params.tipoInstalacao, params.tempAmbiente,
    params.numCircuitosAgrupados
  );
  const bitola = Math.max(2.5, cond.bitolaMm2);
  const disj = Math.min(proximoDisjuntor(correnteA * 1.25), 20);
  const qv = calcularQuedaTensao(correnteA, COMP_REF_M, bitola, tensaoV);
  const desc = comodos.slice(0, 3).join(", ") + (comodos.length > 3 ? "…" : "");

  return {
    circ: `C${String(num).padStart(2, "0")}`,
    tipo: "TUG",
    descricao: desc,
    cargaW,
    correnteA: round(correnteA, 2),
    bitolaMm2: `${bitola}mm²`,
    condutor: formatarCondutor(bitola),
    disjuntorA: disj,
    dr: "30mA",
    deltaVPercent: qv.deltaVPercent,
    situacao: qv.aprovado ? "✅ OK" : "⚠️ REVISAR",
  };
}

export function calcularCircuitos(
  resultados: ResultadoComodo[],
  tensaoV: number,
  params: ParametrosCalculo
): Circuito[] {
  const circuitos: Circuito[] = [];
  let numC = 1;

  // ── Iluminação (máx. 1000W por circuito — Cemig ND-5.5) ─────────────────
  let cargaIlum = 0;
  let comodosIlum: string[] = [];

  for (const r of resultados) {
    if (cargaIlum + r.cargaIlumW > 1000 && comodosIlum.length > 0) {
      circuitos.push(montarCircuitoIluminacao(numC++, comodosIlum, cargaIlum, tensaoV, params));
      cargaIlum = 0;
      comodosIlum = [];
    }
    cargaIlum += r.cargaIlumW;
    comodosIlum.push(r.comodo);
  }
  if (comodosIlum.length > 0) {
    circuitos.push(montarCircuitoIluminacao(numC++, comodosIlum, cargaIlum, tensaoV, params));
  }

  // ── TUG (máx. 1500W por circuito — Cemig ND-5.5) ────────────────────────
  let cargaTug = 0;
  let comodosTug: string[] = [];

  for (const r of resultados) {
    if (cargaTug + r.cargaTugW > 1500 && comodosTug.length > 0) {
      circuitos.push(montarCircuitoTug(numC++, comodosTug, cargaTug, tensaoV, params));
      cargaTug = 0;
      comodosTug = [];
    }
    cargaTug += r.cargaTugW;
    comodosTug.push(r.comodo);
  }
  if (comodosTug.length > 0) {
    circuitos.push(montarCircuitoTug(numC++, comodosTug, cargaTug, tensaoV, params));
  }

  // ── TUE individuais ──────────────────────────────────────────────────────
  const equipamentosPresentes = new Map<string, number>();
  for (const r of resultados) {
    const config = TOMADAS_COMODO[r.tipo as TipoComodo];
    if (config) {
      for (const eq of config.tue) {
        if (!equipamentosPresentes.has(eq)) {
          equipamentosPresentes.set(eq, POTENCIAS_TUE[eq] ?? 500);
        }
      }
    }
  }

  for (const [eqNome, potW] of [...equipamentosPresentes.entries()].sort()) {
    const fp = FP_TUE[eqNome] ?? 0.92;
    const correnteA = potW / (tensaoV * fp);
    const cond = dimensionarCondutor(
      correnteA, params.tipoInstalacao, params.tempAmbiente,
      params.numCircuitosAgrupados
    );
    const bitola = Math.max(2.5, cond.bitolaMm2);
    const disj = proximoDisjuntor(correnteA * 1.25);
    const qv = calcularQuedaTensao(correnteA, COMP_REF_M, bitola, tensaoV);

    circuitos.push({
      circ: `C${String(numC++).padStart(2, "0")}`,
      tipo: "TUE",
      descricao: eqNome,
      cargaW: potW,
      correnteA: round(correnteA, 2),
      bitolaMm2: `${bitola}mm²`,
      condutor: formatarCondutor(bitola),
      disjuntorA: disj,
      dr: "30mA",
      deltaVPercent: qv.deltaVPercent,
      situacao: qv.aprovado ? "✅ OK" : "⚠️ REVISAR",
    });
  }

  // ── Chuveiro elétrico (obrigatório — NBR 5410 9.4.2) ────────────────────
  const potCh = 5500;
  const corrCh = potCh / tensaoV;      // resistivo: FP = 1,0
  const condCh = dimensionarCondutor(corrCh, params.tipoInstalacao, params.tempAmbiente, 1);
  const bitolaCh = Math.max(4.0, condCh.bitolaMm2);
  const qvCh = calcularQuedaTensao(corrCh, COMP_REF_M, bitolaCh, tensaoV, 1.0);

  circuitos.push({
    circ: `C${String(numC).padStart(2, "0")}`,
    tipo: "TUE",
    descricao: "Chuveiro Elétrico 5500W",
    cargaW: potCh,
    correnteA: round(corrCh, 2),
    bitolaMm2: `${bitolaCh}mm²`,
    condutor: formatarCondutor(bitolaCh),
    disjuntorA: proximoDisjuntor(corrCh * 1.25),
    dr: "30mA",
    deltaVPercent: qvCh.deltaVPercent,
    situacao: qvCh.aprovado ? "✅ OK" : "⚠️ REVISAR",
  });

  return circuitos;
}

// ═════════════════════════════════════════════════════════════════════════════
// 8. RESULTADOS POR CÔMODO (tabela da interface)
// ═════════════════════════════════════════════════════════════════════════════

export function calcularResultadosComodos(
  comodos: Array<{
    nome: string;
    tipo: TipoComodo;
    area: number;
    perimetro?: number;
  }>
): ResultadoComodo[] {
  return comodos.map((c) => {
    const il = calcularIluminacao(c.tipo, c.area);
    const tom = calcularTomadas(c.tipo, c.area, c.perimetro);
    const carga = calcularCargaComodo(c.tipo, c.area, c.perimetro);

    return {
      comodo: c.nome,
      tipo: c.tipo,
      areaM2: c.area,
      luxRequerido: il.luxRequerido,
      luminario: il.tipoLuminario,
      numLampadas: il.numLampadas,
      potenciaIlumW: il.potenciaTotalW,
      numTomadas: tom.numTug,
      cargaIlumW: carga.cargaIluminacaoW,
      cargaTugW: carga.cargaTugW,
      cargaTueW: carga.cargaTueW,
      cargaTotalW: carga.cargaTotalW,
    };
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// 9. VALIDAÇÃO DO SISTEMA ELÉTRICO — Cemig ND-5.5
// ═════════════════════════════════════════════════════════════════════════════

export function validarSistema(
  cargaInstaladaW: number,
  fases: string,
  tensao: string
): string[] {
  const alertas: string[] = [];

  const tipoLigacao = fases.includes("Trifásico") || fases.includes("3F")
    ? "Trifásico"
    : fases.includes("Bifásico") || fases.includes("2F")
    ? "Bifásico"
    : "Monofásico";

  const limite = LIMITES_CEMIG[tipoLigacao] ?? 23000;

  if (cargaInstaladaW > limite) {
    const prox =
      tipoLigacao === "Monofásico" ? "Bifásico (2F+N)" : "Trifásico (3F+N)";
    alertas.push(
      `Carga instalada ${(cargaInstaladaW / 1000).toFixed(1)} kW excede o limite do sistema ` +
        `${tipoLigacao} (${(limite / 1000).toFixed(0)} kW – Cemig ND-5.5). ` +
        `Considere alterar para ${prox}.`
    );
  }

  if (tipoLigacao === "Monofásico") {
    const tensaoV = tensao.includes("220") ? 220 : 127;
    const corrente = (cargaInstaladaW * 0.4) / (tensaoV * 0.92);
    if (corrente > 40) {
      alertas.push(
        `Corrente estimada ${Math.round(corrente)}A em sistema Monofásico. ` +
          `A Cemig limita ligação monofásica a 40A. Solicite ligação bifásica ou trifásica.`
      );
    }
  }

  return alertas;
}

// ═════════════════════════════════════════════════════════════════════════════
// 10. LISTA DE MATERIAIS
// ═════════════════════════════════════════════════════════════════════════════

export function gerarListaMateriais(
  comodos: Array<{ tipo: TipoComodo; area: number; perimetro?: number }>,
  circuitos: Circuito[],
  demanda: Demanda
): Material[] {
  // Totais globais
  let totalLamp = 0;
  let totalInter = 0;
  let totalTug = 0;
  let totalTue = 0;
  const lampPorTipo = new Map<string, number>();

  for (const c of comodos) {
    const il = calcularIluminacao(c.tipo, c.area);
    const tom = calcularTomadas(c.tipo, c.area, c.perimetro);

    totalLamp += il.numLampadas;
    totalInter += il.numInterruptores;
    totalTug += tom.numTug;
    totalTue += tom.numTue;

    const prev = lampPorTipo.get(il.tipoLuminario) ?? 0;
    lampPorTipo.set(il.tipoLuminario, prev + il.numLampadas);
  }

  // Metros de condutor por bitola (30m por circuito = ida + volta)
  const metrosCond = new Map<string, number>();
  for (const circ of circuitos) {
    const b = circ.bitolaMm2.replace("mm²", "").trim();
    metrosCond.set(b, (metrosCond.get(b) ?? 0) + 30);
  }

  // Disjuntores por valor exato
  const qtdDisj = (amp: number): number =>
    circuitos.filter((c) => c.disjuntorA === amp).length;

  // Bitola de entrada formatada
  const bitolaEntFmt = String(demanda.bitolaEntradaMm2).replace(".", ",");

  const totalMCond = [...metrosCond.values()].reduce((a, b) => a + b, 0);

  const mat: Material[] = [];
  let itemN = 1;

  // Unidades consumíveis recebem +10% (condutores, eletrodutos, acessórios)
  const add = (
    desc: string,
    unid: UnidadeMaterial,
    quant: number,
    espec: string
  ) => {
    if (quant <= 0) return;
    const isConsumivel = unid === "m" || unid === "rl" || unid === "pct";
    const qtdFinal = isConsumivel ? Math.ceil(quant * 1.1) : quant;
    mat.push({
      item: String(itemN++).padStart(2, "0"),
      descricao: desc,
      unidade: unid,
      quantidade: qtdFinal,
      especificacao: espec,
    });
  };

  // ── Condutores ────────────────────────────────────────────────────────────
  const condutores: [string, string][] = [
    ["1,5", "1.5"],
    ["2,5", "2.5"],
    ["4,0", "4.0"],
    ["6,0", "6.0"],
    ["10,0", "10.0"],
    ["16,0", "16.0"],
    ["25,0", "25.0"],
    ["35,0", "35.0"],
  ];

  for (const [fmt, key] of condutores) {
    const qtd = metrosCond.get(key) ?? 0;
    if (qtd > 0) {
      add(
        `Condutor ${fmt}mm² flexível Cu 750V`,
        "m",
        qtd,
        "NBR NM 247-3 / NBR 6812"
      );
    }
  }

  add(
    `Condutor ${bitolaEntFmt}mm² flexível Cu 750V (ramal entrada)`,
    "m",
    15,
    "NBR NM 247-3 – ramal de entrada"
  );

  // ── Eletrodutos ───────────────────────────────────────────────────────────
  add(
    `Eletroduto PVC rígido 3/4" (20mm)`,
    "m",
    Math.max(10, Math.floor(totalMCond * 0.35)),
    "NBR 15465"
  );
  add(`Eletroduto PVC rígido 1" (25mm)`, "m", 20, "NBR 15465");

  // ── Caixas ────────────────────────────────────────────────────────────────
  add(
    `Caixa de Luz 4×2" PVC (teto e parede)`,
    "un",
    totalLamp + totalInter,
    "Embutir – 1 por luminária + 1 por interruptor"
  );
  add(
    `Caixa de Luz 4×4" PVC`,
    "un",
    Math.max(1, Math.ceil(totalTug / 2)),
    "Para tomadas duplas 2P+T"
  );

  // ── Tomadas e interruptores ───────────────────────────────────────────────
  add(
    "Tomada 2P+T 10A – padrão NBR 14136 (TUG)",
    "un",
    totalTug,
    "Pial Legrand / Tramontina"
  );
  add(
    "Tomada 2P+T 20A – padrão NBR 14136 (TUE)",
    "un",
    totalTue,
    "Pial Legrand / Tramontina"
  );
  add("Interruptor Simples 10A", "un", totalInter, "127/250V – Pial Legrand");

  // Interruptores paralelos: 2 unidades por cômodo com área > 10m²
  const locaisParalelo = comodos.filter((c) => {
    const il = calcularIluminacao(c.tipo, c.area);
    return il.numInterruptores === 2;
  }).length;
  add(
    "Interruptor Paralelo (Three-Way) 10A",
    "un",
    locaisParalelo * 2,
    "Par por acesso – salas e corredores com 2 entradas"
  );

  // ── Luminárias ────────────────────────────────────────────────────────────
  for (const [tipoLum, qtd] of [...lampPorTipo.entries()].sort()) {
    add(
      `Luminária ${tipoLum} – 6500K – IP20 – INMETRO`,
      "un",
      qtd,
      "Certificação INMETRO obrigatória"
    );
  }

  // ── Disjuntores ───────────────────────────────────────────────────────────
  for (const amp of [6, 10, 16, 20, 25, 32, 40, 50]) {
    const q = qtdDisj(amp);
    if (q > 0) {
      add(
        `Disjuntor Monopolar Curva C ${amp}A – 4,5kA`,
        "un",
        q,
        "Schneider / WEG / ABB"
      );
    }
  }

  // DG sempre 1 unidade
  add(
    `Disjuntor Geral ${demanda.disjuntorGeralA}A Bipolar – 10kA – Curva C`,
    "un",
    1,
    "Schneider / WEG – disjuntor principal do QD"
  );

  // ── Proteções ─────────────────────────────────────────────────────────────
  const nDR = Math.max(2, Math.floor(circuitos.length / 4));
  add(
    "Interruptor Diferencial Residual (DR) 25A 30mA 2P",
    "un",
    nDR,
    "NBR IEC 61008 – proteção contra choque elétrico"
  );
  add(
    "Dispositivo de Proteção contra Surtos (DPS) Classe II 275V",
    "un",
    1,
    "NBR IEC 61643-11 – instalado no QD"
  );

  // ── Quadro de distribuição ────────────────────────────────────────────────
  const nPosicoes = circuitos.length + 4;
  add(
    `Quadro de Distribuição ${nPosicoes} disjuntores – embutir`,
    "un",
    1,
    "Com barramento, tampa cega e identificação de circuitos"
  );

  // ── Aterramento ───────────────────────────────────────────────────────────
  add("Cabo 4mm² verde-amarelo (aterramento PE)", "m", 12, "NBR NM 247-3 – condutor de proteção");
  add("Haste de aterramento aço cobreado 5/8\" × 2,4m", "un", 2, "CORGHI / Furukawa – espaçadas ≥ 3m");
  add("Conector de aterramento para haste 5/8\"", "un", 2, "Bronze – parafuso Allen");

  // ── Acessórios ────────────────────────────────────────────────────────────
  add("Fita isolante autofusão 19mm × 10m", "rl", 3, "3M Scotch Super 33+");
  add("Fita isolante PVC 19mm × 10m", "rl", 3, "3M Scotch 33 ou similar");
  add("Abraçadeiras de nylon 200mm – pct 100un", "pct", 2, "Organização de cabos");
  add(
    "Curva 90° PVC 3/4\" para eletroduto",
    "un",
    Math.max(10, Math.floor(totalMCond * 0.08)),
    "PVC rígido – embutir"
  );
  add(
    "Luva PVC 3/4\" para eletroduto",
    "un",
    Math.max(15, Math.floor(totalMCond * 0.12)),
    "Emenda de eletroduto"
  );

  return mat;
}
