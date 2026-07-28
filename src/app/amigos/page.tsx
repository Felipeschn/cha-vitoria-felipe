import type { Metadata } from "next";

import { InvitationRoute } from "@/components/invitation/invitation-route";

export const metadata: Metadata = {
  title: "Convite dos amigos",
  description: "Chá de casa nova de Felipe e Vitória para os amigos.",
};

export default function FriendsInvitationPage() {
  return <InvitationRoute group="amigos" />;
}
