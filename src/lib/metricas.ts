/** Números do painel do administrador. Funções puras, como em disponibilidade.ts. */
import type { Agora } from "./datas";
import { DIAS_SEMANA_ABREV, diaDaSemana, somarDias } from "./datas";
import { estaAusente, minutosDeTrabalho } from "./disponibilidade";
import type { Agendamento, Barbeiro, DataISO, Servico } from "./tipos";

export type Periodo = "hoje" | "semana" | "mes";

export const PERIODOS: { valor: Periodo; rotulo: string; dias: number }[] = [
  { valor: "hoje", rotulo: "Hoje", dias: 1 },
  { valor: "semana", rotulo: "Semana", dias: 7 },
  { valor: "mes", rotulo: "Mês", dias: 30 },
];

/** Faltas e cancelamentos não geram receita. */
function conta(a: Agendamento): boolean {
  return a.status !== "cancelado" && a.status !== "faltou";
}

function noIntervalo(a: Agendamento, de: DataISO, ate: DataISO): boolean {
  return a.data >= de && a.data <= ate;
}

function faturamento(ags: Agendamento[]): number {
  return ags.reduce((t, a) => t + a.totalCentavos, 0);
}

export interface ResumoPainel {
  faturamento: number;
  variacaoPercentual: number | null;
  rotuloComparacao: string;
  total: number;
  atendidos: number;
  aSeguir: number;
  ticketMedio: number;
  ocupacao: number;
  servicoLider: string | null;
}

export function resumoPainel(
  agendamentos: Agendamento[],
  barbeiros: Barbeiro[],
  servicos: Servico[],
  periodo: Periodo,
  agora: Agora,
): ResumoPainel {
  const dias = PERIODOS.find((p) => p.valor === periodo)!.dias;
  const ate = agora.data;
  // "Hoje" compara com o mesmo dia da semana passada; os outros, com o período anterior.
  const recuo = periodo === "hoje" ? 7 : dias;
  const de = somarDias(ate, -(dias - 1));

  const atuais = agendamentos.filter((a) => noIntervalo(a, de, ate) && conta(a));
  const anteriores = agendamentos.filter(
    (a) => noIntervalo(a, somarDias(de, -recuo), somarDias(ate, -recuo)) && conta(a),
  );

  const valor = faturamento(atuais);
  const valorAnterior = faturamento(anteriores);

  let capacidade = 0;
  for (let d = de; d <= ate; d = somarDias(d, 1)) {
    for (const b of barbeiros) if (!estaAusente(b, d)) capacidade += minutosDeTrabalho(b.expediente, d);
  }
  const minutosOcupados = atuais.reduce((t, a) => t + a.duracaoMin, 0);

  const contagem = new Map<string, number>();
  for (const a of atuais) for (const id of a.servicoIds) contagem.set(id, (contagem.get(id) ?? 0) + 1);
  const liderId = [...contagem.entries()].sort((x, y) => y[1] - x[1])[0]?.[0];

  const rotuloComparacao =
    periodo === "hoje"
      ? `vs. ${DIAS_SEMANA_ABREV[diaDaSemana(ate)].toLowerCase()}. passada`
      : `vs. ${dias} dias anteriores`;

  return {
    faturamento: valor,
    variacaoPercentual: valorAnterior > 0 ? Math.round(((valor - valorAnterior) / valorAnterior) * 100) : null,
    rotuloComparacao,
    total: atuais.length,
    atendidos: atuais.filter((a) => a.status === "atendido").length,
    aSeguir: atuais.filter((a) => a.status === "confirmado" || a.status === "aguardando").length,
    ticketMedio: atuais.length > 0 ? Math.round(valor / atuais.length) : 0,
    ocupacao: capacidade > 0 ? Math.min(1, minutosOcupados / capacidade) : 0,
    servicoLider: servicos.find((s) => s.id === liderId)?.nome ?? null,
  };
}

export function faturamentoPorDia(agendamentos: Agendamento[], agora: Agora, dias = 7) {
  return Array.from({ length: dias }, (_, i) => {
    const data = somarDias(agora.data, i - (dias - 1));
    return {
      data,
      rotulo: DIAS_SEMANA_ABREV[diaDaSemana(data)],
      valor: faturamento(agendamentos.filter((a) => a.data === data && conta(a))),
    };
  });
}
