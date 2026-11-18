import { CalendarDays, TrendingDown, TrendingUp } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  DIAS_SEMANA_ABREV,
  MESES_ABREV,
  agoraNoFuso,
  diaDaSemana,
  formatarHora,
  partesDaData,
  somarDias,
} from "@/lib/datas";
import { formatarBRL, formatarMilhar } from "@/lib/dinheiro";
import { PERIODOS, faturamentoPorDia, resumoPainel, type Periodo } from "@/lib/metricas";
import { exigirBarbearia, listarAgendamentos, listarBarbeiros, listarServicos } from "@/lib/repositorio";
import { lerTexto, type SearchParams } from "@/lib/reserva";
import type { StatusAgendamento } from "@/lib/tipos";

export const metadata: Metadata = { title: "Painel" };

const ESTILO_STATUS: Partial<Record<StatusAgendamento, { rotulo: string; classe: string }>> = {
  confirmado: { rotulo: "Confirmado", classe: "bg-sucesso-escuro text-sucesso" },
  aguardando: { rotulo: "Aguardando", classe: "bg-ouro-escuro text-ouro-claro" },
};

function ehPeriodo(v: unknown): v is Periodo {
  return PERIODOS.some((p) => p.valor === v);
}

export default async function Painel({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const p = lerTexto((await searchParams).periodo);
  const periodo: Periodo = ehPeriodo(p) ? p : "hoje";

  const barbearia = await exigirBarbearia(slug);
  const agora = agoraNoFuso(barbearia.fuso);
  const [agendamentos, barbeiros, servicos] = await Promise.all([
    listarAgendamentos(barbearia.id, { de: somarDias(agora.data, -60), ate: agora.data }),
    listarBarbeiros(barbearia.id),
    listarServicos(barbearia.id),
  ]);

  const resumo = resumoPainel(agendamentos, barbeiros, servicos, periodo, agora);
  const serie = faturamentoPorDia(agendamentos, agora);
  const maior = Math.max(...serie.map((d) => d.valor), 1);
  const total7 = serie.reduce((t, d) => t + d.valor, 0);

  const proximos = agendamentos
    .filter((a) => a.data === agora.data && a.inicio >= agora.minutos && (a.status === "confirmado" || a.status === "aguardando"))
    .slice(0, 5);

  const subiu = (resumo.variacaoPercentual ?? 0) >= 0;

  return (
    <>
      <header className="flex items-end justify-between">
        <div>
          <p className="rotulo text-ouro">Administrador</p>
          <h1 className="titulo">Painel</h1>
        </div>
        <span className="flex items-center gap-2 rounded-2xl border border-borda bg-superficie px-4 py-3 font-semibold">
          <CalendarDays aria-hidden className="size-5 text-ouro" />
          {DIAS_SEMANA_ABREV[diaDaSemana(agora.data)]}, {partesDaData(agora.data).dia} {MESES_ABREV[partesDaData(agora.data).mes]}
        </span>
      </header>

      <nav className="cartao mt-5 grid grid-cols-3 gap-1 p-1.5" aria-label="Período">
        {PERIODOS.map((item) => (
          <Link
            key={item.valor}
            href={`/${slug}/admin?periodo=${item.valor}`}
            scroll={false}
            aria-current={periodo === item.valor ? "page" : undefined}
            className={`rounded-2xl py-2.5 text-center font-semibold transition-colors ${periodo === item.valor ? "bg-ouro text-black" : "text-suave hover:text-texto"}`}
          >
            {item.rotulo}
          </Link>
        ))}
      </nav>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-3xl border border-ouro/40 bg-ouro-escuro/50 p-5">
          <p className="text-sm text-suave">Faturamento</p>
          <p className="mt-1 text-3xl font-extrabold text-ouro-claro">{formatarBRL(resumo.faturamento, { compacto: true })}</p>
          {resumo.variacaoPercentual !== null && (
            <p className={`mt-2 flex items-center gap-1 text-sm font-semibold ${subiu ? "text-sucesso" : "text-red-400"}`}>
              {subiu ? <TrendingUp aria-hidden className="size-4" /> : <TrendingDown aria-hidden className="size-4" />}
              {subiu ? "+" : ""}
              {resumo.variacaoPercentual}% {resumo.rotuloComparacao}
            </p>
          )}
        </div>
        <div className="cartao p-5">
          <p className="text-sm text-suave">Agendamentos</p>
          <p className="mt-1 text-3xl font-extrabold">{resumo.total}</p>
          <p className="mt-2 text-sm text-suave">
            {resumo.atendidos} atendidos · {resumo.aSeguir} a seguir
          </p>
        </div>
        <div className="cartao p-5">
          <p className="text-sm text-suave">Ticket médio</p>
          <p className="mt-1 text-3xl font-extrabold">{formatarBRL(resumo.ticketMedio)}</p>
          {resumo.servicoLider && <p className="mt-2 text-sm text-suave">{resumo.servicoLider.split(" ")[0]} lidera vendas</p>}
        </div>
        <div className="cartao p-5">
          <p className="text-sm text-suave">Ocupação</p>
          <p className="mt-1 text-3xl font-extrabold">{Math.round(resumo.ocupacao * 100)}%</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-borda">
            <div className="h-full rounded-full bg-ouro" style={{ width: `${resumo.ocupacao * 100}%` }} />
          </div>
        </div>
      </div>

      <section className="cartao mt-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Faturamento · 7 dias</h2>
          <span className="font-bold text-ouro-claro">{formatarBRL(total7, { compacto: true })}</span>
        </div>
        <ol className="mt-6 grid h-48 grid-cols-7 items-end gap-2 md:gap-4">
          {serie.map((d, i) => {
            const ehHoje = i === serie.length - 1;
            return (
              <li key={d.data} className="flex h-full flex-col justify-end gap-2" title={`${d.rotulo}: ${formatarBRL(d.valor)}`}>
                <div
                  className={`relative flex justify-center rounded-lg ${d.valor === 0 ? "bg-borda" : ehHoje ? "bg-ouro" : "bg-ouro/30"}`}
                  style={{ height: d.valor === 0 ? 4 : `${(d.valor / maior) * 100}%` }}
                >
                  {ehHoje && d.valor > 0 && (
                    <span className="pt-1.5 text-xs font-bold text-black/60">{formatarMilhar(d.valor)}</span>
                  )}
                </div>
                <span className={`text-center text-sm ${ehHoje ? "font-bold text-ouro-claro" : d.valor === 0 ? "text-apagado" : "text-suave"}`}>
                  {d.rotulo}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-bold">Próximos atendimentos</h2>
        <div className="space-y-3">
          {proximos.map((a) => {
            const estilo = ESTILO_STATUS[a.status];
            return (
              <div key={a.id} className="cartao flex items-center gap-4 p-4">
                <span className="w-16 text-xl font-extrabold text-ouro-claro">{formatarHora(a.inicio)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-bold">{a.clienteNome}</p>
                  <p className="truncate text-sm text-suave">
                    {a.servicoIds.map((id) => servicos.find((s) => s.id === id)?.nome).join(" + ")} ·{" "}
                    {barbeiros.find((b) => b.id === a.barbeiroId)?.nome.split(" ")[0]}
                  </p>
                </div>
                {estilo && <span className={`rounded-lg px-3 py-1.5 text-sm font-bold ${estilo.classe}`}>{estilo.rotulo}</span>}
              </div>
            );
          })}
          {proximos.length === 0 && <p className="cartao p-6 text-center text-suave">Nenhum atendimento restante hoje.</p>}
        </div>
      </section>
    </>
  );
}
