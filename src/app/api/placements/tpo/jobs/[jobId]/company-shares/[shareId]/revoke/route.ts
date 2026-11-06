import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {CompanyShareError,revokeTpoCompanyApplicantShare} from "@/modules/placements/company-share/manage-service";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    const {jobId,shareId}=params;
    const data=await revokeTpoCompanyApplicantShare(__ctx,{jobId,shareId});
    return NextResponse.json(data,{headers:{"Cache-Control":"private, no-store"}});
  },
);
