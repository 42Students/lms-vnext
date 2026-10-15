import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {requireTpoJobCollege} from "@/modules/placements/tpo-job-write-base";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {previewTpoBulkAction} from "@/modules/placements/tpo-bulk-action-preview-service";
export const runtime="nodejs";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))
   return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
   const body=await request.json();
   const context=await getCurrentRequestContext();
   await requireTpoJobCollege(context);
   if(body?.target==="APPLICATIONS"&&process.env.DB09_TPO_API_READY!=="DB09_VERIFIED")
     return NextResponse.json({error:"DB09_MIGRATIONS_PENDING"},{status:503,
       headers:{"Cache-Control":"private, no-store"}});
   const result=await previewTpoBulkAction(
     context,body);
   return NextResponse.json(result,{
     headers:{"Cache-Control":"private, no-store"},
   });
 }catch(error){return apiErrorResponse(error);}
}
