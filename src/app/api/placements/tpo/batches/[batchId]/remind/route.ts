import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {remindTpoBatch,TpoBatchReminderError} from "@/modules/placements/tpo-batch-reminder-service";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    try {
const {batchId}=params;
return NextResponse.json(await remindTpoBatch(__ctx,batchId,await request.json()),
   {headers:{"Cache-Control":"private, no-store"}});
} catch(error){
  if(error instanceof TpoBatchReminderError)
   return NextResponse.json({error:error.code},{status:409});
  return apiErrorResponse(error);
 }
  },
);
