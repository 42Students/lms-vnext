import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {resolveSignedInRecruiterPendingInvite} from "@/modules/placements/public-recruiter-invite-accept-service";
export const runtime="nodejs";
type Params={params:Promise<{collegeId:string;action:string}>};
export async function POST(request:Request,{params}:Params){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const {collegeId,action}=await params;
 if(action!=="accept"&&action!=="decline")return NextResponse.json({error:"NOT_FOUND"},{status:404});
 try{
  const result=await resolveSignedInRecruiterPendingInvite(await getCurrentRequestContext(),collegeId,action);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
