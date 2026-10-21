/**
 * TPO-campaigns-public-R01: optional public-join mobile contact for a recruiter.
 * Distinct from users.phone_e164, which is a first-party login factor.
 * The same public contact digits MAY appear on multiple recruiter rows.
 * This field is not a login identity, has no unique phone index and must
 * never bypass the independently verified recruiter account/college grant.
 */
import { sql } from "drizzle-orm";
import { check, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./users";

export const placementRecruiterPublicContacts = pgTable(
  "placement_recruiter_public_contacts",
  {
    recruiterUserId: uuid("recruiter_user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "restrict" }),
    phoneDigits: varchar("phone_digits", { length: 10 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    check(
      "public_recruiter_contact_phone_ck",
      sql`${t.phoneDigits} ~ '^[0-9]{10}$'`,
    ),
  ],
);

/** Public-only phone normalization. Does not create or verify login identity. */
export function normalizeRecruiterPublicContact(raw: string): string | null {
  const digits = raw.trim().replace(/[\\s()+-]/g, "");
  const local = digits.startsWith("91") && digits.length === 12 ? digits.slice(2) : digits;
  return /^[0-9]{10}$/.test(local) ? local : null;
}
