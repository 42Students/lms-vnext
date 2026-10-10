/**
 * DB-004 / Chat 2 — source-backed tenant branding candidate.
 *
 * STAGED ONLY. Deliberately not exported by src/db/schema/index.ts and no
 * numbered Drizzle migration is registered. Chat 1 is the only migration
 * integrator. Do not import into production handlers before integration.
 *
 * Legacy evidence:
 * lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5:
 * model/CollegeBranding.java; controller/PublicTenantController.java
 *
 * One logical row per college, with an archivedAt marker rather than
 * creating multiple active rows for a single tenant.
 */
import { sql } from "drizzle-orm";
import {
  check,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { colleges } from "./colleges";

export const collegeBrandingStaged = pgTable(
  "college_branding",
  {
    collegeId: uuid("college_id")
      .primaryKey()
      .references(() => colleges.id, { onDelete: "restrict" }),
    logoUrl: text("logo_url"),
    faviconUrl: text("favicon_url"),
    loginBackgroundUrl: text("login_background_url"),
    loginBackgroundUrlMobile: text("login_background_url_mobile"),
    primaryColor: varchar("primary_color", { length: 64 }),
    secondaryColor: varchar("secondary_color", { length: 64 }),
    supportEmail: varchar("support_email", { length: 320 }),
    supportPhone: varchar("support_phone", { length: 64 }),
    termsUrl: text("terms_url"),
    privacyUrl: text("privacy_url"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("college_branding_version_ck", sql`${table.version} >= 1`),
  ],
);
