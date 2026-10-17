import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {saveMyTpoNotificationPreferences,TpoPreferenceSaveError} from "@/modules/placements/tpo-my-notification-preferences-write";
export const runtime="nodejs";
export async function PUT(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{return NextResponse.json(await saveMyTpoNotificationPreferences(await getCurrentRequestContext(),await request.json()),{
  headers:{"Cache-Control":"private, no-store"},
 });}catch(error){
  if(error instanceof TpoPreferenceSaveError)return NextResponse.json({error:error.code},{
   status:error.code==="STALE"?409:503,headers:{"Cache-Control":"private, no-store"},
  });
  return apiErrorResponse(error);
 }
}
