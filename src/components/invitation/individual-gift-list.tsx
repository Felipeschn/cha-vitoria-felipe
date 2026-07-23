"use client";

import { useCallback, useEffect, useState } from "react";

type GiftItem = {
  id: number;
  name: string;
  reserved: boolean;
};

type ClaimTokens = Record<string, string>;

const storageKey = "vitoria-felipe-gift-claims";

function readClaims(): ClaimTokens {
  try {
    return JSON.parse(window.localStorage.getItem(storageKey) ?? "{}") as ClaimTokens;
  } catch {
    return {};
  }
}

function writeClaims(claims: ClaimTokens) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(claims));
  } catch {
    // A reserva continua válida mesmo se o navegador bloquear o armazenamento local.
  }
}

export function IndividualGiftList() {
  const [items, setItems] = useState<GiftItem[]>([]);
  const [claims, setClaims] = useState<ClaimTokens>(() =>
    typeof window === "undefined" ? {} : readClaims(),
  );
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const loadItems = useCallback(async () => {
    try {
      const response = await fetch("/api/gifts", { cache: "no-store" });
      const data = (await response.json()) as { items?: GiftItem[]; error?: string };
      if (!response.ok || !data.items) {
        throw new Error(data.error);
      }
      setItems(data.items);
      setMessage("");
    } catch {
      setMessage("A lista não pôde ser carregada. Tente novamente em instantes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadItems(), 0);

    const interval = window.setInterval(loadItems, 15000);
    const refreshVisible = () => {
      if (document.visibilityState === "visible") void loadItems();
    };
    document.addEventListener("visibilitychange", refreshVisible);

    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshVisible);
    };
  }, [loadItems]);

  async function reserve(item: GiftItem) {
    const claimToken = crypto.randomUUID();
    setPendingId(item.id);
    setMessage("");

    try {
      const response = await fetch("/api/gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reserve", id: item.id, claimToken }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error);

      const nextClaims = { ...claims, [item.id]: claimToken };
      setClaims(nextClaims);
      writeClaims(nextClaims);
      setMessage(`${item.name} foi marcado como seu presente. Obrigado!`);
      await loadItems();
    } catch (error) {
      setMessage(
        error instanceof Error && error.message
          ? error.message
          : "Não foi possível reservar este item.",
      );
      await loadItems();
    } finally {
      setPendingId(null);
    }
  }

  async function release(item: GiftItem) {
    const claimToken = claims[item.id];
    if (!claimToken) return;

    setPendingId(item.id);
    setMessage("");

    try {
      const response = await fetch("/api/gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "release", id: item.id, claimToken }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error);

      const nextClaims = { ...claims };
      delete nextClaims[item.id];
      setClaims(nextClaims);
      writeClaims(nextClaims);
      setMessage(`${item.name} voltou a ficar disponível.`);
      await loadItems();
    } catch (error) {
      setMessage(
        error instanceof Error && error.message
          ? error.message
          : "Não foi possível desfazer a escolha.",
      );
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="individual-gifts">
      <div className="individual-gifts__intro">
        <p className="eyebrow">Escolha onde comprar</p>
        <h3>Presentes avulsos</h3>
        <p>
          Se quiser escolher um destes itens, marque-o aqui. Assim, as outras pessoas
          saberão que ele já foi escolhido — e você pode comprar onde preferir.
        </p>
        <p className="individual-gifts__privacy">
          <span aria-hidden="true">♡</span>
          Não se preocupe: o casal saberá apenas que o item foi escolhido, não quem
          comprou.
        </p>
      </div>

      {loading ? (
        <p className="gift-list-state" role="status">
          Carregando os itens…
        </p>
      ) : (
        <div className="checklist" aria-label="Lista de presentes avulsos">
          {items.map((item) => {
            const isMine = item.reserved && Boolean(claims[item.id]);
            const isPending = pendingId === item.id;

            return (
              <article
                className={`checklist__item${item.reserved ? " is-reserved" : ""}${
                  isMine ? " is-mine" : ""
                }`}
                key={item.id}
              >
                <span className="checklist__mark" aria-hidden="true">
                  {item.reserved ? "✓" : ""}
                </span>
                <div className="checklist__copy">
                  <strong>{item.name}</strong>
                  <span>
                    {isMine
                      ? "Escolhido por você"
                      : item.reserved
                        ? "Já foi escolhido"
                        : "Disponível"}
                  </span>
                </div>
                {isMine ? (
                  <button
                    type="button"
                    onClick={() => release(item)}
                    disabled={isPending}
                  >
                    {isPending ? "Atualizando…" : "Desfazer"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => reserve(item)}
                    disabled={item.reserved || isPending}
                  >
                    {isPending
                      ? "Reservando…"
                      : item.reserved
                        ? "Indisponível"
                        : "Vou presentear"}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}

      {message && (
        <p className="gift-list-message" role="status" aria-live="polite">
          {message}
        </p>
      )}
    </div>
  );
}
