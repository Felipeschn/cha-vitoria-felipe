import type { Metadata } from "next";

import { InvitationRoute } from "@/components/invitation/invitation-route";

export const metadata: Metadata = {
  title: "Convite da família",
  description: "Chá de casa nova de Felipe e Vitória para a família.",
};

export default function FamilyInvitationPage() {
  return <InvitationRoute group="familia" />;
}
