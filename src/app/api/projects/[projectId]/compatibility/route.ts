import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {requireProjectReadAccess} from "@/modules/projects/access";
import {apiErrorResponse} from "@/lib/api-error";
import {legacyProjectSectionOrder,projectLegacyCompatibilityRoutes}
 from "@/modules/projects/legacy-project-api-crosswalk";
export const runtime="nodejs";
export async function GET(_request:Request,{params}:{
 params:Promise<{projectId:string}>;
}){
 try{
  const {projectId}=await params;
  const scope=await requireProjectReadAccess(await getCurrentRequestContext(),projectId);
  const role=scope.access==="ADMIN"?"ADMIN":scope.access==="LEARNER"?"LEARNER":
    scope.member?.role==="LEARNER"?"LEARNER":"MENTOR";
  return NextResponse.json({
   projectId:scope.project.id,
   response:"OK",
   message:"Project workspace sections loaded",
   sections:legacyProjectSectionOrder[role],
   routes:projectLegacyCompatibilityRoutes(scope.project.id,role,
      scope.access!=="OBSERVER"),
  },{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
