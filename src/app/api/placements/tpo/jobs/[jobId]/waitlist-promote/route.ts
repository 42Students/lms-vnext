import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readTpoBulkRequestBody,TpoBulkBodyError} from "@/modules/placements/tpo-bulk-request-body";
import {getTpoWaitlistPreview,offerToNextWaitlisted} from "@/modules/placements/tpo-waitlist-promotion-service";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";export const dynamic="force-dynamic";
type Props={params:Promise<{jobId:string}>};
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    const {jobId}=params;
    return NextResponse.json(await getTpoWaitlistPreview(__ctx,jobId),
   {headers:{"Cache-Control":CACHE.PRIVATE}});
  },
);
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request: req, context: __actor, params }) => {
    const __ctx = __actor!;
    try {
const {jobId}=params;
return NextResponse.json(await offerToNextWaitlisted(__ctx,jobId,await readTpoBulkRequestBody(req)),
   {headers:{"Cache-Control":CACHE.PRIVATE}});
} catch(e){
  if(e instanceof TpoBulkBodyError)return NextResponse.json({error:e.message},
   {status:e.status,headers:{"Cache-Control":CACHE.PRIVATE}});
  return apiErrorResponse(e);
 }
  },
);
