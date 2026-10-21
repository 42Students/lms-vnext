import { notFound, redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSuperAdmin } from "@/modules/identity/context";
import { ProjectsServiceError } from "@/modules/projects/errors";
import { requireProjectManageAccess } from "@/modules/projects/access";
import { projectInstanceIdSchema } from "@/modules/projects/validation";

/** Old Super Admin workspace-audit link. Authorize the exact workspace before
 * redirecting to its canonical project audit panel. Never expose cross-college IDs. */
export default async function LegacySuperAdminWorkspaceAudit({
  params,
}:{
  params:Promise<{workspaceId:string}>;
}){
  const context=await getCurrentRequestContext();
  if(!isSuperAdmin(context))throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const {workspaceId}=await params;
  const parsed=projectInstanceIdSchema.safeParse(workspaceId);
  if(!parsed.success)notFound();
  await requireProjectManageAccess(context,parsed.data);
  redirect("/admin/projects/"+encodeURIComponent(parsed.data)+"/audit");
}
