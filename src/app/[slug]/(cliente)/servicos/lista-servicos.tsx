"use client";

import { Check, ChevronRight, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { MiniaturaServico } from "@/components/icone-servico";
import { formatarBRL } from "@/lib/dinheiro";
import { duracaoTotal, precoTotal } from "@/lib/disponibilidade";
import type { Categoria, Servico } from "@/lib/tipos";

const CATEGORIAS: { valor: Categoria | "todos"; rotulo: string }[] = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "cabelo", rotulo: "Cabelo" },
  { valor: "barba", rotulo: "Barba" },
  { valor: "combo", rotulo: "Combos" },
  { valor: "tratamento", rotulo: "Tratamentos" },
];

/** Remove acentos para "degrade" achar "degradê". */
const normalizar = (t: string) => t.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

interface Props {
  slug: string;
  servicos: Servico[];
  selecionadosIniciais: string[];
}

export function ListaServicos({ slug, servicos, selecionadosIniciais }: Props) {
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<Categoria | "todos">("todos");
  const [selecionados, setSelecionados] = useState<string[]>(selecionadosIniciais);

  const visiveis = useMemo(() => {
    const termo = normalizar(busca.trim());
    return servicos.filter(
      (s) =>
        (categoria === "todos" || s.categoria === categoria) &&
        (!termo || normalizar(`${s.nome} ${s.descricao}`).includes(termo)),
    );
  }, [servicos, busca, categoria]);

  const escolhidos = servicos.filter((s) => selecionados.includes(s.id));
  const alternar = (id: string) =>
    setSelecionados((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]));

  return (
    <>
      <label className="mt-5 flex items-center gap-3 rounded-2xl border border-borda bg-superficie px-4 py-3 focus-within:border-ouro/60">
        <Search aria-hidden className="size-5 text-suave" />
        <span className="sr-only">Buscar serviço</span>
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar corte, barba, tratamento..."
          className="w-full bg-transparent outline-none placeholder:text-apagado"
        />
      </label>

      <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]" role="tablist">
        {CATEGORIAS.map((c) => (
          <button
            key={c.valor}
            type="button"
            role="tab"
            aria-selected={categoria === c.valor}
            onClick={() => setCategoria(c.valor)}
            className={`shrink-0 rounded-full px-5 py-2 text-sm font-semibold transition-colors ${categoria === c.valor ? "bg-ouro text-black" : "border border-borda bg-superficie text-suave hover:text-texto"}`}
          >
            {c.rotulo}
          </button>
        ))}
      </div>

      <ul className="mt-5 space-y-3">
        {visiveis.map((s) => {
          const ativo = selecionados.includes(s.id);
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => alternar(s.id)}
                aria-pressed={ativo}
                className={`relative flex w-full items-center gap-4 rounded-3xl border p-4 text-left transition-colors ${ativo ? "border-ouro bg-ouro-escuro/50" : "border-borda bg-superficie hover:border-ouro/40"}`}
              >
                {s.maisVendido && (
                  <span className="absolute -top-px right-8 rounded-b-lg bg-ouro px-3 py-1 text-[11px] font-bold tracking-widest text-black uppercase">
                    Mais vendido
                  </span>
                )}
                <MiniaturaServico icone={s.icone} className="size-24 shrink-0 rounded-2xl" />
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold">{s.nome}</p>
                  <p className="text-sm text-suave">{s.descricao}</p>
                  <p className="mt-2 flex items-baseline gap-3">
                    <span className="text-sm text-suave">{s.duracaoMin} min</span>
                    <span className="text-lg font-bold text-ouro-claro">{formatarBRL(s.precoCentavos, { compacto: true })}</span>
                    {s.precoOriginalCentavos && (
                      <span className="text-sm text-apagado line-through">
                        {formatarBRL(s.precoOriginalCentavos, { compacto: true })}
                      </span>
                    )}
                  </p>
                </div>
                <span
                  aria-hidden
                  className={`flex size-12 shrink-0 items-center justify-center rounded-2xl border ${ativo ? "border-ouro bg-ouro text-black" : "border-ouro/40 text-ouro-claro"}`}
                >
                  {ativo ? <Check className="size-5" /> : <Plus className="size-5" />}
                </span>
              </button>
            </li>
          );
        })}
        {visiveis.length === 0 && <li className="py-10 text-center text-suave">Nenhum serviço encontrado.</li>}
      </ul>

      {escolhidos.length > 0 && (
        <div className="fixed inset-x-0 bottom-20 z-30 px-3 md:bottom-6">
          <div className="mx-auto flex max-w-lg items-center justify-between gap-3 rounded-3xl bg-ouro p-3 pl-6 text-black shadow-2xl shadow-black md:max-w-3xl">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase">
                {escolhidos.length} {escolhidos.length === 1 ? "serviço" : "serviços"} · {duracaoTotal(escolhidos)} min
              </p>
              <p className="text-xl font-extrabold">{formatarBRL(precoTotal(escolhidos))}</p>
            </div>
            <Link
              href={`/${slug}/agendar/profissional?servicos=${selecionados.join(",")}`}
              className="flex items-center gap-2 rounded-2xl bg-black px-6 py-4 font-bold text-texto"
            >
              Continuar <ChevronRight aria-hidden className="size-4" />
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
