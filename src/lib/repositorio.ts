/**
 * Repositório: o ÚNICO lugar que sabe onde os dados ficam.
 *
 * Hoje os dados estão em memória (somem quando o servidor reinicia).
 * Quando o Supabase entrar, só este arquivo muda: as páginas continuam
 * chamando as mesmas funções.
 */
import { notFound } from "next/navigation";
import { agoraNoFuso, ehDataISO } from "./datas";
import type { Banco } from "./dados-exemplo";
import { criarDadosExemplo } from "./dados-exemplo";
import type { ContextoAgenda } from "./disponibilidade";
import {
  duracaoTotal,
  horariosDoBarbeiro,
  horariosSemPreferencia,
  precoTotal,
} from "./disponibilidade";
import type { Agendamento, Barbearia, Barbeiro, Cliente, DataISO, Minutos, Servico } from "./tipos";

/** Até existir login, todo visitante é o cliente de exemplo. */
export const CLIENTE_ATUAL_ID = "cl-rafael";

// Guardamos no globalThis para os dados sobreviverem ao hot reload do `npm run dev`.
const global = globalThis as unknown as { __banco?: Banco };

function banco(): Banco {
  global.__banco ??= criarDadosExemplo(agoraNoFuso());
  return global.__banco;
}

export async function obterBarbearia(slug: string): Promise<Barbearia | null> {
  return banco().barbearias.find((b) => b.slug === slug) ?? null;
}

/** Igual a obterBarbearia, mas mostra a página 404 se não existir. */
export async function exigirBarbearia(slug: string): Promise<Barbearia> {
  const barbearia = await obterBarbearia(slug);
  if (!barbearia) notFound();
  return barbearia;
}

export async function listarServicos(barbeariaId: string): Promise<Servico[]> {
  return banco().servicos.filter((s) => s.barbeariaId === barbeariaId);
}

export async function listarBarbeiros(barbeariaId: string): Promise<Barbeiro[]> {
  return banco().barbeiros.filter((b) => b.barbeariaId === barbeariaId);
}

export async function listarAgendamentos(
  barbeariaId: string,
  filtro: { de?: DataISO; ate?: DataISO; clienteId?: string } = {},
): Promise<Agendamento[]> {
  return banco()
    .agendamentos.filter(
      (a) =>
        a.barbeariaId === barbeariaId &&
        (!filtro.de || a.data >= filtro.de) &&
        (!filtro.ate || a.data <= filtro.ate) &&
        (!filtro.clienteId || a.clienteId === filtro.clienteId),
    )
    .sort((a, b) => a.data.localeCompare(b.data) || a.inicio - b.inicio);
}

export async function obterAgendamento(barbeariaId: string, id: string): Promise<Agendamento | null> {
  return banco().agendamentos.find((a) => a.id === id && a.barbeariaId === barbeariaId) ?? null;
}

export async function obterCliente(barbeariaId: string, id: string): Promise<Cliente | null> {
  return banco().clientes.find((c) => c.id === id && c.barbeariaId === barbeariaId) ?? null;
}

export function contextoAgenda(barbearia: Barbearia): ContextoAgenda {
  return { agora: agoraNoFuso(barbearia.fuso), antecedenciaMin: barbearia.antecedenciaMin };
}

/** Converte "a,b,c" em serviços válidos daquela barbearia (ignora ids inválidos). */
export async function servicosPorIds(barbeariaId: string, ids: string[]): Promise<Servico[]> {
  const todos = await listarServicos(barbeariaId);
  return ids
    .filter((id, i) => ids.indexOf(id) === i)
    .map((id) => todos.find((s) => s.id === id))
    .filter((s): s is Servico => s !== undefined);
}

export type ResultadoCriacao =
  | { ok: true; agendamento: Agendamento }
  | { ok: false; erro: "servicos-invalidos" | "barbeiro-invalido" | "horario-indisponivel" };

/**
 * Cria um agendamento conferindo de novo se o horário está livre.
 * Nunca confie no que veio da tela: outra pessoa pode ter marcado antes.
 */
export async function criarAgendamento(entrada: {
  barbeariaId: string;
  clienteId: string;
  barbeiroId: string | "qualquer";
  servicoIds: string[];
  data: DataISO;
  inicio: Minutos;
}): Promise<ResultadoCriacao> {
  const db = banco();
  const barbearia = db.barbearias.find((b) => b.id === entrada.barbeariaId);
  const cliente = db.clientes.find((c) => c.id === entrada.clienteId);
  if (!barbearia || !cliente || !ehDataISO(entrada.data)) return { ok: false, erro: "horario-indisponivel" };

  const servicos = await servicosPorIds(barbearia.id, entrada.servicoIds);
  if (servicos.length === 0 || servicos.length !== entrada.servicoIds.length) {
    return { ok: false, erro: "servicos-invalidos" };
  }

  const barbeiros = await listarBarbeiros(barbearia.id);
  const escolhido = barbeiros.find((b) => b.id === entrada.barbeiroId);
  if (entrada.barbeiroId !== "qualquer" && !escolhido) return { ok: false, erro: "barbeiro-invalido" };

  const duracao = duracaoTotal(servicos);
  const ctx = contextoAgenda(barbearia);
  const grade = escolhido
    ? horariosDoBarbeiro(escolhido, entrada.data, duracao, db.agendamentos, ctx)
    : horariosSemPreferencia(barbeiros, entrada.data, duracao, db.agendamentos, ctx);

  const horario = grade.find((h) => h.inicio === entrada.inicio && h.livre);
  if (!horario?.barbeiroId) return { ok: false, erro: "horario-indisponivel" };

  const numero = db.proximoCodigo++;
  const agendamento: Agendamento = {
    id: `ag-${numero}`,
    codigo: `${barbearia.iniciais}-${numero}`,
    barbeariaId: barbearia.id,
    clienteId: cliente.id,
    clienteNome: cliente.nome,
    barbeiroId: horario.barbeiroId,
    servicoIds: servicos.map((s) => s.id),
    data: entrada.data,
    inicio: entrada.inicio,
    duracaoMin: duracao,
    totalCentavos: precoTotal(servicos),
    status: "confirmado",
  };
  db.agendamentos.push(agendamento);
  return { ok: true, agendamento };
}

export async function cancelarAgendamento(barbeariaId: string, id: string, clienteId: string): Promise<boolean> {
  const agendamento = await obterAgendamento(barbeariaId, id);
  if (!agendamento || agendamento.clienteId !== clienteId) return false;
  if (agendamento.status !== "confirmado" && agendamento.status !== "aguardando") return false;
  agendamento.status = "cancelado";
  return true;
}
