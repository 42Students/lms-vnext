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
  const input=z.strictObject({domain:z.string()}).parse(await request.json());
  const result=await addTpoCompanyDomain(await getCurrentRequestContext(),{
   ...input,companyId:(await params).companyId,
  });
  return NextResponse.json(result,{headers:{"Cache-Control":"no-store"}});
 }catch(error){
  if(error instanceof ZodError)return NextResponse.json({error:"INVALID_DOMAIN"},{status:422});
  if(error instanceof CompanyDomainError)return NextResponse.json({error:error.code},{
   status:error.code==="COMPANY_NOT_FOUND"?404:409});
  return apiErrorResponse(error);
 }
}
