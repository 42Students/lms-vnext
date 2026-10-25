import {timingSafeEqual} from "node:crypto";
import {NextResponse} from "next/server";
import {mentorProjectEmailWorkerReady,runMentorProjectEmailDispatchBatch}
 from "@/modules/projects/mentor-project-email-dispatch-worker";
export const runtime="nodejs";
const headers={"Cache-Control":"private, no-store"};
/** Server-to-server only. No GET and no browser session or client-chosen job.
 * The worker token must be independently provisioned and rotated.
 */
export async function POST(request:Request){
 const expected=process.env["MENTOR_PROJECT_EMAIL_WORKER_TOKEN"]??"";
 const actual=request.headers.get("authorization")??"";
 if(expected.length<32||expected.length>256||
    actual.length!==expected.length+7||!actual.startsWith("Bearer ")||
    !timingSafeEqual(Buffer.from(actual.slice(7)),Buffer.from(expected)))
  return NextResponse.json({error:"FORBIDDEN"},{status:403,headers});
 if(!mentorProjectEmailWorkerReady().ready)
  return NextResponse.json({error:"WORKER_DISABLED"},{status:503,headers});
 try{
  const result=await runMentorProjectEmailDispatchBatch();
  return NextResponse.json(result,{headers});
 }catch{
  return NextResponse.json({error:"WORKER_UNAVAILABLE"},{status:503,headers});
 }
}
