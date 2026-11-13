import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {listTpoStudentSavedViews,mutateTpoStudentSavedView}
 from "@/modules/placements/tpo-student-saved-views-service";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";export const dynamic="force-dynamic";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor }) => {
    const __ctx = __actor!;
    return NextResponse.json(await listTpoStudentSavedViews(__ctx),
  {headers:{"Cache-Control":CACHE.PRIVATE}})
  },
);
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request: req, context: __actor }) => {
    const __ctx = __actor!;
    return NextResponse.json(await mutateTpoStudentSavedView(__ctx,await boundedRequestJson(req)),
  {headers:{"Cache-Control":CACHE.PRIVATE}})
  },
);
