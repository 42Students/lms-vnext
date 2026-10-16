import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {requireTpoJobCollege} from "@/modules/placements/tpo-job-write-base";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readTpoBulkRequestBody,TpoBulkBodyError} from "@/modules/placements/tpo-bulk-request-body";
import {previewTpoBulkAction} from "@/modules/placements/tpo-bulk-action-preview-service";
import {TpoBulkApplicationsUnavailable} from "@/modules/placements/tpo-bulk-workflow-model";
export const runtime="nodejs";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))
   return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
   const body=await readTpoBulkRequestBody(request);
   const context=await getCurrentRequestContext();
   await requireTpoJobCollege(context);
   const result=await previewTpoBulkAction(
     context,body);
   return NextResponse.json(result,{
     headers:{"Cache-Control":"private, no-store"},
   });
 }catch(error){
   if(error instanceof TpoBulkBodyError)
     return NextResponse.json({error:error.message},{status:error.status,
       headers:{"Cache-Control":"private, no-store"}});
   if(error instanceof TpoBulkApplicationsUnavailable)
     return NextResponse.json({error:"DB09_MIGRATIONS_PENDING"},{status:503,
       headers:{"Cache-Control":"private, no-store"}});
   return apiErrorResponse(error);
 }
}
