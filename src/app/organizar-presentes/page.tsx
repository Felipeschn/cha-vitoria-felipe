import type { Metadata } from "next";
import Link from "next/link";

import { GiftAdmin } from "@/components/invitation/gift-admin";

export const metadata: Metadata = {
  title: "Organizar presentes",
  description: "Área de organização dos presentes avulsos.",
  robots: { index: false, follow: false },
};

export default function OrganizeGiftsPage() {
  return (
    <main className="admin-page">
      <div className="admin-shell">
        <p className="eyebrow">Vitória &amp; Felipe</p>
        <h1>Organizar presentes</h1>
        <p className="admin-lead">
          Adicione novos itens avulsos e acompanhe quais já foram escolhidos.
        </p>
        <GiftAdmin />
        <Link className="admin-back" href="/">
          Voltar ao convite
        </Link>
      </div>
    </main>
  );
}
