import type { Metadata } from "next";
import { exigirBarbearia } from "@/lib/repositorio";

// Os dados mudam a cada agendamento e dependem da hora atual: nada de cache estático.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const barbearia = await exigirBarbearia((await params).slug);
  return { title: { default: barbearia.nome, template: `%s · ${barbearia.nome}` } };
}

export default async function LayoutBarbearia({ children, params }: Props & { children: React.ReactNode }) {
  await exigirBarbearia((await params).slug); // 404 se a barbearia não existir
  return children;
}
