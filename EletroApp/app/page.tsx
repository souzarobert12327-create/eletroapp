// app/page.tsx  — Passo 1: Dados da Obra
"use client";

import { useApp } from "@/lib/store";
import { useRouter } from "next/navigation";
import { Building2, ArrowRight, Zap } from "lucide-react";
import type { TensaoAlimentacao, SistemaEletrico } from "@/lib/types";

export default function DadosObraPage() {
  const { state, setDadosObra } = useApp();
  const { dadosObra } = state;
  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setDadosObra({ [name]: value } as Partial<typeof dadosObra>);
  };

  const podeAvancar =
    dadosObra.proprietario.trim() !== "" &&
    dadosObra.responsavel.trim() !== "";

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-900 text-yellow-400 rounded-full w-9 h-9 flex items-center justify-center font-bold">
            1
          </div>
          <h1 className="text-2xl font-bold text-blue-900">Dados da Obra</h1>
        </div>
        <p className="text-gray-500 text-sm">
          Informações do projeto e responsável técnico — aparecerão em todos os documentos gerados.
        </p>
      </div>

      {/* Dados do proprietário */}
      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <Building2 className="w-5 h-5 text-blue-700" />
          <h2 className="font-semibold text-blue-900">Dados da Edificação</h2>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="label">Proprietário *</label>
            <input
              className="input-field"
              name="proprietario"
              value={dadosObra.proprietario}
              onChange={handleChange}
              placeholder="Nome completo do proprietário"
            />
          </div>
          <div>
            <label className="label">Endereço completo</label>
            <input
              className="input-field"
              name="endereco"
              value={dadosObra.endereco}
              onChange={handleChange}
              placeholder="Rua, número, bairro, cidade/UF"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tensão de Alimentação</label>
              <select
                className="select-field"
                name="tensao"
                value={dadosObra.tensao}
                onChange={handleChange}
              >
                <option value="127/220V">127/220V (padrão Cemig)</option>
                <option value="220/380V">220/380V</option>
              </select>
            </div>
            <div>
              <label className="label">Sistema Elétrico</label>
              <select
                className="select-field"
                name="fases"
                value={dadosObra.fases}
                onChange={handleChange}
              >
                <option value="Monofásico (1F+N)">Monofásico (1F+N)</option>
                <option value="Bifásico (2F+N)">Bifásico (2F+N)</option>
                <option value="Trifásico (3F+N)">Trifásico (3F+N)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Concessionária</label>
              <input
                className="input-field"
                name="concessionaria"
                value={dadosObra.concessionaria}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="label">Data do Projeto</label>
              <input
                className="input-field"
                type="text"
                name="data"
                value={dadosObra.data}
                onChange={handleChange}
                placeholder="dd/mm/aaaa"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Dados técnicos */}
      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <Zap className="w-5 h-5 text-blue-700" />
          <h2 className="font-semibold text-blue-900">Responsável Técnico</h2>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="label">Engenheiro / Técnico Responsável *</label>
            <input
              className="input-field"
              name="responsavel"
              value={dadosObra.responsavel}
              onChange={handleChange}
              placeholder="Eng. Nome Sobrenome"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">CREA</label>
              <input
                className="input-field"
                name="crea"
                value={dadosObra.crea}
                onChange={handleChange}
                placeholder="CREA/MG 12345"
              />
            </div>
            <div>
              <label className="label">ART / TRT</label>
              <input
                className="input-field"
                name="art"
                value={dadosObra.art}
                onChange={handleChange}
                placeholder="ART 2026/000001"
              />
            </div>
          </div>
          <div>
            <label className="label">Norma de Referência</label>
            <input
              className="input-field"
              name="norma"
              value={dadosObra.norma}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      {/* Aviso bifásico */}
      {dadosObra.fases === "Monofásico (1F+N)" && (
        <div className="alerta-warning">
          ⚠️ <strong>Atenção:</strong> Para projetos residenciais com múltiplos equipamentos
          (chuveiro, ar-condicionado, fogão elétrico), o sistema <strong>Bifásico (2F+N)</strong> é
          o mais adequado conforme Cemig ND-5.5.
        </div>
      )}

      {/* Botão avançar */}
      <button
        className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!podeAvancar}
        onClick={() => router.push("/comodos")}
      >
        <span>Próximo: Cadastrar Cômodos</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
