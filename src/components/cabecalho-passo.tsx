import { ChevronLeft } from "lucide-react";
import Link from "next/link";

interface CabecalhoPassoProps {
  passo: number;
  total?: number;
  voltar: string;
  /** Conteúdo do meio (ex.: chip com o barbeiro). Sem ele, mostra "PASSO X DE Y". */
  centro?: React.ReactNode;
}

export function CabecalhoPasso({ passo, total = 4, voltar, centro }: CabecalhoPassoProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between gap-3">
        <Link href={voltar} className="botao-icone" aria-label="Voltar">
          <ChevronLeft aria-hidden className="size-5" />
        </Link>
        {centro ?? (
          <span className="rotulo">
            Passo {passo} de {total}
          </span>
        )}
        <span className={`w-12 text-right text-sm font-semibold text-suave ${centro ? "" : "invisible"}`}>
          {passo}/{total}
        </span>
      </div>
      <div className="mt-6 grid gap-2" style={{ gridTemplateColumns: `repeat(${total}, 1fr)` }} aria-hidden>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`h-1 rounded-full ${i < passo ? "bg-ouro" : "bg-borda"}`} />
        ))}
      </div>
    </div>
  );
}
