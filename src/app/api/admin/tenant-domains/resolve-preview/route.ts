import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {previewTenantHostResolutionWithRuntime} from "@/modules/tenant-domains/runtime";

export const runtime="nodejs";

/** Read-only global administrator preview of the effective verified host. */
export async function GET(request:Request){
 try{
  const query=new URL(request.url).searchParams;
  if([...query.keys()].length!==1||!query.has("host")||!(query.get("host")??"").trim())
   return NextResponse.json({error:"HOST_REQUIRED",
    fieldErrors:{host:"Enter one fully qualified tenant host."}},{status:400,
    headers:{"Cache-Control":"private, no-store"}});
  const resolution=await previewTenantHostResolutionWithRuntime(
   await getCurrentRequestContext(),query.get("host")!);
  return NextResponse.json(resolution,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
