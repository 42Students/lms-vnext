import {NextResponse} from "next/server";
import {ZodError} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {setTpoPublicJoinLinkEnabled,TpoPublicJoinLinkError} from "@/modules/placements/tpo-public-join-link-service";
export const runtime="nodejs";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const value=await setTpoPublicJoinLinkEnabled(await getCurrentRequestContext(),
    await request.json().catch(()=>null));
  return NextResponse.json(value,{headers:{"Cache-Control":"no-store"}});
 }catch(e){
  if(e instanceof ZodError)return NextResponse.json({error:"INVALID_BODY"},{status:400});
  if(e instanceof TpoPublicJoinLinkError)return NextResponse.json({error:e.code},{
   status:e.code==="NOT_REGISTERED"?503:e.code==="STALE"?409:404});
  return apiErrorResponse(e);
 }
}
