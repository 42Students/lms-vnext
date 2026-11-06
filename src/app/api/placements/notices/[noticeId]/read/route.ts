import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {markOwnTpoNoticeRead} from "@/modules/announcements/tpo-notice-read-receipts-service";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
async function handlePOST(request:Request,{params}:{params:Promise<{noticeId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const value=await markOwnTpoNoticeRead(await getCurrentRequestContext(),(await params).noticeId);
  // A missing delivered receipt is NOT a read acknowledgement. Keep the
  // successful request idempotent without lying to the unread badge.
  return NextResponse.json({...value,acknowledged:value.read,
    noDeliveredReceipt:!value.read},{
    headers:{"Cache-Control":"no-store"},
  });
 }catch(e){return apiErrorResponse(e);}
}
export const POST = secured(handlePOST, { csrf: "enforce" });
