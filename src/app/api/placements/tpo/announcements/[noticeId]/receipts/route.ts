import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getTpoNoticeReadSummary} from "@/modules/announcements/tpo-notice-read-receipts-service";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(_request:Request,{params}:{params:Promise<{noticeId:string}>}){
 try{
  const result=await getTpoNoticeReadSummary(await getCurrentRequestContext(),(await params).noticeId);
  if(!result)return NextResponse.json({error:"NOT_FOUND"},{status:404});
  return NextResponse.json(result,{headers:{"Cache-Control":"no-store"}});
 }catch(e){return apiErrorResponse(e);}
}
