import "server-only";
import {sql} from "drizzle-orm";
import {getDb} from "@/db/client";

/** Grade-audit parity is not complete until the registered PostgreSQL log,
 * append-only privileges, and every grading producer write in one
 * transaction with its corresponding immutable audit event.
 * An activity log is not an authoritative substitute for grade history.
 */
export const GRADE_AUDIT_PARITY_REQUIREMENTS={
 migration:"DB045_GRADE_HISTORY_VERIFIED",
 producers:"DB045_GRADE_PRODUCERS_VERIFIED",
 replay:"DB045_GRADE_REPLAY_VERIFIED",
} as const;

export function gradeAuditParityConfigured(){
 return process.env.DB045_GRADE_HISTORY_READY==="DB045_VERIFIED" &&
  process.env.DB045_GRADE_PRODUCERS_READY==="DB045_VERIFIED" &&
  process.env.DB045_GRADE_REPLAY_READY==="DB045_VERIFIED";
}

/** Fail closed: do not advertise grade audit history or purge old grade
 * events while the migrated table or transactional producer cutover is
 * unverified. This does not execute migrations or make a parity claim.
 */
export async function requireGradeAuditParity(){
 if(!gradeAuditParityConfigured())
  throw new Error("GRADE_AUDIT_PARITY_NOT_VERIFIED");
 const result=await getDb().execute<{registered:boolean}>(sql`
  select to_regclass('public.grade_audit_logs') is not null as registered`);
 if(result.rows[0]?.registered!==true)
  throw new Error("GRADE_AUDIT_PARITY_NOT_VERIFIED");
 return {verified:true as const};
}
