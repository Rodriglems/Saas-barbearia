/**
 * Dados de exemplo para o site funcionar antes de existir banco de dados.
 * Os agendamentos são gerados em volta da data de hoje, com sorteio
 * "fixo" (seed), para o painel sempre parecer movimentado.
 */
import type { Agora } from "./datas";
import { diaDaSemana, somarDias } from "./datas";
import { sobrepoe } from "./disponibilidade";
import type { Agendamento, Barbearia, Barbeiro, Cliente, DataISO, Servico } from "./tipos";

export interface Banco {
  barbearias: Barbearia[];
  servicos: Servico[];
  barbeiros: Barbeiro[];
  clientes: Cliente[];
  agendamentos: Agendamento[];
  proximoCodigo: number;
}

const h = (hora: number, min = 0) => hora * 60 + min;

/** Gerador pseudoaleatório com seed: mesma seed, mesma sequência. */
function sorteador(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NOMES_CLIENTES = [
  "Pedro Lima", "João Vitor", "Gabriel Rocha", "Mateus Araújo", "Felipe Nunes",
  "Gustavo Reis", "Leonardo Dias", "Vinícius Melo", "Caio Martins", "Diego Ramos",
  "Henrique Pires", "Igor Barros", "Marcelo Teixeira", "Renan Cardoso", "Samuel Freitas",
  "Otávio Moura", "Bruno Castro", "Daniel Prado", "Eduardo Vieira", "Arthur Campos",
];

export function criarDadosExemplo(agora: Agora): Banco {
  const hoje = agora.data;
  const barbeariaId = "bb-dom-navalha";

  const barbearia: Barbearia = {
    id: barbeariaId,
    slug: "dom-navalha",
    nome: "Dom Navalha",
    subtitulo: "Barbearia clássica",
    iniciais: "DN",
    endereco: "Av. Principal, 1200 · Centro",
    avaliacao: 4.9,
    totalAvaliacoes: 1284,
    fuso: "America/Sao_Paulo",
    funcionamento: {
      1: [{ inicio: h(9), fim: h(20) }],
      2: [{ inicio: h(9), fim: h(20) }],
      3: [{ inicio: h(9), fim: h(20) }],
      4: [{ inicio: h(9), fim: h(20) }],
      5: [{ inicio: h(9), fim: h(20) }],
      6: [{ inicio: h(9), fim: h(20) }],
    },
    antecedenciaMin: 30,
    janelaDias: 60,
  };

  const s = (dados: Omit<Servico, "barbeariaId">): Servico => ({ ...dados, barbeariaId });
  const servicos: Servico[] = [
    s({ id: "sv-corte", nome: "Corte clássico", descricao: "Tesoura e máquina, lavagem inclusa", categoria: "cabelo", icone: "tesoura", duracaoMin: 40, precoCentavos: 4500, maisPedido: true }),
    s({ id: "sv-degrade", nome: "Corte degradê", descricao: "Fade na navalha com acabamento", categoria: "cabelo", icone: "tesoura", duracaoMin: 45, precoCentavos: 5000 }),
    s({ id: "sv-barba", nome: "Barba completa", descricao: "Toalha quente, navalha e balm", categoria: "barba", icone: "navalha", duracaoMin: 30, precoCentavos: 3500, maisPedido: true }),
    s({ id: "sv-combo", nome: "Combo Corte + Barba", descricao: "O ritual completo da casa", categoria: "combo", icone: "estrela", duracaoMin: 70, precoCentavos: 7500, precoOriginalCentavos: 8500, maisVendido: true, maisPedido: true }),
    s({ id: "sv-hidratacao", nome: "Hidratação capilar", descricao: "Tratamento com óleos e máscara", categoria: "tratamento", icone: "gota", duracaoMin: 25, precoCentavos: 4000 }),
    s({ id: "sv-sobrancelha", nome: "Sobrancelha", descricao: "Design na navalha", categoria: "tratamento", icone: "olho", duracaoMin: 15, precoCentavos: 2000 }),
  ];

  // Próxima quinta-feira (o Bruno volta nesse dia).
  const diasAteQuinta = (4 - diaDaSemana(hoje) + 7) % 7 || 7;

  const b = (dados: Omit<Barbeiro, "barbeariaId">): Barbeiro => ({ ...dados, barbeariaId });
  const barbeiros: Barbeiro[] = [
    b({
      id: "br-thiago", nome: "Thiago Mendes", iniciais: "TM", cargo: "Master barber",
      anosExperiencia: 9, avaliacao: 4.9, totalAvaliacoes: 412,
      especialidades: ["Degradê", "Barba", "Navalha"],
      expediente: Object.fromEntries([1, 2, 3, 4, 5, 6].map((d) => [d, [{ inicio: h(9), fim: h(12) }, { inicio: h(14), fim: h(19) }]])),
    }),
    b({
      id: "br-lucas", nome: "Lucas Ferreira", iniciais: "LF", cargo: "Cortes clássicos",
      anosExperiencia: 6, avaliacao: 4.8, totalAvaliacoes: 287,
      especialidades: ["Clássico", "Tesoura"],
      expediente: Object.fromEntries([2, 3, 4, 5, 6].map((d) => [d, [{ inicio: h(9), fim: h(12) }, { inicio: h(13), fim: h(18) }]])),
    }),
    b({
      id: "br-andre", nome: "André Costa", iniciais: "AC", cargo: "Barba e pigmentação",
      anosExperiencia: 7, avaliacao: 4.9, totalAvaliacoes: 351,
      especialidades: ["Barba", "Pigmentação"],
      expediente: {
        ...Object.fromEntries([1, 2, 3, 4, 5].map((d) => [d, [{ inicio: h(10), fim: h(13) }, { inicio: h(14), fim: h(20) }]])),
        6: [{ inicio: h(9), fim: h(14) }],
      },
    }),
    b({
      id: "br-bruno", nome: "Bruno Alves", iniciais: "BA", cargo: "Cortes modernos",
      anosExperiencia: 4, avaliacao: 4.7, totalAvaliacoes: 158,
      especialidades: ["Degradê", "Freestyle"],
      expediente: Object.fromEntries([1, 2, 3, 4, 5, 6].map((d) => [d, [{ inicio: h(9), fim: h(12) }, { inicio: h(14), fim: h(19) }]])),
      ausencia: { ate: somarDias(hoje, diasAteQuinta - 1), mensagem: "Volta na quinta-feira" },
    }),
  ];

  const rafael: Cliente = {
    id: "cl-rafael",
    barbeariaId,
    nome: "Rafael Souza",
    iniciais: "RS",
    clienteDesde: "2024-03-12",
    nivel: "ouro",
    pontos: 1250,
    fidelidade: { atual: 8, meta: 10 },
  };

  const servicoPorId = new Map(servicos.map((x) => [x.id, x]));
  const agendamentos: Agendamento[] = [];
  let codigo = 4800;

  const adicionar = (dados: Omit<Agendamento, "id" | "codigo" | "barbeariaId" | "duracaoMin" | "totalCentavos">) => {
    const lista = dados.servicoIds.map((id) => servicoPorId.get(id)!);
    codigo += 1;
    agendamentos.push({
      ...dados,
      id: `ag-${codigo}`,
      codigo: `DN-${codigo}`,
      barbeariaId,
      duracaoMin: lista.reduce((t, x) => t + x.duracaoMin, 0),
      totalCentavos: lista.reduce((t, x) => t + x.precoCentavos, 0),
    });
  };

  // Recua até um dia que não seja domingo.
  const diaUtil = (iso: DataISO) => (diaDaSemana(iso) === 0 ? somarDias(iso, -1) : iso);
  const proximoSabado = somarDias(hoje, (6 - diaDaSemana(hoje) + 7) % 7 || 7);

  // Histórico e próximo horário do cliente de exemplo.
  const doRafael = { clienteId: rafael.id, clienteNome: rafael.nome };
  adicionar({ ...doRafael, barbeiroId: "br-andre", servicoIds: ["sv-barba"], data: diaUtil(somarDias(hoje, -66)), inicio: h(16), status: "atendido" });
  adicionar({ ...doRafael, barbeiroId: "br-thiago", servicoIds: ["sv-combo"], data: diaUtil(somarDias(hoje, -48)), inicio: h(15), status: "atendido" });
  adicionar({ ...doRafael, barbeiroId: "br-thiago", servicoIds: ["sv-degrade"], data: diaUtil(somarDias(hoje, -34)), inicio: h(10), status: "atendido" });
  adicionar({ ...doRafael, barbeiroId: "br-thiago", servicoIds: ["sv-combo"], data: proximoSabado, inicio: h(15, 30), status: "confirmado" });

  // Agenda movimentada dos outros clientes.
  const sortear = sorteador(42);
  const pesos: [string, number][] = [
    ["sv-combo", 0.3], ["sv-corte", 0.2], ["sv-degrade", 0.2],
    ["sv-barba", 0.17], ["sv-hidratacao", 0.06], ["sv-sobrancelha", 0.07],
  ];
  const sortearServico = () => {
    let r = sortear();
    for (const [id, peso] of pesos) {
      r -= peso;
      if (r <= 0) return servicoPorId.get(id)!;
    }
    return servicoPorId.get("sv-corte")!;
  };

  for (let d = -65; d <= 14; d++) {
    const data = somarDias(hoje, d);
    const chance = d < 0 ? 0.72 : d === 0 ? 0.78 : Math.max(0.12, 0.6 - 0.05 * d);

    for (const barbeiro of barbeiros) {
      if (d >= 0 && barbeiro.ausencia && data <= barbeiro.ausencia.ate) continue;

      for (const faixa of barbeiro.expediente[diaDaSemana(data)] ?? []) {
        let t = faixa.inicio;
        while (t < faixa.fim) {
          const servico = sortearServico();
          const intervalo = { inicio: t, fim: t + servico.duracaoMin };
          const colide = agendamentos.some(
            (a) =>
              a.barbeiroId === barbeiro.id &&
              a.data === data &&
              a.status !== "cancelado" &&
              sobrepoe({ inicio: a.inicio, fim: a.inicio + a.duracaoMin }, intervalo),
          );
          if (sortear() < chance && intervalo.fim <= faixa.fim && !colide) {
            const passou = d < 0 || (d === 0 && intervalo.fim <= agora.minutos);
            const r = sortear();
            const status = passou
              ? r < 0.94 ? "atendido" : r < 0.97 ? "faltou" : "cancelado"
              : r < 0.72 ? "confirmado" : "aguardando";
            adicionar({
              clienteId: `cl-${Math.floor(sortear() * NOMES_CLIENTES.length)}`,
              clienteNome: NOMES_CLIENTES[Math.floor(sortear() * NOMES_CLIENTES.length)],
              barbeiroId: barbeiro.id,
              servicoIds: [servico.id],
              data,
              inicio: t,
              status,
            });
            t += Math.ceil(servico.duracaoMin / 30) * 30;
          } else {
            t += 30;
          }
        }
      }
    }
  }

  return {
    barbearias: [barbearia],
    servicos,
    barbeiros,
    clientes: [rafael],
    agendamentos,
    proximoCodigo: codigo + 1,
  };
}
