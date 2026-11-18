import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { diaDaSemana, nomeDoMes, partesDaData, type MesISO } from "@/lib/datas";
import type { DataISO } from "@/lib/tipos";

export interface DiaCalendario {
  data: DataISO;
  disponivel: boolean;
}

interface Props {
  mes: MesISO;
  dias: DiaCalendario[];
  hoje: DataISO;
  selecionada: DataISO | null;
  hrefDia: (data: DataISO) => string;
  hrefMesAnterior: string | null;
  hrefMesSeguinte: string | null;
}

const CABECALHO = ["D", "S", "T", "Q", "Q", "S", "S"];

/** Componente de servidor: cada dia é um link, sem JavaScript no navegador. */
export function Calendario({ mes, dias, hoje, selecionada, hrefDia, hrefMesAnterior, hrefMesSeguinte }: Props) {
  const vazios = dias.length > 0 ? diaDaSemana(dias[0].data) : 0;

  const navegar = (href: string | null, rotulo: string, icone: React.ReactNode) =>
    href ? (
      <Link href={href} scroll={false} className="botao-icone size-11" aria-label={rotulo}>
        {icone}
      </Link>
    ) : (
      <span className="botao-icone size-11 opacity-30" aria-hidden>
        {icone}
      </span>
    );

  return (
    <section className="cartao p-5">
      <div className="flex items-center justify-between">
        {navegar(hrefMesAnterior, "Mês anterior", <ChevronLeft className="size-5" />)}
        <h2 className="text-lg font-bold">{nomeDoMes(mes)}</h2>
        {navegar(hrefMesSeguinte, "Próximo mês", <ChevronRight className="size-5" />)}
      </div>

      <div className="mt-5 grid grid-cols-7 gap-y-2 text-center">
        {CABECALHO.map((d, i) => (
          <span key={i} className="pb-2 text-xs font-semibold text-suave">
            {d}
          </span>
        ))}
        {Array.from({ length: vazios }, (_, i) => (
          <span key={`v${i}`} />
        ))}
        {dias.map(({ data, disponivel }) => {
          const { dia } = partesDaData(data);
          const selecionado = data === selecionada;
          const ehHoje = data === hoje;
          const base = "mx-auto flex size-11 items-center justify-center rounded-xl text-lg";

          if (!disponivel) {
            return (
              <span key={data} className={`${base} text-apagado ${ehHoje ? "border border-ouro/30" : ""}`}>
                {dia}
              </span>
            );
          }
          return (
            <Link
              key={data}
              href={hrefDia(data)}
              scroll={false}
              aria-current={selecionado ? "date" : undefined}
              className={`${base} font-bold transition-colors ${selecionado ? "bg-ouro text-black" : ehHoje ? "border border-ouro/50 text-ouro-claro hover:bg-ouro-escuro" : "hover:bg-superficie-2"}`}
            >
              {dia}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
