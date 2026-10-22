import {timingSafeEqual} from "node:crypto";
import {NextResponse} from "next/server";
import { isSameOriginRequest } from "@/auth/origin";
import {postgresScheduledJobLeaseStore}
 from "@/modules/operations/postgres-scheduled-job-lease-store";
import {executeScheduledJobWithLease,scheduledJobWorkerIdentity}
 from "@/modules/operations/scheduled-job-runner";
import {queueFencedInterviewReminders}
 from "@/modules/operations/notification-scheduled-job-service";
import {queueFencedInterviewReminderEmails}
 from "@/modules/announcements/tpo-interview-reminder-email-service";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":"no-store"};
/** The private Cloud Scheduler runs at 19:00 Asia/Kolkata. Configure this
 * paired worker INSTEAD OF the in-app-only notification scheduler route for
 * tpo.interviewReminders, never both. The morning route stays IN_APP-only. */
export async function POST(request:Request){
  // Scheduled/service callbacks have no browser Origin. Reject a foreign Origin when one is supplied.
  if (request.headers.has("origin") && !isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const secret=process.env["TPO_REMINDER_SCHEDULER_SECRET"]??"";
 const incoming=request.headers.get("x-tpo-reminder-key")??"";
 if(Buffer.byteLength(secret,"utf8")<32)
  return NextResponse.json({error:"SCHEDULER_NOT_CONFIGURED"},
   {status:503,headers:noStore});
 const expected=Buffer.from(secret,"utf8"),supplied=Buffer.from(incoming,"utf8");
 if(expected.length!==supplied.length||!timingSafeEqual(expected,supplied))
  return NextResponse.json({error:"FORBIDDEN"},{status:403,headers:noStore});
 if(process.env["DB10_NOTIFICATION_SCHEDULER_READY"]!=="DB10_VERIFIED"||
    process.env["TPO_INTERVIEW_EMAIL_READY"]!=="VERIFIED"||
    process.env["ZEPTOMAIL_LEGACY_KEY_REVOKED"]!=="confirmed")
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
