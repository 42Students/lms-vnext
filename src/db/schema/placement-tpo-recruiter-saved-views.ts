/** TPO-recruiters-18: per-college, per-owner recruiter list filter/column views. */
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  jsonb,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { colleges } from "./colleges";
import { users } from "./users";

export const placementTpoRecruiterSavedViews = pgTable(
  "placement_tpo_recruiter_saved_views",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    ownerUserId: uuid("owner_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 100 }).notNull(),
    note: varchar("note", { length: 500 }),
    queryJson: jsonb("query_json")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    columnsJson: jsonb("columns_json").$type<unknown[]>().notNull().default([]),
    pinned: boolean("pinned").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("tpo_recruiter_saved_view_name_uq").on(
      t.collegeId,
      t.ownerUserId,
      t.name,
    ),
    index("tpo_recruiter_saved_views_owner_idx").on(
      t.collegeId,
      t.ownerUserId,
      sql`${t.pinned} desc`,
      sql`${t.updatedAt} desc`,
    ),
    check(
      "tpo_recruiter_saved_view_query_ck",
      sql`jsonb_typeof(${t.queryJson})='object'`,
    ),
    check(
      "tpo_recruiter_saved_view_columns_ck",
      sql`jsonb_typeof(${t.columnsJson})='array'`,
    ),
  ],
);
