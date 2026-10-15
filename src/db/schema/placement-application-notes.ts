/**
 * Private, append-only reviewer notes on a placement application.
 *
 * Two audiences never see each other's notes:
 *   - TPO notes: visible to the college placement cell only.
 *   - RECRUITER notes: visible to recruiters of the authoring company that
 *     hold an active grant on the job's company relationship.
 * Notes are never edited or deleted; a correction is a new note.
 */
import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { placementApplications, placementCompanies } from "./placements";
import { users } from "./users";

export const placementApplicationNotes = pgTable(
  "placement_application_notes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => placementApplications.id, { onDelete: "restrict" }),
    side: varchar("side", { length: 12 }).notNull(),
    companyId: uuid("company_id").references(() => placementCompanies.id, {
      onDelete: "restrict",
    }),
    authorUserId: uuid("author_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("placement_application_notes_application_side_idx").on(
      table.applicationId,
      table.side,
      table.createdAt,
    ),
    check(
      "placement_application_notes_side_ck",
      sql`${table.side} in ('TPO', 'RECRUITER')`,
    ),
    check(
      "placement_application_notes_company_ck",
      sql`(${table.side} = 'RECRUITER') = (${table.companyId} is not null)`,
    ),
    check(
      "placement_application_notes_body_ck",
      sql`length(trim(${table.body})) between 1 and 2000`,
    ),
  ],
);
