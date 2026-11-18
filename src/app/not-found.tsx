import Link from "next/link";

export default function NaoEncontrado() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="rotulo text-ouro">Erro 404</p>
      <h1 className="titulo mt-2">Página não encontrada</h1>
      <p className="mt-3 text-suave">O endereço pode estar errado ou a página não existe mais.</p>
      <Link href="/" className="botao-ouro mt-8">
        Voltar ao início
      </Link>
    </main>
  );
}
