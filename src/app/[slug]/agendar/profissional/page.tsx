import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CabecalhoPasso } from "@/components/cabecalho-passo";
import { formatarDiaRelativo, formatarHora } from "@/lib/datas";
import { duracaoTotal, proximoHorarioLivre } from "@/lib/disponibilidade";
import {
  contextoAgenda,
  exigirBarbearia,
  listarAgendamentos,
  listarBarbeiros,
  servicosPorIds,
} from "@/lib/repositorio";
import { lerIds, lerTexto, type SearchParams } from "@/lib/reserva";
import { EscolhaProfissional, type OpcaoBarbeiro } from "./escolha-profissional";

export const metadata: Metadata = { title: "Escolha o profissional" };

export default async function Profissional({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const barbearia = await exigirBarbearia(slug);
  const ids = lerIds(query.servicos);
  const servicos = await servicosPorIds(barbearia.id, ids);
  if (servicos.length === 0) redirect(`/${slug}/servicos`);

  const ctx = contextoAgenda(barbearia);
  const duracao = duracaoTotal(servicos);
  const [barbeiros, agendamentos] = await Promise.all([
    listarBarbeiros(barbearia.id),
    listarAgendamentos(barbearia.id, { de: ctx.agora.data }),
  ]);

  // Só mandamos para o navegador o que a tela precisa (nada de agenda completa).
  const opcoes: OpcaoBarbeiro[] = barbeiros.map((b) => {
    const proximo = b.ausencia && b.ausencia.ate >= ctx.agora.data ? null : proximoHorarioLivre(b, duracao, agendamentos, ctx);
    return {
      id: b.id,
      nome: b.nome,
      iniciais: b.iniciais,
      descricao: `${b.cargo} · ${b.anosExperiencia} anos`,
      avaliacao: b.avaliacao,
      totalAvaliacoes: b.totalAvaliacoes,
      especialidades: b.especialidades,
      indisponivel: b.ausencia && b.ausencia.ate >= ctx.agora.data ? b.ausencia.mensagem : null,
      proximo: proximo ? `${formatarDiaRelativo(proximo.data, ctx.agora.data)} ${formatarHora(proximo.inicio)}` : null,
    };
  });

  const resumo =
    servicos.length === 1 ? servicos[0].nome : `${servicos.length} serviços`;

  return (
    <>
      <CabecalhoPasso passo={2} voltar={`/${slug}/servicos?servicos=${servicos.map((s) => s.id).join(",")}`} />
      <h1 className="titulo">Escolha o profissional</h1>
      <p className="mt-1 text-suave">
        {resumo} · {duracao} min
      </p>
      <EscolhaProfissional
        slug={slug}
        servicoIds={servicos.map((s) => s.id)}
        opcoes={opcoes}
        inicial={lerTexto(query.barbeiro) ?? null}
      />
    </>
  );
}
