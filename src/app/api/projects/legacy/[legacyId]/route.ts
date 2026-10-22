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
      ...(query.get("releaseKey") !== null ? {releaseKey:query.get("releaseKey") ?? ""} : {}),
      ...(query.get("sprintKey") !== null ? {sprintKey:query.get("sprintKey") ?? ""} : {}),
      ...(query.get("taskKey") !== null ? {taskKey:query.get("taskKey") ?? ""} : {}),
    });
  return NextResponse.json(data,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
