import {NextResponse} from "next/server";
import {postgresScheduledJobLeaseStore}
 from "@/modules/operations/postgres-scheduled-job-lease-store";
import {executeScheduledJobWithLease,scheduledJobWorkerIdentity}
 from "@/modules/operations/scheduled-job-runner";
import {queueEligibleDeadlineTodayReminders}
 from "@/modules/announcements/tpo-deadline-today-job-service";
import { internalRoute } from "@/security/internal-route";

import { featureReady } from "@/config/features";
import { CACHE } from "@/security/responses";
import { jobCredential } from "@/security/jobs";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":CACHE.NONE};

/** Bind an external Cloud Scheduler with Asia/Kolkata cron 0 8 * * *.
 * No browser or cross-tenant request can select jobs or recipient IDs.
 * A distinct non-public secret and a persisted authorized service actor are
 * required in addition to a transactional PostgreSQL lease.
 */
async function handlePOST(request:Request){
 if(!featureReady("notificationScheduler")||
    !featureReady("tpoDeadlineToday"))
  return NextResponse.json({error:"SCHEDULER_NOT_READY"},{status:503,headers:noStore});
 try{
  const result=await executeScheduledJobWithLease(
   postgresScheduledJobLeaseStore,{
    jobName:"tpo.deadlineToday",
    holderId:scheduledJobWorkerIdentity().holderId,
    ttlMs:30*60_000,
   },fence=>queueEligibleDeadlineTodayReminders(fence));
  return NextResponse.json(result.ran?
   {ran:true,...result.result}:{ran:false,reason:result.reason},
   {headers:noStore});
 }catch{
  return NextResponse.json({error:"TPO_DEADLINE_TODAY_FAILED"},
   {status:503,headers:noStore});
 }
}
// Names of the deployment variable and request header that carry the scheduler credential (names only, no values).
export const POST = internalRoute(
  { name: "internal.placements.tpo.deadline-today", credential: jobCredential("internal.placements.tpo.deadline-today"), emptyBody: true, denied: { status: 403, body: { error: "FORBIDDEN" } } },
  ({ request }) => handlePOST(request),
);
