import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";

/** Migration 0067 supplies both columns. Verify actual type before exposing an editor. */
export async function facultyProfileDocumentStorageReady(tx: Pick<ReturnType<typeof getDb>, "execute"> = getDb()) {
  const found = await tx.execute<{ present: boolean }>(sql`
    select count(*)::int = 2 as present
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'faculty_profiles'
      and ((column_name = 'profile_document' and data_type = 'jsonb')
        or (column_name = 'profile_document_version' and data_type = 'integer'))
  `);
  return found.rows[0]?.present === true;
}
