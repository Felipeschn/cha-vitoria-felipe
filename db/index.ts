import { env } from "cloudflare:workers";

type GiftEnvironment = {
  DB?: D1Database;
  GIFT_ADMIN_CODE?: string;
};

export function getGiftEnvironment(): GiftEnvironment {
  const giftEnv = env as GiftEnvironment;

  if (!giftEnv.DB) {
    throw new Error("O banco da lista de presentes não está disponível.");
  }

  return giftEnv;
}
