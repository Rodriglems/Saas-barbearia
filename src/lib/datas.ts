import type { DataISO, DiaSemana, Minutos } from "./tipos";

export const FUSO_PADRAO = "America/Sao_Paulo";

export const DIAS_SEMANA = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
] as const;

export const DIAS_SEMANA_ABREV = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

export const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
] as const;

export const MESES_ABREV = [
  "jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez",
] as const;

export interface Agora {
  data: DataISO;
  minutos: Minutos;
}

/**
 * Data e hora atuais no fuso da barbearia. Sem isso, um servidor em UTC
 * acharia que já é "amanhã" às 21h de Brasília.
 */
export function agoraNoFuso(fuso: string = FUSO_PADRAO, instante = new Date()): Agora {
  const formato = new Intl.DateTimeFormat("en-CA", {
    timeZone: fuso,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const p = Object.fromEntries(formato.formatToParts(instante).map((x) => [x.type, x.value]));
  return {
    data: `${p.year}-${p.month}-${p.day}`,
    minutos: Number(p.hour) * 60 + Number(p.minute),
  };
}

// As contas de calendário usam UTC para não sofrer com horário de verão.
function paraDate(iso: DataISO): Date {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia));
}

function deDate(d: Date): DataISO {
  return d.toISOString().slice(0, 10);
}

export function ehDataISO(valor: unknown): valor is DataISO {
  if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const d = paraDate(valor);
  return !Number.isNaN(d.getTime()) && deDate(d) === valor;
}

export function somarDias(iso: DataISO, dias: number): DataISO {
  const d = paraDate(iso);
  d.setUTCDate(d.getUTCDate() + dias);
  return deDate(d);
}

export function diferencaEmDias(de: DataISO, ate: DataISO): number {
  return Math.round((paraDate(ate).getTime() - paraDate(de).getTime()) / 86_400_000);
}

export function diaDaSemana(iso: DataISO): DiaSemana {
  return paraDate(iso).getUTCDay() as DiaSemana;
}

export function partesDaData(iso: DataISO) {
  const d = paraDate(iso);
  return { ano: d.getUTCFullYear(), mes: d.getUTCMonth(), dia: d.getUTCDate() };
}

// ---------- Meses ("AAAA-MM") ----------

export type MesISO = string;

export function ehMesISO(valor: unknown): valor is MesISO {
  return typeof valor === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(valor);
}

export function mesDe(iso: DataISO): MesISO {
  return iso.slice(0, 7);
}

export function somarMeses(mes: MesISO, n: number): MesISO {
  const [ano, m] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(ano, m - 1 + n, 1));
  return deDate(d).slice(0, 7);
}

/** Todas as datas do mês, em ordem. */
export function diasDoMes(mes: MesISO): DataISO[] {
  const primeiro = `${mes}-01`;
  const dias: DataISO[] = [];
  for (let d = primeiro; mesDe(d) === mes; d = somarDias(d, 1)) dias.push(d);
  return dias;
}

export function nomeDoMes(mes: MesISO): string {
  const [ano, m] = mes.split("-").map(Number);
  return `${capitalizar(MESES[m - 1])} ${ano}`;
}

// ---------- Formatação ----------

export function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** 930 -> "15:30" */
export function formatarHora(min: Minutos): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** 1200 -> "20h", 570 -> "9h30" */
export function formatarHoraCurta(min: Minutos): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

/** "Sábado, 21 de novembro" */
export function formatarDataLonga(iso: DataISO): string {
  const { mes, dia } = partesDaData(iso);
  return `${capitalizar(DIAS_SEMANA[diaDaSemana(iso)])}, ${dia} de ${MESES[mes]}`;
}

/** "Sáb, 21 de novembro" */
export function formatarDataMedia(iso: DataISO): string {
  const { mes, dia } = partesDaData(iso);
  return `${DIAS_SEMANA_ABREV[diaDaSemana(iso)]}, ${dia} de ${MESES[mes]}`;
}

/** "Sáb, 21/11" */
export function formatarDataCurta(iso: DataISO): string {
  const { mes, dia } = partesDaData(iso);
  return `${DIAS_SEMANA_ABREV[diaDaSemana(iso)]}, ${String(dia).padStart(2, "0")}/${String(mes + 1).padStart(2, "0")}`;
}

/** "hoje", "amanhã" ou "sáb 21/11" */
export function formatarDiaRelativo(iso: DataISO, hoje: DataISO): string {
  const diff = diferencaEmDias(hoje, iso);
  if (diff === 0) return "hoje";
  if (diff === 1) return "amanhã";
  return formatarDataCurta(iso).replace(",", "").toLowerCase();
}

/** "no sábado", "na terça-feira", "hoje", "amanhã" */
export function formatarQuando(iso: DataISO, hoje: DataISO): string {
  const diff = diferencaEmDias(hoje, iso);
  if (diff === 0) return "hoje";
  if (diff === 1) return "amanhã";
  const dia = diaDaSemana(iso);
  const artigo = dia === 0 || dia === 6 ? "no" : "na";
  return `${artigo} ${DIAS_SEMANA[dia]}`;
}

export function saudacao(minutos: Minutos): string {
  if (minutos < 12 * 60) return "Bom dia";
  if (minutos < 18 * 60) return "Boa tarde";
  return "Boa noite";
}
