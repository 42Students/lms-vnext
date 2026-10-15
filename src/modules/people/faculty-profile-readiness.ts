import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";

/** DB04 is optional until the orchestrator registers its migration. Never guess. */
export async function facultyProfileDocumentStorageReady() {
  const found = await getDb().execute<{ present: boolean }>(sql`
    select count(*)::int = 2 as present
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'faculty_profiles'
      and column_name in ('profile_document', 'profile_document_version')
  `);
  return found.rows[0]?.present === true;
}
