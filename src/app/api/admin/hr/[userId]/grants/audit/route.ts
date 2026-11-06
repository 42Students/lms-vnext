import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getSuperAdminRecruiterGrantAudit} from "@/modules/placements/super-admin-recruiter-grant-audit-service";
export const runtime="nodejs";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    const {userId}=params;
    const audit=await getSuperAdminRecruiterGrantAudit(__ctx,userId);
    return NextResponse.json(audit,{headers:{"cache-control":"no-store"}});
  },
);
