import {NextResponse} from "next/server";
import {postgresScheduledJobLeaseStore}
 from "@/modules/operations/postgres-scheduled-job-lease-store";
import {executeScheduledJobWithLease,scheduledJobWorkerIdentity}
 from "@/modules/operations/scheduled-job-runner";
import {queueFencedInterviewReminders}
 from "@/modules/operations/notification-scheduled-job-service";
import {queueFencedInterviewReminderEmails}
 from "@/modules/announcements/tpo-interview-reminder-email-service";
import { internalRoute } from "@/security/internal-route";

import { env } from "@/config/env";
import { featureReady } from "@/config/features";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":CACHE.NONE};
/** The private Cloud Scheduler runs at 19:00 Asia/Kolkata. Configure this
 * paired worker INSTEAD OF the in-app-only notification scheduler route for
 * tpo.interviewReminders, never both. The morning route stays IN_APP-only. */
async function handlePOST(request:Request){
 if(!featureReady("notificationScheduler")||
    !featureReady("tpoInterviewEmail")||
    env.ZEPTOMAIL_LEGACY_KEY_REVOKED!=="confirmed")
  return NextResponse.json({error:"INTERVIEW_EMAIL_UNPROVISIONED"},
   {status:503,headers:noStore});
 const localHour=new Date(Date.now()+330*60_000).getUTCHours();
 if(localHour<19)
  return NextResponse.json({error:"INTERVIEW_REMINDER_NOT_DUE"},
   {status:409,headers:noStore});
 try{
  const result=await executeScheduledJobWithLease(
   postgresScheduledJobLeaseStore,{
    jobName:"tpo.interviewReminders",
    holderId:scheduledJobWorkerIdentity().holderId,
    ttlMs:30*60_000,
   },async fence=>{
    const inApp=await queueFencedInterviewReminders(fence,"TOMORROW");
    // Reserve and dispatch only after the durable in-app event exists.
    const email=await queueFencedInterviewReminderEmails(fence);
    return {inApp,email,hasMore:inApp.hasMore||email.hasMore};
   });
  return NextResponse.json(result.ran?
   {ran:true,...result.result}:{ran:false,reason:result.reason},
   {headers:noStore});
 }catch{
  return NextResponse.json({error:"TPO_INTERVIEW_REMINDER_FAILED"},
   {status:503,headers:noStore});
 }
}
// Names of the deployment variable and request header that carry the scheduler credential (names only, no values).
const WORKER_ENV = "TPO_REMINDER_SCHEDULER_SECRET";
const WORKER_HEADER = "x-tpo-reminder-key";
export const POST = internalRoute(
  { name: "internal.placements.tpo.interview-evening", credential: { kind: "header", header: WORKER_HEADER, secretEnv: WORKER_ENV }, emptyBody: true, denied: { status: 403, body: { error: "FORBIDDEN" } } },
  ({ request }) => handlePOST(request),
);
