"use server";

/**
 * Server Action: roda no SERVIDOR quando o formulário de confirmação é enviado.
 * Por isso validamos tudo de novo, mesmo que a tela já tenha validado.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ehDataISO } from "@/lib/datas";
import { CLIENTE_ATUAL_ID, criarAgendamento, obterBarbearia } from "@/lib/repositorio";
import { comQuery, lerIds } from "@/lib/reserva";

const esquema = z.object({
  slug: z.string().min(1),
  servicos: z.string().min(1),
  barbeiro: z.string().min(1),
  data: z.string().refine(ehDataISO, "Data inválida"),
  hora: z.coerce.number().int().min(0).max(24 * 60 - 1),
});

// O tipo é gerado a partir do esquema: uma fonte só de verdade.
export type DadosConfirmacao = z.infer<typeof esquema>;

export async function confirmarAgendamento(formData: FormData) {
  const resultado = esquema.safeParse(Object.fromEntries(formData));
  if (!resultado.success) redirect("/");

  const { slug, servicos, barbeiro, data, hora } = resultado.data;
  const barbearia = await obterBarbearia(slug);
  if (!barbearia) redirect("/");

  const criado = await criarAgendamento({
    barbeariaId: barbearia.id,
    clienteId: CLIENTE_ATUAL_ID,
    barbeiroId: barbeiro,
    servicoIds: lerIds(servicos),
    data,
    inicio: hora,
  });

  if (!criado.ok) {
    // Alguém pegou o horário antes: volta para a escolha com um aviso.
    redirect(comQuery(`/${slug}/agendar/horario`, { servicos, barbeiro, data, erro: criado.erro }));
  }

  revalidatePath(`/${slug}`, "layout");
  redirect(`/${slug}/agendamento/${criado.agendamento.id}`);
}
