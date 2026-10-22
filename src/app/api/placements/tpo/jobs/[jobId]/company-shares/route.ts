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
export async function GET(request:Request,{params}:RouteContext) {
  try {
    const {jobId}=await params;
    const result=await listTpoCompanyApplicantShares(await getCurrentRequestContext(),jobId,new URL(request.url).searchParams.get("status")??"ALL",new URL(request.url).searchParams.get("page")??1);
    return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
  }catch(error){return errorResponse(error);}
}
export async function POST(request:Request,{params}:RouteContext) {
  if(!isSameOriginRequest(request)) return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try {
    const {jobId}=await params;
    const body=await request.json() as unknown;
    if(!body||typeof body!=="object"||Array.isArray(body)) return NextResponse.json({error:"INVALID_INPUT"},{status:400});
    const expiresInDays=(body as Record<string,unknown>)["expiresInDays"];
    const selectedApplicationIds=(body as Record<string,unknown>)["selectedApplicationIds"];
    const selectedColumns=(body as Record<string,unknown>)["selectedColumns"];
    const shortlistBy=(body as Record<string,unknown>)["shortlistBy"];
    const result=await issueTpoCompanyApplicantShare(await getCurrentRequestContext(),{jobId,expiresInDays,
      ...(selectedApplicationIds!==undefined?{selectedApplicationIds}:{}),
      ...(selectedColumns!==undefined?{selectedColumns}:{}),
      ...(shortlistBy!==undefined?{shortlistBy}:{})});
    return NextResponse.json(result,{status:201,headers:{"Cache-Control":"private, no-store","Referrer-Policy":"no-referrer"}});
  }catch(error){return errorResponse(error);}
}
