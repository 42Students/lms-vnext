import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readTpoBulkRequestBody,TpoBulkBodyError} from "@/modules/placements/tpo-bulk-request-body";
import {closeTpoDriveWithPreview,getTpoDriveClosePreview} from "@/modules/placements/tpo-drive-close-preview-service";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    try {
const {jobId}=params;
return NextResponse.json(await closeTpoDriveWithPreview(__ctx,jobId,await readTpoBulkRequestBody(request)));
} catch(error){
  if(error instanceof TpoBulkBodyError)return NextResponse.json({error:error.message},
   {status:error.status,headers:{"Cache-Control":"private, no-store"}});
  return apiErrorResponse(error);
 }
  },
);

/** TPO-drives-13: read-only bulk preflight. Never mutates a job on GET. */
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    const {jobId}=params;
    return NextResponse.json(await getTpoDriveClosePreview(__ctx,jobId),
   {headers:{"Cache-Control":"private, no-store"}});
  },
);
