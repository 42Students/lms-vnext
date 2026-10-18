import {createHash,timingSafeEqual} from "node:crypto";
import {NextResponse} from "next/server";
import {isSameOriginRequest} from "@/auth/origin";
import {dispatchRecruiterUnreadMessageDigests} from "@/modules/placements/recruiter-message-email-dispatch-service";
export const runtime="nodejs";
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
 try{
  const result=await dispatchRecruiterUnreadMessageDigests();
  return NextResponse.json(result,{headers:{"Cache-Control":"no-store"}});
 }catch{
  return NextResponse.json({error:"SERVICE_UNAVAILABLE"},{status:503});
 }
}
