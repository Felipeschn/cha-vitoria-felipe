"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type GiftItem = {
  description?: string | null;
  id: string;
  name: string;
  quantityAvailable: number;
  quantityPurchased: number;
  quantityReserved: number;
  quantityTotal: number;
};

export function GiftCreator() {
  const [items, setItems] = useState<GiftItem[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [quantityTotal, setQuantityTotal] = useState(1);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const loadItems = useCallback(async () => {
    const response = await fetch("/api/gifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "adminList" }),
    });
    const data = (await response.json()) as {
      error?: string;
      items?: GiftItem[];
    };
    if (!response.ok) throw new Error(data.error);
    setItems(data.items ?? []);
  }, []);

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
      const response = await fetch("/api/gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          description,
          name,
          quantityTotal,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error);

      setName("");
      setDescription("");
      setQuantityTotal(1);
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

  return (
    <div className="admin-card">
      <div className="admin-section-heading">
        <p className="eyebrow">Lista da casa nova</p>
        <h2>Criar presentes</h2>
        <p>
          Cadastre cada opção e informe quantas unidades podem ser escolhidas
          pelos convidados.
        </p>
      </div>
      <form onSubmit={addItem}>
        <label>
          Nome do presente
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex.: Panela elétrica"
            maxLength={80}
            required
          />
        </label>
        <label>
          Descrição opcional
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Ex.: Pode ser comprado em qualquer loja."
            maxLength={500}
            rows={3}
          />
        </label>
        <label>
          Quantidade disponível
          <input
            type="number"
            value={quantityTotal}
            onChange={(event) => setQuantityTotal(Number(event.target.value))}
            min={1}
            max={999}
            required
          />
        </label>
        <button className="button" type="submit" disabled={saving}>
          {saving ? "Criando…" : "Criar presente"}
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
            {items.map((item) => (
              <li key={item.id}>
                <span>
                  <strong>{item.name}</strong>
                  {item.description && <em>{item.description}</em>}
                </span>
                <small>
                  {item.quantityAvailable} de {item.quantityTotal} disponíveis
                  {item.quantityPurchased > 0
                    ? ` · ${item.quantityPurchased} compras confirmadas`
                    : item.quantityReserved > 0
                      ? ` · ${item.quantityReserved} reservados`
                      : ""}
                </small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
