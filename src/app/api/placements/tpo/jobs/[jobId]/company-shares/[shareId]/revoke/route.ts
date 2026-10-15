import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {CompanyShareError,revokeTpoCompanyApplicantShare} from "@/modules/placements/company-share/manage-service";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{jobId:string;shareId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {jobId,shareId}=await params;
  const data=await revokeTpoCompanyApplicantShare(await getCurrentRequestContext(),{jobId,shareId});
  return NextResponse.json(data,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof CompanyShareError)return NextResponse.json({error:error.code},{
   status:error.code==="MIGRATION_PENDING"?503:404,
   headers:{"Cache-Control":"private, no-store"},
  });
  return apiErrorResponse(error);
 }
}
