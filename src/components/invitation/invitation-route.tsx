import { redirect } from "next/navigation";

import type { InvitationGroup } from "@/lib/invitation-data";
import { readInvitationSessionFromCookies } from "@/lib/invitations/server";

import { InvitationAccessGate } from "./invitation-access-gate";
import { InvitationPage } from "./invitation-page";

type InvitationRouteProps = {
  /**
   * Rota fixa (`/familia`, `/amigos`). Sem valor, o convite exibido é o da
   * audiência da própria sessão.
   */
  group?: InvitationGroup;
};

export async function InvitationRoute({ group }: InvitationRouteProps) {
  const session = await readInvitationSessionFromCookies();

  // Sem código, nada do convite chega ao navegador: nem data, nem endereço,
  // nem lista de presentes.
  if (!session) return <InvitationAccessGate />;

  const { audience, displayName, isAdmin } = session.invitation;

  // O casal circula entre os dois convites para conferir como cada um ficou;
  // o convidado volta sempre para o seu.
  if (group && group !== audience && !isAdmin) {
    redirect(audience === "amigos" ? "/amigos" : "/familia");
  }

  return (
    <InvitationPage
      displayName={displayName}
      group={group ?? audience}
      isAdmin={isAdmin}
    />
  );
}
