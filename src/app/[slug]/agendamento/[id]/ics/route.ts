/**
 * Gera um arquivo .ics: o formato que Google Agenda, Apple Calendário e
 * Outlook entendem para "adicionar ao calendário".
 */
import {
  CLIENTE_ATUAL_ID,
  listarBarbeiros,
  listarServicos,
  obterAgendamento,
  obterBarbearia,
} from "@/lib/repositorio";

const pad = (n: number) => String(n).padStart(2, "0");
const escapar = (t: string) => t.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");

/** "2026-11-21" + 930 min -> "20261121T153000" */
function dataHoraICS(data: string, minutos: number): string {
  return `${data.replaceAll("-", "")}T${pad(Math.floor(minutos / 60))}${pad(minutos % 60)}00`;
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const barbearia = await obterBarbearia(slug);
  const agendamento = barbearia ? await obterAgendamento(barbearia.id, id) : null;
  if (!barbearia || !agendamento || agendamento.clienteId !== CLIENTE_ATUAL_ID) {
    return new Response("Agendamento não encontrado", { status: 404 });
  }

  const [servicos, barbeiros] = await Promise.all([listarServicos(barbearia.id), listarBarbeiros(barbearia.id)]);
  const nomeServicos = agendamento.servicoIds.map((s) => servicos.find((x) => x.id === s)?.nome).join(" + ");
  const barbeiro = barbeiros.find((b) => b.id === agendamento.barbeiroId)?.nome ?? "";
  const agora = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");

  const linhas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Cadeira//Agendamentos//PT",
    "BEGIN:VEVENT",
    `UID:${agendamento.id}@cadeira`,
    `DTSTAMP:${agora}`,
    `DTSTART;TZID=${barbearia.fuso}:${dataHoraICS(agendamento.data, agendamento.inicio)}`,
    `DTEND;TZID=${barbearia.fuso}:${dataHoraICS(agendamento.data, agendamento.inicio + agendamento.duracaoMin)}`,
    `SUMMARY:${escapar(`${nomeServicos} · ${barbearia.nome}`)}`,
    `DESCRIPTION:${escapar(`Com ${barbeiro}. Código ${agendamento.codigo}.`)}`,
    `LOCATION:${escapar(barbearia.endereco)}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Lembrete do seu horário",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return new Response(linhas.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${agendamento.codigo}.ics"`,
    },
  });
}
