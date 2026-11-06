/**
 * Shared, short-lived security state that must hold across server instances (docs/security/central-security-architecture.md,
 * layers L8 and L10): rate-limit windows and webhook delivery claims.
 *
 * Platform-wide system table: it holds no tenant data (the key is a route name plus an opaque identifier), so it has
 * no college_id and no RLS policy. Rows are disposable; `expires_at` lets a sweep delete them at any time.
 */
import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const securitySharedStore = pgTable(
  "security_shared_store",
  {
    key: text("key").primaryKey(),
    kind: text("kind").notNull(),
    count: integer("count").notNull().default(1),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("security_shared_store_expires_idx").on(table.expiresAt)],
);
