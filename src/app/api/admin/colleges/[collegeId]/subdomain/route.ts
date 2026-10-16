import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {changeManagedCollegeSubdomain,getManagedCollegeSubdomain,ManagedSubdomainError} from "@/modules/tenant-domains/managed-subdomain-service";
export const runtime="nodejs";
type Params={params:Promise<{collegeId:string}>};
export async function GET(_request:Request,{params}:Params){
 try{
  const {collegeId}=await params;
  return NextResponse.json(await getManagedCollegeSubdomain(await getCurrentRequestContext(),collegeId),
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof ManagedSubdomainError)return NextResponse.json(
    {error:error.code},{status:error.code==="MANAGED_WILDCARD_NOT_READY"?503:409,
      headers:{"Cache-Control":"private, no-store"}});
  return apiErrorResponse(error);
 }
}
export async function POST(request:Request,{params}:Params){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {collegeId}=await params;
  const result=await changeManagedCollegeSubdomain(await getCurrentRequestContext(),collegeId,await request.json());
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
