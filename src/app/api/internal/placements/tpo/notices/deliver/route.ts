import {timingSafeEqual} from "node:crypto";
import {NextResponse} from "next/server";
import {deliverDueTpoNotices} from "@/modules/announcements/tpo-notice-delivery-service";
export const runtime="nodejs";
export const dynamic="force-dynamic";
/** POST-only scheduler: never publish notices from GET or page rendering. */
export async function POST(request:Request){
 const key=process.env.TPO_NOTICE_SCHEDULER_SECRET??"";
 const supplied=request.headers.get("x-tpo-scheduler-key")??"";
 const expected=Buffer.from(key),actual=Buffer.from(supplied);
 if(key.length<32||expected.length!==actual.length||
    !timingSafeEqual(expected,actual))
  return NextResponse.json({error:"FORBIDDEN"},{status:403});
 try{
  const result=await deliverDueTpoNotices();
  return NextResponse.json(result,{headers:{"Cache-Control":"no-store"}});
 }catch{
  return NextResponse.json({error:"DELIVERY_NOT_COMPLETED"},{status:503});
 }
}
