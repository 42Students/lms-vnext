import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {z,ZodError} from "zod";
import {isSameOriginRequest} from "@/auth/origin";
import {getCurrentRequestContext} from "@/auth/request-context";
import {addTpoCompanyDomain,CompanyDomainError} from "@/modules/placements/tpo-company-domain-service";
import {apiErrorResponse} from "@/lib/api-error";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const input=z.strictObject({
    domain:z.string().trim().min(1,"Enter a company email domain."),
  }).parse(await request.json());
    const result=await addTpoCompanyDomain(__ctx,{
   ...input,companyId:(params).companyId,
  });
    return NextResponse.json({
    ...result,message:result.unchanged?
      "This company domain is already registered.":"Company email domain added.",
    nextAction:"REVIEW_COMPANY_TRUST",
    navigation:{company:"/tpo/companies/"+(params).companyId,
      domains:"/api/placements/tpo/companies/"+(params).companyId+"/domain",
      trust:"/tpo/companies/"+(params).companyId},
    verifiedBy42:false,
  },{headers:{"Cache-Control":"private, no-store"}});
  },
);
