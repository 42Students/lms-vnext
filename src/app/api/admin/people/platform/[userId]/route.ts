import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {requireRecentDeviceAuthentication} from "@/auth/recent-device-auth";
import {apiErrorResponse} from "@/lib/api-error";
import {readBoundedJsonRequest} from "@/lib/bounded-json-request";
import {changePlatformAccountStatus} from "@/modules/people/super-admin-platform-account-service";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
type Params={params:Promise<{userId:string}>};
async function handlePATCH(request:Request,{params}:Params){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {userId}=await params;
  const parsed=await readBoundedJsonRequest(request,8192);
  if(!parsed.ok)return NextResponse.json({error:"INVALID_REQUEST"},{status:400,headers:{"Cache-Control":"private, no-store"}});
  const context=await getCurrentRequestContext();
  // Disabling/reactivating platform identities is a security-critical write.
  await requireRecentDeviceAuthentication(context.user.id);
  const result=await changePlatformAccountStatus(context,userId,parsed.value);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export const PATCH = secured(handlePATCH, { csrf: "enforce" });
