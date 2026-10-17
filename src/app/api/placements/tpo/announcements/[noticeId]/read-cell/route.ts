import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {markPlacementCellNoticeRead} from "@/modules/announcements/placement-cell-receipt-service";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{noticeId:string}>}){
 if(!isSameOriginRequest(request))return Response.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {noticeId}=await params;
  return Response.json(await markPlacementCellNoticeRead(await getCurrentRequestContext(),noticeId),
    {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
