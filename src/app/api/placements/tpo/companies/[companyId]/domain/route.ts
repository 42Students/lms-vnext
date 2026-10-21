import {NextResponse} from "next/server";
import {z,ZodError} from "zod";
import {isSameOriginRequest} from "@/auth/origin";
import {getCurrentRequestContext} from "@/auth/request-context";
import {addTpoCompanyDomain,CompanyDomainError} from "@/modules/placements/tpo-company-domain-service";
import {apiErrorResponse} from "@/lib/api-error";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{companyId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const input=z.strictObject({
    domain:z.string().trim().min(1,"Enter a company email domain."),
  }).parse(await request.json());
  const result=await addTpoCompanyDomain(await getCurrentRequestContext(),{
   ...input,companyId:(await params).companyId,
  });
  return NextResponse.json({
    ...result,message:result.unchanged?
      "This company domain is already registered.":"Company email domain added.",
    nextAction:"REVIEW_COMPANY_TRUST",
    navigation:{company:"/tpo/companies/"+(await params).companyId,
      domains:"/api/placements/tpo/companies/"+(await params).companyId+"/domain",
      trust:"/tpo/companies/"+(await params).companyId},
    verifiedBy42:false,
  },{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof ZodError)return NextResponse.json({
    error:"INVALID_DOMAIN",
    message:error.issues[0]?.message??"Enter a valid company email domain.",
    field:"domain",
  },{status:422,headers:{"Cache-Control":"private, no-store"}});
  if(error instanceof CompanyDomainError){
   // Global domain uniqueness must not expose another college's private employer list.
   const message=error.code==="DOMAIN_IN_USE"?
    "This email domain belongs to another company. Ask 42Students support to review the domain owner.":
    error.code==="ALREADY_SET"?
    "This company already has an email domain. Ask 42Students support to review changes.":
    "This company is no longer available in your placement directory.";
   return NextResponse.json({error:error.code,message},{
    status:error.code==="COMPANY_NOT_FOUND"?404:409,headers:{"Cache-Control":"no-store"}});
  }
  return apiErrorResponse(error);
 }
}
