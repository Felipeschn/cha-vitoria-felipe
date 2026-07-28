import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

type SupabaseEnvironment = {
  INVITATION_CODE_SECRET?: string;
  SUPABASE_PUBLISHABLE_KEY?: string;
  SUPABASE_SECRET_KEY?: string;
  SUPABASE_URL?: string;
};

function getEnvironment(): SupabaseEnvironment {
  return {
    INVITATION_CODE_SECRET: process.env.INVITATION_CODE_SECRET,
    SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    SUPABASE_URL: process.env.SUPABASE_URL,
  };
}

function requireEnvironmentValue(
  environment: SupabaseEnvironment,
  name: keyof SupabaseEnvironment,
) {
  const value = environment[name]?.trim();

  if (!value) {
    throw new Error(`A variável ${name} não está configurada.`);
  }

  return value;
}

/**
 * O cliente é reaproveitado entre requisições. Ele age sempre com a chave de
 * serviço e não guarda sessão de usuário, então não há estado por requisição a
 * isolar — e uma única chamada ao painel passava por aqui quatro vezes, cada
 * uma montando um cliente inteiro do zero. A validação continua por chamada:
 * uma variável ausente ainda estoura na hora do uso, não na importação.
 */
let cached: {
  client: SupabaseClient<Database>;
  secretKey: string;
  url: string;
} | null = null;

export function createSupabaseAdminClient(): SupabaseClient<Database> {
  const environment = getEnvironment();
  const url = requireEnvironmentValue(environment, "SUPABASE_URL");
  const secretKey = requireEnvironmentValue(environment, "SUPABASE_SECRET_KEY");

  if (cached?.url !== url || cached.secretKey !== secretKey) {
    cached = {
      client: createClient<Database>(url, secretKey, {
        auth: {
          autoRefreshToken: false,
          detectSessionInUrl: false,
          persistSession: false,
        },
      }),
      secretKey,
      url,
    };
  }

  return cached.client;
}

export function getSupabaseRealtimeConfig() {
  const environment = getEnvironment();

  return {
    key: requireEnvironmentValue(environment, "SUPABASE_PUBLISHABLE_KEY"),
    url: requireEnvironmentValue(environment, "SUPABASE_URL"),
  };
}
