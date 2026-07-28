"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Encerra a sessão do convite neste aparelho e devolve o portão, para que
 * outra pessoa possa entrar com o próprio código.
 */
export function SessionExit() {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  async function leave() {
    setLeaving(true);
    try {
      await fetch("/api/invitations/access", { method: "DELETE" });
      router.refresh();
    } finally {
      setLeaving(false);
    }
  }

  return (
    <button
      className="top-action"
      type="button"
      onClick={leave}
      disabled={leaving}
      aria-busy={leaving}
    >
      {leaving ? "Saindo…" : "Sair"}
    </button>
  );
}
