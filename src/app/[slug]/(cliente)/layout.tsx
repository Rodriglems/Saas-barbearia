import { NavCliente } from "@/components/nav-cliente";
import { exigirBarbearia } from "@/lib/repositorio";

// (cliente) é um "route group": agrupa as telas com barra de navegação
// sem aparecer na URL.
export default async function LayoutCliente({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const barbearia = await exigirBarbearia(slug);

  return (
    <>
      <NavCliente slug={slug} nome={barbearia.nome} />
      <main className="mx-auto w-full max-w-lg px-4 pt-6 pb-32 md:max-w-3xl md:pt-10 md:pb-16">{children}</main>
    </>
  );
}
