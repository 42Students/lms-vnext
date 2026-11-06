import {timingSafeEqual} from "node:crypto";
import {NextResponse} from "next/server";
import {readBoundedUtf8Body} from "@/lib/bounded-utf8-body";
import {mentorProjectEmailWorkerReady,runMentorProjectEmailDispatchBatch}
 from "@/modules/projects/mentor-project-email-dispatch-worker";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store"};
/** Server-to-server only. No GET and no browser session or client-chosen job.
 * The worker token must be independently provisioned and rotated.
 */
async function handlePOST(request:Request){
 if(request.headers.has("origin"))
  return NextResponse.json({error:"FORBIDDEN"},{status:403,headers});
 const expected=process.env["MENTOR_PROJECT_EMAIL_WORKER_TOKEN"]??"";
 const actual=request.headers.get("authorization")??"";
 // JavaScript character length is not UTF-8 byte length. Always compare
 // equal-sized buffers before timingSafeEqual; a multi-byte Authorization
 // header must return 403, never throw and turn a denied call into HTTP 500.
 const expectedBytes=Buffer.from(expected,"utf8");
 const suppliedBytes=Buffer.from(actual.startsWith("Bearer ")?actual.slice(7):"","utf8");
 if(expected.length<32||expectedBytes.length<32||expectedBytes.length>256||
    actual.length!==expected.length+7||!actual.startsWith("Bearer ")||
    suppliedBytes.byteLength!==expectedBytes.byteLength||
    !timingSafeEqual(suppliedBytes,expectedBytes))
  return NextResponse.json({error:"FORBIDDEN"},{status:403,headers});
 if(new URL(request.url).search)
  return NextResponse.json({error:"INVALID_REQUEST"},{status:400,headers});
 const body=await readBoundedUtf8Body(request,0);
 if(body.kind!=="OK"||body.body!=="")
  return NextResponse.json({error:"INVALID_REQUEST"},{status:400,headers});
 if(!mentorProjectEmailWorkerReady().ready)
  return NextResponse.json({error:"WORKER_DISABLED"},{status:503,headers});
 try{
  const result=await runMentorProjectEmailDispatchBatch();
  return NextResponse.json(result,{headers});
 }catch{
  return NextResponse.json({error:"WORKER_UNAVAILABLE"},{status:503,headers});
 }
}
export const POST = secured(handlePOST);
