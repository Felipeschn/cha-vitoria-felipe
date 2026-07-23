import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found">
      <p className="eyebrow">Página não encontrada</p>
      <h1>Este convite não existe.</h1>
      <Link className="button" href="/">
        Voltar ao convite
      </Link>
    </main>
  );
}
