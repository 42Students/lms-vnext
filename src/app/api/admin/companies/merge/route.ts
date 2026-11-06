import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { readBoundedJsonRequest } from "@/lib/bounded-json-request";
import { CompanyMergeError, mergeSuperAdminCompanies } from "@/modules/placements/admin-company-merge-service";
import { secured } from "@/security/secure-handler";

export const runtime = "nodejs";

async function handlePOST(request: Request) {
  if (!isSameOriginRequest(request)) return Response.json({error:"INVALID_ORIGIN"},{status:403});
  try {
    const parsed = await readBoundedJsonRequest(request, 16384);
    if (!parsed.ok) return Response.json({error:"INVALID_REQUEST"},{status:400});
    const context = await getCurrentRequestContext();
    const merged = await mergeSuperAdminCompanies(context, parsed.value);
    return Response.json({merged});
  } catch (error) {
    if (error instanceof CompanyMergeError) {
      return Response.json({error:error.code},{status:error.code==="COMPANY_NOT_FOUND"?404:409});
    }
    return apiErrorResponse(error);
  }
}
export const POST = secured(handlePOST);
