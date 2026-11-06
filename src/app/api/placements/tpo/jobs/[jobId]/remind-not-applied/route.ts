import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {getTpoNonApplicantReminderPreview,remindTpoNonApplicants} from "@/modules/placements/tpo-remind-not-applied-service";
export const runtime="nodejs";export const dynamic="force-dynamic";
type Props={params:Promise<{jobId:string}>};
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    const {jobId}=params;
    return NextResponse.json(await getTpoNonApplicantReminderPreview(__ctx,jobId),
   {headers:{"Cache-Control":"private, no-store"}});
  },
);
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {jobId}=params;
    return NextResponse.json(await remindTpoNonApplicants(__ctx,jobId,await request.json()),
   {headers:{"Cache-Control":"private, no-store"}});
  },
);
