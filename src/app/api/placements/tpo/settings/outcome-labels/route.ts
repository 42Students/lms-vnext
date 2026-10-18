import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readTpoSettingsBody,TpoCommunicationBodyError} from "@/modules/placements/tpo-communication-request-model";
import {saveTpoOutcomeLabels,TpoOutcomeLabelError} from "@/modules/placements/tpo-outcome-label-settings-service";
export const runtime="nodejs";
export async function PUT(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const data=await saveTpoOutcomeLabels(await getCurrentRequestContext(),await readTpoSettingsBody(request));
  return NextResponse.json(data,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof TpoCommunicationBodyError)return NextResponse.json({error:"INVALID_REQUEST"},{
   status:error.code==="BODY_TOO_LARGE"?413:400,
   headers:{"Cache-Control":"private, no-store"},
  });
  if(error instanceof TpoOutcomeLabelError)return NextResponse.json({error:error.code},{
   status:error.code==="TPO_SETTINGS_STALE"?409:error.code==="TPO_SETTINGS_PENDING"?503:404,
  });
  return apiErrorResponse(error);
 }
}
