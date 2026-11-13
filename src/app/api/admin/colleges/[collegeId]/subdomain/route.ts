import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {changeManagedCollegeSubdomain,getManagedCollegeSubdomain,ManagedSubdomainError} from "@/modules/tenant-domains/managed-subdomain-service";
import {readBoundedJsonRequest} from "@/lib/bounded-json-request";
import { route } from "@/security/route";
import { CACHE, privateJson } from "@/security/responses";
export const runtime="nodejs";
type Params={params:Promise<{collegeId:string}>};
async function handleGET(_request:Request,{params}:Params){
 try{
  const {collegeId}=await params;
  return NextResponse.json(await getManagedCollegeSubdomain(await getCurrentRequestContext(),collegeId),
   {headers:{"Cache-Control":CACHE.PRIVATE}});
 }catch(error){
  if(error instanceof ManagedSubdomainError)return NextResponse.json(
    {error:error.code},{status:error.code==="MANAGED_WILDCARD_NOT_READY"?503:409,
      headers:{"Cache-Control":CACHE.PRIVATE}});
  return apiErrorResponse(error);
 }
}
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handleGET(request as Parameters<typeof handleGET>[0], { params: Promise.resolve(params) } as Parameters<typeof handleGET>[1]),
);
/** Legacy /tenant/colleges/{id}/subdomain contract:
 * GET -> scoped state, PUT -> ALLOT/CHANGE, DELETE -> REMOVE.
 * All writers retain same-origin checks, college UUID mapping, and CAS.
 */
async function mutate(request:Request,{params}:Params,legacyVerb?:"PUT"|"DELETE"){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const _b=await readBoundedJsonRequest(request,8192);
  if(!_b.ok)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  let raw:unknown=_b.value;
  const {collegeId}=await params;
  const context=await getCurrentRequestContext();
  if(legacyVerb){
   if(!raw||typeof raw!=="object"||Array.isArray(raw))
    return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
   const input=raw as Record<string,unknown>;
   if(typeof input["expectedHost"]!=="string"&&input["expectedHost"]!==null)
    return NextResponse.json({error:"EXPECTED_HOST_REQUIRED"},{status:400});
   raw={...input,action:legacyVerb==="DELETE"?"REMOVE":
    (await getManagedCollegeSubdomain(context,collegeId)).currentHost?"CHANGE":"ALLOT"};
  }
  const result=await changeManagedCollegeSubdomain(context,collegeId,raw);
  return privateJson(result);
 }catch(error){return apiErrorResponse(error);}
}
async function handlePOST(request:Request,params:Params){return mutate(request,params);}
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handlePOST(request as Parameters<typeof handlePOST>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePOST>[1]),
);
async function handlePUT(request:Request,params:Params){return mutate(request,params,"PUT");}
export const PUT = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handlePUT(request as Parameters<typeof handlePUT>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePUT>[1]),
);
async function handleDELETE(request:Request,params:Params){return mutate(request,params,"DELETE");}
export const DELETE = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handleDELETE(request as Parameters<typeof handleDELETE>[0], { params: Promise.resolve(params) } as Parameters<typeof handleDELETE>[1]),
);
