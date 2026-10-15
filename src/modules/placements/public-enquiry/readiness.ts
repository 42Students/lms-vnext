import "server-only";
import {sql} from "drizzle-orm";
import {getDb} from "@/db/client";
export async function publicEnquiryTablesReady(){
  const rows=await getDb().execute<{challenges:boolean;enquiries:boolean}>(sql`
    select to_regclass('public.placement_public_enquiry_challenges') is not null as challenges,
      to_regclass('public.placement_public_recruit_enquiries') is not null as enquiries`);
  return rows.rows[0]?.challenges===true && rows.rows[0]?.enquiries===true;
}
