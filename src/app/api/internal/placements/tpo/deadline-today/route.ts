import {timingSafeEqual} from "node:crypto";
import {NextResponse} from "next/server";
import { isSameOriginRequest } from "@/auth/origin";
import {postgresScheduledJobLeaseStore}
 from "@/modules/operations/postgres-scheduled-job-lease-store";
import {executeScheduledJobWithLease,scheduledJobWorkerIdentity}
 from "@/modules/operations/scheduled-job-runner";
import {queueEligibleDeadlineTodayReminders}
 from "@/modules/announcements/tpo-deadline-today-job-service";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":"no-store"};

/** Bind an external Cloud Scheduler with Asia/Kolkata cron 0 8 * * *.
 * No browser or cross-tenant request can select jobs or recipient IDs.
 * A distinct non-public secret and a persisted authorized service actor are
 * required in addition to a transactional PostgreSQL lease.
 */
export async function POST(request:Request){
  // Scheduled/service callbacks have no browser Origin. Reject a foreign Origin when one is supplied.
  if (request.headers.has("origin") && !isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const secret=process.env["TPO_REMINDER_SCHEDULER_SECRET"]??"";
 const incoming=request.headers.get("x-tpo-reminder-key")??"";
 if(Buffer.byteLength(secret,"utf8")<32)
  return NextResponse.json({error:"SCHEDULER_NOT_CONFIGURED"},
   {status:503,headers:noStore});
 const expected=Buffer.from(secret,"utf8");
 const supplied=Buffer.from(incoming,"utf8");
 if(expected.length!==supplied.length||!timingSafeEqual(expected,supplied))
  return NextResponse.json({error:"FORBIDDEN"},{status:403,headers:noStore});
 if(process.env["DB10_NOTIFICATION_SCHEDULER_READY"]!=="DB10_VERIFIED"||
    process.env["TPO_DEADLINE_TODAY_READY"]!=="VERIFIED")
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
