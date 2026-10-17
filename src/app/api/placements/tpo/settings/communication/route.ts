import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {updateTpoCommunicationSettings,TpoCommunicationSettingsError} from "@/modules/placements/tpo-communication-settings-service";
export const runtime="nodejs";
export async function PATCH(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const result=await updateTpoCommunicationSettings(await getCurrentRequestContext(),await request.json());
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof TpoCommunicationSettingsError)return NextResponse.json({error:error.code},{
   status:error.code==="TPO_SETTINGS_STALE"?409:error.code==="TPO_SETTINGS_PENDING"?503:404});
  return apiErrorResponse(error);
 }
}
