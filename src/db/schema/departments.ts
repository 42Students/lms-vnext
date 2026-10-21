/**
 * Legacy Department.id and college_id were integers. Any approved historic
 * import must resolve both through verified tenant-scoped UUID identity maps;
 * do not cast numeric IDs or reuse a name as a college identifier.
 * Legacy BaseModel.isDeleted becomes archivedAt (true -> verified archived
 * timestamp; false -> NULL); preserve source created/updated timestamps only
 * after timezone validation, and keep archived departments for references.
 * No historical department migration is required for greenfield vNext.
 */
import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { colleges } from "./colleges";

export const departments = pgTable(
  "departments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("departments_active_college_name_uq")
      .on(table.collegeId, sql`lower(${table.name})`)
      .where(sql`${table.archivedAt} is null`),
    index("departments_college_idx").on(table.collegeId),
    check("departments_legacy_name_length_ck",sql`
      length(trim(${table.name})) between 1 and 255`),
    uniqueIndex("departments_id_college_uq").on(table.id, table.collegeId),
  ],
);
