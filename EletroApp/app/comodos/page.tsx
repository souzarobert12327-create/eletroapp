// app/comodos/page.tsx — Passo 2: Cadastro de Cômodos
"use client";

"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useApp } from "@/lib/store";
import { useRouter } from "next/navigation";
import { TIPOS_COMODO } from "@/lib/constants";
import type { TipoComodo } from "@/lib/types";
import { Plus, Trash2, ArrowRight, LayoutGrid, Building2 } from "lucide-react";
import clsx from "clsx";

const COR_TIPO: Record<TipoComodo, string> = {
  Sala:              "bg-blue-100 text-blue-800",
  Cozinha:           "bg-yellow-100 text-yellow-800",
  Quarto:            "bg-purple-100 text-purple-800",
  Banheiro:          "bg-cyan-100 text-cyan-800",
  "Área de Serviço": "bg-indigo-100 text-indigo-800",
  Garagem:           "bg-stone-100 text-stone-800",
  "Hall/Circulação": "bg-green-100 text-green-800",
  Escritório:        "bg-orange-100 text-orange-800",
  Varanda:           "bg-teal-100 text-teal-800",
  Despensa:          "bg-gray-100 text-gray-700",
};

interface FormState {
  nome: string;
  tipo: TipoComodo;
  comprimento: string;
  largura: string;
  peDireito: string;
}

const FORM_INICIAL: FormState = {
  nome: "",
  tipo: "Sala",
  comprimento: "5.0",
  largura: "4.0",
  peDireito: "2.7",
};

export default function ComodosPage() {
  const { state, addComodo, removeComodo, clearComodos, loadExemplo } = useApp();
  const router = useRouter();
  const [form, setForm] = useState<FormState>(FORM_INICIAL);
  const [erro, setErro] = useState("");

  const areaPreview =
    parseFloat(form.comprimento) > 0 && parseFloat(form.largura) > 0
      ? (parseFloat(form.comprimento) * parseFloat(form.largura)).toFixed(2)
      : "—";

  const perimetroPreview =
    parseFloat(form.comprimento) > 0 && parseFloat(form.largura) > 0
      ? (2 * (parseFloat(form.comprimento) + parseFloat(form.largura))).toFixed(2)
      : "—";

  function handleAdd() {
    setErro("");
    const comp = parseFloat(form.comprimento);
    const larg = parseFloat(form.largura);
    const pd   = parseFloat(form.peDireito);

    if (isNaN(comp) || comp <= 0) return setErro("Comprimento inválido.");
    if (isNaN(larg) || larg <= 0) return setErro("Largura inválida.");
    if (isNaN(pd)   || pd < 2.0)  return setErro("Pé-direito mínimo: 2,00m.");

    const nome = form.nome.trim() || form.tipo;
    addComodo({
      nome,
      tipo: form.tipo,
      comprimento: comp,
      largura: larg,
      peDireito: pd,
      area: parseFloat((comp * larg).toFixed(2)),
      perimetro: parseFloat((2 * (comp + larg)).toFixed(2)),
    });

    // Limpa apenas nome e mantém tipo/dimensões para facilitar cadastro em série
    setForm((f) => ({ ...f, nome: "" }));
  }

  const areaTotal = state.comodos.reduce((s, c) => s + c.area, 0);

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-900 text-yellow-400 rounded-full w-9 h-9 flex items-center justify-center font-bold">
            2
          </div>
          <h1 className="text-2xl font-bold text-blue-900">Cômodos</h1>
        </div>
        <p className="text-gray-500 text-sm">
          Cadastre cada ambiente da residência com suas dimensões reais.
          O perímetro é calculado automaticamente e usado para dimensionar as tomadas (NBR 5410 item 9.4.1.1).
        </p>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Formulário de adição */}
        <div className="col-span-2">
          <div className="card sticky top-4">
            <div className="flex items-center gap-2 mb-5">
              <Plus className="w-5 h-5 text-blue-700" />
              <h2 className="font-semibold text-blue-900">Adicionar Cômodo</h2>
            </div>

            <div className="space-y-3">
              <div>
                <label className="label">Tipo do Cômodo</label>
                <select
                  className="select-field"
                  value={form.tipo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, tipo: e.target.value as TipoComodo }))
                  }
                >
                  {TIPOS_COMODO.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Nome personalizado</label>
                <input
                  className="input-field"
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex: Quarto 2, Banheiro Social"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Comprimento (m)</label>
                  <input
                    className="input-field"
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="50"
                    value={form.comprimento}
                    onChange={(e) => setForm((f) => ({ ...f, comprimento: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Largura (m)</label>
                  <input
                    className="input-field"
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="50"
                    value={form.largura}
                    onChange={(e) => setForm((f) => ({ ...f, largura: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="label">Pé-direito (m)</label>
                <input
                  className="input-field"
                  type="number"
                  step="0.1"
                  min="2.0"
                  max="6.0"
                  value={form.peDireito}
                  onChange={(e) => setForm((f) => ({ ...f, peDireito: e.target.value }))}
                />
              </div>

              {/* Preview */}
              <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-800 space-y-1">
                <div className="flex justify-between">
                  <span>Área:</span>
                  <span className="font-bold">{areaPreview} m²</span>
                </div>
                <div className="flex justify-between">
                  <span>Perímetro:</span>
                  <span className="font-bold">{perimetroPreview} m</span>
                </div>
              </div>

              {erro && (
                <p className="text-red-600 text-sm font-medium">⚠️ {erro}</p>
              )}

              <button className="btn-primary" onClick={handleAdd}>
                + Adicionar Cômodo
              </button>
            </div>
          </div>
        </div>

        {/* Lista de cômodos */}
        <div className="col-span-3">
          {/* Ações rápidas */}
          <div className="flex gap-3 mb-4">
            <button
              className="btn-secondary text-sm py-2"
              onClick={loadExemplo}
            >
              <LayoutGrid className="w-4 h-4 inline mr-1" />
              Exemplo (3 quartos)
            </button>
            {state.comodos.length > 0 && (
              <button
                className="btn-danger"
                onClick={clearComodos}
              >
                Limpar tudo
              </button>
            )}
          </div>

          {state.comodos.length === 0 ? (
            <div className="card text-center text-gray-400 py-12">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhum cômodo cadastrado.</p>
              <p className="text-xs mt-1">Adicione cômodos ou use o exemplo.</p>
            </div>
          ) : (
            <>
              {/* Resumo */}
              <div className="alerta-info mb-4">
                📐 <strong>{state.comodos.length}</strong> cômodo(s) ·{" "}
                Área total: <strong>{areaTotal.toFixed(1)} m²</strong>
              </div>

              {/* Tabela */}
              <div className="card p-0 overflow-hidden">
                <table className="tabela-projeto">
                  <thead>
                    <tr>
                      <th>Cômodo</th>
                      <th>Tipo</th>
                      <th className="text-right">Comp.</th>
                      <th className="text-right">Larg.</th>
                      <th className="text-right">Área</th>
                      <th className="text-right">Perim.</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.comodos.map((c) => (
                      <tr key={c.id}>
                        <td className="font-medium">{c.nome}</td>
                        <td>
                          <span
                            className={clsx(
                              "px-2 py-0.5 rounded-full text-xs font-medium",
                              COR_TIPO[c.tipo]
                            )}
                          >
                            {c.tipo}
                          </span>
                        </td>
                        <td className="text-right text-sm">{c.comprimento}m</td>
                        <td className="text-right text-sm">{c.largura}m</td>
                        <td className="text-right text-sm font-medium">
                          {c.area}m²
                        </td>
                        <td className="text-right text-sm">{c.perimetro}m</td>
                        <td className="text-right">
                          <button
                            className="btn-danger py-1 px-2 text-xs"
                            onClick={() => removeComodo(c.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Avançar */}
          {state.comodos.length > 0 && (
            <button
              className="btn-primary mt-4 flex items-center justify-center gap-2"
              onClick={() => router.push("/calculos")}
            >
              <span>Próximo: Calcular Projeto</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
