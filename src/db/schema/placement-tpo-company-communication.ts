/** TPO-companies-15: durable company communication status per college and normalized company key. */
import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { colleges } from "./colleges";
import { users } from "./users";

export const placementTpoCompanyCommunication = pgTable(
  "placement_tpo_company_communication",
  {
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    companyKey: varchar("company_key", { length: 180 }).notNull(),
    status: varchar("status", { length: 24 }).notNull(),
    updatedByUserId: uuid("updated_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.collegeId, t.companyKey] }),
    index("tpo_company_communication_status_idx").on(t.collegeId, t.status),
    check(
      "tpo_company_communication_status_ck",
      sql`${t.status} IN ('NOT_CONTACTED','EMAILED','REPLIED','MEETING_SET','NOT_INTERESTED')`,
    ),
    check(
      "tpo_company_communication_key_ck",
      sql`length(trim(${t.companyKey}))>0`,
    ),
  ],
);
