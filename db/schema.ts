import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const giftItems = sqliteTable("gift_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
  reservedAt: text("reserved_at"),
  claimTokenHash: text("claim_token_hash"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
