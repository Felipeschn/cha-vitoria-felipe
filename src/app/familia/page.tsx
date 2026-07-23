import type { Metadata } from "next";

import { InvitationPage } from "@/components/invitation/invitation-page";

export const metadata: Metadata = {
  title: "Convite da família",
  description: "Chá de casa nova de Vitória e Felipe para a família.",
};

export default function FamilyInvitationPage() {
  return <InvitationPage group="familia" />;
}
