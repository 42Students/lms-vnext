import {redirect,notFound} from "next/navigation";
import {z} from "zod";
import {and,eq,isNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {projectInstances} from "@/db/schema";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSuperAdmin} from "@/modules/identity/context";
import {requireProjectManageAccess} from "@/modules/projects/access";
import {AdminProjectSectionPage} from "@/components/projects/admin-project-section-page";

/** A legacy workspace ID/slug must be resolved within the selected college,
 * then checked for project-manage authorization before redirecting to an
 * audited canonical section. Never use a global legacy-id lookup.
 */
export default async function SuperAdminProjectSectionRoute({
  params,searchParams,
}:{
  searchParams:Promise<Record<string,string|string[]|undefined>>;
  params:Promise<{projectId:string;section:string}>;
}){
  const {projectId,section}=await params;
  let canonicalId=projectId;
  if(!z.uuid().safeParse(projectId).success){
    const context=await getCurrentRequestContext();
    const collegeId=context.adminScope?.collegeId;
    if(!isSuperAdmin(context)||!collegeId)notFound();
    const legacyId=/^[1-9][0-9]{0,9}$/.test(projectId)&&
      Number(projectId)<=2147483647?Number(projectId):null;
    const slug=/^[a-zA-Z0-9_-]{1,96}$/.test(projectId)?projectId:null;
    if(legacyId===null&&slug===null)notFound();
    const matches=await getDb().select({id:projectInstances.id})
      .from(projectInstances).where(and(
        eq(projectInstances.collegeId,collegeId),
        isNull(projectInstances.deletedAt),
        legacyId!==null?eq(projectInstances.legacyProjectId,legacyId):
          eq(projectInstances.slug,slug ?? ""),
      )).limit(2);
    if(matches.length!==1)notFound();
    const match=matches[0];
    if(!match)notFound();
    canonicalId=match.id;
    await requireProjectManageAccess(context,canonicalId);
    const query=await searchParams;
    const retained=new URLSearchParams();
    for(const key of ["from","reason"] as const){
      const value=query[key];
      if(typeof value==="string"&&value.length<=120&&
        /^[a-zA-Z0-9 _-]*$/.test(value))retained.set(key,value);
    }
    const suffix=retained.toString();
    redirect("/admin/projects/"+encodeURIComponent(canonicalId)+"/"+
      encodeURIComponent(section)+(suffix?"?"+suffix:""));
  }
  const query=await searchParams;
  const one=(value:string|string[]|undefined)=>typeof value==="string"&&
    value.length<=120&&/^[a-zA-Z0-9 _-]*$/.test(value)?value:undefined;
  const from=one(query["from"]);
  const reason=one(query["reason"]);
  return <div className="min-w-0 max-w-full space-y-3">
    <AdminProjectSectionPage projectId={canonicalId} section={section}
      basePath="/admin/projects"
      {...(from!==undefined?{from}:{})}
      {...(reason!==undefined?{reason}:{})} polishAdminSection/>
  </div>;
}
