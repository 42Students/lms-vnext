import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {resolveLegacyProjectIdentity} from "@/modules/projects/project-legacy-id-resolver";
export const runtime="nodejs";
export async function GET(request:Request,{params}:{
 params:Promise<{legacyId:string}>;
}){
 try{
  const {legacyId}=await params;
  const query=new URL(request.url).searchParams;
  const data=await resolveLegacyProjectIdentity(
    await getCurrentRequestContext(),legacyId,{
      releaseKey:query.get("releaseKey")??undefined,
      sprintKey:query.get("sprintKey")??undefined,
      taskKey:query.get("taskKey")??undefined,
    });
  return NextResponse.json(data,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
