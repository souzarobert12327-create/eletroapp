// app/documentos/page.tsx — Passo 6: Gerar Documentos PDF
"use client";

import { useState, useRef } from "react";
import { useApp } from "@/lib/store";
import { FileText, Download, CheckCircle } from "lucide-react";
import type { Circuito, Material, ResultadoComodo } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────────
// GERADOR DE PDF (jsPDF nativo — sem imagens externas)
// ─────────────────────────────────────────────────────────────────────────────

async function gerarPDF(state: ReturnType<typeof useApp>["state"]) {
  const { default: jsPDF } = await import("jspdf");
  // @ts-expect-error autoTable is added via import
  await import("jspdf-autotable");

  const { dadosObra, resultados, circuitos, demanda, materiais, alertas } = state;
  if (!demanda) return;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const PW = 210;    // page width
  const M  = 14;     // margin
  const CW = PW - 2 * M; // content width
  let y = 0;

  const AZUL = [13, 71, 161] as [number, number, number];
  const AZUL_CL = [227, 242, 253] as [number, number, number];
  const BRANCO = [255, 255, 255] as [number, number, number];

  // ── Helper: Cabeçalho de cada página ────────────────────────────────────────
  function cabecalho() {
    doc.setFillColor(...AZUL);
    doc.rect(0, 0, PW, 10, "F");
    doc.setTextColor(...BRANCO);
    doc.setFontSize(7);
    doc.text("⚡ EletrApp Residencial | NBR 5410:2005 / ND-5.5 Cemig", M, 6.5);
    doc.text(`Data: ${dadosObra.data}`, PW - M, 6.5, { align: "right" });
    doc.setTextColor(0, 0, 0);
    y = 16;
  }

  function rodape(numPag: number) {
    doc.setFillColor(...AZUL);
    doc.rect(0, 287, PW, 10, "F");
    doc.setTextColor(...BRANCO);
    doc.setFontSize(6.5);
    doc.text(
      `Resp.: ${dadosObra.responsavel}  |  CREA: ${dadosObra.crea}`,
      M, 293
    );
    doc.text(`Pág. ${numPag}`, PW / 2, 293, { align: "center" });
    doc.text(`ART: ${dadosObra.art}`, PW - M, 293, { align: "right" });
    doc.setTextColor(0, 0, 0);
  }

  function secao(titulo: string) {
    if (y > 255) { doc.addPage(); cabecalho(); }
    doc.setFillColor(...AZUL_CL);
    doc.rect(M, y, CW, 7, "F");
    doc.setDrawColor(...AZUL);
    doc.rect(M, y, CW, 7, "S");
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...AZUL);
    doc.text(titulo, M + 3, y + 5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    y += 10;
  }

  function corpo(texto: string, fontSize = 9) {
    if (y > 260) { doc.addPage(); cabecalho(); }
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", "normal");
    const linhas = doc.splitTextToSize(texto, CW);
    doc.text(linhas, M, y);
    y += linhas.length * (fontSize * 0.45) + 3;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PÁGINA 1 — CAPA
  // ════════════════════════════════════════════════════════════════════════════
  doc.setFillColor(...AZUL);
  doc.rect(0, 0, PW, 60, "F");
  doc.setTextColor(...BRANCO);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("⚡ EletrApp Residencial", PW / 2, 28, { align: "center" });
  doc.setFontSize(12);
  doc.text("PROJETO ELÉTRICO RESIDENCIAL", PW / 2, 40, { align: "center" });
  doc.setFontSize(9);
  doc.text("Conforme NBR 5410:2005 e Normas Cemig (ND-5.5)", PW / 2, 50, { align: "center" });

  doc.setTextColor(0, 0, 0);
  y = 72;

  // Tabela de dados da obra
  // @ts-expect-error autoTable
  doc.autoTable({
    startY: y,
    head: [["DADOS DA OBRA", ""]],
    body: [
      ["Proprietário:", dadosObra.proprietario],
      ["Endereço:", dadosObra.endereco],
      ["Concessionária:", dadosObra.concessionaria],
      ["Tensão:", dadosObra.tensao],
      ["Sistema:", dadosObra.fases],
      ["Norma:", dadosObra.norma],
      ["DADOS TÉCNICOS", ""],
      ["Resp. Técnico:", dadosObra.responsavel],
      ["CREA:", dadosObra.crea],
      ["ART/TRT:", dadosObra.art],
      ["Data:", dadosObra.data],
    ],
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 }, 1: { cellWidth: CW - 50 } },
    headStyles: { fillColor: AZUL, textColor: BRANCO, fontSize: 9 },
    bodyStyles: { fontSize: 8.5 },
    alternateRowStyles: { fillColor: AZUL_CL },
    theme: "grid",
    margin: { left: M, right: M },
    didParseCell: (data: { row: { index: number }, cell: { styles: { fillColor: number[] } } }) => {
      if (data.row.index === 6) data.cell.styles.fillColor = [21, 101, 192];
    },
  });

  // @ts-expect-error autoTable
  y = doc.lastAutoTable.finalY + 10;

  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text(
    "Este projeto foi elaborado por profissional habilitado e registrado no CREA, com emissão de ART conforme Lei 6.496/77.",
    M, y, { maxWidth: CW }
  );

  rodape(1);

  // ════════════════════════════════════════════════════════════════════════════
  // PÁGINA 2 — MEMORIAL DESCRITIVO
  // ════════════════════════════════════════════════════════════════════════════
  doc.addPage();
  cabecalho();

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("MEMORIAL DESCRITIVO", PW / 2, y, { align: "center" });
  y += 12;

  secao("1. OBJETIVO E ESCOPO DO PROJETO");
  corpo(
    "O presente memorial descritivo tem por objetivo definir e especificar os materiais, equipamentos e serviços " +
    "necessários à execução da instalação elétrica de baixa tensão da residência em questão, observando todas as " +
    "prescrições da NBR 5410:2005, ND-5.5 Cemig, NBR 5444:1989 e demais normas técnicas aplicáveis."
  );

  secao("2. DADOS DA EDIFICAÇÃO");
  const areaTotal = state.comodos.reduce((s, c) => s + c.area, 0);
  // @ts-expect-error autoTable
  doc.autoTable({
    startY: y,
    head: [["Item", "Descrição", "Valor"]],
    body: [
      ["Proprietário",    dadosObra.proprietario, ""],
      ["Área total",      `${areaTotal.toFixed(1)} m²`, ""],
      ["Nº de cômodos",   String(state.comodos.length), ""],
      ["Tensão",          dadosObra.tensao, "Cemig"],
      ["Sistema",         dadosObra.fases, "NBR 5410"],
      ["Concessionária",  dadosObra.concessionaria, ""],
    ],
    headStyles: { fillColor: AZUL, textColor: BRANCO, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: AZUL_CL },
    theme: "grid",
    margin: { left: M, right: M },
  });
  // @ts-expect-error autoTable
  y = doc.lastAutoTable.finalY + 8;

  secao("3. SISTEMAS — ILUMINAÇÃO (NBR ISO/CIE 8995-1:2013)");
  corpo(
    "Pontos de iluminação calculados pelo Método dos Lúmens com luminários LED reais: " +
    "Plafon 18W = 1200lm, 25W = 1700lm, 36W = 2500lm. " +
    "Fator de utilização FU = 0,65 e fator de manutenção FM = 0,80. " +
    "Vida útil mínima 25.000 horas. Certificação INMETRO obrigatória."
  );

  secao("3.2 TOMADAS DE USO GERAL — TUG (NBR 5410:2005 item 9.4.1.1)");
  corpo(
    "Mínimo 1 TUG a cada 5m de comprimento de parede (perímetro), ou fração. " +
    "Mínimo de 2 pontos por cômodo. Altura: 30cm (áreas secas) e 110–120cm (áreas molhadas). " +
    "Padrão NBR 14136 (2P+T – 10A)."
  );

  secao("3.3 TOMADAS DE USO ESPECÍFICO — TUE (NBR 5410:2005 item 9.4.2)");
  corpo(
    "Circuitos individuais: chuveiro (5500W), ar-condicionado, máquina de lavar, " +
    "micro-ondas, geladeira e fogão elétrico. Bitola e disjuntor dimensionados para carga nominal. " +
    "Cargas resistivas (chuveiro, aquecedor, ferro) com FP = 1,0."
  );

  secao("4. ATERRAMENTO (NBR 5410:2005 Seção 5 — Sistema TN-S)");
  corpo(
    "Mínimo 2 hastes aço cobreado 5/8\" × 2,4m espaçadas ≥ 3m. " +
    "Cabo PE verde-amarelo 4mm². Resistência máxima 10Ω (medir antes da energização). " +
    "Todos os circuitos com condutor de proteção PE = fase (Tabela 54 NBR 5410)."
  );

  rodape(2);

  // ════════════════════════════════════════════════════════════════════════════
  // PÁGINA 3 — MEMORIAL DE CÁLCULO
  // ════════════════════════════════════════════════════════════════════════════
  doc.addPage();
  cabecalho();

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("MEMORIAL DE CÁLCULO ELÉTRICO", PW / 2, y, { align: "center" });
  y += 12;

  // Alertas se houver
  if (alertas.length > 0) {
    doc.setFillColor(255, 243, 205);
    doc.setDrawColor(255, 143, 0);
    doc.rect(M, y, CW, alertas.length * 8 + 6, "FD");
    doc.setFontSize(8);
    doc.setTextColor(183, 28, 28);
    doc.setFont("helvetica", "bold");
    alertas.forEach((a, i) => {
      doc.text(`⚠ ${a}`, M + 3, y + 6 + i * 8);
    });
    doc.setTextColor(0, 0, 0);
    y += alertas.length * 8 + 10;
  }

  secao("1. PREVISÃO DE CARGA POR CÔMODO");

  // @ts-expect-error autoTable
  doc.autoTable({
    startY: y,
    head: [["Cômodo", "Área\n(m²)", "Lux", "Luminário", "Lâmp.", "TUG", "Cg.Ilum\n(W)", "Cg.TUG\n(W)", "Cg.TUE\n(W)", "Total\n(W)"]],
    body: [
      ...resultados.map((r: ResultadoComodo) => [
        r.comodo, r.areaM2, r.luxRequerido, r.luminario,
        r.numLampadas, r.numTomadas,
        r.cargaIlumW, r.cargaTugW, r.cargaTueW, r.cargaTotalW,
      ]),
      ["TOTAL", "", "", "", "", "",
        resultados.reduce((s, r) => s + r.cargaIlumW, 0),
        resultados.reduce((s, r) => s + r.cargaTugW, 0),
        resultados.reduce((s, r) => s + r.cargaTueW, 0),
        resultados.reduce((s, r) => s + r.cargaTotalW, 0),
      ],
    ],
    headStyles: { fillColor: AZUL, textColor: BRANCO, fontSize: 7, halign: "center" },
    bodyStyles: { fontSize: 7 },
    alternateRowStyles: { fillColor: AZUL_CL },
    theme: "grid",
    margin: { left: M, right: M },
    didParseCell: (data: { row: { index: number }, cell: { styles: { fillColor: number[], textColor: number[], fontStyle: string } } }) => {
      if (data.row.index === resultados.length) {
        data.cell.styles.fillColor = AZUL;
        data.cell.styles.textColor = [255, 255, 255];
        data.cell.styles.fontStyle = "bold";
      }
    },
  });
  // @ts-expect-error autoTable
  y = doc.lastAutoTable.finalY + 8;

  secao("2. DEMANDA TOTAL — Cemig ND-5.5");
  // @ts-expect-error autoTable
  doc.autoTable({
    startY: y,
    head: [["Parâmetro", "Valor", "Observação"]],
    body: [
      ["Carga instalada total", `${demanda.cargaInstaladaW.toFixed(0)} W`, "Soma de todos os cômodos"],
      ["Demanda calculada",     `${demanda.demandaW.toFixed(0)} W`,        "Após aplicação FD Cemig"],
      ["Corrente de demanda",   `${demanda.correnteA.toFixed(2)} A`,       "I = P / (U × FP), FP=0,92"],
      ["Disjuntor geral",       `${demanda.disjuntorGeralA} A`,            "Próximo valor padronizado"],
      ["Condutor entrada",      demanda.condutorEntrada,                    `Iz = ${demanda.izEntradaA}A ≥ DG`],
    ],
    headStyles: { fillColor: AZUL, textColor: BRANCO, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: AZUL_CL },
    theme: "grid",
    margin: { left: M, right: M },
  });
  // @ts-expect-error autoTable
  y = doc.lastAutoTable.finalY + 8;

  rodape(3);

  // ════════════════════════════════════════════════════════════════════════════
  // PÁGINA 4 — CIRCUITOS
  // ════════════════════════════════════════════════════════════════════════════
  doc.addPage();
  cabecalho();

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("DIMENSIONAMENTO DE CIRCUITOS", PW / 2, y, { align: "center" });
  y += 6;
  corpo("NBR 5410:2005 Tabelas 36, 38, 40 (condutores) e 54 (PE). Queda de tensão máx. 4%.");

  // @ts-expect-error autoTable
  doc.autoTable({
    startY: y,
    head: [["Circ.", "Tipo", "Descrição", "Carga\n(W)", "I\n(A)", "Bitola", "Condutor", "Disj.", "DR", "ΔV\n(%)", "Status"]],
    body: circuitos.map((c: Circuito) => [
      c.circ, c.tipo, c.descricao.slice(0, 20),
      c.cargaW, c.correnteA, c.bitolaMm2, c.condutor.slice(0, 18),
      `${c.disjuntorA}A`, c.dr, `${c.deltaVPercent}%`, c.situacao,
    ]),
    headStyles: { fillColor: AZUL, textColor: BRANCO, fontSize: 7, halign: "center" },
    bodyStyles: { fontSize: 6.5 },
    alternateRowStyles: { fillColor: AZUL_CL },
    theme: "grid",
    margin: { left: M, right: M },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 18 },
      2: { cellWidth: 30 },
      3: { cellWidth: 14, halign: "right" },
      4: { cellWidth: 12, halign: "right" },
      5: { cellWidth: 14 },
      6: { cellWidth: 28 },
      7: { cellWidth: 10, halign: "right" },
      8: { cellWidth: 10 },
      9: { cellWidth: 10, halign: "right" },
      10: { cellWidth: 16 },
    },
    didParseCell: (data: { column: { index: number }, row: { index: number, raw: unknown[] }, cell: { styles: { textColor: number[], fontStyle: string } } }) => {
      if (data.column.index === 10 && data.row.index >= 0) {
        const val = String(data.row.raw[10]);
        if (val.includes("OK")) {
          data.cell.styles.textColor = [27, 94, 32];
          data.cell.styles.fontStyle = "bold";
        } else if (val.includes("REVISAR")) {
          data.cell.styles.textColor = [183, 28, 28];
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });
  // @ts-expect-error autoTable
  y = doc.lastAutoTable.finalY + 10;

  // Fórmulas
  secao("FÓRMULAS UTILIZADAS");
  // @ts-expect-error autoTable
  doc.autoTable({
    startY: y,
    head: [["Grandeza", "Fórmula", "Unidade"]],
    body: [
      ["Nº lâmpadas",      "N = (E × A) / (Φ × FU × FM)", "un"],
      ["Corrente de carga", "I = P / (U × FP)",             "A"],
      ["Queda de tensão",   "ΔV = 2 × L × I × R × cosφ",   "V"],
      ["ΔV percentual",     "ΔV% = (ΔV / Vn) × 100",        "%"],
      ["Corrente corrigida","Ic = I / (FT × FA)",            "A"],
    ],
    headStyles: { fillColor: AZUL, textColor: BRANCO, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: AZUL_CL },
    theme: "grid",
    margin: { left: M, right: M },
  });

  rodape(4);

  // ════════════════════════════════════════════════════════════════════════════
  // PÁGINA 5 — LISTA DE MATERIAIS
  // ════════════════════════════════════════════════════════════════════════════
  doc.addPage();
  cabecalho();

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("LISTA DE MATERIAIS", PW / 2, y, { align: "center" });
  y += 6;
  corpo("Consumíveis (m, rl, pct) incluem margem de 10%. Equipamentos em quantidade exata de projeto.");

  // @ts-expect-error autoTable
  doc.autoTable({
    startY: y,
    head: [["Item", "Descrição do Material", "Unid.", "Qtd.", "Especificação Técnica"]],
    body: materiais.map((m: Material) => [m.item, m.descricao, m.unidade, m.quantidade, m.especificacao]),
    headStyles: { fillColor: AZUL, textColor: BRANCO, fontSize: 8 },
    bodyStyles: { fontSize: 7.5 },
    alternateRowStyles: { fillColor: [255, 253, 231] },
    theme: "grid",
    margin: { left: M, right: M },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      1: { cellWidth: 72 },
      2: { cellWidth: 14, halign: "center" },
      3: { cellWidth: 12, halign: "center" },
      4: { cellWidth: CW - 110 },
    },
  });

  rodape(5);

  // ════════════════════════════════════════════════════════════════════════════
  // PÁGINA 6 — DECLARAÇÃO E ASSINATURAS
  // ════════════════════════════════════════════════════════════════════════════
  doc.addPage();
  cabecalho();

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("DECLARAÇÃO E ASSINATURAS", PW / 2, y, { align: "center" });
  y += 14;

  corpo(
    "Declaro que o presente projeto foi elaborado em conformidade com as normas técnicas vigentes, " +
    "em especial a NBR 5410:2005, e que as informações nele contidas são verdadeiras e de minha " +
    "responsabilidade técnica."
  );

  y += 30;
  doc.setFontSize(9);
  doc.text(`${dadosObra.endereco || "Local"}, ${dadosObra.data}`, M, y);

  y += 30;
  doc.line(M, y, M + 70, y);
  doc.line(PW - M - 70, y, PW - M, y);

  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(dadosObra.proprietario, M + 35, y, { align: "center" });
  doc.text(dadosObra.responsavel,  PW - M - 35, y, { align: "center" });

  y += 5;
  doc.setFontSize(7.5);
  doc.text("Proprietário / Contratante", M + 35, y, { align: "center" });
  doc.text(`CREA: ${dadosObra.crea}`, PW - M - 35, y, { align: "center" });

  rodape(6);

  return doc;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE
// ─────────────────────────────────────────────────────────────────────────────

export default function DocumentosPage() {
  const { state } = useApp();
  const [gerando, setGerando] = useState(false);
  const [gerado, setGerado] = useState(false);

  if (!state.calculado) {
    return (
      <div className="alerta-warning max-w-xl">
        ⚠️ Finalize os cálculos antes de gerar os documentos.
      </div>
    );
  }

  async function handleGerar() {
    setGerando(true);
    setGerado(false);
    try {
      const doc = await gerarPDF(state);
      if (!doc) return;
      const nome = `ProjetoEletrico_${state.dadosObra.proprietario.replace(/\s+/g, "_") || "projeto"}_${state.dadosObra.data.replace(/\//g, "")}.pdf`;
      doc.save(nome);
      setGerado(true);
    } catch (e) {
      console.error("Erro ao gerar PDF:", e);
      alert("Erro ao gerar PDF. Verifique o console.");
    } finally {
      setGerando(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-900 text-yellow-400 rounded-full w-9 h-9 flex items-center justify-center font-bold">
            6
          </div>
          <h1 className="text-2xl font-bold text-blue-900">Gerar Documentos</h1>
        </div>
        <p className="text-gray-500 text-sm">
          Projeto elétrico completo em PDF profissional — pronto para assinar e entregar.
        </p>
      </div>

      {/* Conteúdo do PDF */}
      <div className="card mb-6">
        <h2 className="font-semibold text-blue-900 mb-4">📄 Conteúdo do PDF gerado</h2>
        <div className="space-y-2 text-sm">
          {[
            ["1", "Capa", "Dados da obra, responsável técnico, ART"],
            ["2", "Memorial Descritivo", "Normas, critérios e sistemas especificados"],
            ["3", "Memorial de Cálculo", "Previsão de carga, demanda Cemig ND-5.5"],
            ["4", "Dimensionamento de Circuitos", "NBR 5410 Tabelas 36, 38, 40, 54"],
            ["5", "Lista de Materiais", "Quantidades e especificações técnicas"],
            ["6", "Declaração e Assinaturas", "Termo de responsabilidade técnica"],
          ].map(([num, titulo, desc]) => (
            <div key={num} className="flex gap-3 items-start">
              <span className="bg-blue-900 text-yellow-400 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {num}
              </span>
              <div>
                <span className="font-medium text-gray-800">{titulo}</span>
                <span className="text-gray-500 ml-2 text-xs">{desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resumo do projeto */}
      {state.demanda && (
        <div className="card mb-6">
          <h2 className="font-semibold text-blue-900 mb-3">📊 Resumo do Projeto</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: "Cômodos", value: state.comodos.length },
              { label: "Circuitos", value: state.circuitos.length },
              { label: "Materiais", value: `${state.materiais.length} itens` },
              { label: "Carga Total", value: `${(state.demanda.cargaInstaladaW / 1000).toFixed(1)} kW` },
              { label: "Demanda", value: `${(state.demanda.demandaW / 1000).toFixed(1)} kW` },
              { label: "DG", value: `${state.demanda.disjuntorGeralA} A` },
            ].map((item) => (
              <div key={item.label} className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className="text-xl font-bold text-blue-900">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alertas */}
      {state.alertas.length > 0 && (
        <div className="mb-4 space-y-2">
          {state.alertas.map((a, i) => (
            <div key={i} className="alerta-warning text-sm">⚠️ {a}</div>
          ))}
        </div>
      )}

      {/* Botão */}
      <button
        className="btn-primary flex items-center justify-center gap-3 py-4 text-base disabled:opacity-60"
        onClick={handleGerar}
        disabled={gerando}
      >
        {gerando ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Gerando PDF...
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            BAIXAR PROJETO ELÉTRICO COMPLETO (PDF)
          </>
        )}
      </button>

      {gerado && (
        <div className="mt-4 flex items-center gap-2 text-green-700 font-semibold">
          <CheckCircle className="w-5 h-5" />
          PDF gerado e baixado com sucesso!
        </div>
      )}

      <p className="mt-4 text-xs text-gray-400 text-center">
        ⚠️ Versão Beta — Revisar com engenheiro habilitado antes da execução.
        Emissão de ART obrigatória conforme Lei 6.496/77.
      </p>
    </div>
  );
}
