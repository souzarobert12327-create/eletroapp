// components/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/store";
import {
  Home,
  Building2,
  Calculator,
  Map,
  FileText,
  Zap,
  BarChart3,
} from "lucide-react";
import clsx from "clsx";

const LINKS = [
  { href: "/",           label: "Dados da Obra",    icon: Home,        passo: 1 },
  { href: "/comodos",    label: "Cômodos",           icon: Building2,   passo: 2 },
  { href: "/calculos",   label: "Cargas & Cálculos", icon: Calculator,  passo: 3 },
  { href: "/planta",     label: "Planta Elétrica",   icon: Map,         passo: 4 },
  { href: "/unifilar",   label: "Diagrama Unifilar",  icon: BarChart3,   passo: 5 },
  { href: "/documentos", label: "Gerar Documentos",  icon: FileText,    passo: 6 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { state } = useApp();

  const temComodos   = state.comodos.length > 0;
  const temCalculo   = state.calculado;

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#0D47A1] text-white flex flex-col z-50 shadow-xl">
      {/* Logo */}
      <div className="p-6 border-b border-blue-800">
        <div className="flex items-center gap-3">
          <Zap className="w-8 h-8 text-yellow-400" />
          <div>
            <h1 className="font-bold text-lg leading-tight">EletrApp</h1>
            <p className="text-blue-300 text-xs">Residencial v2.0</p>
          </div>
        </div>
        <p className="text-blue-300 text-xs mt-3 leading-relaxed">
          NBR 5410:2005 · Cemig ND-5.5
        </p>
      </div>

      {/* Links */}
      <nav className="flex-1 p-4 space-y-1">
        {LINKS.map(({ href, label, icon: Icon, passo }) => {
          const ativo = pathname === href;

          // Bloqueia passos que dependem de cômodos ou cálculo
          const bloqueado =
            (passo >= 3 && !temComodos) ||
            (passo >= 4 && !temCalculo);

          return (
            <Link
              key={href}
              href={bloqueado ? "#" : href}
              onClick={(e) => bloqueado && e.preventDefault()}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                ativo
                  ? "bg-yellow-400 text-blue-900 shadow"
                  : bloqueado
                  ? "text-blue-500 cursor-not-allowed opacity-50"
                  : "text-blue-100 hover:bg-blue-800"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              <span
                className={clsx(
                  "text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold",
                  ativo ? "bg-blue-900 text-yellow-400" : "bg-blue-800 text-blue-300"
                )}
              >
                {passo}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Resumo rápido */}
      <div className="p-4 border-t border-blue-800 space-y-1 text-xs text-blue-300">
        <div className="flex justify-between">
          <span>Cômodos:</span>
          <span className="text-white font-semibold">{state.comodos.length}</span>
        </div>
        {state.calculado && state.demanda && (
          <>
            <div className="flex justify-between">
              <span>Carga total:</span>
              <span className="text-white font-semibold">
                {(state.demanda.cargaInstaladaW / 1000).toFixed(1)} kW
              </span>
            </div>
            <div className="flex justify-between">
              <span>Circuitos:</span>
              <span className="text-white font-semibold">
                {state.circuitos.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Disjuntor geral:</span>
              <span className="text-white font-semibold">
                {state.demanda.disjuntorGeralA}A
              </span>
            </div>
          </>
        )}
      </div>

      {/* Versão */}
      <div className="px-4 pb-4 text-xs text-blue-500 text-center">
        © 2026 EletrApp Residencial
      </div>
    </aside>
  );
}
