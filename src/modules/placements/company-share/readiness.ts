import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";

/** Both the capability store and immutable audit table are mandatory. */
export async function companyShareTablesReady(): Promise<boolean> {
  const response = await getDb().execute<{links:boolean;views:boolean;codeReady:boolean}>(sql`
    select to_regclass('public.placement_company_applicant_shares') is not null as links,
           to_regclass('public.placement_company_applicant_share_views') is not null as views,
           (select count(*)=7 from information_schema.columns where table_schema='public'
            and table_name='placement_company_applicant_shares' and column_name in
            ('code_hash','code_salt','wrong_code_count','wrong_code_window_start',
             'locked_until','selected_columns','shortlist_by')) as "codeReady"
  `);
  return response.rows[0]?.links === true && response.rows[0]?.views === true && response.rows[0]?.codeReady === true;
}
