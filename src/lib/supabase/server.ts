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

export function createSupabaseAdminClient(): SupabaseClient<Database> {
  const environment = getEnvironment();
  const url = requireEnvironmentValue(environment, "SUPABASE_URL");
  const secretKey = requireEnvironmentValue(environment, "SUPABASE_SECRET_KEY");

  return createClient<Database>(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

export function getSupabaseRealtimeConfig() {
  const environment = getEnvironment();

  return {
    key: requireEnvironmentValue(environment, "SUPABASE_PUBLISHABLE_KEY"),
    url: requireEnvironmentValue(environment, "SUPABASE_URL"),
  };
}
