import "server-only";
import {sql} from "drizzle-orm";
import {getDb} from "@/db/client";

/** Guard staged columns until the orchestrator registers their SQL migration. */
export async function learnerPlacementRoundDeadlineAvailable(){
 const result=await getDb().execute(sql`
   select exists(select 1 from information_schema.columns
     where table_schema='public' and table_name='placement_job_rounds'
       and column_name='assessment_due_at') as present
 `);
 const rows=Array.isArray(result)?result:
   ((result as {rows?:unknown[]}).rows??[]);
 return (rows[0] as {present?:boolean}|undefined)?.present===true;
}
