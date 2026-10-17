import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {previewCollegeBulkDrives,updateCollegeBulkDrives} from "@/modules/placements/college-bulk-drive-service";
export const runtime="nodejs";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const raw=await request.json();
  const ctx=await getCurrentRequestContext();
  return NextResponse.json(raw?.confirmStage==="PREVIEW"?
   await previewCollegeBulkDrives(ctx,{action:raw.action,jobIds:raw.jobIds}):
   await updateCollegeBulkDrives(ctx,{action:raw.action,jobIds:raw.jobIds,confirmed:raw.confirmed}),
  {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
