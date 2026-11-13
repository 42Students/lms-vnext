import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {
 issueOwnFacultyIdentityUpload,completeOwnFacultyIdentityUpload,
 openOwnFacultyIdentityEvidence,revokeOwnFacultyIdentityEvidence,
} from "@/modules/people/faculty-identity-evidence-service";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":CACHE.PRIVATE};
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const result=await issueOwnFacultyIdentityUpload(__ctx,
   await boundedRequestJson(request));
    return NextResponse.json(result,{headers:noStore});
  },
);
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const result=await completeOwnFacultyIdentityUpload(__ctx,
   await boundedRequestJson(request));
    return NextResponse.json(result,{headers:noStore});
  },
);
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const search=new URL(request.url).searchParams;
    const result=await openOwnFacultyIdentityEvidence(__ctx,{
   kind:search.get("kind"),receiptId:search.get("receiptId"),
  });
    return NextResponse.json(result,{headers:noStore});
  },
);
export const DELETE = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const result=await revokeOwnFacultyIdentityEvidence(__ctx,
   await boundedRequestJson(request));
    return NextResponse.json(result,{headers:noStore});
  },
);
