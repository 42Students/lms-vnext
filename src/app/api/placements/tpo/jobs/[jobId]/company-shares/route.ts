import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { CompanyShareError, issueTpoCompanyApplicantShare, listTpoCompanyApplicantShares } from "@/modules/placements/company-share/manage-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type RouteContext = {params:Promise<{jobId:string}>};
function errorResponse(error:unknown) {
  if (error instanceof CompanyShareError) {
    return NextResponse.json({error:error.code},{
      status:error.code==="MIGRATION_PENDING"?503:error.code==="NOT_FOUND"?404:error.code==="ACTIVE_LINK_LIMIT"?409:422,
      headers:{"Cache-Control":"private, no-store"},
    });
  }
  return apiErrorResponse(error);
}
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    try {
const {jobId}=params;
const result=await listTpoCompanyApplicantShares(__ctx,jobId,new URL(request.url).searchParams.get("status")??"ALL",new URL(request.url).searchParams.get("page")??1);
return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
} catch(error){return errorResponse(error);}
  },
);
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    try {
const {jobId}=params;
const body=await boundedRequestJson(request) as unknown;
if(!body||typeof body!=="object"||Array.isArray(body)) return NextResponse.json({error:"INVALID_INPUT"},{status:400});
const expiresInDays=(body as Record<string,unknown>)["expiresInDays"];
const selectedApplicationIds=(body as Record<string,unknown>)["selectedApplicationIds"];
const selectedColumns=(body as Record<string,unknown>)["selectedColumns"];
const shortlistBy=(body as Record<string,unknown>)["shortlistBy"];
const result=await issueTpoCompanyApplicantShare(__ctx,{jobId,expiresInDays,
      ...(selectedApplicationIds!==undefined?{selectedApplicationIds}:{}),
      ...(selectedColumns!==undefined?{selectedColumns}:{}),
      ...(shortlistBy!==undefined?{shortlistBy}:{})});
return NextResponse.json(result,{status:201,headers:{"Cache-Control":"private, no-store","Referrer-Policy":"no-referrer"}});
} catch(error){return errorResponse(error);}
  },
);
