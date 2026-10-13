import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";

/**
 * Some placement tables are defined in the schema code but are not part of the
 * registered migrations yet (staged features). Reads that join them must not
 * take a whole page down with "relation does not exist". Callers check first
 * and degrade to "no data from this source", saying so in the UI.
 */
export async function placementTableExists(
  tableName: string,
): Promise<boolean> {
  if (!/^[a-z_][a-z0-9_]*$/.test(tableName)) {
    return false;
  }

  const result = await getDb().execute(
    sql`select to_regclass(${`public.${tableName}`}) is not null as present`,
  );

  const rows = Array.isArray(result)
    ? result
    : ((result as { rows?: unknown[] }).rows ?? []);

  return Boolean(
    (rows[0] as { present?: boolean } | undefined)?.present,
  );
}
