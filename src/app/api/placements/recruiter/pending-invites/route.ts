import { boundedRequestJson } from "@/lib/request-body";
import {NextResponse} from "next/server";
import {z} from "zod";
import {isSameOriginRequest} from "@/auth/origin";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {listOwnRecruiterPendingInvites,respondToOwnRecruiterPendingInvite} from "@/modules/placements/recruiter-pending-invites-service";
import { route } from "@/security/route";
import { CACHE, privateJson } from "@/security/responses";
import { zUuid } from "@/lib/schema-primitives";
export const runtime="nodejs";
async function handleGET(){
 try{
  return NextResponse.json(await listOwnRecruiterPendingInvites(await getCurrentRequestContext()),
    {headers:{"Cache-Control":CACHE.PRIVATE}});
 }catch(error){return apiErrorResponse(error);}
}
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  () => handleGET(),
);

const pendingInviteResponseSchema=z.strictObject({
 grantId:zUuid,
 action:z.enum(["ACCEPT","DECLINE","accept","decline"]),
 expectedVersion:z.number().int().min(1),
});
/** A signed-in recruiter can only act on an invite currently owned by the
 * same user and company. Version and tenant grant are rechecked under lock. */
async function handlePOST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const body:unknown=await boundedRequestJson(request).catch(()=>null);
 const parsed=pendingInviteResponseSchema.safeParse(body);
 if(!parsed.success)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
 try{
  const {grantId,action,expectedVersion}=parsed.data;
  const result=await respondToOwnRecruiterPendingInvite(
   await getCurrentRequestContext(),grantId,{
    action:action.toUpperCase(),expectedVersion,
   });
  return privateJson(result);
 }catch(error){
  const code=error instanceof Error?error.message:"";
  if(code==="PENDING_RECRUITER_ACCESS_DENIED")
   return NextResponse.json({error:"FORBIDDEN"},{status:403});
  if(code==="PENDING_RECRUITER_NOT_FOUND")
   return NextResponse.json({error:"NOT_FOUND"},{status:404});
  if(["PENDING_RECRUITER_STALE","PENDING_RECRUITER_INVALID_STATE",
     "PENDING_RECRUITER_EXPIRED"].includes(code))
   return NextResponse.json({error:"STALE_INVITE"},{status:409});
  return apiErrorResponse(error);
 }
}
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  ({ request }) => handlePOST(request as Parameters<typeof handlePOST>[0]),
);
