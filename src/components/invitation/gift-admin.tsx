"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type GiftItem = {
  id: number;
  name: string;
  reserved: boolean;
};

export function GiftAdmin() {
  const [items, setItems] = useState<GiftItem[]>([]);
  const [adminCode, setAdminCode] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const loadItems = useCallback(async () => {
    const response = await fetch("/api/gifts", { cache: "no-store" });
    const data = (await response.json()) as { items?: GiftItem[] };
    setItems(data.items ?? []);
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadItems(), 0);
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
        body: JSON.stringify({ action: "add", name, adminCode }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error);

      setName("");
      setMessage("Item adicionado à lista.");
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
      <form onSubmit={addItem}>
        <label>
          Código de organização
          <input
            type="password"
            value={adminCode}
            onChange={(event) => setAdminCode(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        <label>
          Novo presente
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex.: Panela elétrica"
            maxLength={80}
            required
          />
        </label>
        <button className="button" type="submit" disabled={saving}>
          {saving ? "Adicionando…" : "Adicionar à lista"}
        </button>
      </form>

      {message && (
        <p className="admin-message" role="status" aria-live="polite">
          {message}
        </p>
      )}

      <div className="admin-list">
        <h2>Itens atuais</h2>
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <span>{item.name}</span>
              <small>{item.reserved ? "Escolhido" : "Disponível"}</small>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
