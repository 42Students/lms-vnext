import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readTpoSettingsBody,TpoCommunicationBodyError} from "@/modules/placements/tpo-communication-request-model";
import {setTpoPrepReadiness,PrepReadinessError} from "@/modules/placements/tpo-prep-readiness-write-service";
export const runtime="nodejs";
export async function PUT(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const result=await setTpoPrepReadiness(await getCurrentRequestContext(),await readTpoSettingsBody(request));
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof TpoCommunicationBodyError)return NextResponse.json({error:"INVALID_REQUEST"},{
   status:error.code==="BODY_TOO_LARGE"?413:400,
   headers:{"Cache-Control":"private, no-store"},
  });
  if(error instanceof PrepReadinessError)return NextResponse.json({error:error.code},{status:
   error.code==="PREP_STALE"?409:error.code==="PREP_STORAGE_PENDING"?503:error.code==="PREP_INVALID_COURSE"?422:404});
  return apiErrorResponse(error);
 }
}
