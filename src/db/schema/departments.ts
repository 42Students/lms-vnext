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


/** Old Department.id/collegeId integers are source import keys only.
 * An archived department may be retained for roster/history references but
 * cannot be revived under a conflicting active name in the same college. */
export function legacyDepartmentImportDisposition(input:{
 legacyId:number;sourceCollegeId:number;resolvedCollegeId:string|null;
 name:string;deleted:boolean;sourceArchivedAt:string|null;
 activeNameAlreadyUsed:boolean;
}){
 if(!Number.isSafeInteger(input.legacyId)||input.legacyId<1||
    !Number.isSafeInteger(input.sourceCollegeId)||input.sourceCollegeId<1||
    !input.resolvedCollegeId||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.resolvedCollegeId))
  throw new Error("Unmapped department or college ID");
 const name=input.name.trim();
 if(name.length<1||name.length>255)throw new Error("Invalid source department name");
 if(!input.deleted&&input.activeNameAlreadyUsed)
  throw new Error("Active department name collision in this college");
 const retired=input.deleted?input.sourceArchivedAt:null;
 if(retired!==null&&(!/(?:Z|[+-]\d{2}:\d{2})$/.test(retired)||
  !Number.isFinite(Date.parse(retired))))
  throw new Error("Department archive time needs timezone mapping");
 return {collegeId:input.resolvedCollegeId,name,
  archivedAt:input.deleted?new Date(retired??"1970-01-01T00:00:00Z"):null,
  legacyDepartmentId:input.legacyId,activate:false as const};
}
