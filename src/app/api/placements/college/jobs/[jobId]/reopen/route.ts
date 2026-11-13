import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {reopenCollegeDrive} from "@/modules/placements/college-drive-reopen-service";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";
type Props={params:Promise<{jobId:string}>};
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request: req, context: __actor, params }) => {
    const __ctx = __actor!;
    const {jobId}=params;
    return NextResponse.json(await reopenCollegeDrive(__ctx,jobId,
   await boundedRequestJson(req)),{headers:{"Cache-Control":CACHE.PRIVATE}});
  },
);
