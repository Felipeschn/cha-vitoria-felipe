import type { Metadata } from "next";

import { InvitationPage } from "@/components/invitation/invitation-page";

export const metadata: Metadata = {
  title: "Convite dos amigos",
  description: "Chá de casa nova de Vitória e Felipe para os amigos.",
};

export default function FriendsInvitationPage() {
  return <InvitationPage group="amigos" />;
}
