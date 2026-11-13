import {randomUUID} from "node:crypto";
import {executeScheduledJobWithLease} from "@/modules/operations/scheduled-job-runner";
import {postgresScheduledJobLeaseStore} from "@/modules/operations/postgres-scheduled-job-lease-store";
import {TPO_SCHEDULED_JOBS} from "@/modules/operations/tpo-scheduled-job-registry";
import {NextResponse} from "next/server";
import {readBoundedUtf8Body} from "@/lib/request-body";
import {escalatePendingWithdrawalRequests} from "@/modules/placements/tpo-withdrawal-escalation-service";
import { internalRoute } from "@/security/internal-route";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":CACHE.NONE} as const;
/** POST-only scheduler using the existing TPO scheduler secret; GET cannot send notifications. */
async function handlePOST(request:Request){
 try{
  const result=await executeScheduledJobWithLease(
   postgresScheduledJobLeaseStore,
   {jobName:"tpo.escalateWithdrawals",holderId:randomUUID(),
    ttlMs:TPO_SCHEDULED_JOBS["tpo.escalateWithdrawals"].leaseMs},
   async fence=>{await fence.assertCurrent();return escalatePendingWithdrawalRequests();},
  );
  return NextResponse.json(result.ran?result.result:{skipped:true,reason:result.reason},
   {headers:noStore});
 }catch{
  return NextResponse.json({error:"ESCALATION_NOT_COMPLETED"},{status:503,headers:noStore});
 }
}
// Names of the deployment variable and request header that carry the scheduler credential (names only, no values).
const WORKER_ENV = "TPO_NOTICE_SCHEDULER_SECRET";
const WORKER_HEADER = "x-tpo-scheduler-key";
export const POST = internalRoute(
  { name: "internal.placements.tpo.withdrawal-escalations", credential: { kind: "header", header: WORKER_HEADER, secretEnv: WORKER_ENV }, emptyBody: true, denied: { status: 403, body: { error: "FORBIDDEN" } } },
  ({ request }) => handlePOST(request),
);
