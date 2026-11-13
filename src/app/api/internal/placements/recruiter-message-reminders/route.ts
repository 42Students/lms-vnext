import {createHash,randomUUID,timingSafeEqual} from "node:crypto";
import {executeScheduledJobWithLease} from "@/modules/operations/scheduled-job-runner";
import {postgresScheduledJobLeaseStore} from "@/modules/operations/postgres-scheduled-job-lease-store";
import {TPO_SCHEDULED_JOBS} from "@/modules/operations/tpo-scheduled-job-registry";
import {NextResponse} from "next/server";
import {isSameOriginRequest} from "@/auth/origin";
import {dispatchRecruiterUnreadMessageDigests} from "@/modules/placements/recruiter-message-email-dispatch-service";
import { route } from "@/security/route";
import { env } from "@/config/env";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";
// The legacy job waited 90 seconds after process startup. Our external
// dev CronJob invokes this authenticated worker on five-minute ticks.
const STARTUP_GRACE_MS=90_000;
function allowed(request:Request){
 const secret=env.RECRUITER_MESSAGE_WORKER_SECRET??"";
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
async function handlePOST(request:Request){
 if(!isSameOriginRequest(request)||!allowed(request))
  return NextResponse.json({error:"FORBIDDEN"},{status:403});
 if(process.uptime()*1_000<STARTUP_GRACE_MS)
  return NextResponse.json({skipped:true,reason:"STARTUP_GRACE",retryOnNextTick:true},
   {headers:{"Cache-Control":CACHE.NONE}});
 try{
  const result=await executeScheduledJobWithLease(
   postgresScheduledJobLeaseStore,
   {jobName:"tpo.recruiterMessageEmails",holderId:randomUUID(),
    ttlMs:TPO_SCHEDULED_JOBS["tpo.recruiterMessageEmails"].leaseMs},
   async fence=>{await fence.assertCurrent();return dispatchRecruiterUnreadMessageDigests();},
  );
  return NextResponse.json(result.ran?result.result:
   {skipped:true,reason:result.reason},{headers:{"Cache-Control":CACHE.NONE}});
 }catch{
  return NextResponse.json({error:"SERVICE_UNAVAILABLE"},{status:503});
 }
}
export const POST = route(
  { auth: "public", publicReason: "Machine-to-machine endpoint: the handler authenticates the caller with its own shared secret or signature.", csrf: false, csrfExemptReason: "Callers are servers or schedulers and send no browser Origin; the handler checks its credential instead.", rateLimit: { limit: 3000, windowMs: 60_000 } },
  ({ request }) => handlePOST(request as Parameters<typeof handlePOST>[0]),
);
