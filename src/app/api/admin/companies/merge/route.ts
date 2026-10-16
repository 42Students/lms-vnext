import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { CompanyMergeError, mergeSuperAdminCompanies } from "@/modules/placements/admin-company-merge-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return Response.json({error:"INVALID_ORIGIN"},{status:403});
  try {
    const context = await getCurrentRequestContext();
    const input: unknown = await request.json();
    const merged = await mergeSuperAdminCompanies(context,input);
    return Response.json({merged});
  } catch (error) {
    if (error instanceof CompanyMergeError) {
      return Response.json({error:error.code},{status:error.code==="COMPANY_NOT_FOUND"?404:409});
    }
    return apiErrorResponse(error);
  }
}
