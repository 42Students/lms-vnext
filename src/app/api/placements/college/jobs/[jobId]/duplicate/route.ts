import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {duplicateCollegeDrive} from "@/modules/placements/college-drive-clone-service";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request: req, context: __actor, params }) => {
    const __ctx = __actor!;
    const {jobId}=params;
    return NextResponse.json(await duplicateCollegeDrive(__ctx,jobId,await req.json()),{
   headers:{"Cache-Control":"private, no-store"}});
  },
);
