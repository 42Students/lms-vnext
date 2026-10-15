import "server-only";
import {sql} from "drizzle-orm";
import {getDb} from "@/db/client";
export async function publicJoinTablesReady(){
 const result=await getDb().execute<{links:boolean;challenges:boolean}>(sql`
   select to_regclass('public.placement_public_join_links') is not null as links,
          to_regclass('public.placement_public_join_challenges') is not null as challenges`);
 return result.rows[0]?.links===true && result.rows[0]?.challenges===true;
}
