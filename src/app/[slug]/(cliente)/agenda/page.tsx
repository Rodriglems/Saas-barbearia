import type { Metadata } from "next";
import Link from "next/link";
import { ItemAgendamento } from "@/components/item-agendamento";
import { agoraNoFuso } from "@/lib/datas";
import {
  CLIENTE_ATUAL_ID,
  exigirBarbearia,
  listarAgendamentos,
  listarBarbeiros,
  listarServicos,
} from "@/lib/repositorio";

export const metadata: Metadata = { title: "Agenda" };

export default async function Agenda({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const barbearia = await exigirBarbearia(slug);
  const agora = agoraNoFuso(barbearia.fuso);

  const [servicos, barbeiros, meus] = await Promise.all([
    listarServicos(barbearia.id),
    listarBarbeiros(barbearia.id),
    listarAgendamentos(barbearia.id, { clienteId: CLIENTE_ATUAL_ID, de: agora.data }),
  ]);
  const proximos = meus.filter((a) => a.status !== "atendido" && (a.data > agora.data || a.inicio >= agora.minutos));

  return (
    <>
      <h1 className="titulo">Minha agenda</h1>
      <p className="mt-1 text-suave">Seus próximos horários na {barbearia.nome}</p>

      <div className="mt-6 space-y-3">
        {proximos.map((a) => (
          <ItemAgendamento key={a.id} agendamento={a} servicos={servicos} barbeiros={barbeiros} modo="detalhe" slug={slug} />
        ))}
        {proximos.length === 0 && (
          <div className="cartao p-8 text-center">
            <p className="text-suave">Você não tem horários marcados.</p>
            <Link href={`/${slug}/servicos`} className="botao-ouro mt-5">
              Agendar horário
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
