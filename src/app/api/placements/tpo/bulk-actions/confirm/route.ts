import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {requireTpoJobCollege} from "@/modules/placements/tpo-job-write-base";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readTpoBulkRequestBody,TpoBulkBodyError} from "@/modules/placements/tpo-bulk-request-body";
import {TpoBulkApplicationsUnavailable} from "@/modules/placements/tpo-bulk-workflow-model";
import {confirmTpoBulkAction,TpoBulkPreviewError}
 from "@/modules/placements/tpo-bulk-action-confirm-service";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const context = __actor!;
    try {
const body=await readTpoBulkRequestBody(request);
await requireTpoJobCollege(context);
const result=await confirmTpoBulkAction(
     context,body);
return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
} catch(error){
   if(error instanceof TpoBulkBodyError)
     return NextResponse.json({error:error.message},{status:error.status,
       headers:{"Cache-Control":"private, no-store"}});
   if(error instanceof TpoBulkApplicationsUnavailable)
     return NextResponse.json({error:"DB09_MIGRATIONS_PENDING"},{status:503,
       headers:{"Cache-Control":"private, no-store"}});
   if(error instanceof TpoBulkPreviewError)
     return NextResponse.json({error:error.message},{status:409,
       headers:{"Cache-Control":"private, no-store"}});
   return apiErrorResponse(error);
 }
  },
);
