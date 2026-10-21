import {and,eq,or} from "drizzle-orm";
import {notFound,redirect} from "next/navigation";
import {getDb} from "@/db/client";
import {projectInstances} from "@/db/schema";
import {getCurrentRequestContext} from "@/auth/request-context";
import {requireProjectManageAccess} from "@/modules/projects/access";
import {getProjectAdminCollegeId} from "@/modules/projects/admin-college-scope";
export default async function LegacyCollegeWorkspaceDelivery({params}:{params:Promise<{workspaceId:string}>}){
 const {workspaceId}=await params;
 const context=await getCurrentRequestContext();
 const collegeId=getProjectAdminCollegeId(context);
 if(!collegeId||!workspaceId||workspaceId.length>160)notFound();
 const [row]=await getDb().select({id:projectInstances.id})
  .from(projectInstances).where(and(eq(projectInstances.collegeId,collegeId),
   or(eq(projectInstances.slug,workspaceId),/^[0-9a-f-]{36}$/i.test(workspaceId)?eq(projectInstances.id,workspaceId):undefined))).limit(1);
 if(!row)notFound();
 await requireProjectManageAccess(context,row.id);
 redirect("/college/projects/"+encodeURIComponent(row.id)+"/delivery");
}
