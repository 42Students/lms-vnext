import {randomUUID,timingSafeEqual} from "node:crypto";
import {executeScheduledJobWithLease} from "@/modules/operations/scheduled-job-runner";
import {postgresScheduledJobLeaseStore} from "@/modules/operations/postgres-scheduled-job-lease-store";
import {TPO_SCHEDULED_JOBS} from "@/modules/operations/tpo-scheduled-job-registry";
import {NextResponse} from "next/server";
import {escalatePendingWithdrawalRequests} from "@/modules/placements/tpo-withdrawal-escalation-service";
export const runtime="nodejs";
export const dynamic="force-dynamic";
/** POST-only scheduler using the existing TPO scheduler secret; GET cannot send notifications. */
export async function POST(request:Request){
 const secret=process.env.TPO_NOTICE_SCHEDULER_SECRET??"";
 const provided=request.headers.get("x-tpo-scheduler-key")??"";
 const expected=Buffer.from(secret),actual=Buffer.from(provided);
 if(secret.length<32||expected.length!==actual.length||
  !timingSafeEqual(expected,actual))
  return NextResponse.json({error:"FORBIDDEN"},{status:403});
 try{
  const result=await executeScheduledJobWithLease(
   postgresScheduledJobLeaseStore,
   {jobName:"tpo.escalateWithdrawals",holderId:randomUUID(),
    ttlMs:TPO_SCHEDULED_JOBS["tpo.escalateWithdrawals"].leaseMs},
   async fence=>{await fence.assertCurrent();return escalatePendingWithdrawalRequests();},
  );
  return NextResponse.json(result.ran?result.result:{skipped:true,reason:result.reason},
   {headers:{"Cache-Control":"no-store"}});
 }catch{
  return NextResponse.json({error:"ESCALATION_NOT_COMPLETED"},{status:503});
 }
}
