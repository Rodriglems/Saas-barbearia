"use server";

import { revalidatePath } from "next/cache";
import { CLIENTE_ATUAL_ID, cancelarAgendamento, obterBarbearia } from "@/lib/repositorio";

export async function cancelar(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const id = String(formData.get("id") ?? "");
  const barbearia = await obterBarbearia(slug);
  if (!barbearia) return;

  await cancelarAgendamento(barbearia.id, id, CLIENTE_ATUAL_ID);
  revalidatePath(`/${slug}`, "layout");
}
