import { CircleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { CabecalhoPasso } from "@/components/cabecalho-passo";
import { Calendario } from "@/components/calendario";
import {
  diasDoMes,
  ehDataISO,
  ehMesISO,
  formatarDataCurta,
  formatarDataLonga,
  formatarHora,
  mesDe,
  somarDias,
  somarMeses,
} from "@/lib/datas";
import { duracaoTotal, horariosDoBarbeiro, horariosSemPreferencia, type Horario } from "@/lib/disponibilidade";
import {
  contextoAgenda,
  exigirBarbearia,
  listarAgendamentos,
  listarBarbeiros,
  servicosPorIds,
} from "@/lib/repositorio";
import { comQuery, lerIds, lerTexto, type SearchParams } from "@/lib/reserva";
import type { DataISO } from "@/lib/tipos";
import { confirmarAgendamento } from "../acoes";

export const metadata: Metadata = { title: "Data e horário" };

const ERROS: Record<string, string> = {
  "horario-indisponivel": "Esse horário acabou de ser reservado. Escolha outro, por favor.",
  "servicos-invalidos": "Algum serviço não está mais disponível. Revise sua escolha.",
  "barbeiro-invalido": "Esse profissional não está disponível.",
};

export default async function Horario({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const barbearia = await exigirBarbearia(slug);

  const servicos = await servicosPorIds(barbearia.id, lerIds(query.servicos));
  if (servicos.length === 0) redirect(`/${slug}/servicos`);
  const servicoParam = servicos.map((s) => s.id).join(",");

  const ctx = contextoAgenda(barbearia);
  const hoje = ctx.agora.data;
  const limite = somarDias(hoje, barbearia.janelaDias);
  const [barbeiros, agendamentos] = await Promise.all([
    listarBarbeiros(barbearia.id),
    listarAgendamentos(barbearia.id, { de: hoje, ate: limite }),
  ]);

  const barbeiroParam = lerTexto(query.barbeiro);
  const barbeiro = barbeiros.find((b) => b.id === barbeiroParam) ?? null;
  if (barbeiroParam !== "qualquer" && !barbeiro) {
    redirect(`/${slug}/agendar/profissional?servicos=${servicoParam}`);
  }

  const duracao = duracaoTotal(servicos);
  const horariosDe = (data: DataISO): Horario[] =>
    barbeiro
      ? horariosDoBarbeiro(barbeiro, data, duracao, agendamentos, ctx)
      : horariosSemPreferencia(barbeiros, data, duracao, agendamentos, ctx);
  const temVaga = (data: DataISO) => data >= hoje && data <= limite && horariosDe(data).some((h) => h.livre);

  // Data escolhida: a da URL, ou o primeiro dia com vaga.
  const dataParam = lerTexto(query.data);
  let data: DataISO | null = ehDataISO(dataParam) && temVaga(dataParam) ? dataParam : null;
  if (!data && !dataParam) {
    for (let d = hoje; d <= limite && !data; d = somarDias(d, 1)) if (temVaga(d)) data = d;
  }

  const mesParam = lerTexto(query.mes);
  const mes = ehMesISO(mesParam) ? mesParam : mesDe(data ?? hoje);
  const dias = diasDoMes(mes).map((d) => ({ data: d, disponivel: temVaga(d) }));

  const horarios = data ? horariosDe(data) : [];
  const horaParam = Number(lerTexto(query.hora));
  const hora = horarios.find((h) => h.livre && h.inicio === horaParam)?.inicio ?? null;

  const base = { servicos: servicoParam, barbeiro: barbeiroParam };
  const url = (extra: Record<string, string | number | null>) => comQuery(`/${slug}/agendar/horario`, { ...base, ...extra });

  const grupos = [
    { titulo: "Manhã", lista: horarios.filter((h) => h.inicio < 12 * 60) },
    { titulo: "Tarde", lista: horarios.filter((h) => h.inicio >= 12 * 60 && h.inicio < 18 * 60) },
    { titulo: "Noite", lista: horarios.filter((h) => h.inicio >= 18 * 60) },
  ].filter((g) => g.lista.length > 0);

  const resumoServico = servicos.length === 1 ? servicos[0].nome.split(" ")[0] : `${servicos.length} serviços`;
  const erro = ERROS[lerTexto(query.erro) ?? ""];

  return (
    <>
      <CabecalhoPasso
        passo={3}
        voltar={`/${slug}/agendar/profissional?servicos=${servicoParam}&barbeiro=${barbeiroParam}`}
        centro={
          <span className="flex items-center gap-2 rounded-full border border-borda bg-superficie py-1.5 pr-4 pl-1.5">
            {barbeiro ? <Avatar iniciais={barbeiro.iniciais} variante="contorno" tamanho="sm" /> : null}
            <span className="font-semibold">
              {barbeiro ? barbeiro.nome.split(" ")[0] : "Sem preferência"} · {resumoServico}
            </span>
          </span>
        }
      />

      <h1 className="titulo mb-5">Data e horário</h1>

      {erro && (
        <p role="alert" className="mb-4 flex items-center gap-3 rounded-2xl border border-ouro/40 bg-ouro-escuro p-4 text-ouro-claro">
          <CircleAlert aria-hidden className="size-5 shrink-0" /> {erro}
        </p>
      )}

      <Calendario
        mes={mes}
        dias={dias}
        hoje={hoje}
        selecionada={data}
        hrefDia={(d) => url({ data: d, mes })}
        hrefMesAnterior={mes > mesDe(hoje) ? url({ mes: somarMeses(mes, -1) }) : null}
        hrefMesSeguinte={mes < mesDe(limite) ? url({ mes: somarMeses(mes, 1) }) : null}
      />

      {data ? (
        <section className="mt-6">
          <h2 className="text-lg font-bold">{formatarDataLonga(data)}</h2>
          {grupos.map((g) => (
            <div key={g.titulo} className="mt-4">
              <h3 className="rotulo mb-3">{g.titulo}</h3>
              <div className="grid grid-cols-4 gap-2 md:grid-cols-6">
                {g.lista.map((h) =>
                  h.livre ? (
                    <Link
                      key={h.inicio}
                      href={url({ data, mes, hora: h.inicio })}
                      scroll={false}
                      aria-current={h.inicio === hora ? "true" : undefined}
                      className={`rounded-2xl border py-4 text-center font-bold transition-colors ${h.inicio === hora ? "border-ouro bg-ouro text-black" : "border-borda bg-superficie hover:border-ouro/50"}`}
                    >
                      {formatarHora(h.inicio)}
                    </Link>
                  ) : (
                    <span
                      key={h.inicio}
                      className="rounded-2xl border border-borda/50 bg-superficie/40 py-4 text-center font-bold text-apagado line-through"
                    >
                      <span className="sr-only">Ocupado: </span>
                      {formatarHora(h.inicio)}
                    </span>
                  ),
                )}
              </div>
            </div>
          ))}
        </section>
      ) : (
        <p className="mt-6 text-center text-suave">
          {dataParam ? "Sem horários livres nesse dia. Escolha outra data." : "Sem horários livres nos próximos dias."}
        </p>
      )}

      <form
        action={confirmarAgendamento}
        className="fixed inset-x-0 bottom-0 z-20 border-t border-borda bg-fundo/95 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur"
      >
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="servicos" value={servicoParam} />
        <input type="hidden" name="barbeiro" value={barbeiroParam} />
        <input type="hidden" name="data" value={data ?? ""} />
        <input type="hidden" name="hora" value={hora ?? ""} />
        <button type="submit" disabled={!data || hora === null} className="botao-ouro mx-auto flex w-full max-w-lg text-lg md:max-w-2xl">
          {data && hora !== null ? `Confirmar · ${formatarDataCurta(data)} às ${formatarHora(hora)}` : "Escolha um horário"}
        </button>
      </form>
    </>
  );
}
