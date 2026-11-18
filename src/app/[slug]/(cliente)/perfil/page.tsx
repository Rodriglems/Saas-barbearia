import { SlidersHorizontal, Star } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { ItemAgendamento } from "@/components/item-agendamento";
import { MESES, agoraNoFuso, partesDaData } from "@/lib/datas";
import {
  CLIENTE_ATUAL_ID,
  exigirBarbearia,
  listarAgendamentos,
  listarBarbeiros,
  listarServicos,
  obterCliente,
} from "@/lib/repositorio";
import { lerTexto, type SearchParams } from "@/lib/reserva";
import type { NivelCliente } from "@/lib/tipos";

export const metadata: Metadata = { title: "Meu perfil" };

const NIVEL: Record<NivelCliente, string> = { bronze: "Membro bronze", prata: "Membro prata", ouro: "Membro ouro" };

export default async function Perfil({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const aba = lerTexto((await searchParams).aba) === "proximos" ? "proximos" : "historico";
  const barbearia = await exigirBarbearia(slug);
  const agora = agoraNoFuso(barbearia.fuso);

  const [cliente, servicos, barbeiros, todos] = await Promise.all([
    obterCliente(barbearia.id, CLIENTE_ATUAL_ID),
    listarServicos(barbearia.id),
    listarBarbeiros(barbearia.id),
    listarAgendamentos(barbearia.id, { clienteId: CLIENTE_ATUAL_ID }),
  ]);
  if (!cliente) notFound();

  const historico = todos.filter((a) => a.status === "atendido").reverse();
  const proximos = todos.filter(
    (a) => (a.status === "confirmado" || a.status === "aguardando") && (a.data > agora.data || (a.data === agora.data && a.inicio >= agora.minutos)),
  );

  // Barbeiro favorito = quem mais atendeu o cliente.
  const vezes = new Map<string, number>();
  for (const a of historico) vezes.set(a.barbeiroId, (vezes.get(a.barbeiroId) ?? 0) + 1);
  const favoritoId = [...vezes.entries()].sort((x, y) => y[1] - x[1])[0]?.[0];
  const favorito = barbeiros.find((b) => b.id === favoritoId);

  const desde = partesDaData(cliente.clienteDesde);
  const { atual, meta } = cliente.fidelidade;
  const lista = aba === "historico" ? historico : proximos;

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="titulo">Meu perfil</h1>
        <button type="button" className="botao-icone" aria-label="Configurações">
          <SlidersHorizontal aria-hidden className="size-5" />
        </button>
      </div>

      <section className="cartao mt-6 p-6">
        <div className="flex items-center gap-5">
          <Avatar iniciais={cliente.iniciais} variante="anel" tamanho="lg" />
          <div>
            <p className="text-2xl font-bold">{cliente.nome}</p>
            <p className="text-suave">
              Cliente desde {MESES[desde.mes]} de {desde.ano}
            </p>
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-ouro px-3 py-1 text-xs font-bold tracking-widest text-black uppercase">
              <Star aria-hidden className="size-3 fill-black" /> {NIVEL[cliente.nivel]}
            </span>
          </div>
        </div>
        <dl className="mt-6 grid grid-cols-3 divide-x divide-borda border-t border-borda pt-5 text-center">
          {[
            { valor: historico.length, rotulo: "Visitas" },
            { valor: cliente.pontos.toLocaleString("pt-BR"), rotulo: "Pontos" },
            { valor: favorito?.nome.split(" ")[0] ?? "—", rotulo: "Barbeiro favorito" },
          ].map((item) => (
            <div key={item.rotulo} className="px-2">
              <dd className="text-2xl font-extrabold text-ouro-claro">{item.valor}</dd>
              <dt className="text-xs text-suave md:text-sm">{item.rotulo}</dt>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-4 rounded-3xl border border-ouro/40 bg-ouro-escuro/50 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Cartão fidelidade</h2>
          <span className="font-bold text-ouro-claro">
            {atual} de {meta}
          </span>
        </div>
        <div
          className="mt-3 grid gap-1.5"
          style={{ gridTemplateColumns: `repeat(${meta}, 1fr)` }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={meta}
          aria-valuenow={atual}
          aria-label="Progresso do cartão fidelidade"
        >
          {Array.from({ length: meta }, (_, i) => (
            <span key={i} className={`h-2 rounded-full ${i < atual ? "bg-ouro" : "bg-borda"}`} />
          ))}
        </div>
        <p className="mt-3 text-sm text-texto/80">
          {atual >= meta
            ? "Seu próximo corte é por nossa conta!"
            : `Faltam ${meta - atual} ${meta - atual === 1 ? "corte" : "cortes"} para ganhar um corte grátis`}
        </p>
      </section>

      <nav className="cartao mt-6 grid grid-cols-2 gap-1 p-1.5" aria-label="Agendamentos">
        {[
          { valor: "proximos", rotulo: `Próximos (${proximos.length})` },
          { valor: "historico", rotulo: "Histórico" },
        ].map((t) => (
          <Link
            key={t.valor}
            href={`/${slug}/perfil?aba=${t.valor}`}
            scroll={false}
            aria-current={aba === t.valor ? "page" : undefined}
            className={`rounded-2xl py-3 text-center font-semibold transition-colors ${aba === t.valor ? "bg-ouro-escuro text-ouro-claro" : "text-suave hover:text-texto"}`}
          >
            {t.rotulo}
          </Link>
        ))}
      </nav>

      <div className="mt-4 space-y-3">
        {lista.map((a) => (
          <ItemAgendamento
            key={a.id}
            agendamento={a}
            servicos={servicos}
            barbeiros={barbeiros}
            modo={aba === "historico" ? "repetir" : "detalhe"}
            slug={slug}
          />
        ))}
        {lista.length === 0 && <p className="py-8 text-center text-suave">Nada por aqui ainda.</p>}
      </div>
    </>
  );
}
