import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {
 issueOwnFacultyAttachmentUpload,completeOwnFacultyAttachmentUpload,
 openOwnFacultyAttachment,revokeOwnFacultyAttachment,
} from "@/modules/people/faculty-section-attachment-service";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":CACHE.PRIVATE};
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    return NextResponse.json(await issueOwnFacultyAttachmentUpload(
   __ctx,await boundedRequestJson(request)),{headers:noStore});
  },
);
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    return NextResponse.json(await completeOwnFacultyAttachmentUpload(
   __ctx,await boundedRequestJson(request)),{headers:noStore});
  },
);
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const params=new URL(request.url).searchParams;
    return NextResponse.json(await openOwnFacultyAttachment(
   __ctx,{
    purpose:params.get("purpose"),entryId:params.get("entryId"),
    receiptId:params.get("receiptId"),
   }),{headers:noStore});
  },
);
export const DELETE = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    return NextResponse.json(await revokeOwnFacultyAttachment(
   __ctx,await boundedRequestJson(request)),{headers:noStore});
  },
);
