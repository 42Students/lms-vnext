import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { listSuperAdminSmsDeliveryAttempts } from "@/modules/messaging/receipt-detail-service";

export const runtime = "nodejs";

/** Global Super Admin support-only SMS attempt index, never a phone list.
 * The service rechecks persisted platform permission before querying.
 */
export async function GET(request:Request){
 try{
  const context=await getCurrentRequestContext();
  const params=new URL(request.url).searchParams;
  const limit=params.get("limit")??"25";
  if(!/^[0-9]{1,2}$/.test(limit)||Number(limit)<1||Number(limit)>50)
   return NextResponse.json({error:"INVALID_LIMIT",message:"Limit must be between 1 and 50"},
    {status:400,headers:{"Cache-Control":"private, no-store"}});
  const input={
   limit:Number(limit),
   ...(params.has("collegeId")?{collegeId:params.get("collegeId")}:{}),
   ...(params.has("before")?{before:params.get("before")}:{}),
  };
  const items=await listSuperAdminSmsDeliveryAttempts(context,input);
  return NextResponse.json({
   status:"success",message:"SMS delivery attempts retrieved",
   items,data:items,source:"PROVIDER_ATTEMPT_LOG",
  },{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
