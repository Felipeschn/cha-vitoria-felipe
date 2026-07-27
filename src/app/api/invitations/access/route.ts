import { NextRequest, NextResponse } from "next/server";

import {
  clearInvitationSessionCookie,
  ensureAdminInvitation,
  fingerprintInvitationRequest,
  generateSessionToken,
  hashInvitationCode,
  hashSessionToken,
  invitationSessionCookie,
  invitationSessionExpiry,
  normalizeInvitationCode,
  setInvitationSessionCookie,
} from "@/lib/invitations/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

class AccessError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function json(data: unknown, status = 200) {
  const response = NextResponse.json(data, { status });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

async function readCode(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > 1_024) {
    throw new AccessError("A solicitação é grande demais.", 413);
  }

  try {
    const payload = (await request.json()) as { code?: unknown };
    const code = normalizeInvitationCode(payload.code);
    if (!code) {
      throw new AccessError(
        "Digite o código de oito caracteres do seu convite.",
        400,
      );
    }
    return code;
  } catch (error) {
    if (error instanceof AccessError) throw error;
    throw new AccessError("Digite um código de convite válido.", 400);
  }
}

export async function POST(request: NextRequest) {
  try {
    const code = await readCode(request);
    const fingerprintHash = fingerprintInvitationRequest(request);
    const supabase = createSupabaseAdminClient();

    // O convite do casal é encontrado pelo mesmo caminho de qualquer outro; só
    // precisa existir no banco com o código atual da variável de ambiente. Um
    // GIFT_ADMIN_CODE ausente ou inválido não pode impedir o acesso dos
    // convidados, então a falha é registrada e o fluxo continua.
    try {
      await ensureAdminInvitation();
    } catch (error) {
      console.error("Admin invitation sync failed", error);
    }
    const { data: allowed, error: attemptError } = await supabase.rpc(
      "consume_invitation_access_attempt",
      { p_fingerprint_hash: fingerprintHash },
    );

    if (attemptError) {
      console.error("Invitation access rate limit failed", attemptError);
      throw new AccessError(
        "Não foi possível validar o convite agora. Tente novamente.",
        500,
      );
    }
    if (!allowed) {
      throw new AccessError(
        "Muitas tentativas seguidas. Aguarde 15 minutos e tente novamente.",
        429,
      );
    }

    const { data: invitation, error: invitationError } = await supabase
      .from("gift_invitations")
      .select(
        "id,display_name,audience,is_active,expires_at,session_version",
      )
      .eq("code_hash", hashInvitationCode(code))
      .maybeSingle();

    if (
      invitationError ||
      !invitation ||
      !invitation.is_active ||
      (invitation.expires_at &&
        new Date(invitation.expires_at).getTime() <= Date.now()) ||
      (invitation.audience !== "amigos" &&
        invitation.audience !== "familia")
    ) {
      throw new AccessError(
        "Código não reconhecido. Confira os oito caracteres do convite.",
        401,
      );
    }

    const sessionToken = generateSessionToken();
    const { error: sessionError } = await supabase
      .from("gift_invitation_sessions")
      .insert({
        expires_at: invitationSessionExpiry(),
        invitation_id: invitation.id,
        session_version: invitation.session_version,
        token_hash: hashSessionToken(sessionToken),
      });

    if (sessionError) {
      console.error("Invitation session creation failed", sessionError);
      throw new AccessError(
        "Não foi possível abrir seu convite agora. Tente novamente.",
        500,
      );
    }

    await supabase
      .from("gift_invitation_access_attempts")
      .delete()
      .eq("fingerprint_hash", fingerprintHash);

    // Acessos bem-sucedidos são raros o bastante para carregar a limpeza das
    // sessões e tentativas vencidas sem custo perceptível.
    void supabase.rpc("purge_expired_invitation_state");

    const response = json({
      invitation: {
        audience: invitation.audience,
        displayName: invitation.display_name,
      },
      ok: true,
    });
    setInvitationSessionCookie(response, sessionToken);
    return response;
  } catch (error) {
    const accessError =
      error instanceof AccessError
        ? error
        : new AccessError(
            "Não foi possível abrir seu convite agora. Tente novamente.",
            500,
          );
    return json({ error: accessError.message }, accessError.status);
  }
}

export async function DELETE(request: NextRequest) {
  const token = request.cookies.get(invitationSessionCookie)?.value;
  if (token) {
    const supabase = createSupabaseAdminClient();
    await supabase
      .from("gift_invitation_sessions")
      .update({ revoked_at: new Date().toISOString() })
      .eq("token_hash", hashSessionToken(token));
  }

  const response = json({ ok: true });
  clearInvitationSessionCookie(response);
  return response;
}
