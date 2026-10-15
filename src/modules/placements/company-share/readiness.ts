import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";

/** Both the capability store and immutable audit table are mandatory. */
export async function companyShareTablesReady(): Promise<boolean> {
  const response = await getDb().execute<{links:boolean;views:boolean}>(sql`
    select to_regclass('public.placement_company_applicant_shares') is not null as links,
           to_regclass('public.placement_company_applicant_share_views') is not null as views
  `);
  return response.rows[0]?.links === true && response.rows[0]?.views === true;
}
