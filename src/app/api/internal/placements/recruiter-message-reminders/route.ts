import {createHash,timingSafeEqual} from "node:crypto";
import {NextResponse} from "next/server";
import {isSameOriginRequest} from "@/auth/origin";
import {dispatchRecruiterUnreadMessageDigests} from "@/modules/placements/recruiter-message-email-dispatch-service";
export const runtime="nodejs";
function allowed(request:Request){
 const secret=process.env.RECRUITER_MESSAGE_WORKER_SECRET??"";
 if(secret.length<32)return false;
 const bearer=(request.headers.get("authorization")??"").replace(/^Bearer /,"");
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
