import { describe, expect, it } from "vitest";
import {
  gerarGrade,
  horariosDoBarbeiro,
  horariosSemPreferencia,
  proximoHorarioLivre,
  sobrepoe,
} from "./disponibilidade";
import type { Agendamento, Barbeiro } from "./tipos";

// 2026-11-21 é um sábado (dia 6).
const SABADO = "2026-11-21";

function barbeiro(id: string, extra: Partial<Barbeiro> = {}): Barbeiro {
  return {
    id,
    barbeariaId: "b1",
    nome: id,
    iniciais: "XX",
    cargo: "",
    anosExperiencia: 1,
    avaliacao: 5,
    totalAvaliacoes: 1,
    especialidades: [],
    expediente: { 6: [{ inicio: 9 * 60, fim: 12 * 60 }] }, // sábado 9h-12h
    ...extra,
  };
}

function agendamento(barbeiroId: string, inicio: number, duracaoMin: number, extra: Partial<Agendamento> = {}): Agendamento {
  return {
    id: `${barbeiroId}-${inicio}`,
    codigo: "X",
    barbeariaId: "b1",
    clienteId: "c1",
    clienteNome: "Cliente",
    barbeiroId,
    servicoIds: [],
    data: SABADO,
    inicio,
    duracaoMin,
    totalCentavos: 0,
    status: "confirmado",
    ...extra,
  };
}

const ctxSemana = { agora: { data: "2026-11-17", minutos: 10 * 60 }, antecedenciaMin: 60 };

describe("sobrepoe", () => {
  it("detecta sobreposição parcial", () => {
    expect(sobrepoe({ inicio: 540, fim: 600 }, { inicio: 570, fim: 630 })).toBe(true);
  });
  it("horários encostados não se sobrepõem", () => {
    expect(sobrepoe({ inicio: 540, fim: 600 }, { inicio: 600, fim: 660 })).toBe(false);
  });
});

describe("gerarGrade", () => {
  it("só lista horários em que o serviço inteiro cabe no expediente", () => {
    const grade = gerarGrade({
      expediente: { 6: [{ inicio: 540, fim: 720 }] },
      data: SABADO,
      duracaoMin: 70,
      ocupados: [],
    });
    // 9:00 ... 10:30 (10:30 + 70min = 11:40 cabe; 11:00 + 70 = 12:10 não cabe)
    expect(grade.map((h) => h.inicio)).toEqual([540, 570, 600, 630]);
  });

  it("dia sem expediente não tem horários", () => {
    expect(gerarGrade({ expediente: {}, data: SABADO, duracaoMin: 30, ocupados: [] })).toEqual([]);
  });
});

describe("horariosDoBarbeiro", () => {
  it("bloqueia horários que colidem com um agendamento existente", () => {
    const b = barbeiro("t");
    const ags = [agendamento("t", 600, 60)]; // 10:00-11:00
    const grade = horariosDoBarbeiro(b, SABADO, 30, ags, ctxSemana);
    const livres = grade.filter((h) => h.livre).map((h) => h.inicio);
    expect(livres).toEqual([540, 570, 660, 690]);
  });

  it("agendamento cancelado libera o horário", () => {
    const b = barbeiro("t");
    const ags = [agendamento("t", 600, 60, { status: "cancelado" })];
    expect(horariosDoBarbeiro(b, SABADO, 30, ags, ctxSemana).every((h) => h.livre)).toBe(true);
  });

  it("ignora agendamentos de outro barbeiro", () => {
    const ags = [agendamento("outro", 540, 180)];
    expect(horariosDoBarbeiro(barbeiro("t"), SABADO, 30, ags, ctxSemana).every((h) => h.livre)).toBe(true);
  });

  it("no dia de hoje respeita a antecedência mínima", () => {
    const ctx = { agora: { data: SABADO, minutos: 9 * 60 + 10 }, antecedenciaMin: 60 };
    const livres = horariosDoBarbeiro(barbeiro("t"), SABADO, 30, [], ctx)
      .filter((h) => h.livre)
      .map((h) => h.inicio);
    expect(livres[0]).toBe(10 * 60 + 30); // 9:10 + 60min = 10:10 -> próximo é 10:30
  });

  it("não devolve horários para datas passadas", () => {
    const ctx = { agora: { data: "2026-11-22", minutos: 0 }, antecedenciaMin: 0 };
    expect(horariosDoBarbeiro(barbeiro("t"), SABADO, 30, [], ctx)).toEqual([]);
  });

  it("barbeiro ausente não tem horários", () => {
    const b = barbeiro("t", { ausencia: { ate: SABADO, mensagem: "Férias" } });
    expect(horariosDoBarbeiro(b, SABADO, 30, [], ctxSemana)).toEqual([]);
  });
});

describe("horariosSemPreferencia", () => {
  it("fica livre se algum barbeiro estiver livre e escolhe quem está livre", () => {
    const a = barbeiro("a");
    const b = barbeiro("b");
    const ags = [agendamento("a", 540, 180)]; // "a" ocupado a manhã inteira
    const grade = horariosSemPreferencia([a, b], SABADO, 30, ags, ctxSemana);
    expect(grade.every((h) => h.livre && h.barbeiroId === "b")).toBe(true);
  });

  it("ocupado quando todos estão ocupados", () => {
    const ags = [agendamento("a", 540, 30), agendamento("b", 540, 30)];
    const grade = horariosSemPreferencia([barbeiro("a"), barbeiro("b")], SABADO, 30, ags, ctxSemana);
    expect(grade[0]).toEqual({ inicio: 540, livre: false, barbeiroId: null });
  });
});

describe("proximoHorarioLivre", () => {
  it("encontra o primeiro horário livre nos próximos dias", () => {
    expect(proximoHorarioLivre(barbeiro("t"), 30, [], ctxSemana)).toEqual({ data: SABADO, inicio: 540 });
  });
});
