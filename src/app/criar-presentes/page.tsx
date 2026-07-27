import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { GiftCreator } from "@/components/invitation/gift-creator";
import { InvitationManager } from "@/components/invitation/invitation-manager";
import { readInvitationSessionFromCookies } from "@/lib/invitations/server";

export const metadata: Metadata = {
  title: "Presentes e convites",
  description: "Área privada do casal para presentes e convites.",
  robots: { index: false, follow: false },
};

export default async function CreateGiftsPage() {
  const session = await readInvitationSessionFromCookies();

  // Quem não entrou com o código do casal nunca chega a renderizar o painel.
  if (!session?.invitation.isAdmin) redirect("/");

  return (
    <main className="admin-page">
      <div className="admin-shell">
        <p className="eyebrow">Vitória &amp; Felipe</p>
        <h1>Presentes e convites</h1>
        <p className="admin-lead">
          Crie os presentes da lista e os códigos que identificam cada pessoa,
          casal ou família.
        </p>
        <div className="admin-dashboard">
          <InvitationManager />
          <GiftCreator />
        </div>
        <Link className="admin-back" href="/">
          Voltar ao convite
        </Link>
      </div>
    </main>
  );
}
