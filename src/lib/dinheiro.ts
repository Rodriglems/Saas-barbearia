const formatoBRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Formata centavos como reais.
 * formatarBRL(7500) -> "R$ 75,00"
 * formatarBRL(7500, { compacto: true }) -> "R$ 75"
 */
export function formatarBRL(centavos: number, opcoes: { compacto?: boolean } = {}): string {
  const texto = formatoBRL.format(centavos / 100);
  return opcoes.compacto && centavos % 100 === 0 ? texto.replace(/,00$/, "") : texto;
}

/** 234000 -> "2,3k" (para rótulos de gráfico) */
export function formatarMilhar(centavos: number): string {
  const reais = centavos / 100;
  if (reais < 1000) return String(Math.round(reais));
  return `${(reais / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}k`;
}
