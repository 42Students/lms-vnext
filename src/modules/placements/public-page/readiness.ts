import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
export async function publicPlacementTableReady(){
  const result=await getDb().execute<{ready:boolean}>(sql`select to_regclass('public.placement_public_page_settings') is not null as ready`);
  return result.rows[0]?.ready===true;
}
