import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {requireTpoJobCollege} from "@/modules/placements/tpo-job-write-base";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readTpoBulkRequestBody,TpoBulkBodyError} from "@/modules/placements/tpo-bulk-request-body";
import {previewTpoBulkAction} from "@/modules/placements/tpo-bulk-action-preview-service";
import {TpoBulkApplicationsUnavailable} from "@/modules/placements/tpo-bulk-workflow-model";
export const runtime="nodejs";
const previewMessages:Record<string,string>={
 REQUEST_TOO_LARGE:"This bulk action is too large. Select no more than 200 rows at once.",
 UNSUPPORTED_MEDIA_TYPE:"Send the selected actions as JSON.",
 INVALID_JSON:"The selected actions were invalid. Review the rows and try again.",
 DB09_MIGRATIONS_PENDING:"Bulk placements are temporarily unavailable. Please try again later.",
};
function safeBulkCount(value:unknown){
 const n=typeof value==="number"?value:NaN;
 return Number.isFinite(n)?Math.max(0,Math.min(1_000_000,Math.trunc(n))):0;
}
export async function POST(request:Request){
 if(!isSameOriginRequest(request))
   return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
   const body=await readTpoBulkRequestBody(request);
   const context=await getCurrentRequestContext();
   await requireTpoJobCollege(context);
   const result=await previewTpoBulkAction(context,body);
   const ready=safeBulkCount(result.counts.ready),skipped=safeBulkCount(result.counts.skipped);
   return NextResponse.json({
     ...result,counts:{ready,skipped},
     summary:ready+" ready · "+skipped+" skipped",
     confirmationRequired:true,
     message:"Review the eligible rows and confirm before applying this bulk action.",
   },{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
   if(error instanceof TpoBulkBodyError)
     return NextResponse.json({error:error.message,
       message:previewMessages[error.message]??"The bulk selection could not be previewed.",
       retryable:error.status!==415,
     },{status:error.status,headers:{"Cache-Control":"private, no-store"}});
   if(error instanceof TpoBulkApplicationsUnavailable)
     return NextResponse.json({error:"DB09_MIGRATIONS_PENDING",
       message:previewMessages["DB09_MIGRATIONS_PENDING"],
     },{status:503,headers:{"Cache-Control":"private, no-store"}});
   return apiErrorResponse(error);
 }
}
