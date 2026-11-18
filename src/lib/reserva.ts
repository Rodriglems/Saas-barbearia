/** Ajuda a montar as URLs do fluxo de agendamento (o estado viaja na URL). */

type Query = Record<string, string | number | null | undefined>;

export function comQuery(caminho: string, query: Query): string {
  const params = new URLSearchParams();
  for (const [chave, valor] of Object.entries(query)) {
    if (valor !== null && valor !== undefined && valor !== "") params.set(chave, String(valor));
  }
  const texto = params.toString();
  return texto ? `${caminho}?${texto}` : caminho;
}

/** Lê ?servicos=a,b da URL. */
export function lerIds(valor: string | string[] | undefined): string[] {
  const texto = Array.isArray(valor) ? valor.join(",") : (valor ?? "");
  return texto.split(",").map((s) => s.trim()).filter(Boolean);
}

export function lerTexto(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;
