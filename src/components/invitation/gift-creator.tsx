"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type GiftItem = {
  description: string | null;
  id: string;
  name: string;
  quantityAvailable: number;
  quantityPurchased: number;
  quantityReserved: number;
  quantityTotal: number;
  referenceUrl: string | null;
};

type GiftDraft = {
  description: string;
  name: string;
  quantityTotal: number;
  referenceUrl: string;
};

const emptyDraft: GiftDraft = {
  description: "",
  name: "",
  quantityTotal: 1,
  referenceUrl: "",
};

/** Abaixo disso o banco recusa: são unidades que convidados já escolheram. */
function minimumQuantity(item: GiftItem) {
  return Math.max(1, item.quantityReserved + item.quantityPurchased);
}

function draftFrom(item: GiftItem): GiftDraft {
  return {
    description: item.description ?? "",
    name: item.name,
    quantityTotal: item.quantityTotal,
    referenceUrl: item.referenceUrl ?? "",
  };
}

export function GiftCreator() {
  const [items, setItems] = useState<GiftItem[]>([]);
  const [draft, setDraft] = useState<GiftDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<GiftDraft>(emptyDraft);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const request = useCallback(async (payload: Record<string, unknown>) => {
    const response = await fetch("/api/gifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as {
      error?: string;
      items?: GiftItem[];
    };
    if (!response.ok) throw new Error(data.error);
    return data;
  }, []);

  const loadItems = useCallback(async () => {
    const data = await request({ action: "adminList" });
    setItems(data.items ?? []);
  }, [request]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void loadItems().catch((error: unknown) => {
        setMessage(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os presentes.",
        );
      });
    }, 0);
    return () => window.clearTimeout(initialLoad);
  }, [loadItems]);

  async function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      await request({
        action: "add",
        description: draft.description,
        name: draft.name,
        quantityTotal: draft.quantityTotal,
        referenceUrl: draft.referenceUrl,
      });

      setDraft(emptyDraft);
      setMessage(
        "Presente criado. Ele já aparece nas páginas de amigos e família.",
      );
      await loadItems();
    } catch (error) {
      setMessage(
        error instanceof Error && error.message
          ? error.message
          : "Não foi possível adicionar o item.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(item: GiftItem, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      await request({
        action: "update",
        description: editDraft.description,
        id: item.id,
        name: editDraft.name,
        quantityTotal: editDraft.quantityTotal,
        referenceUrl: editDraft.referenceUrl,
      });

      setEditingId(null);
      setMessage(`${editDraft.name} foi atualizado.`);
      await loadItems();
    } catch (error) {
      setMessage(
        error instanceof Error && error.message
          ? error.message
          : "Não foi possível salvar as alterações.",
      );
    } finally {
      setSaving(false);
    }
  }

  function startEditing(item: GiftItem) {
    setEditingId(item.id);
    setEditDraft(draftFrom(item));
    setMessage("");
  }

  return (
    <div className="admin-card">
      <div className="admin-section-heading">
        <p className="eyebrow">Lista da casa nova</p>
        <h2>Presentes</h2>
        <p>
          Cadastre cada opção e informe quantas unidades podem ser escolhidas
          pelos convidados. O link é opcional e aparece como sugestão para o
          convidado, não como obrigação de onde comprar.
        </p>
      </div>

      <form onSubmit={addItem}>
        <label>
          Nome do presente
          <input
            type="text"
            value={draft.name}
            onChange={(event) =>
              setDraft({ ...draft, name: event.target.value })
            }
            placeholder="Ex.: Panela elétrica"
            maxLength={80}
            required
          />
        </label>
        <label>
          Descrição opcional
          <textarea
            value={draft.description}
            onChange={(event) =>
              setDraft({ ...draft, description: event.target.value })
            }
            placeholder="Ex.: Pode ser comprado em qualquer loja."
            maxLength={500}
            rows={3}
          />
        </label>
        <label>
          Link de referência opcional
          <input
            type="url"
            value={draft.referenceUrl}
            onChange={(event) =>
              setDraft({ ...draft, referenceUrl: event.target.value })
            }
            placeholder="https://loja.com.br/produto"
            maxLength={2048}
            inputMode="url"
            spellCheck={false}
          />
        </label>
        <label>
          Quantidade disponível
          <input
            type="number"
            value={draft.quantityTotal}
            onChange={(event) =>
              setDraft({ ...draft, quantityTotal: Number(event.target.value) })
            }
            min={1}
            max={999}
            required
          />
        </label>
        <button className="button" type="submit" disabled={saving}>
          {saving ? "Salvando…" : "Criar presente"}
        </button>
      </form>

      {message && (
        <p className="admin-message" role="status" aria-live="polite">
          {message}
        </p>
      )}

      <div className="admin-list">
        <h2>Presentes criados</h2>
        {items.length === 0 ? (
          <p>Nenhum presente foi criado ainda.</p>
        ) : (
          <ul>
            {items.map((item) => {
              const chosen = item.quantityReserved + item.quantityPurchased;

              if (editingId === item.id) {
                return (
                  <li className="gift-edit" key={item.id}>
                    <form onSubmit={(event) => saveEdit(item, event)}>
                      <label>
                        Nome do presente
                        <input
                          type="text"
                          value={editDraft.name}
                          onChange={(event) =>
                            setEditDraft({
                              ...editDraft,
                              name: event.target.value,
                            })
                          }
                          maxLength={80}
                          required
                        />
                      </label>
                      <label>
                        Descrição
                        <textarea
                          value={editDraft.description}
                          onChange={(event) =>
                            setEditDraft({
                              ...editDraft,
                              description: event.target.value,
                            })
                          }
                          maxLength={500}
                          rows={3}
                        />
                      </label>
                      <label>
                        Link de referência
                        <input
                          type="url"
                          value={editDraft.referenceUrl}
                          onChange={(event) =>
                            setEditDraft({
                              ...editDraft,
                              referenceUrl: event.target.value,
                            })
                          }
                          placeholder="https://loja.com.br/produto"
                          maxLength={2048}
                          inputMode="url"
                          spellCheck={false}
                        />
                      </label>
                      <label>
                        Quantidade total
                        <input
                          type="number"
                          value={editDraft.quantityTotal}
                          onChange={(event) =>
                            setEditDraft({
                              ...editDraft,
                              quantityTotal: Number(event.target.value),
                            })
                          }
                          min={minimumQuantity(item)}
                          max={999}
                          required
                        />
                      </label>
                      {chosen > 0 && (
                        <p className="gift-edit__hint">
                          {chosen}{" "}
                          {chosen === 1
                            ? "unidade já foi escolhida"
                            : "unidades já foram escolhidas"}
                          , então a quantidade total não pode ficar abaixo
                          disso.
                        </p>
                      )}
                      <div className="gift-edit__actions">
                        <button
                          className="button"
                          type="submit"
                          disabled={saving}
                        >
                          {saving ? "Salvando…" : "Salvar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          disabled={saving}
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  </li>
                );
              }

              return (
                <li key={item.id}>
                  <span>
                    <strong>{item.name}</strong>
                    {item.description && <em>{item.description}</em>}
                    {item.referenceUrl && (
                      <a
                        className="gift-reference-link"
                        href={item.referenceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Ver sugestão <span aria-hidden="true">↗</span>
                      </a>
                    )}
                  </span>
                  <small>
                    {item.quantityAvailable} de {item.quantityTotal} disponíveis
                    {item.quantityPurchased > 0
                      ? ` · ${item.quantityPurchased} compras confirmadas`
                      : item.quantityReserved > 0
                        ? ` · ${item.quantityReserved} reservados`
                        : ""}
                  </small>
                  <button
                    className="gift-edit-trigger"
                    type="button"
                    onClick={() => startEditing(item)}
                  >
                    Editar
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
