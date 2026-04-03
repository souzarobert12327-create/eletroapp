// app/unifilar/page.tsx — Passo 5: Diagrama Unifilar
"use client";

import { useEffect, useRef } from "react";
import { useApp } from "@/lib/store";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import type { Circuito } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS DE DESENHO
// ─────────────────────────────────────────────────────────────────────────────

function rrect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  r: number, fill: string, stroke: string, lw = 1.5
) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lw;
  ctx.stroke();
  ctx.restore();
}

function texto(
  ctx: CanvasRenderingContext2D,
  t: string, x: number, y: number,
  font = "11px sans-serif", cor = "#1A1A1A", align: CanvasTextAlign = "center"
) {
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = cor;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(t, x, y);
  ctx.restore();
}

function linha(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  cor = "#333", lw = 2
) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = cor;
  ctx.lineWidth = lw;
  ctx.stroke();
  ctx.restore();
}

// Agrupa circuitos em 3 DRs
function agruparPorDR(circuitos: Circuito[]) {
  const grupos: Record<string, Circuito[]> = {
    "DR-1\nIluminação": [],
    "DR-2\nTUG": [],
    "DR-3\nTUE": [],
  };
  for (const c of circuitos) {
    if (c.tipo === "Iluminação") grupos["DR-1\nIluminação"].push(c);
    else if (c.tipo === "TUG")    grupos["DR-2\nTUG"].push(c);
    else                           grupos["DR-3\nTUE"].push(c);
  }
  return Object.entries(grupos).filter(([, v]) => v.length > 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE
// ─────────────────────────────────────────────────────────────────────────────

export default function UnifilarPage() {
  const { state } = useApp();
  const { circuitos, demanda, dadosObra, calculado } = state;
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !calculado || !demanda) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const grupos = agruparPorDR(circuitos);
    const maxCircsGrupo = Math.max(...grupos.map(([, v]) => v.length), 1);
    const W = Math.max(900, grupos.length * 300 + 100);
    const H = 180 + maxCircsGrupo * 100 + 120;

    canvas.width = W;
    canvas.height = H;

    ctx.fillStyle = "#FAFAFA";
    ctx.fillRect(0, 0, W, H);

    // ── Título ────────────────────────────────────────────────────────────────
    rrect(ctx, W / 2 - 280, 10, 560, 34, 6, "#E3F2FD", "#0D47A1", 1.5);
    texto(ctx, `DIAGRAMA UNIFILAR — QUADRO DE DISTRIBUIÇÃO — ${dadosObra.proprietario || "RESIDÊNCIA"}`,
      W / 2, 27, "bold 11px sans-serif", "#0D47A1");

    texto(ctx,
      `NBR 5410:2005 / ND-5.5 Cemig  |  Tensão: ${dadosObra.tensao}  |  Sistema: ${dadosObra.fases}`,
      W / 2, 56, "9px sans-serif", "#666");

    // ── Rede Cemig ────────────────────────────────────────────────────────────
    const xv = 80;
    let yc = 76;
    for (let i = 0; i < 3; i++) {
      linha(ctx, xv - 18, yc - i * 7, xv + 18, yc - i * 7, "#333", 2.5 - i * 0.7);
    }
    texto(ctx, "Rede Cemig (BT pública)", xv + 28, yc - 7, "9px sans-serif", "#555", "left");
    yc += 14;

    linha(ctx, xv, yc, xv, yc + 16, "#333", 2);
    yc += 18;

    // ── Medidor ────────────────────────────────────────────────────────────────
    rrect(ctx, xv - 20, yc, 40, 28, 14, "#E3F2FD", "#0D47A1", 1.5);
    texto(ctx, "kWh", xv, yc + 10, "bold 9px sans-serif", "#0D47A1");
    texto(ctx, "MED", xv, yc + 21, "8px sans-serif", "#0D47A1");
    texto(ctx, "Medidor kWh (Cemig — padrão ND-5.5)", xv + 28, yc + 14, "9px sans-serif", "#333", "left");
    yc += 36;

    linha(ctx, xv, yc, xv, yc + 16, "#333", 2);
    yc += 18;

    // ── Disjuntor Geral ────────────────────────────────────────────────────────
    rrect(ctx, xv - 24, yc, 48, 32, 4, "#FFF9C4", "#E65100", 1.8);
    texto(ctx, "DG", xv, yc + 10, "bold 10px sans-serif", "#E65100");
    texto(ctx, `${demanda.disjuntorGeralA}A`, xv, yc + 22, "bold 10px sans-serif", "#E65100");
    texto(ctx,
      `Disjuntor Geral ${demanda.disjuntorGeralA}A – Curva C – 10kA`,
      xv + 30, yc + 10, "9px sans-serif", "#333", "left");
    texto(ctx,
      `Condutor entrada: ${demanda.condutorEntrada}  Iz=${demanda.izEntradaA}A`,
      xv + 30, yc + 22, "8px sans-serif", "#555", "left");
    yc += 40;

    linha(ctx, xv, yc, xv, yc + 10, "#333", 2.5);
    yc += 12;

    // ── Barramento ─────────────────────────────────────────────────────────────
    const barY = yc;
    linha(ctx, 20, barY, W - 20, barY, "#000", 5);
    texto(ctx,
      `BARRAMENTO PRINCIPAL  |  P inst.=${(demanda.cargaInstaladaW / 1000).toFixed(1)}kW  |  Demanda=${(demanda.demandaW / 1000).toFixed(1)}kW  |  I=${demanda.correnteA.toFixed(1)}A`,
      W / 2, barY - 10, "bold 9px sans-serif", "#0D47A1");

    yc = barY + 14;

    // ── Grupos DR ──────────────────────────────────────────────────────────────
    const dxGrupo = (W - 60) / grupos.length;

    grupos.forEach(([nomeDR, circs], ig) => {
      const xg = 30 + ig * dxGrupo + dxGrupo / 2;

      // Descida ao DR
      linha(ctx, xg, barY, xg, yc + 10, "#444", 1.8);

      // Bloco DR
      const drY = yc + 10;
      rrect(ctx, xg - 28, drY, 56, 36, 4, "#E8EAF6", "#3949AB", 1.5);
      texto(ctx, nomeDR.split("\n")[0], xg, drY + 12, "bold 9px sans-serif", "#3949AB");
      texto(ctx, "30mA", xg, drY + 24, "8px sans-serif", "#3949AB");

      const cargGrupo = circs.reduce((s, c) => s + c.cargaW, 0);
      texto(ctx, `∑ ${cargGrupo}W`, xg, drY + 44, "8px sans-serif", "#555");

      const ySec = drY + 56;

      // Barramento secundário se > 1 circuito
      if (circs.length > 1) {
        const hw = (circs.length - 1) * 88 / 2;
        linha(ctx, xg - hw, ySec, xg + hw, ySec, "#777", 1.4);
      }

      const xPositions = circs.length === 1
        ? [xg]
        : circs.map((_, i) => xg - ((circs.length - 1) * 88 / 2) + i * 88);

      circs.forEach((circ, ic) => {
        const xc = xPositions[ic];

        linha(ctx, xc, ySec, xc, ySec + 14, "#777", 1.2);

        // Bloco disjuntor do circuito
        const djY = ySec + 14;
        rrect(ctx, xc - 26, djY, 52, 28, 3, "#FFF9C4", "#EF6C00", 1.5);
        texto(ctx, circ.circ, xc, djY + 9, "bold 9px sans-serif", "#EF6C00");
        texto(ctx, `${circ.disjuntorA}A`, xc, djY + 20, "9px sans-serif", "#EF6C00");

        linha(ctx, xc, djY + 28, xc, djY + 40, "#777", 1.1);

        // Bitola
        rrect(ctx, xc - 28, djY + 40, 56, 18, 3, "#FFFDE7", "#F9A825", 0.8);
        texto(ctx, circ.bitolaMm2, xc, djY + 49, "8px sans-serif", "#333");

        // Descrição + dados
        const descY = djY + 66;
        rrect(ctx, xc - 38, descY, 76, 28, 3, "#F5F5F5", "#CCC", 0.6);
        const descCurta = circ.descricao.slice(0, 14);
        texto(ctx, descCurta, xc, descY + 8, "7px sans-serif", "#333");
        texto(ctx, `${circ.cargaW}W  ${circ.correnteA}A  ΔV=${circ.deltaVPercent}%`, xc, descY + 19, "7px sans-serif", "#666");

        // Status
        const stY = descY + 33;
        const stCor = circ.situacao === "✅ OK" ? "#1B5E20" : "#B71C1C";
        texto(ctx, circ.situacao, xc, stY, "bold 8px sans-serif", stCor);
      });
    });

    // ── Aterramento ────────────────────────────────────────────────────────────
    const atY = H - 52;
    rrect(ctx, 20, atY, W - 40, 34, 4, "#E8F5E9", "#1B5E20", 1.3);
    texto(ctx,
      "SISTEMA DE ATERRAMENTO — TN-S (NBR 5410:2005 Seção 5)  |  2 hastes aço cobreado 5/8\" × 2,4m espaçadas ≥ 3m  |  Cabo PE 4mm² verde-amarelo  |  R ≤ 10Ω",
      W / 2, atY + 17, "bold 8px sans-serif", "#1B5E20");

    // ── Rodapé ─────────────────────────────────────────────────────────────────
    const rdY = H - 14;
    texto(ctx,
      `Resp.: ${dadosObra.responsavel}  |  CREA: ${dadosObra.crea}  |  ART: ${dadosObra.art}  |  Data: ${dadosObra.data}  |  Escala: S/E`,
      W / 2, rdY, "8px sans-serif", "#888");
  }, [circuitos, demanda, dadosObra, calculado]);

  if (!calculado) {
    return (
      <div className="alerta-warning max-w-xl">
        ⚠️ Execute o cálculo completo antes de visualizar o diagrama unifilar.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-900 text-yellow-400 rounded-full w-9 h-9 flex items-center justify-center font-bold">
            5
          </div>
          <h1 className="text-2xl font-bold text-blue-900">Diagrama Unifilar</h1>
        </div>
        <p className="text-gray-500 text-sm">
          Quadro de distribuição conforme padrão Cemig ND-5.5.
          Hierarquia: Rede → Medidor → DG → Barramento → DRs → Circuitos.
        </p>
      </div>

      <div className="card p-3 overflow-auto">
        <canvas ref={canvasRef} className="block mx-auto" style={{ maxWidth: "100%" }} />
      </div>

      <div className="flex gap-3 mt-4">
        <button
          className="btn-secondary"
          onClick={() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const link = document.createElement("a");
            link.download = `unifilar_${dadosObra.proprietario || "projeto"}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
          }}
        >
          ⬇️ Baixar Unifilar (PNG)
        </button>

        <button
          className="btn-primary flex items-center justify-center gap-2"
          onClick={() => router.push("/documentos")}
        >
          <span>Próximo: Gerar Documentos</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
