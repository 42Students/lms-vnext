import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {resolveSignedInRecruiterPendingInvite} from "@/modules/placements/public-recruiter-invite-accept-service";
import { route } from "@/security/route";
import { privateJson } from "@/security/responses";
export const runtime="nodejs";
type Params={params:Promise<{collegeId:string;action:string}>};
async function handlePOST(request:Request,{params}:Params){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const {collegeId,action}=await params;
 if(action!=="accept"&&action!=="decline")return NextResponse.json({error:"NOT_FOUND"},{status:404});
 try{
  const result=await resolveSignedInRecruiterPendingInvite(await getCurrentRequestContext(),collegeId,action);
  return privateJson(result);
 }catch(error){return apiErrorResponse(error);}
}
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handlePOST(request as Parameters<typeof handlePOST>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePOST>[1]),
);
