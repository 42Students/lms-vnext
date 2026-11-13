import { route } from "@/security/route";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { readBoundedJsonRequest } from "@/lib/request-body";
import { CompanyMergeError, mergeSuperAdminCompanies } from "@/modules/placements/admin-company-merge-service";

export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const context = __actor!;
    try {
const parsed = await readBoundedJsonRequest(request, 16384);
if (!parsed.ok) return Response.json({error:"INVALID_REQUEST"},{status:400});
const merged = await mergeSuperAdminCompanies(context, parsed.value);
return Response.json({merged});
} catch (error) {
    if (error instanceof CompanyMergeError) {
      return Response.json({error:error.code},{status:error.code==="COMPANY_NOT_FOUND"?404:409});
    }
    return apiErrorResponse(error);
  }
  },
);
