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
/** Legacy /tenant/colleges/{id}/subdomain contract:
 * GET -> scoped state, PUT -> ALLOT/CHANGE, DELETE -> REMOVE.
 * All writers retain same-origin checks, college UUID mapping, and CAS.
 */
async function mutate(request:Request,{params}:Params,legacyVerb?:"PUT"|"DELETE"){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  let raw:unknown;
  try{raw=await request.json();}catch{
   return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  }
  const {collegeId}=await params;
  const context=await getCurrentRequestContext();
  if(legacyVerb){
   if(!raw||typeof raw!=="object"||Array.isArray(raw))
    return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
   const input=raw as Record<string,unknown>;
   if(typeof input.expectedHost!=="string"&&input.expectedHost!==null)
    return NextResponse.json({error:"EXPECTED_HOST_REQUIRED"},{status:400});
   raw={...input,action:legacyVerb==="DELETE"?"REMOVE":
    (await getManagedCollegeSubdomain(context,collegeId)).currentHost?"CHANGE":"ALLOT"};
  }
  const result=await changeManagedCollegeSubdomain(context,collegeId,raw);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export async function POST(request:Request,params:Params){return mutate(request,params);}
export async function PUT(request:Request,params:Params){return mutate(request,params,"PUT");}
export async function DELETE(request:Request,params:Params){return mutate(request,params,"DELETE");}
