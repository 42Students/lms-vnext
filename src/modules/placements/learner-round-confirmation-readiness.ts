import "server-only";
import {sql} from "drizzle-orm";
import {getDb} from "@/db/client";
export async function learnerRoundConfirmationReady(){
 const result=await getDb().execute<{ready:boolean}>(sql`
  SELECT exists(SELECT 1 FROM information_schema.columns
   WHERE table_schema='public'
    AND table_name='placement_round_candidate_slots'
    AND column_name='learner_confirmed_at') AS ready`);
 return result.rows[0]?.ready===true;
}
