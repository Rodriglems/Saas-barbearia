import { Bell, CalendarPlus, Check, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { agoraNoFuso, formatarDataMedia, formatarHora, formatarQuando } from "@/lib/datas";
import { formatarBRL } from "@/lib/dinheiro";
import {
  CLIENTE_ATUAL_ID,
  exigirBarbearia,
  listarBarbeiros,
  listarServicos,
  obterAgendamento,
} from "@/lib/repositorio";
import { cancelar } from "../acoes";

export const metadata: Metadata = { title: "Agendamento" };

export default async function DetalheAgendamento({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const barbearia = await exigirBarbearia(slug);
  const agendamento = await obterAgendamento(barbearia.id, id);
  // Só o dono vê o agendamento.
  if (!agendamento || agendamento.clienteId !== CLIENTE_ATUAL_ID) notFound();

  const [servicos, barbeiros] = await Promise.all([listarServicos(barbearia.id), listarBarbeiros(barbearia.id)]);
  const agora = agoraNoFuso(barbearia.fuso);
  const barbeiro = barbeiros.find((b) => b.id === agendamento.barbeiroId);
  const cancelado = agendamento.status === "cancelado";
  const ativo =
    (agendamento.status === "confirmado" || agendamento.status === "aguardando") &&
    (agendamento.data > agora.data || (agendamento.data === agora.data && agendamento.inicio > agora.minutos));

  const linhas = [
    { rotulo: "Serviço", valor: agendamento.servicoIds.map((s) => servicos.find((x) => x.id === s)?.nome).join(" + ") },
    { rotulo: "Profissional", valor: barbeiro?.nome ?? "—" },
    { rotulo: "Data", valor: formatarDataMedia(agendamento.data) },
    { rotulo: "Horário", valor: `${formatarHora(agendamento.inicio)} – ${formatarHora(agendamento.inicio + agendamento.duracaoMin)}` },
    { rotulo: "Local", valor: barbearia.endereco },
  ];

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-10 md:max-w-xl">
      <div className="flex flex-col items-center text-center">
        <div className="relative flex size-32 items-center justify-center">
          <span aria-hidden className="absolute inset-0 rounded-full border border-ouro/25" />
          <span aria-hidden className="absolute inset-3 rounded-full border border-ouro/40" />
          <span
            className={`flex size-20 items-center justify-center rounded-full ${cancelado ? "bg-superficie-2 text-suave" : "bg-ouro text-black shadow-[0_0_60px_rgb(201_165_92/0.35)]"}`}
          >
            {cancelado ? <X aria-hidden className="size-9" /> : <Check aria-hidden className="size-9" strokeWidth={2.5} />}
          </span>
        </div>
        <h1 className="titulo mt-4 text-5xl">{cancelado ? "Agendamento cancelado" : "Agendamento confirmado"}</h1>
        <p className="mt-2 text-suave">
          {cancelado
            ? "O horário foi liberado. Quando quiser, é só marcar de novo."
            : `Te esperamos ${formatarQuando(agendamento.data, agora.data)}, ${agendamento.clienteNome.split(" ")[0]}.`}
        </p>
      </div>

      <section className="mt-8 overflow-hidden rounded-3xl border border-ouro/40 bg-superficie">
        <div className="flex items-center justify-between border-b border-dashed border-ouro/50 bg-ouro-escuro/50 px-6 py-5">
          <span className="font-serif text-2xl tracking-[0.2em] text-ouro-claro uppercase">{barbearia.nome}</span>
          <span className="text-sm font-bold text-suave">Nº {agendamento.codigo}</span>
        </div>
        <dl className="divide-y divide-borda px-6">
          {linhas.map((l) => (
            <div key={l.rotulo} className="flex justify-between gap-4 py-4">
              <dt className="text-suave">{l.rotulo}</dt>
              <dd className="text-right font-bold">{l.valor}</dd>
            </div>
          ))}
        </dl>
        <div className="m-3 flex items-center justify-between rounded-2xl bg-superficie-2 px-4 py-4">
          <span className="text-suave">Pagamento no local</span>
          <span className="text-xl font-extrabold text-ouro-claro">{formatarBRL(agendamento.totalCentavos)}</span>
        </div>
      </section>

      {ativo && (
        <p className="cartao mt-4 flex items-center gap-3 p-4 text-sm text-texto/85">
          <Bell aria-hidden className="size-5 shrink-0 text-ouro" />
          Você receberá um lembrete pelo WhatsApp 2 horas antes.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3">
        <Link href={`/${slug}/agenda`} className="botao-ouro text-lg">
          Ver meus agendamentos
        </Link>
        {ativo && (
          <a href={`/${slug}/agendamento/${agendamento.id}/ics`} className="botao-contorno text-lg">
            <CalendarPlus aria-hidden className="size-5" /> Adicionar ao calendário
          </a>
        )}
        {ativo && (
          <form action={cancelar} className="text-center">
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="id" value={agendamento.id} />
            <button type="submit" className="py-2 text-suave underline underline-offset-4 hover:text-texto">
              Cancelar agendamento
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
