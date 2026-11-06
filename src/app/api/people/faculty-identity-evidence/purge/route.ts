import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {purgeExpiredFacultyIdentityEvidence}
 from "@/modules/people/faculty-identity-evidence-retention-service";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const result=await purgeExpiredFacultyIdentityEvidence(
   __ctx,await request.json());
    return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
  },
);
