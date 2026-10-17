import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {changePlatformAccountStatus} from "@/modules/people/super-admin-platform-account-service";
export const runtime="nodejs";
type Params={params:Promise<{userId:string}>};
export async function PATCH(request:Request,{params}:Params){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {userId}=await params;
  const result=await changePlatformAccountStatus(await getCurrentRequestContext(),userId,await request.json());
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
