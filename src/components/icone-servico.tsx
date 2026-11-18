import { Brush, Droplets, Eye, Scissors, Star, type LucideIcon } from "lucide-react";
import type { IconeServico } from "@/lib/tipos";

// Record<IconeServico, ...> obriga a ter um ícone para cada tipo:
// se alguém criar um tipo novo e esquecer daqui, o TypeScript avisa.
const icones: Record<IconeServico, LucideIcon> = {
  tesoura: Scissors,
  navalha: Brush,
  estrela: Star,
  gota: Droplets,
  olho: Eye,
};

export function IconeDoServico({ icone, className = "size-6" }: { icone: IconeServico; className?: string }) {
  const Icone = icones[icone];
  return <Icone aria-hidden strokeWidth={1.6} className={className} />;
}

/** Quadrado com listras douradas e o ícone do serviço (como no mockup). */
export function MiniaturaServico({ icone, className = "" }: { icone: IconeServico; className?: string }) {
  return (
    <div
      className={`flex items-center justify-center bg-ouro-escuro/60 text-ouro ${icone === "navalha" ? "listras-v" : "listras"} ${className}`}
    >
      <IconeDoServico icone={icone} className="size-8" />
    </div>
  );
}
