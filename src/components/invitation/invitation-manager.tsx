"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type AudienceFilter = "todos" | "familia" | "amigos";

const audienceFilters: { label: string; value: AudienceFilter }[] = [
  { label: "Todos", value: "todos" },
  { label: "Família", value: "familia" },
  { label: "Amigos", value: "amigos" },
];

type ReservationSummary = {
  createdAt: string;
  giftId: string;
  giftName: string;
  quantity: number;
  status: "purchased" | "reserved";
};

type ManagedInvitation = {
  audience: "amigos" | "familia";
  code: string;
  codeHint: string;
  confirmed: boolean;
  confirmedAt: string | null;
  createdAt: string;
  displayName: string;
  id: string;
  reservations: ReservationSummary[];
  sessionVersion: number;
};

type InvitationResponse = {
  error?: string;
  invitations?: ManagedInvitation[];
};

function invitationLink(invitation: ManagedInvitation) {
  if (typeof window === "undefined" || !invitation.code) return "";
  const path = invitation.audience === "amigos" ? "/amigos" : "/familia";
  return `${window.location.origin}${path}#convite=${invitation.code}`;
}

export function InvitationManager() {
  const [invitations, setInvitations] = useState<ManagedInvitation[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [audience, setAudience] =
    useState<ManagedInvitation["audience"]>("familia");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [filter, setFilter] = useState<AudienceFilter>("todos");
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      todos: invitations.length,
      familia: invitations.filter((item) => item.audience === "familia").length,
      amigos: invitations.filter((item) => item.audience === "amigos").length,
    }),
    [invitations],
  );

  const visibleInvitations = useMemo(
    () =>
      filter === "todos"
        ? invitations
        : invitations.filter((item) => item.audience === filter),
    [filter, invitations],
  );

  const confirmedCount = useMemo(
    () => visibleInvitations.filter((item) => item.confirmed).length,
    [visibleInvitations],
  );

  const request = useCallback(
    async (payload: Record<string, unknown>) => {
      const response = await fetch("/api/invitations/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as InvitationResponse;
      if (!response.ok || !data.invitations) {
        throw new Error(data.error || "Não foi possível carregar os convites.");
      }
      setInvitations(data.invitations);
      return data.invitations;
    },
    [],
  );

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void request({ action: "list" }).catch((error: unknown) => {
        setMessage(
          error instanceof Error ? error.message : "Não foi possível carregar.",
        );
      });
    }, 0);
    return () => window.clearTimeout(initialLoad);
  }, [request]);

  async function createInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending("create");
    setMessage("");

    try {
      const next = await request({
        action: "create",
        audience,
        displayName,
      });
      setDisplayName("");
      setMessage(
        `Convite de ${next.find((item) => item.displayName === displayName)?.displayName ?? displayName} criado. O código já pode ser enviado.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Não foi possível criar.",
      );
    } finally {
      setPending(null);
    }
  }

  async function updateInvitation(
    invitation: ManagedInvitation,
    action: "rotate" | "setConfirmed" | "delete",
  ) {
    const key = `${action}:${invitation.id}`;
    setPending(key);
    setMessage("");

    try {
      await request({
        action,
        confirmed:
          action === "setConfirmed" ? !invitation.confirmed : undefined,
        id: invitation.id,
      });
      setConfirmingDelete(null);
      setMessage(
        action === "rotate"
          ? `Novo código criado para ${invitation.displayName}. Os acessos anteriores foram encerrados.`
          : action === "delete"
            ? `O convite de ${invitation.displayName} foi excluído.`
            : invitation.confirmed
              ? `A presença de ${invitation.displayName} deixou de estar confirmada.`
              : `${invitation.displayName} está com presença confirmada.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Não foi possível atualizar.",
      );
    } finally {
      setPending(null);
    }
  }

  async function copyInvitation(
    invitation: ManagedInvitation,
    kind: "code" | "link",
  ) {
    const value =
      kind === "code" ? invitation.code : invitationLink(invitation);
    if (!value) {
      setMessage("Gere um novo código antes de copiar este convite.");
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      const key = `${kind}:${invitation.id}`;
      setCopied(key);
      window.setTimeout(() => setCopied(null), 1_800);
    } catch {
      setMessage("Não foi possível copiar automaticamente.");
    }
  }

  return (
    <section className="admin-card admin-card--invitations">
      <div className="admin-section-heading">
        <p className="eyebrow">Acesso dos convidados</p>
        <h2>Convites e famílias</h2>
        <p>
          Cada código identifica uma pessoa, casal ou família em qualquer aparelho.
          Os oito caracteres ficam organizados em dois blocos fáceis de ler.
        </p>
      </div>

      <form className="invitation-create-form" onSubmit={createInvitation}>
        <label>
          Nome no convite
          <input
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Ex.: Família Oliveira"
            maxLength={80}
            required
          />
        </label>
        <label>
          Tipo de convite
          <select
            value={audience}
            onChange={(event) =>
              setAudience(event.target.value as ManagedInvitation["audience"])
            }
          >
            <option value="familia">Família</option>
            <option value="amigos">Amigos</option>
          </select>
        </label>
        <button className="button" type="submit" disabled={pending === "create"}>
          {pending === "create" ? "Gerando…" : "Gerar convite"}
        </button>
      </form>

      {message && (
        <p className="admin-message" role="status" aria-live="polite">
          {message}
        </p>
      )}

      <div className="invitation-admin-list">
        <div className="invitation-admin-list__heading">
          <h3>Convites criados</h3>
          <span>{visibleInvitations.length}</span>
        </div>

        <div
          className="invitation-filter"
          role="group"
          aria-label="Filtrar convites por tipo"
        >
          {audienceFilters.map((option) => (
            <button
              className={filter === option.value ? "is-selected" : ""}
              key={option.value}
              type="button"
              aria-pressed={filter === option.value}
              onClick={() => setFilter(option.value)}
            >
              {option.label}
              <span>{counts[option.value]}</span>
            </button>
          ))}
        </div>

        {visibleInvitations.length > 0 && (
          <p className="invitation-confirmed-summary">
            <strong>{confirmedCount}</strong> de {visibleInvitations.length} com
            presença confirmada
          </p>
        )}

        {visibleInvitations.length === 0 ? (
          <p className="admin-empty-state">
            {invitations.length === 0
              ? "Nenhum convite criado ainda. Comece pelo primeiro nome acima."
              : `Nenhum convite de ${filter === "familia" ? "família" : "amigos"} ainda.`}
          </p>
        ) : (
          <div className="invitation-admin-grid">
            {visibleInvitations.map((invitation) => {
              const reserved = invitation.reservations
                .filter((item) => item.status === "reserved")
                .reduce((total, item) => total + item.quantity, 0);
              const purchased = invitation.reservations
                .filter((item) => item.status === "purchased")
                .reduce((total, item) => total + item.quantity, 0);

              return (
                <article
                  className={`invitation-admin-item${
                    invitation.confirmed ? " is-confirmed" : ""
                  }`}
                  key={invitation.id}
                >
                  <div className="invitation-admin-item__top">
                    <div>
                      <span className="invitation-audience">
                        {invitation.audience === "familia"
                          ? "Família"
                          : "Amigos"}
                      </span>
                      <h4>{invitation.displayName}</h4>
                    </div>
                    {invitation.confirmed && (
                      <span className="invitation-status is-confirmed">
                        Presença confirmada
                      </span>
                    )}
                  </div>

                  <code className="invitation-code">
                    {invitation.code || `••••-${invitation.codeHint}`}
                  </code>

                  <div className="invitation-copy-actions">
                    <button
                      type="button"
                      onClick={() => copyInvitation(invitation, "code")}
                    >
                      {copied === `code:${invitation.id}`
                        ? "Código copiado"
                        : "Copiar código"}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyInvitation(invitation, "link")}
                    >
                      {copied === `link:${invitation.id}`
                        ? "Link copiado"
                        : "Copiar link"}
                    </button>
                  </div>

                  <div className="invitation-summary">
                    <span>
                      <strong>{reserved}</strong> reservado
                    </span>
                    <span>
                      <strong>{purchased}</strong> comprado
                    </span>
                  </div>

                  {invitation.reservations.length > 0 && (
                    <ul className="invitation-reservations">
                      {invitation.reservations.map((reservation) => (
                        <li
                          key={`${reservation.giftId}:${reservation.status}`}
                        >
                          <span>
                            {reservation.quantity}× {reservation.giftName}
                          </span>
                          <small>
                            {reservation.status === "purchased"
                              ? "Comprado"
                              : "Reservado"}
                          </small>
                        </li>
                      ))}
                    </ul>
                  )}

                  <button
                    className={`invitation-confirm${
                      invitation.confirmed ? " is-confirmed" : ""
                    }`}
                    type="button"
                    onClick={() => updateInvitation(invitation, "setConfirmed")}
                    disabled={pending === `setConfirmed:${invitation.id}`}
                  >
                    <span aria-hidden="true">
                      {invitation.confirmed ? "✓" : "+"}
                    </span>
                    {pending === `setConfirmed:${invitation.id}`
                      ? "Salvando…"
                      : invitation.confirmed
                        ? "Presença confirmada"
                        : "Marcar presença confirmada"}
                  </button>

                  <div className="invitation-manage-actions">
                    <button
                      type="button"
                      onClick={() => updateInvitation(invitation, "rotate")}
                      disabled={pending === `rotate:${invitation.id}`}
                    >
                      {pending === `rotate:${invitation.id}`
                        ? "Gerando…"
                        : "Trocar código"}
                    </button>
                    {confirmingDelete === invitation.id ? (
                      <button
                        className="is-danger"
                        type="button"
                        onClick={() => updateInvitation(invitation, "delete")}
                        disabled={pending === `delete:${invitation.id}`}
                      >
                        {pending === `delete:${invitation.id}`
                          ? "Excluindo…"
                          : "Confirmar exclusão"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmingDelete(invitation.id)}
                      >
                        Excluir convite
                      </button>
                    )}
                  </div>

                  {confirmingDelete === invitation.id && (
                    <p className="invitation-delete-warning">
                      Isso apaga o convite, as escolhas de presente
                      {reserved + purchased > 0
                        ? ` (${reserved + purchased} ${reserved + purchased === 1 ? "unidade volta" : "unidades voltam"} para a lista)`
                        : ""}{" "}
                      e o acesso de {invitation.displayName}. Não dá para
                      desfazer.{" "}
                      <button
                        type="button"
                        onClick={() => setConfirmingDelete(null)}
                      >
                        Cancelar
                      </button>
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
