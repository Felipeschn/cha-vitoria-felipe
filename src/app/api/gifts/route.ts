import { getGiftEnvironment } from "../../../../db";

type GiftRow = {
  id: number;
  name: string;
  reserved: number;
};

type GiftAction =
  | { action?: "reserve"; id?: number; claimToken?: string }
  | { action: "release"; id?: number; claimToken?: string }
  | { action: "add"; name?: string; adminCode?: string };

function json(data: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store");
  return Response.json(data, { ...init, headers });
}

async function hashToken(token: string) {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function GET() {
  try {
    const { DB } = getGiftEnvironment();
    const result = await DB!.prepare(
      `SELECT id, name, reserved_at IS NOT NULL AS reserved
       FROM gift_items
       ORDER BY sort_order, id`,
    ).all<GiftRow>();

    return json({
      items: result.results.map((item) => ({
        id: item.id,
        name: item.name,
        reserved: Boolean(item.reserved),
      })),
    });
  } catch {
    return json(
      { error: "Não foi possível carregar os presentes agora." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as GiftAction;
    const { DB, GIFT_ADMIN_CODE } = getGiftEnvironment();

    if (payload.action === "add") {
      const name = payload.name?.trim().replace(/\s+/g, " ") ?? "";

      if (!GIFT_ADMIN_CODE || payload.adminCode !== GIFT_ADMIN_CODE) {
        return json({ error: "Código de organização incorreto." }, { status: 401 });
      }
      if (name.length < 2 || name.length > 80) {
        return json(
          { error: "Digite um item entre 2 e 80 caracteres." },
          { status: 400 },
        );
      }

      const nextOrder = await DB!.prepare(
        "SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM gift_items",
      ).first<{ next_order: number }>();

      try {
        const result = await DB!.prepare(
          "INSERT INTO gift_items (name, sort_order) VALUES (?, ?) RETURNING id, name",
        )
          .bind(name, nextOrder?.next_order ?? 1)
          .first<{ id: number; name: string }>();
        return json({ item: result }, { status: 201 });
      } catch (error) {
        if (String(error).toLowerCase().includes("unique")) {
          return json({ error: "Esse item já está na lista." }, { status: 409 });
        }
        throw error;
      }
    }

    const id = Number(payload.id);
    const claimToken = payload.claimToken?.trim() ?? "";

    if (!Number.isInteger(id) || id < 1 || claimToken.length < 20) {
      return json({ error: "Reserva inválida." }, { status: 400 });
    }

    const tokenHash = await hashToken(claimToken);

    if (payload.action === "release") {
      const result = await DB!.prepare(
        `UPDATE gift_items
         SET reserved_at = NULL, claim_token_hash = NULL
         WHERE id = ? AND claim_token_hash = ?`,
      )
        .bind(id, tokenHash)
        .run();

      if (result.meta.changes !== 1) {
        return json(
          { error: "Não foi possível desfazer essa escolha." },
          { status: 409 },
        );
      }

      return json({ ok: true });
    }

    const result = await DB!.prepare(
      `UPDATE gift_items
       SET reserved_at = CURRENT_TIMESTAMP, claim_token_hash = ?
       WHERE id = ? AND reserved_at IS NULL`,
    )
      .bind(tokenHash, id)
      .run();

    if (result.meta.changes !== 1) {
      return json(
        { error: "Outra pessoa acabou de escolher este item." },
        { status: 409 },
      );
    }

    return json({ ok: true }, { status: 201 });
  } catch {
    return json(
      { error: "Não foi possível atualizar a lista agora." },
      { status: 500 },
    );
  }
}
