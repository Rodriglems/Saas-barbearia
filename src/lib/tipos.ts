/**
 * Tipos do domínio. Eles descrevem os dados do sistema e serão reaproveitados
 * quando os dados de exemplo forem trocados pelo banco (Supabase).
 */

/** Data no formato "AAAA-MM-DD", por exemplo "2026-11-21". */
export type DataISO = string;

/** Minutos desde a meia-noite. Exemplo: 15:30 = 930. */
export type Minutos = number;

/** 0 = domingo, 1 = segunda ... 6 = sábado (igual ao Date.getDay()). */
export type DiaSemana = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Intervalo {
  inicio: Minutos;
  fim: Minutos;
}

/** Faixas de trabalho de cada dia da semana. Dia ausente = não trabalha. */
export type Expediente = Partial<Record<DiaSemana, Intervalo[]>>;

export interface Barbearia {
  id: string;
  slug: string;
  nome: string;
  subtitulo: string;
  iniciais: string;
  endereco: string;
  avaliacao: number;
  totalAvaliacoes: number;
  fuso: string;
  funcionamento: Expediente;
  /** Antecedência mínima, em minutos, para marcar um horário no mesmo dia. */
  antecedenciaMin: number;
  /** Até quantos dias à frente o cliente pode agendar. */
  janelaDias: number;
}

export type Categoria = "cabelo" | "barba" | "combo" | "tratamento";

export type IconeServico = "tesoura" | "navalha" | "estrela" | "gota" | "olho";

export interface Servico {
  id: string;
  barbeariaId: string;
  nome: string;
  descricao: string;
  categoria: Categoria;
  icone: IconeServico;
  duracaoMin: number;
  /** Dinheiro sempre em centavos (inteiro) para evitar erro de arredondamento. */
  precoCentavos: number;
  precoOriginalCentavos?: number;
  maisVendido?: boolean;
  maisPedido?: boolean;
}

export interface Barbeiro {
  id: string;
  barbeariaId: string;
  nome: string;
  iniciais: string;
  cargo: string;
  anosExperiencia: number;
  avaliacao: number;
  totalAvaliacoes: number;
  especialidades: string[];
  expediente: Expediente;
  /** Férias ou folga: não aparece com horários até esta data (inclusive). */
  ausencia?: { ate: DataISO; mensagem: string };
}

export type StatusAgendamento =
  | "confirmado"
  | "aguardando"
  | "atendido"
  | "cancelado"
  | "faltou";

export interface Agendamento {
  id: string;
  codigo: string;
  barbeariaId: string;
  clienteId: string;
  clienteNome: string;
  barbeiroId: string;
  servicoIds: string[];
  data: DataISO;
  inicio: Minutos;
  duracaoMin: number;
  totalCentavos: number;
  status: StatusAgendamento;
}

export type NivelCliente = "bronze" | "prata" | "ouro";

export interface Cliente {
  id: string;
  barbeariaId: string;
  nome: string;
  iniciais: string;
  clienteDesde: DataISO;
  nivel: NivelCliente;
  pontos: number;
  fidelidade: { atual: number; meta: number };
}
