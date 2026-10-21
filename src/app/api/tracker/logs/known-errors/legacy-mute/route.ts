import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {logAlertApiError} from "@/lib/log-alert-api-error";
import {alertEnvironment} from "@/modules/log-alerts/signature";
import {logAlertsRuntimeEnabled} from "@/modules/log-alerts/readiness";
import {muteLegacyKnownErrorForAdmin} from "@/modules/log-alerts/admin-service";
import {legacyKnownErrorMuteLookupSchema} from "@/modules/log-alerts/validation";

export const runtime="nodejs";
export async function POST(request:Request){
 if(!logAlertsRuntimeEnabled())return NextResponse.json({
  error:"DB10_LOG_ALERTS_MIGRATIONS_PENDING"},{status:503});
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const ctx=await getCurrentRequestContext();
  const raw:unknown=await request.json();
  const input=legacyKnownErrorMuteLookupSchema.parse(raw);
  if(input.environment!==alertEnvironment())
   return NextResponse.json({error:"ENVIRONMENT_NOT_AVAILABLE"},{status:400});
  const item=await muteLegacyKnownErrorForAdmin(ctx,input);
  return NextResponse.json({item},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return logAlertApiError(error);}
}
