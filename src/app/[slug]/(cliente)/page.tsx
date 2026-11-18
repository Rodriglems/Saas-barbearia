import { Bell, CalendarDays, ChevronRight, Star } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { MiniaturaServico } from "@/components/icone-servico";
import {
  MESES_ABREV,
  DIAS_SEMANA_ABREV,
  agoraNoFuso,
  diaDaSemana,
  formatarHora,
  formatarHoraCurta,
  partesDaData,
  saudacao,
} from "@/lib/datas";
import { formatarBRL } from "@/lib/dinheiro";
import {
  CLIENTE_ATUAL_ID,
  exigirBarbearia,
  listarAgendamentos,
  listarBarbeiros,
  listarServicos,
  obterCliente,
} from "@/lib/repositorio";
import type { Barbearia } from "@/lib/tipos";

function statusFuncionamento(barbearia: Barbearia) {
  const agora = agoraNoFuso(barbearia.fuso);
  const faixas = barbearia.funcionamento[diaDaSemana(agora.data)] ?? [];
  const atual = faixas.find((f) => agora.minutos >= f.inicio && agora.minutos < f.fim);
  if (atual) return { aberto: true, texto: `Aberto até ${formatarHoraCurta(atual.fim)}` };
  const proxima = faixas.find((f) => f.inicio > agora.minutos);
  if (proxima) return { aberto: false, texto: `Abre às ${formatarHoraCurta(proxima.inicio)}` };
  return { aberto: false, texto: "Fechado agora" };
}

export default async function Inicio({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const barbearia = await exigirBarbearia(slug);
  const agora = agoraNoFuso(barbearia.fuso);

  const [cliente, servicos, barbeiros, meus] = await Promise.all([
    obterCliente(barbearia.id, CLIENTE_ATUAL_ID),
    listarServicos(barbearia.id),
    listarBarbeiros(barbearia.id),
    listarAgendamentos(barbearia.id, { clienteId: CLIENTE_ATUAL_ID, de: agora.data }),
  ]);

  const proximo = meus.find(
    (a) =>
      (a.status === "confirmado" || a.status === "aguardando") &&
      (a.data > agora.data || a.inicio >= agora.minutos),
  );
  const status = statusFuncionamento(barbearia);
  const maisPedidos = servicos.filter((s) => s.maisPedido);
  const primeiroNome = cliente?.nome.split(" ")[0];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {cliente && <Avatar iniciais={cliente.iniciais} variante="contorno" />}
          <div>
            <p className="text-suave">{saudacao(agora.minutos)},</p>
            <p className="text-xl font-bold">{primeiroNome ?? "visitante"}</p>
          </div>
        </div>
        <button type="button" className="botao-icone relative" aria-label="Notificações">
          <Bell aria-hidden className="size-5" />
          <span className="absolute top-3 right-3 size-2 rounded-full bg-ouro" />
        </button>
      </header>

      {/* Cartão da barbearia */}
      <section className="relative overflow-hidden rounded-3xl border border-ouro/40 bg-superficie p-6 md:p-8">
        <div aria-hidden className="pointer-events-none absolute -top-24 -right-24">
          {[320, 250, 180].map((t) => (
            <span
              key={t}
              className="absolute rounded-full border border-ouro/15"
              style={{ width: t, height: t, top: (320 - t) / 2, left: (320 - t) / 2 }}
            />
          ))}
        </div>
        <div className="relative flex items-center gap-4">
          <Avatar iniciais={barbearia.iniciais} variante="ouro" tamanho="lg" />
          <div>
            <h1 className="font-serif text-4xl leading-none font-semibold tracking-[0.15em] text-ouro-claro uppercase md:text-5xl">
              {barbearia.nome}
            </h1>
            <p className="rotulo mt-2">{barbearia.subtitulo}</p>
          </div>
        </div>
        <div className="relative mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="flex items-center gap-1.5">
            <Star aria-hidden className="size-4 fill-ouro text-ouro" />
            <strong>{barbearia.avaliacao.toLocaleString("pt-BR")}</strong>
            <span className="text-suave">({barbearia.totalAvaliacoes.toLocaleString("pt-BR")})</span>
          </span>
          <span aria-hidden className="size-1 rounded-full bg-apagado" />
          <span className="flex items-center gap-1.5 text-suave">
            <span className={`size-2 rounded-full ${status.aberto ? "bg-sucesso" : "bg-apagado"}`} />
            {status.texto}
          </span>
        </div>
        <Link href={`/${slug}/servicos`} className="botao-ouro relative mt-6 w-full text-lg">
          <CalendarDays aria-hidden className="size-5" />
          Agendar horário
        </Link>
      </section>

      {proximo && (
        <Link href={`/${slug}/agendamento/${proximo.id}`} className="cartao flex items-center gap-4 p-4 transition-colors hover:border-ouro/40">
          <div className="flex w-16 shrink-0 flex-col items-center rounded-2xl border border-ouro/40 bg-ouro-escuro py-2">
            <span className="text-xs font-bold text-ouro uppercase">{DIAS_SEMANA_ABREV[diaDaSemana(proximo.data)]}</span>
            <span className="font-serif text-2xl leading-tight font-semibold">{partesDaData(proximo.data).dia}</span>
            <span className="text-xs text-suave uppercase">{MESES_ABREV[partesDaData(proximo.data).mes]}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="rotulo">Próximo horário</p>
            <p className="truncate text-lg font-bold">
              {proximo.servicoIds.map((id) => servicos.find((s) => s.id === id)?.nome).join(" + ")}
            </p>
            <p className="text-suave">
              {formatarHora(proximo.inicio)} · com {barbeiros.find((b) => b.id === proximo.barbeiroId)?.nome}
            </p>
          </div>
          <ChevronRight aria-hidden className="size-5 text-ouro" />
        </Link>
      )}

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-serif text-3xl font-semibold">Mais pedidos</h2>
          <Link href={`/${slug}/servicos`} className="font-semibold text-ouro">
            Ver todos
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {maisPedidos.map((s) => (
            <Link
              key={s.id}
              href={`/${slug}/agendar/profissional?servicos=${s.id}`}
              className={`overflow-hidden rounded-3xl border bg-superficie transition-colors hover:border-ouro/60 ${s.maisVendido ? "border-ouro/50" : "border-borda"}`}
            >
              <MiniaturaServico icone={s.icone} className="h-24" />
              <div className="p-3 md:p-4">
                <p className="font-bold leading-snug">{s.nome}</p>
                <p className="mt-1 font-bold text-ouro-claro">{formatarBRL(s.precoCentavos, { compacto: true })}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
