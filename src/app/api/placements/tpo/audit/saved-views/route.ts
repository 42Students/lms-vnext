import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {
 readTpoSettingsBody,TpoCommunicationBodyError,
} from "@/modules/placements/tpo-communication-request-model";
import {
 listTpoAuditSavedViews,changeTpoAuditSavedView,TpoAuditSavedViewError,
} from "@/modules/placements/tpo-audit-saved-view-service";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};

export async function GET(request:Request){
 try{
  if(new URL(request.url).searchParams.size!==0)
   return NextResponse.json({error:"INVALID_REQUEST"},{status:400,headers:noStore});
  return NextResponse.json(await listTpoAuditSavedViews(await getCurrentRequestContext()),{
   headers:noStore,
  });
 }catch(error){return apiErrorResponse(error);}
}
export async function POST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403,headers:noStore});
 try{
  // Authenticate before reading arbitrary untrusted bytes. The service
  // derives the owner and tenant from persisted identity, never the JSON.
  const context=await getCurrentRequestContext();
  const body=await readTpoSettingsBody(request);
  return NextResponse.json(await changeTpoAuditSavedView(context,body),{headers:noStore});
 }catch(error){
  if(error instanceof TpoCommunicationBodyError)
   return NextResponse.json({error:"INVALID_REQUEST"},{status:error.code==="BODY_TOO_LARGE"?413:400,headers:noStore});
  if(error instanceof TpoAuditSavedViewError){
   const status=error.code==="STORAGE_PENDING"?503:error.code==="VIEW_NOT_FOUND"?404:409;
   return NextResponse.json({error:error.code},{status,headers:noStore});
  }
  return apiErrorResponse(error);
 }
}
