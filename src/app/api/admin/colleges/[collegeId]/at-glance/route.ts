import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getSuperAdminCollegeAtGlance} from "@/modules/colleges/admin-college-at-glance-service";
export const runtime="nodejs";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    const {collegeId}=params;
    const data=await getSuperAdminCollegeAtGlance(__ctx,collegeId);
    return NextResponse.json(data,{headers:{"Cache-Control":"private, no-store"}});
  },
);
