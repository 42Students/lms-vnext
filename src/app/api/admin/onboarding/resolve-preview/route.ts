import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {previewTenantHostResolutionWithRuntime} from "@/modules/tenant-domains/runtime";

export const runtime="nodejs";

/** Read-only, global-super-admin host resolution diagnostic; no DNS request. */
export async function GET(request:Request){
 try{
  const params=new URL(request.url).searchParams;
  if([...params.keys()].some(key=>key!=="host")||params.getAll("host").length!==1)
   return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  const host=params.get("host")?.trim()??"";
  if(!host||host.length>253)
   return NextResponse.json({error:"INVALID_HOST"},{status:400});
  const context=await getCurrentRequestContext();
  const preview=await previewTenantHostResolutionWithRuntime(context,host);
  return NextResponse.json(preview);
 }catch(error){
  return apiErrorResponse(error);
 }
}
