/**
 * Regras de horários livres.
 *
 * Tudo aqui são "funções puras": recebem dados e devolvem resultado, sem
 * acessar banco nem relógio. Por isso dá para testar com facilidade
 * (veja disponibilidade.test.ts).
 */
import type { Agora } from "./datas";
import { diaDaSemana, somarDias } from "./datas";
import type {
  Agendamento,
  Barbeiro,
  DataISO,
  Expediente,
  Intervalo,
  Minutos,
  StatusAgendamento,
} from "./tipos";

export interface Horario {
  inicio: Minutos;
  livre: boolean;
  /** Quem atende nesse horário (null quando ocupado). */
  barbeiroId: string | null;
}

export interface ContextoAgenda {
  agora: Agora;
  /** Minutos mínimos entre "agora" e o horário marcado. */
  antecedenciaMin: number;
  /** Intervalo entre um horário e outro na grade. */
  passoMin?: number;
}

export function sobrepoe(a: Intervalo, b: Intervalo): boolean {
  return a.inicio < b.fim && b.inicio < a.fim;
}

/** Agendamentos cancelados liberam o horário; os demais ocupam. */
export function ocupaHorario(status: StatusAgendamento): boolean {
  return status !== "cancelado";
}

export function duracaoTotal(servicos: { duracaoMin: number }[]): number {
  return servicos.reduce((soma, s) => soma + s.duracaoMin, 0);
}

export function precoTotal(servicos: { precoCentavos: number }[]): number {
  return servicos.reduce((soma, s) => soma + s.precoCentavos, 0);
}

export function minutosDeTrabalho(expediente: Expediente, data: DataISO): number {
  return (expediente[diaDaSemana(data)] ?? []).reduce((s, i) => s + (i.fim - i.inicio), 0);
}

export function estaAusente(barbeiro: Barbeiro, data: DataISO): boolean {
  return barbeiro.ausencia !== undefined && data <= barbeiro.ausencia.ate;
}

interface ParametrosGrade {
  expediente: Expediente;
  data: DataISO;
  duracaoMin: number;
  ocupados: Intervalo[];
  passoMin?: number;
  /** Horários que começam antes disso ficam indisponíveis (passado/antecedência). */
  naoAntesDe?: Minutos;
}

/**
 * Monta a grade de horários de um dia. Um horário só aparece se o serviço
 * inteiro cabe dentro da faixa de trabalho; ele fica "livre" se não bate com
 * nenhum horário ocupado e não está no passado.
 */
export function gerarGrade({
  expediente,
  data,
  duracaoMin,
  ocupados,
  passoMin = 30,
  naoAntesDe = 0,
}: ParametrosGrade): { inicio: Minutos; livre: boolean }[] {
  const faixas = expediente[diaDaSemana(data)] ?? [];
  const grade: { inicio: Minutos; livre: boolean }[] = [];

  for (const faixa of faixas) {
    for (let inicio = faixa.inicio; inicio + duracaoMin <= faixa.fim; inicio += passoMin) {
      const candidato = { inicio, fim: inicio + duracaoMin };
      const livre = inicio >= naoAntesDe && !ocupados.some((o) => sobrepoe(o, candidato));
      grade.push({ inicio, livre });
    }
  }
  return grade;
}

export function horariosDoBarbeiro(
  barbeiro: Barbeiro,
  data: DataISO,
  duracaoMin: number,
  agendamentos: Agendamento[],
  ctx: ContextoAgenda,
): Horario[] {
  if (data < ctx.agora.data || estaAusente(barbeiro, data)) return [];

  const ocupados = agendamentos
    .filter((a) => a.barbeiroId === barbeiro.id && a.data === data && ocupaHorario(a.status))
    .map((a) => ({ inicio: a.inicio, fim: a.inicio + a.duracaoMin }));

  const naoAntesDe = data === ctx.agora.data ? ctx.agora.minutos + ctx.antecedenciaMin : 0;

  return gerarGrade({
    expediente: barbeiro.expediente,
    data,
    duracaoMin,
    ocupados,
    passoMin: ctx.passoMin,
    naoAntesDe,
  }).map((h) => ({ ...h, barbeiroId: h.livre ? barbeiro.id : null }));
}

/**
 * "Sem preferência": junta a grade de todos os barbeiros. O horário fica
 * livre se pelo menos um estiver livre, e vai para o barbeiro com menos
 * atendimentos no dia, para dividir o trabalho.
 */
export function horariosSemPreferencia(
  barbeiros: Barbeiro[],
  data: DataISO,
  duracaoMin: number,
  agendamentos: Agendamento[],
  ctx: ContextoAgenda,
): Horario[] {
  const cargaDoDia = new Map<string, number>();
  for (const a of agendamentos) {
    if (a.data === data && ocupaHorario(a.status)) {
      cargaDoDia.set(a.barbeiroId, (cargaDoDia.get(a.barbeiroId) ?? 0) + 1);
    }
  }
  const ordenados = [...barbeiros].sort(
    (a, b) => (cargaDoDia.get(a.id) ?? 0) - (cargaDoDia.get(b.id) ?? 0),
  );

  const porInicio = new Map<Minutos, Horario>();
  for (const barbeiro of ordenados) {
    for (const h of horariosDoBarbeiro(barbeiro, data, duracaoMin, agendamentos, ctx)) {
      const atual = porInicio.get(h.inicio);
      if (!atual || (!atual.livre && h.livre)) porInicio.set(h.inicio, h);
    }
  }
  return [...porInicio.values()].sort((a, b) => a.inicio - b.inicio);
}

export function proximoHorarioLivre(
  barbeiro: Barbeiro,
  duracaoMin: number,
  agendamentos: Agendamento[],
  ctx: ContextoAgenda,
  diasAFrente = 14,
): { data: DataISO; inicio: Minutos } | null {
  for (let i = 0; i <= diasAFrente; i++) {
    const data = somarDias(ctx.agora.data, i);
    const livre = horariosDoBarbeiro(barbeiro, data, duracaoMin, agendamentos, ctx).find(
      (h) => h.livre,
    );
    if (livre) return { data, inicio: livre.inicio };
  }
  return null;
}
