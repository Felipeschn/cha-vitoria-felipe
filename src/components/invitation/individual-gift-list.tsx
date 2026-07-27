"use client";

import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { Database } from "@/types/database.types";

type GiftReservation = {
  id: string;
  quantity: number;
  status: "purchased" | "reserved";
};

type GiftItem = {
  active: boolean;
  description: string | null;
  id: string;
  myReservation: GiftReservation | null;
  name: string;
  quantityAvailable: number;
  quantityPurchased: number;
  quantityReserved: number;
  quantityTotal: number;
  sortOrder: number;
};

type RealtimeConfig = {
  key: string;
  url: string;
};

type GiftListResponse = {
  error?: string;
  items?: GiftItem[];
  realtime?: RealtimeConfig | null;
};

type IndividualGiftListProps = {
  displayName: string;
};

function maximumSelectable(item: GiftItem) {
  const ownedReserved =
    item.myReservation?.status === "reserved"
      ? item.myReservation.quantity
      : 0;
  return Math.min(20, item.quantityAvailable + ownedReserved);
}

export function IndividualGiftList({ displayName }: IndividualGiftListProps) {
  const router = useRouter();
  const [items, setItems] = useState<GiftItem[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [realtime, setRealtime] = useState<RealtimeConfig | null>(null);

  const loadItems = useCallback(async () => {
    try {
      const response = await fetch("/api/gifts", { cache: "no-store" });
      const data = (await response.json()) as GiftListResponse;

      // A sessão caiu ou foi revogada: o servidor volta a exibir o portão.
      if (response.status === 401) {
        router.refresh();
        return;
      }
      if (!response.ok || !data.items) {
        throw new Error(data.error);
      }

      const items = data.items;
      setItems(items);
      setRealtime(data.realtime ?? null);
      setQuantities((current) =>
        Object.fromEntries(
          items.map((item) => {
            const maximum = Math.max(1, maximumSelectable(item));
            const preferred =
              current[item.id] ?? item.myReservation?.quantity ?? 1;
            return [item.id, Math.min(Math.max(1, preferred), maximum)];
          }),
        ),
      );
    } catch {
      setMessage(
        "A lista não pôde ser carregada. Tente novamente em instantes.",
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadItems(), 0);
    const interval = window.setInterval(() => void loadItems(), 30_000);
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

  useEffect(() => {
    if (!realtime) return;

    const supabase = createClient<Database>(realtime.url, realtime.key, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    });
    const channel = supabase
      .channel("public-gifts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gifts" },
        () => void loadItems(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadItems, realtime]);

  const summary = useMemo(() => {
    const mine = items.filter((item) => item.myReservation);
    return {
      gifts: mine.length,
      units: mine.reduce(
        (total, item) => total + (item.myReservation?.quantity ?? 0),
        0,
      ),
    };
  }, [items]);

  async function leaveInvitation() {
    setMessage("");
    await fetch("/api/invitations/access", { method: "DELETE" });
    router.refresh();
  }

  function changeQuantity(item: GiftItem, delta: number) {
    const maximum = maximumSelectable(item);
    setQuantities((current) => ({
      ...current,
      [item.id]: Math.min(
        Math.max(1, (current[item.id] ?? 1) + delta),
        maximum,
      ),
    }));
  }

  async function saveReservation(item: GiftItem) {
    const quantity = quantities[item.id] ?? 1;
    setPendingId(item.id);
    setMessage("");

    try {
      const response = await fetch("/api/gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: item.myReservation ? "setQuantity" : "reserve",
          id: item.id,
          quantity,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error);

      setMessage(
        item.myReservation
          ? `Sua reserva de ${item.name} foi atualizada para ${quantity} ${quantity === 1 ? "unidade" : "unidades"}.`
          : `${quantity} ${quantity === 1 ? "unidade foi reservada" : "unidades foram reservadas"} para ${displayName}.`,
      );
      await loadItems();
    } catch (error) {
      setMessage(
        error instanceof Error && error.message
          ? error.message
          : "Não foi possível salvar sua escolha.",
      );
      await loadItems();
    } finally {
      setPendingId(null);
    }
  }

  async function updateReservation(
    item: GiftItem,
    action: "confirm" | "release",
  ) {
    setPendingId(item.id);
    setMessage("");

    try {
      const response = await fetch("/api/gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id: item.id }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error);

      setMessage(
        action === "release"
          ? `${item.name} voltou a ficar disponível para os outros convidados.`
          : `A compra de ${item.name} foi confirmada. Obrigado pelo carinho!`,
      );
      await loadItems();
    } catch (error) {
      setMessage(
        error instanceof Error && error.message
          ? error.message
          : "Não foi possível atualizar sua escolha.",
      );
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="individual-gifts" id="lista-presentes">
      <div className="individual-gifts__intro">
        <p className="eyebrow">Escolha onde comprar</p>
        <h3>Lista de presentes</h3>
        <p>
          Reserve apenas a quantidade que deseja presentear. Sua escolha fica
          guardada no convite e aparece em qualquer aparelho em que você usar o
          mesmo código.
        </p>
      </div>

      {loading ? (
        <div className="gift-list-loading" role="status">
          <span aria-hidden="true" />
          Preparando sua lista…
        </div>
      ) : (
        <>
          <div className="gift-identity">
            <div className="gift-identity__copy">
              <span className="gift-identity__icon" aria-hidden="true">
                ♡
              </span>
              <div>
                <small>Lista de</small>
                <strong>{displayName}</strong>
              </div>
            </div>
            <div className="gift-identity__summary">
              <span>
                <strong>{summary.gifts}</strong>{" "}
                {summary.gifts === 1 ? "presente" : "presentes"}
              </span>
              <span>
                <strong>{summary.units}</strong>{" "}
                {summary.units === 1 ? "unidade" : "unidades"}
              </span>
            </div>
            <button type="button" onClick={leaveInvitation}>
              Trocar convite
            </button>
          </div>

          {items.length === 0 ? (
            <p className="gift-list-state">
              A lista de presentes ainda está vazia.
            </p>
          ) : (
            <div className="checklist" aria-label="Lista de presentes">
              {items.map((item) => {
                const reservation = item.myReservation;
                const isPending = pendingId === item.id;
                const isUnavailable =
                  item.quantityAvailable < 1 && !reservation;
                const selectedQuantity = quantities[item.id] ?? 1;
                const maximum = maximumSelectable(item);
                const quantityChanged =
                  reservation?.status === "reserved" &&
                  reservation.quantity !== selectedQuantity;

                return (
                  <article
                    className={`checklist__item${
                      reservation ? " is-mine" : ""
                    }${isUnavailable ? " is-reserved" : ""}`}
                    key={item.id}
                  >
                    <div
                      className={`checklist__heading${
                        reservation ? " has-check" : ""
                      }`}
                    >
                      {reservation && (
                        <span className="checklist__mark" aria-hidden="true">
                          <svg viewBox="0 0 24 24" focusable="false">
                            <path d="m6.5 12.5 3.5 3.5 7.5-8" />
                          </svg>
                        </span>
                      )}
                      <div className="checklist__copy">
                        <strong>{item.name}</strong>
                        {item.description && <p>{item.description}</p>}
                        <span>
                          {reservation?.status === "purchased"
                            ? `${reservation.quantity} ${reservation.quantity === 1 ? "unidade comprada" : "unidades compradas"}`
                            : reservation
                              ? `${reservation.quantity} ${reservation.quantity === 1 ? "unidade reservada" : "unidades reservadas"} por você`
                              : isUnavailable
                                ? "Todas as unidades já foram escolhidas"
                                : item.quantityTotal > 1
                                  ? `${item.quantityAvailable} de ${item.quantityTotal} disponíveis`
                                  : "Disponível"}
                        </span>
                      </div>
                    </div>

                    {reservation?.status === "purchased" ? (
                      <div className="gift-purchased-state">
                        <span>Compra confirmada</span>
                        <button
                          type="button"
                          onClick={() => updateReservation(item, "release")}
                          disabled={isPending}
                        >
                          {isPending ? "Atualizando…" : "Cancelar escolha"}
                        </button>
                      </div>
                    ) : isUnavailable ? (
                      <div className="gift-unavailable-state">
                        Escolhido por outro convidado
                      </div>
                    ) : (
                      <div className="gift-choice">
                        <div
                          className="quantity-stepper"
                          aria-label={`Quantidade de ${item.name}`}
                        >
                          <button
                            type="button"
                            onClick={() => changeQuantity(item, -1)}
                            disabled={selectedQuantity <= 1 || isPending}
                            aria-label={`Diminuir quantidade de ${item.name}`}
                          >
                            −
                          </button>
                          <span>
                            <strong>{selectedQuantity}</strong>
                            <small>
                              {selectedQuantity === 1 ? "unidade" : "unidades"}
                            </small>
                          </span>
                          <button
                            type="button"
                            onClick={() => changeQuantity(item, 1)}
                            disabled={
                              selectedQuantity >= maximum || isPending
                            }
                            aria-label={`Aumentar quantidade de ${item.name}`}
                          >
                            +
                          </button>
                        </div>

                        <div className="gift-choice__actions">
                          {reservation ? (
                            <>
                              {quantityChanged && (
                                <button
                                  className="gift-action-primary"
                                  type="button"
                                  onClick={() => saveReservation(item)}
                                  disabled={isPending}
                                >
                                  {isPending
                                    ? "Salvando…"
                                    : "Atualizar quantidade"}
                                </button>
                              )}
                              <button
                                className="gift-action-primary"
                                type="button"
                                onClick={() =>
                                  updateReservation(item, "confirm")
                                }
                                disabled={isPending || quantityChanged}
                              >
                                {isPending
                                  ? "Atualizando…"
                                  : "Confirmar que comprei"}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  updateReservation(item, "release")
                                }
                                disabled={isPending}
                              >
                                Cancelar reserva
                              </button>
                            </>
                          ) : (
                            <button
                              className="gift-action-primary"
                              type="button"
                              onClick={() => saveReservation(item)}
                              disabled={isPending}
                            >
                              {isPending
                                ? "Reservando…"
                                : `Reservar ${selectedQuantity}`}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {message && (
        <p className="gift-list-message" role="status" aria-live="polite">
          {message}
        </p>
      )}
    </div>
  );
}
