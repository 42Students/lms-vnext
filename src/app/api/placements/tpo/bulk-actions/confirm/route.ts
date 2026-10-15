import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {confirmTpoBulkAction,TpoBulkPreviewError}
 from "@/modules/placements/tpo-bulk-action-confirm-service";
export const runtime="nodejs";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))
   return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
   const body=await request.json();
   if(body?.target==="APPLICATIONS"&&process.env.DB09_TPO_API_READY!=="DB09_VERIFIED")
     return NextResponse.json({error:"DB09_MIGRATIONS_PENDING"},{status:503,
       headers:{"Cache-Control":"private, no-store"}});
   const result=await confirmTpoBulkAction(
     await getCurrentRequestContext(),body);
   return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
   if(error instanceof TpoBulkPreviewError)
     return NextResponse.json({error:error.message},{status:409,
       headers:{"Cache-Control":"private, no-store"}});
   return apiErrorResponse(error);
 }
}
