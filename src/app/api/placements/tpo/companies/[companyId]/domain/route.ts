import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {z,ZodError} from "zod";
import {isSameOriginRequest} from "@/auth/origin";
import {getCurrentRequestContext} from "@/auth/request-context";
import {addTpoCompanyDomain,CompanyDomainError} from "@/modules/placements/tpo-company-domain-service";
import {apiErrorResponse} from "@/lib/api-error";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    try {
const input=z.strictObject({
    domain:z.string().trim().min(1,"Enter a company email domain."),
  }).parse(await boundedRequestJson(request));
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
  },{headers:{"Cache-Control":CACHE.PRIVATE}});
} catch(error){
  if(error instanceof ZodError)return NextResponse.json({
    error:"INVALID_DOMAIN",
    message:error.issues[0]?.message??"Enter a valid company email domain.",
    field:"domain",
  },{status:422,headers:{"Cache-Control":CACHE.PRIVATE}});
  if(error instanceof CompanyDomainError){
   // Global domain uniqueness must not expose another college's private employer list.
   const message=error.code==="DOMAIN_IN_USE"?
    "This email domain belongs to another company. Ask 42Students support to review the domain owner.":
    error.code==="ALREADY_SET"?
    "This company already has an email domain. Ask 42Students support to review changes.":
    "This company is no longer available in your placement directory.";
   return NextResponse.json({error:error.code,message},{
    status:error.code==="COMPANY_NOT_FOUND"?404:409,headers:{"Cache-Control":CACHE.NONE}});
  }
  return apiErrorResponse(error);
 }
  },
);
