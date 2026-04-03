// app/calculos/page.tsx — Passo 3: Cálculos Elétricos
"use client";

import { useApp } from "@/lib/store";
import { useRouter } from "next/navigation";
import { ArrowRight, Zap, AlertTriangle, CheckCircle } from "lucide-react";
import type { ParametrosCalculo } from "@/lib/types";

export default function CalculosPage() {
  const { state, setParams, calcular } = useApp();
  const { params, resultados, demanda, circuitos, alertas, calculado } = state;
  const router = useRouter();

  if (state.comodos.length === 0) {
    return (
      <div className="alerta-warning max-w-xl">
        ⚠️ Cadastre os cômodos antes de calcular.
      </div>
    );
  }

  const handleParam = (key: keyof ParametrosCalculo, value: unknown) => {
    setParams({ [key]: value } as Partial<ParametrosCalculo>);
  };

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-900 text-yellow-400 rounded-full w-9 h-9 flex items-center justify-center font-bold">
            3
          </div>
          <h1 className="text-2xl font-bold text-blue-900">Cargas &amp; Cálculos</h1>
        </div>
        <p className="text-gray-500 text-sm">
          Dimensionamento conforme NBR 5410:2005 · Tabelas 36, 38, 40, 43 e 54 · Cemig ND-5.5
        </p>
      </div>

      {/* Parâmetros */}
      <div className="card">
        <h2 className="font-semibold text-blue-900 mb-4">⚙️ Parâmetros de Cálculo</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Tensão (V)</label>
            <select
              className="select-field"
              value={params.tensaoV}
              onChange={(e) => handleParam("tensaoV", Number(e.target.value) as 127 | 220 | 380)}
            >
              <option value={127}>127V</option>
              <option value={220}>220V</option>
              <option value={380}>380V</option>
            </select>
          </div>
          <div>
            <label className="label">Método de Instalação</label>
            <select
              className="select-field"
              value={params.tipoInstalacao}
              onChange={(e) =>
                handleParam(
                  "tipoInstalacao",
                  e.target.value as ParametrosCalculo["tipoInstalacao"]
                )
              }
            >
              <option value="Eletroduto embutido">Eletroduto embutido</option>
              <option value="Eletroduto aparente">Eletroduto aparente</option>
              <option value="Cabo em bandeja">Cabo em bandeja</option>
            </select>
          </div>
          <div>
            <label className="label">Temperatura Ambiente (°C)</label>
            <select
              className="select-field"
              value={params.tempAmbiente}
              onChange={(e) => handleParam("tempAmbiente", Number(e.target.value))}
            >
              {[25, 30, 35, 40, 45, 50].map((t) => (
                <option key={t} value={t}>{t}°C</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Botão calcular */}
      <button
        className="btn-primary flex items-center justify-center gap-2 mb-6"
        onClick={calcular}
      >
        <Zap className="w-5 h-5" />
        CALCULAR PROJETO COMPLETO
      </button>

      {/* Alertas do sistema */}
      {calculado && alertas.length > 0 && (
        <div className="space-y-2 mb-6">
          {alertas.map((a, i) => (
            <div key={i} className="alerta-warning flex gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
              <span>{a}</span>
            </div>
          ))}
        </div>
      )}

      {calculado && (
        <>
          {/* Cards demanda */}
          {demanda && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                { label: "Carga Instalada", value: `${(demanda.cargaInstaladaW / 1000).toFixed(1)} kW` },
                { label: "Demanda Calculada", value: `${(demanda.demandaW / 1000).toFixed(1)} kW` },
                { label: "Corrente Total", value: `${demanda.correnteA.toFixed(1)} A` },
                { label: "Disjuntor Geral", value: `${demanda.disjuntorGeralA} A` },
              ].map((item) => (
                <div key={item.label} className="card text-center py-4">
                  <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                  <p className="text-2xl font-bold text-blue-900">{item.value}</p>
                </div>
              ))}
            </div>
          )}

          {demanda && (
            <div className="alerta-info mb-6 text-sm">
              <strong>Ramal de entrada:</strong> {demanda.condutorEntrada} &nbsp;|&nbsp;
              Iz = {demanda.izEntradaA}A ≥ DG {demanda.disjuntorGeralA}A ✅
            </div>
          )}

          {/* Tabela de resultados por cômodo */}
          <div className="card p-0 overflow-hidden mb-6">
            <div className="px-5 py-4 bg-blue-900 text-white font-semibold text-sm">
              Previsão de Carga por Cômodo — NBR 5410:2005 item 4.2 / Cemig ND-5.5
            </div>
            <div className="overflow-x-auto">
              <table className="tabela-projeto">
                <thead>
                  <tr>
                    <th>Cômodo</th>
                    <th>Área</th>
                    <th>Lux</th>
                    <th>Luminário</th>
                    <th className="text-right">Lâmp.</th>
                    <th className="text-right">TUG</th>
                    <th className="text-right">Cg.Ilum</th>
                    <th className="text-right">Cg.TUG</th>
                    <th className="text-right">Cg.TUE</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {resultados.map((r, i) => (
                    <tr key={i}>
                      <td className="font-medium">{r.comodo}</td>
                      <td>{r.areaM2}m²</td>
                      <td>{r.luxRequerido}</td>
                      <td className="text-xs">{r.luminario}</td>
                      <td className="text-right">{r.numLampadas}</td>
                      <td className="text-right">{r.numTomadas}</td>
                      <td className="text-right">{r.cargaIlumW}W</td>
                      <td className="text-right">{r.cargaTugW}W</td>
                      <td className="text-right">{r.cargaTueW}W</td>
                      <td className="text-right font-semibold">{r.cargaTotalW}W</td>
                    </tr>
                  ))}
                  <tr className="bg-blue-900 text-white font-bold">
                    <td colSpan={9} className="px-3 py-2">TOTAL</td>
                    <td className="text-right px-3 py-2">
                      {resultados.reduce((s, r) => s + r.cargaTotalW, 0)}W
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabela de circuitos */}
          <div className="card p-0 overflow-hidden mb-6">
            <div className="px-5 py-4 bg-blue-900 text-white font-semibold text-sm">
              Dimensionamento de Circuitos — NBR 5410:2005 Tabelas 36, 38, 40 e 54
            </div>
            <div className="overflow-x-auto">
              <table className="tabela-projeto">
                <thead>
                  <tr>
                    <th>Circ.</th>
                    <th>Tipo</th>
                    <th>Descrição</th>
                    <th className="text-right">Carga</th>
                    <th className="text-right">I (A)</th>
                    <th>Bitola</th>
                    <th>Condutor</th>
                    <th className="text-right">Disj.</th>
                    <th className="text-right">DR</th>
                    <th className="text-right">ΔV%</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {circuitos.map((c, i) => (
                    <tr key={i}>
                      <td className="font-mono font-bold text-blue-900">{c.circ}</td>
                      <td>
                        <span
                          className={
                            c.tipo === "Iluminação"
                              ? "text-yellow-700 font-medium text-xs"
                              : c.tipo === "TUG"
                              ? "text-blue-700 font-medium text-xs"
                              : "text-red-700 font-medium text-xs"
                          }
                        >
                          {c.tipo}
                        </span>
                      </td>
                      <td className="text-xs max-w-[160px] truncate">{c.descricao}</td>
                      <td className="text-right text-sm">{c.cargaW}W</td>
                      <td className="text-right text-sm">{c.correnteA}</td>
                      <td className="text-sm font-mono">{c.bitolaMm2}</td>
                      <td className="text-xs font-mono">{c.condutor}</td>
                      <td className="text-right text-sm">{c.disjuntorA}A</td>
                      <td className="text-right text-xs">{c.dr}</td>
                      <td className="text-right text-sm">{c.deltaVPercent}%</td>
                      <td className={c.situacao === "✅ OK" ? "badge-ok" : "badge-revisar"}>
                        {c.situacao}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Avançar */}
          <button
            className="btn-primary flex items-center justify-center gap-2"
            onClick={() => router.push("/planta")}
          >
            <span>Próximo: Planta Elétrica</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
}
