import { CalendarCheck, ChartColumn, Gift, Scissors } from "lucide-react";
import Link from "next/link";

const RECURSOS = [
  { icone: CalendarCheck, titulo: "Agendamento online", texto: "Seus clientes marcam pelo celular, 24 horas por dia, sem conflito de horário." },
  { icone: Gift, titulo: "Fidelidade", texto: "Cartão de fidelidade digital que traz o cliente de volta." },
  { icone: ChartColumn, titulo: "Painel de gestão", texto: "Faturamento, ocupação e ticket médio em tempo real." },
];

export default function PaginaInicial() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16 md:py-24">
      <div className="flex items-center gap-3 text-ouro">
        <Scissors aria-hidden className="size-6" />
        <span className="font-serif text-2xl font-semibold tracking-[0.25em] uppercase">Cadeira</span>
      </div>

      <h1 className="mt-10 font-serif text-5xl leading-[1.05] font-semibold md:text-7xl">
        A agenda da sua barbearia,
        <br />
        <span className="text-ouro-claro">no bolso do cliente.</span>
      </h1>
      <p className="mt-6 max-w-xl text-lg text-suave">
        Agendamento online, cartão fidelidade e painel de gestão em um só lugar. Feito para barbearias.
      </p>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link href="/dom-navalha" className="botao-ouro text-lg">
          Ver demonstração do cliente
        </Link>
        <Link href="/dom-navalha/admin" className="botao-contorno text-lg">
          Ver painel do administrador
        </Link>
      </div>

      <ul className="mt-20 grid gap-4 md:grid-cols-3">
        {RECURSOS.map(({ icone: Icone, titulo, texto }) => (
          <li key={titulo} className="cartao p-6">
            <Icone aria-hidden className="size-7 text-ouro" strokeWidth={1.6} />
            <h2 className="mt-4 text-lg font-bold">{titulo}</h2>
            <p className="mt-2 text-suave">{texto}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
