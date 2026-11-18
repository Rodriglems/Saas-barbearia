"use client";

import { CalendarDays, House, Scissors, User, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Item {
  href: string;
  rotulo: string;
  icone: LucideIcon;
}

export function NavCliente({ slug, nome }: { slug: string; nome: string }) {
  const pathname = usePathname();
  const itens: Item[] = [
    { href: `/${slug}`, rotulo: "Início", icone: House },
    { href: `/${slug}/servicos`, rotulo: "Serviços", icone: Scissors },
    { href: `/${slug}/agenda`, rotulo: "Agenda", icone: CalendarDays },
    { href: `/${slug}/perfil`, rotulo: "Perfil", icone: User },
  ];
  const ativo = (href: string) => pathname === href;

  return (
    <>
      {/* Computador: barra no topo */}
      <header className="sticky top-0 z-20 hidden border-b border-borda bg-fundo/90 backdrop-blur md:block">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href={`/${slug}`} className="font-serif text-2xl tracking-[0.2em] text-ouro-claro uppercase">
            {nome}
          </Link>
          <nav className="flex gap-1">
            {itens.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={ativo(item.href) ? "page" : undefined}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${ativo(item.href) ? "bg-ouro-escuro text-ouro" : "text-suave hover:text-texto"}`}
              >
                {item.rotulo}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Celular: barra inferior */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-borda bg-fundo/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-4">
          {itens.map(({ href, rotulo, icone: Icone }) => (
            <Link
              key={href}
              href={href}
              aria-current={ativo(href) ? "page" : undefined}
              className={`flex flex-col items-center gap-1 py-3 text-xs font-semibold ${ativo(href) ? "text-ouro" : "text-suave"}`}
            >
              <Icone aria-hidden strokeWidth={1.6} className="size-6" />
              {rotulo}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
