import Link from "next/link";
import { MESES_ABREV, formatarDataCurta, formatarHora, partesDaData } from "@/lib/datas";
import { formatarBRL } from "@/lib/dinheiro";
import type { Agendamento, Barbeiro, Servico, StatusAgendamento } from "@/lib/tipos";

const ROTULO_STATUS: Record<StatusAgendamento, string> = {
  confirmado: "Confirmado",
  aguardando: "Aguardando",
  atendido: "Atendido",
  cancelado: "Cancelado",
  faltou: "Não compareceu",
};

interface Props {
  agendamento: Agendamento;
  servicos: Servico[];
  barbeiros: Barbeiro[];
  /** "repetir": mostra botão para marcar de novo; "detalhe": mostra data e hora. */
  modo: "repetir" | "detalhe";
  slug: string;
}

export function ItemAgendamento({ agendamento: a, servicos, barbeiros, modo, slug }: Props) {
  const { dia, mes } = partesDaData(a.data);
  const barbeiro = barbeiros.find((b) => b.id === a.barbeiroId);
  const nomeServicos = a.servicoIds.map((id) => servicos.find((s) => s.id === id)?.nome).join(" + ");
  const cancelado = a.status === "cancelado" || a.status === "faltou";

  const conteudo = (
    <>
      <div className="w-12 shrink-0 border-r border-borda pr-4 text-center">
        <p className="font-serif text-3xl leading-none font-semibold">{dia}</p>
        <p className="mt-1 text-xs font-bold tracking-widest text-suave uppercase">{MESES_ABREV[mes]}</p>
      </div>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-lg font-bold ${cancelado ? "text-suave line-through" : ""}`}>{nomeServicos}</p>
        <p className="text-sm text-suave">
          {modo === "detalhe" && `${formatarDataCurta(a.data)} · ${formatarHora(a.inicio)} · `}
          {barbeiro?.nome.split(" ")[0]} · {formatarBRL(a.totalCentavos)}
        </p>
        {cancelado && <p className="mt-1 text-xs font-semibold text-apagado">{ROTULO_STATUS[a.status]}</p>}
      </div>
    </>
  );

  if (modo === "detalhe") {
    return (
      <Link href={`/${slug}/agendamento/${a.id}`} className="cartao flex items-center gap-4 p-4 transition-colors hover:border-ouro/40">
        {conteudo}
        <span className="rounded-lg bg-ouro-escuro px-3 py-1 text-xs font-bold text-ouro">{ROTULO_STATUS[a.status]}</span>
      </Link>
    );
  }

  return (
    <div className="cartao flex items-center gap-4 p-4">
      {conteudo}
      <Link
        href={`/${slug}/agendar/horario?servicos=${a.servicoIds.join(",")}&barbeiro=${a.barbeiroId}`}
        className="rounded-xl border border-ouro/40 bg-ouro-escuro px-4 py-2 text-sm font-bold text-ouro-claro transition-colors hover:border-ouro"
      >
        Repetir
      </Link>
    </div>
  );
}
