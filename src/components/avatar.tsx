const tamanhos = {
  sm: "size-9 text-sm",
  md: "size-14 text-xl",
  lg: "size-20 text-3xl",
} as const;

const variantes = {
  ouro: "bg-ouro text-black",
  anel: "border-2 border-ouro bg-ouro-escuro text-ouro-claro",
  contorno: "border border-ouro text-ouro-claro",
  neutro: "border-2 border-borda bg-superficie-2 text-texto",
} as const;

interface AvatarProps {
  iniciais: string;
  tamanho?: keyof typeof tamanhos;
  variante?: keyof typeof variantes;
  className?: string;
}

export function Avatar({ iniciais, tamanho = "md", variante = "neutro", className = "" }: AvatarProps) {
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-serif font-semibold ${tamanhos[tamanho]} ${variantes[variante]} ${className}`}
    >
      {iniciais}
    </span>
  );
}
