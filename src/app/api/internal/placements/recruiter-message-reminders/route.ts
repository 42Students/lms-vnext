import {createHash,randomUUID,timingSafeEqual} from "node:crypto";
import {executeScheduledJobWithLease} from "@/modules/operations/scheduled-job-runner";
import {postgresScheduledJobLeaseStore} from "@/modules/operations/postgres-scheduled-job-lease-store";
import {TPO_SCHEDULED_JOBS} from "@/modules/operations/tpo-scheduled-job-registry";
import {NextResponse} from "next/server";
import {isSameOriginRequest} from "@/auth/origin";
import {dispatchRecruiterUnreadMessageDigests} from "@/modules/placements/recruiter-message-email-dispatch-service";
export const runtime="nodejs";
// The legacy job waited 90 seconds after process startup. Our external
// dev CronJob invokes this authenticated worker on five-minute ticks.
const STARTUP_GRACE_MS=90_000;
function allowed(request:Request){
 const secret=process.env.RECRUITER_MESSAGE_WORKER_SECRET??"";
 const authorization=request.headers.get("authorization")??"";
 // Whitespace-only/misquoted secrets must not enable a privileged mail worker.
 if(Buffer.byteLength(secret.trim(),"utf8")<32||secret!==secret.trim()||
   !authorization.startsWith("Bearer "))return false;
 const bearer=authorization.slice("Bearer ".length);
 if(!bearer||bearer!==bearer.trim())return false;
 const actual=createHash("sha256").update(bearer).digest();
 const expected=createHash("sha256").update(secret).digest();
 return timingSafeEqual(actual,expected);
}
export async function POST(request:Request){
 if(!isSameOriginRequest(request)||!allowed(request))
  return NextResponse.json({error:"FORBIDDEN"},{status:403});
 if(process.uptime()*1_000<STARTUP_GRACE_MS)
  return NextResponse.json({skipped:true,reason:"STARTUP_GRACE",retryOnNextTick:true},
   {headers:{"Cache-Control":"no-store"}});
 try{
  const result=await executeScheduledJobWithLease(
   postgresScheduledJobLeaseStore,
   {jobName:"tpo.recruiterMessageEmails",holderId:randomUUID(),
    ttlMs:TPO_SCHEDULED_JOBS["tpo.recruiterMessageEmails"].leaseMs},
   async fence=>{await fence.assertCurrent();return dispatchRecruiterUnreadMessageDigests();},
  );
  return NextResponse.json(result.ran?result.result:
   {skipped:true,reason:result.reason},{headers:{"Cache-Control":"no-store"}});
 }catch{
  return NextResponse.json({error:"SERVICE_UNAVAILABLE"},{status:503});
 }
}
