import {randomUUID,timingSafeEqual} from "node:crypto";
import {executeScheduledJobWithLease} from "@/modules/operations/scheduled-job-runner";
import {postgresScheduledJobLeaseStore} from "@/modules/operations/postgres-scheduled-job-lease-store";
import {NextResponse} from "next/server";
import {deliverDueTpoNotices} from "@/modules/announcements/tpo-notice-delivery-service";
export const runtime="nodejs";
export const dynamic="force-dynamic";
/** POST-only scheduler: never publish notices from GET or page rendering. */
export async function POST(request:Request){
 const key=process.env["TPO_NOTICE_SCHEDULER_SECRET"]??"";
 const supplied=request.headers.get("x-tpo-scheduler-key")??"";
 const expected=Buffer.from(key),actual=Buffer.from(supplied);
 if(key.length<32||expected.length!==actual.length||
    !timingSafeEqual(expected,actual))
  return NextResponse.json({error:"FORBIDDEN"},{status:403});
 try{
  const result=await executeScheduledJobWithLease(
   postgresScheduledJobLeaseStore,
   {jobName:"tpo.deliverDueNotices",holderId:randomUUID(),ttlMs:50_000},
   async fence=>{await fence.assertCurrent();return deliverDueTpoNotices();},
  );
  if(result.ran&&!result.result.ready)
   return NextResponse.json({error:"DELIVERY_STORAGE_NOT_READY"},{status:503});
  if(result.ran&&result.result.failed>0)
   return NextResponse.json({
    error:"NOTICE_DELIVERY_INCOMPLETE",
    failed:result.result.failed,scanned:result.result.scanned,
    delivered:result.result.delivered,retryable:true,
   },{status:503,headers:{"Cache-Control":"no-store"}});
  return NextResponse.json(result.ran?result.result:{skipped:true,reason:result.reason},
   {headers:{"Cache-Control":"no-store"}});
 }catch{
  return NextResponse.json({error:"DELIVERY_NOT_COMPLETED"},{status:503});
 }
}
