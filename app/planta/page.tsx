// app/planta/page.tsx — Passo 4: Planta Elétrica
"use client";

import { useEffect, useRef } from "react";
import { useApp } from "@/lib/store";
import { useRouter } from "next/navigation";
import { ArrowRight, Map } from "lucide-react";
import { LUMINARIOS, TOMADAS_COMODO, COR_COMODO } from "@/lib/constants";
import { calcularIluminacao, calcularTomadas } from "@/lib/calculations";
import type { TipoComodo } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS DE DESENHO (Canvas 2D nativo — sem dependência externa)
// ─────────────────────────────────────────────────────────────────────────────

const ESCALA = 60;       // px por metro
const MARGEM = 40;
const SYMBOL_R = 12;     // raio dos símbolos em px

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// Símbolo NBR 5444 — ponto de luz (círculo com X)
function drawLampada(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, SYMBOL_R, 0, Math.PI * 2);
  ctx.fillStyle = "#F9A825";
  ctx.fill();
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  const d = SYMBOL_R * 0.6;
  ctx.beginPath();
  ctx.moveTo(x - d, y - d); ctx.lineTo(x + d, y + d);
  ctx.moveTo(x - d, y + d); ctx.lineTo(x + d, y - d);
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

// Símbolo NBR 5444 — interruptor simples
function drawInterruptor(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, SYMBOL_R, 0, Math.PI * 2);
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.strokeStyle = "#2E7D32";
  ctx.lineWidth = 1.8;
  ctx.stroke();
  const len = SYMBOL_R * 1.4;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + len, y - len);
  ctx.strokeStyle = "#2E7D32";
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + len, y - len, 3, 0, Math.PI * 2);
  ctx.fillStyle = "#2E7D32";
  ctx.fill();
  ctx.restore();
}

// Símbolo NBR 5444 — tomada TUG (círculo + 2 pinos)
function drawTUG(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, SYMBOL_R, 0, Math.PI * 2);
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.strokeStyle = "#1565C0";
  ctx.lineWidth = 1.8;
  ctx.stroke();
  for (const dx of [-4, 4]) {
    ctx.beginPath();
    ctx.moveTo(x + dx, y - 2);
    ctx.lineTo(x + dx, y + 8);
    ctx.strokeStyle = "#1565C0";
    ctx.lineWidth = 1.8;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(x, y - 2);
  ctx.lineTo(x, y - 9);
  ctx.stroke();
  ctx.restore();
}

// Símbolo NBR 5444 — tomada TUE (círculo sólido vermelho com "E")
function drawTUE(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, SYMBOL_R, 0, Math.PI * 2);
  ctx.fillStyle = "#B71C1C";
  ctx.fill();
  ctx.fillStyle = "white";
  ctx.font = `bold ${SYMBOL_R}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("E", x, y + 1);
  ctx.restore();
}

// Símbolo QD
function drawQD(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  const w = 36, h = 28;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h / 2, w, h, 4);
  ctx.fillStyle = "#4A148C";
  ctx.fill();
  ctx.fillStyle = "white";
  ctx.font = `bold 11px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("QD", x, y);
  ctx.restore();
}

// Fio em rota L
function drawFio(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
  cor: string,
  tracejado = false
) {
  ctx.save();
  ctx.beginPath();
  const mx = (x1 + x2) / 2;
  ctx.moveTo(x1, y1);
  ctx.lineTo(mx, y1);
  ctx.lineTo(mx, y2);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = cor;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.55;
  if (tracejado) ctx.setLineDash([4, 4]);
  ctx.stroke();
  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

export default function PlantaPage() {
  const { state } = useApp();
  const { comodos, calculado } = state;
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || comodos.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ── Calcula dimensões do canvas ────────────────────────────────────────
    const cols = Math.ceil(Math.sqrt(comodos.length * 1.4));
    const rows = Math.ceil(comodos.length / cols);

    const maxLarg = Math.max(...comodos.map((c) => c.largura));
    const maxComp = Math.max(...comodos.map((c) => c.comprimento));
    const celW = Math.max(maxLarg * ESCALA + 80, 160);
    const celH = Math.max(maxComp * ESCALA + 80, 120);

    const canvasW = cols * celW + MARGEM * 2;
    const canvasH = rows * celH + MARGEM * 2 + 60;

    canvas.width = canvasW;
    canvas.height = canvasH;

    // Fundo
    ctx.fillStyle = "#F8F8F2";
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Título
    ctx.fillStyle = "#0D47A1";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      `PLANTA ELÉTRICA — ${state.dadosObra.proprietario || "RESIDÊNCIA"} — NBR 5444:1989`,
      canvasW / 2,
      24
    );

    // QD — canto superior esquerdo
    const qdX = MARGEM + 30;
    const qdY = MARGEM + 55;
    drawQD(ctx, qdX, qdY);
    ctx.fillStyle = "#4A148C";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`${state.dadosObra.fases}`, qdX + 22, qdY);

    // ── Desenha cada cômodo ─────────────────────────────────────────────────
    comodos.forEach((c, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);

      const rx = MARGEM + col * celW + 60;
      const ry = MARGEM + row * celH + 40;
      const rw = c.largura * ESCALA;
      const rh = c.comprimento * ESCALA;

      // Fundo colorido do cômodo
      const corFundo = COR_COMODO[c.tipo as TipoComodo] ?? "#FFFFFF";
      ctx.fillStyle = hexToRgba(corFundo, 0.9);
      ctx.beginPath();
      ctx.roundRect(rx, ry, rw, rh, 4);
      ctx.fill();
      ctx.strokeStyle = "#2C2C2C";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Rótulo
      ctx.fillStyle = "#212121";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(c.nome, rx + rw / 2, ry + 16);
      ctx.fillStyle = "#555";
      ctx.font = "9px sans-serif";
      ctx.fillText(`${c.area}m²  |  pd=${c.peDireito}m`, rx + rw / 2, ry + 28);

      // Cota largura
      ctx.fillStyle = "#AAA";
      ctx.font = "9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${c.largura}m`, rx + rw / 2, ry + rh + 13);

      // ── Lâmpadas ─────────────────────────────────────────────────────────
      const il = calcularIluminacao(c.tipo as TipoComodo, c.area);
      const nL = il.numLampadas;
      const colsL = Math.ceil(Math.sqrt(nL));
      const rowsL = Math.ceil(nL / colsL);

      for (let li = 0; li < nL; li++) {
        const lc = li % colsL;
        const lr = Math.floor(li / colsL);
        const lx = rx + (lc + 1) * (rw / (colsL + 1));
        const ly = ry + rh * 0.35 + lr * (rh * 0.35 / Math.max(rowsL, 1));
        drawLampada(ctx, lx, ly);
        drawFio(ctx, lx, ly, qdX, qdY, "#F9A825", true);
      }

      // ── Interruptores (parede esquerda) ───────────────────────────────────
      for (let ii = 0; ii < il.numInterruptores; ii++) {
        drawInterruptor(ctx, rx + 14, ry + rh * 0.6 + ii * 30);
      }

      // ── TUGs (parede inferior) ────────────────────────────────────────────
      const tom = calcularTomadas(c.tipo as TipoComodo, c.area, c.perimetro);
      const nT = tom.numTug;
      const yTug = c.tipo === "Banheiro" || c.tipo === "Cozinha" || c.tipo === "Área de Serviço"
        ? ry + rh * 0.85
        : ry + rh - 14;

      for (let ti = 0; ti < nT; ti++) {
        const tx = rx + (ti + 1) * (rw / (nT + 1));
        drawTUG(ctx, tx, yTug);
        drawFio(ctx, tx, yTug, qdX, qdY, "#1565C0");
      }

      // ── TUEs (parede direita) ─────────────────────────────────────────────
      for (let ei = 0; ei < tom.numTue; ei++) {
        const ey = ry + rh * 0.3 + ei * 32;
        if (ey < ry + rh - 10) {
          drawTUE(ctx, rx + rw - 14, ey);
          drawFio(ctx, rx + rw - 14, ey, qdX, qdY, "#B71C1C", false);
        }
      }
    });

    // ── Legenda ─────────────────────────────────────────────────────────────
    const lyBase = canvasH - 36;
    const itens: [string, (ctx: CanvasRenderingContext2D, x: number, y: number) => void][] = [
      ["Ponto de Luz", drawLampada],
      ["Interruptor", drawInterruptor],
      ["Tomada TUG 10A", drawTUG],
      ["Tomada TUE 20A", drawTUE],
      ["QD", drawQD],
    ];
    let lx = MARGEM;
    ctx.fillStyle = "white";
    ctx.fillRect(MARGEM - 8, lyBase - 22, canvasW - MARGEM * 2 + 16, 48);
    ctx.strokeStyle = "#0D47A1";
    ctx.lineWidth = 1;
    ctx.strokeRect(MARGEM - 8, lyBase - 22, canvasW - MARGEM * 2 + 16, 48);

    ctx.fillStyle = "#0D47A1";
    ctx.font = "bold 9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("LEGENDA — Símbolos NBR 5444:1989", canvasW / 2, lyBase - 10);

    for (const [label, fn] of itens) {
      fn(ctx, lx + 12, lyBase + 12);
      ctx.fillStyle = "#333";
      ctx.font = "9px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(label, lx + 28, lyBase + 16);
      lx += 130;
    }
  }, [comodos, state.dadosObra, calculado]);

  if (!calculado) {
    return (
      <div className="alerta-warning max-w-xl">
        ⚠️ Execute o cálculo completo antes de visualizar a planta.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-900 text-yellow-400 rounded-full w-9 h-9 flex items-center justify-center font-bold">
            4
          </div>
          <h1 className="text-2xl font-bold text-blue-900">Planta Elétrica</h1>
        </div>
        <p className="text-gray-500 text-sm">
          Simbologia conforme NBR 5444:1989. Posicionamento baseado em NBR 5410:2005 seções 9.3 e 9.4.
        </p>
      </div>

      <div className="card p-3 overflow-auto">
        <canvas
          ref={canvasRef}
          className="block mx-auto"
          style={{ maxWidth: "100%" }}
        />
      </div>

      {/* Download da planta */}
      <div className="flex gap-3 mt-4">
        <button
          className="btn-secondary"
          onClick={() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const link = document.createElement("a");
            link.download = `planta_eletrica_${state.dadosObra.proprietario || "projeto"}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
          }}
        >
          ⬇️ Baixar Planta (PNG)
        </button>

        <button
          className="btn-primary flex items-center justify-center gap-2"
          onClick={() => router.push("/unifilar")}
        >
          <span>Próximo: Diagrama Unifilar</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
