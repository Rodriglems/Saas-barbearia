import type { Metadata } from "next";
import { exigirBarbearia, listarServicos } from "@/lib/repositorio";
import { lerIds, type SearchParams } from "@/lib/reserva";
import { ListaServicos } from "./lista-servicos";

export const metadata: Metadata = { title: "Serviços" };

export default async function Servicos({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const barbearia = await exigirBarbearia(slug);
  const servicos = await listarServicos(barbearia.id);
  const selecionados = lerIds((await searchParams).servicos);

  return (
    <>
      <h1 className="titulo">Serviços</h1>
      <p className="mt-1 text-suave">Escolha um ou mais serviços para agendar</p>
      {/* A página (servidor) busca os dados; a lista (cliente) cuida dos cliques. */}
      <ListaServicos slug={slug} servicos={servicos} selecionadosIniciais={selecionados} />
    </>
  );
}
