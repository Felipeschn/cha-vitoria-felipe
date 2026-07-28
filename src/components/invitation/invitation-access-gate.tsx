"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";

import { BotanicalMark } from "./botanical-mark";

const codeAlphabetPattern = /[^A-HJ-KM-NP-Z2-9]/g;

function formatCodeInput(value: string) {
  const normalized = value
    .toUpperCase()
    .replace(codeAlphabetPattern, "")
    .slice(0, 8);
  return normalized.length > 4
    ? `${normalized.slice(0, 4)}-${normalized.slice(4)}`
    : normalized;
}

type InvitationAccessGateProps = {
  /**
   * Com sessão aberta o formulário não aparece, mas o componente continua
   * montado para tratar links `#convite=CODE`.
   */
  hasSession?: boolean;
};

export function InvitationAccessGate({
  hasSession = false,
}: InvitationAccessGateProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [accessing, setAccessing] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  const accessInvitation = useCallback(
    async (invitationCode: string) => {
      setAccessing(true);
      setMessage("");

      try {
        const response = await fetch("/api/invitations/access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: invitationCode }),
        });
        const data = (await response.json()) as { error?: string; ok?: boolean };
        if (!response.ok || !data.ok) {
          throw new Error(data.error || "Código de convite inválido.");
        }

        setCode("");
        // A porta abre enquanto o servidor responde: o refresh corre por baixo
        // da animação, então não somamos espera — só cobrimos a que já existia.
        setUnlocking(true);
        await new Promise((resolve) => window.setTimeout(resolve, 220));
        router.refresh();
      } catch (error) {
        setUnlocking(false);
        setMessage(
          error instanceof Error && error.message
            ? error.message
            : "Não foi possível abrir o convite.",
        );
      } finally {
        setAccessing(false);
      }
    },
    [router],
  );

  // Um link com `#convite=CODE` precisa valer mesmo em um aparelho que já tenha
  // a sessão de outro convite aberta; sem isso o convidado veria a lista da
  // família anterior. O hash sai da barra antes de qualquer coisa.
  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const invitationCode = fragment.get("convite");
    if (!invitationCode) return;

    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}`,
    );

    const openInvitation = window.setTimeout(
      () => void accessInvitation(formatCodeInput(invitationCode)),
      0,
    );
    return () => window.clearTimeout(openInvitation);
  }, [accessInvitation]);

  async function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await accessInvitation(code);
  }

  if (hasSession) return null;

  return (
    <main className={`gate${unlocking ? " is-unlocking" : ""}`}>
      <section className="gate__card" aria-labelledby="gate-title">
        <BotanicalMark className="gate__sprig" />

        <p className="eyebrow">Chá de casa nova</p>
        <h1 className="gate__title" id="gate-title">
          Entre.
        </h1>
        <p className="gate__lead">
          O convite é pessoal — use o código que enviamos junto com ele.
        </p>

        <form className="code-field" onSubmit={submitCode}>
          <label className="code-field__label" htmlFor="invitation-code">
            Código do convite
          </label>
          <input
            className="code-field__input"
            id="invitation-code"
            type="text"
            value={code}
            onChange={(event) => setCode(formatCodeInput(event.target.value))}
            placeholder="ABCD-EFGH"
            autoCapitalize="characters"
            autoCorrect="off"
            autoComplete="one-time-code"
            enterKeyHint="go"
            spellCheck={false}
            maxLength={9}
            aria-describedby="invitation-code-hint"
            aria-invalid={message ? true : undefined}
            required
          />
          <button
            className="btn btn--solid btn--block"
            type="submit"
            disabled={accessing || code.length !== 9}
            aria-busy={accessing}
          >
            {accessing ? "Abrindo…" : "Abrir convite"}
          </button>
          <small
            className={`code-field__hint${message ? " code-field__hint--error" : ""}`}
            id="invitation-code-hint"
            role={message ? "alert" : undefined}
          >
            {message || "Oito caracteres, com um hífen no meio."}
          </small>
        </form>
      </section>
    </main>
  );
}
