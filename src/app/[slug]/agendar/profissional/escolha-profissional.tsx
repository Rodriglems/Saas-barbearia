"use client";

import { Check, ChevronRight, Star, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/avatar";

export interface OpcaoBarbeiro {
  id: string;
  nome: string;
  iniciais: string;
  descricao: string;
  avaliacao: number;
  totalAvaliacoes: number;
  especialidades: string[];
  /** Mensagem quando o barbeiro está ausente (null = disponível). */
  indisponivel: string | null;
  proximo: string | null;
}

const QUALQUER = "qualquer";

function Marcador({ ativo }: { ativo: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 ${ativo ? "border-ouro bg-ouro text-black" : "border-apagado"}`}
    >
      {ativo && <Check className="size-4" strokeWidth={3} />}
    </span>
  );
}

interface Props {
  slug: string;
  servicoIds: string[];
  opcoes: OpcaoBarbeiro[];
  inicial: string | null;
}

export function EscolhaProfissional({ slug, servicoIds, opcoes, inicial }: Props) {
  const valido = inicial === QUALQUER || opcoes.some((o) => o.id === inicial && !o.indisponivel);
  const [escolha, setEscolha] = useState<string | null>(valido ? inicial : null);
  const escolhido = opcoes.find((o) => o.id === escolha);

  const textoBotao =
    escolha === QUALQUER ? "Continuar sem preferência" : escolhido ? `Continuar com ${escolhido.nome.split(" ")[0]}` : "Escolha um profissional";

  return (
    <>
      <div className="mt-6 space-y-3" role="radiogroup" aria-label="Profissional">
        <button
          type="button"
          role="radio"
          aria-checked={escolha === QUALQUER}
          onClick={() => setEscolha(QUALQUER)}
          className={`flex w-full items-center gap-4 rounded-3xl border border-dashed p-4 text-left transition-colors ${escolha === QUALQUER ? "border-ouro bg-ouro-escuro/50" : "border-borda bg-superficie/50 hover:border-ouro/40"}`}
        >
          <span className="flex size-14 items-center justify-center rounded-full bg-superficie-2 text-ouro">
            <Users aria-hidden className="size-6" />
          </span>
          <span className="flex-1">
            <span className="block text-lg font-bold">Sem preferência</span>
            <span className="text-sm text-suave">Primeiro horário disponível</span>
          </span>
          <Marcador ativo={escolha === QUALQUER} />
        </button>

        {opcoes.map((o) => {
          const ativo = escolha === o.id;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={ativo}
              disabled={o.indisponivel !== null}
              onClick={() => setEscolha(o.id)}
              className={`w-full rounded-3xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${ativo ? "border-ouro bg-ouro-escuro/50" : "border-borda bg-superficie hover:border-ouro/40"}`}
            >
              <span className="flex items-center gap-4">
                <Avatar iniciais={o.iniciais} variante={ativo ? "anel" : "neutro"} tamanho="lg" />
                <span className="min-w-0 flex-1">
                  <span className="block text-xl font-bold">{o.nome}</span>
                  {o.indisponivel ? (
                    <span className="text-suave">{o.indisponivel}</span>
                  ) : (
                    <>
                      <span className="block text-suave">{o.descricao}</span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-sm">
                        <Star aria-hidden className="size-4 fill-ouro text-ouro" />
                        <strong>{o.avaliacao.toLocaleString("pt-BR")}</strong>
                        <span className="text-suave">· {o.totalAvaliacoes} avaliações</span>
                      </span>
                    </>
                  )}
                </span>
                {!o.indisponivel && <Marcador ativo={ativo} />}
              </span>
              {ativo && (
                <span className="mt-4 flex flex-wrap items-center gap-2">
                  {o.especialidades.map((e) => (
                    <span key={e} className="rounded-lg bg-ouro-escuro px-3 py-1.5 text-sm font-bold text-ouro-claro">
                      {e}
                    </span>
                  ))}
                  {o.proximo && <span className="ml-auto text-sm text-suave">Próximo: {o.proximo}</span>}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-borda bg-fundo/95 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
        <Link
          href={escolha ? `/${slug}/agendar/horario?servicos=${servicoIds.join(",")}&barbeiro=${escolha}` : "#"}
          aria-disabled={!escolha}
          className="botao-ouro mx-auto flex w-full max-w-lg text-lg md:max-w-2xl"
        >
          {textoBotao} <ChevronRight aria-hidden className="size-5" />
        </Link>
      </div>
    </>
  );
}
