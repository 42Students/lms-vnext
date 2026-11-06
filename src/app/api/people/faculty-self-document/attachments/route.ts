import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {
 issueOwnFacultyAttachmentUpload,completeOwnFacultyAttachmentUpload,
 openOwnFacultyAttachment,revokeOwnFacultyAttachment,
} from "@/modules/people/faculty-section-attachment-service";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":"private, no-store"};
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    return NextResponse.json(await issueOwnFacultyAttachmentUpload(
   __ctx,await request.json()),{headers:noStore});
  },
);
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    return NextResponse.json(await completeOwnFacultyAttachmentUpload(
   __ctx,await request.json()),{headers:noStore});
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
   __ctx,await request.json()),{headers:noStore});
  },
);
