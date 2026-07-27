"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";

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
        // O servidor decide o que renderizar a partir do cookie recém-criado,
        // inclusive redirecionar quando a audiência não é a da rota atual.
        router.refresh();
      } catch (error) {
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
    <main className="access-page">
      <section
        className="gift-access-card"
        aria-labelledby="invitation-access-title"
      >
        <div className="gift-access-card__seal" aria-hidden="true">
          V<span>&amp;</span>F
        </div>
        <div className="gift-access-card__content">
          <p className="eyebrow">Chá de casa nova</p>
          <h1 id="invitation-access-title">Vitória &amp; Felipe</h1>
          <p>
            Nosso convite é pessoal. Digite o código que enviamos junto com ele
            para abrir os detalhes da festa e a sua lista de presentes.
          </p>

          <form className="gift-access-form" onSubmit={submitCode}>
            <label htmlFor="invitation-code">Código do convite</label>
            <div className="gift-access-form__row">
              <input
                id="invitation-code"
                type="text"
                value={code}
                onChange={(event) =>
                  setCode(formatCodeInput(event.target.value))
                }
                placeholder="ABCD-EFGH"
                autoCapitalize="characters"
                autoComplete="one-time-code"
                spellCheck={false}
                maxLength={9}
                aria-describedby="invitation-code-help"
                required
              />
              <button
                className="button"
                type="submit"
                disabled={accessing || code.length !== 9}
              >
                {accessing ? "Abrindo…" : "Abrir convite"}
              </button>
            </div>
            <small id="invitation-code-help">
              Oito caracteres, com um hífen no meio.
            </small>
          </form>

          {message && (
            <p className="access-message" role="status" aria-live="polite">
              {message}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
