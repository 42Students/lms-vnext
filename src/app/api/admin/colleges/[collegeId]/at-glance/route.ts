import { route } from "@/security/route";

import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getSuperAdminCollegeAtGlance} from "@/modules/colleges/admin-college-at-glance-service";
import { privateJson } from "@/security/responses";
export const runtime="nodejs";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    const {collegeId}=params;
    const data=await getSuperAdminCollegeAtGlance(__ctx,collegeId);
    return privateJson(data);
  },
);
