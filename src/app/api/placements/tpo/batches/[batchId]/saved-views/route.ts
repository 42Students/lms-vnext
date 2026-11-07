import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {listTpoBatchSavedViews,mutateTpoBatchSavedView}
 from "@/modules/placements/tpo-batch-saved-view-service";
export const runtime="nodejs";export const dynamic="force-dynamic";
type Params={params:Promise<{batchId:string}>};
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    const {batchId}=params;
    return NextResponse.json(await listTpoBatchSavedViews(__ctx,batchId),
   {headers:{"Cache-Control":"private, no-store"}});
  },
);
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {batchId}=params;
    return NextResponse.json(await mutateTpoBatchSavedView(__ctx,batchId,await boundedRequestJson(request)),
   {headers:{"Cache-Control":"private, no-store"}});
  },
);
