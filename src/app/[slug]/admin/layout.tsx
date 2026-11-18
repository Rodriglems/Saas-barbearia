import { CalendarDays, ChartColumn, User, Users } from "lucide-react";
import Link from "next/link";

// Por enquanto só o Painel existe; os outros itens aparecem como "em breve".
const ITENS = [
  { rotulo: "Painel", icone: ChartColumn, pronto: true },
  { rotulo: "Agenda", icone: CalendarDays, pronto: false },
  { rotulo: "Clientes", icone: User, pronto: false },
  { rotulo: "Equipe", icone: Users, pronto: false },
];

export default async function LayoutAdmin({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <>
      <main className="mx-auto w-full max-w-lg px-4 pt-6 pb-32 md:max-w-4xl md:pt-10">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-borda bg-fundo/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto grid max-w-lg grid-cols-4 md:max-w-4xl">
          {ITENS.map(({ rotulo, icone: Icone, pronto }) =>
            pronto ? (
              <Link key={rotulo} href={`/${slug}/admin`} aria-current="page" className="flex flex-col items-center gap-1 py-3 text-xs font-semibold text-ouro">
                <Icone aria-hidden strokeWidth={1.6} className="size-6" />
                {rotulo}
              </Link>
            ) : (
              <span key={rotulo} title="Em breve" className="flex cursor-not-allowed flex-col items-center gap-1 py-3 text-xs font-semibold text-apagado">
                <Icone aria-hidden strokeWidth={1.6} className="size-6" />
                {rotulo}
              </span>
            ),
          )}
        </div>
      </nav>
    </>
  );
}
