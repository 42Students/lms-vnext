import { redirect } from "next/navigation";
import Link from "next/link";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { projectInstances } from "@/db/schema";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSuperAdmin } from "@/modules/identity/context";
import { ProjectsServiceError } from "@/modules/projects/errors";
import { requireProjectManageAccess } from "@/modules/projects/access";
import { projectInstanceIdSchema } from "@/modules/projects/validation";

/** The legacy project URL delegates to the canonical summary only after
 * establishing that the selected Super Admin can actually see that project.
 * Avoid redirecting hostile IDs into a detailed page as an access oracle.
 */
export default async function SuperAdminProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<Record<string,string|string[]|undefined>>;
}) {
  const context = await getCurrentRequestContext();
  if (!isSuperAdmin(context)) {
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  }
  const { projectId } = await params;
  // A legacy workspace numeric key/slug is never globally searchable. Resolve
  // it inside the actively selected college only, then check canonical
  // authorization. An absent or ambiguous mapping reveals no foreign project.
  const collegeId=context.adminScope?.collegeId;
  if(!collegeId)return <div className="min-w-0 space-y-4">
    <PageHeader title="Project workspace"/>
    <ErrorState title="No college selected"
      description="Select a college in the header to open its project workspaces. Existing workspaces in other colleges stay private."
      action={<Link href="/admin/projects"
        className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">
        Back to workspaces
      </Link>}/>
  </div>;
  const parsed = projectInstanceIdSchema.safeParse(projectId);
  let canonicalId:string|null=parsed.success?parsed.data:null;
  if(!canonicalId){
    const legacyId=/^[1-9][0-9]{0,9}$/.test(projectId)&&Number(projectId)<=2147483647
      ?Number(projectId):null;
    const legacySlug=/^[a-zA-Z0-9_-]{1,96}$/.test(projectId)?projectId:null;
    if(legacyId!==null||legacySlug!==null){
      const candidates=await getDb().select({id:projectInstances.id})
        .from(projectInstances).where(and(
          eq(projectInstances.collegeId,collegeId),
          isNull(projectInstances.deletedAt),
          legacyId!==null?eq(projectInstances.legacyProjectId,legacyId):
            eq(projectInstances.slug,legacySlug ?? ""),
        )).limit(2);
      if(candidates.length===1)canonicalId=candidates[0]?.id ?? null;
    }
  }
  if(!canonicalId)return <ErrorState title="Could not load this workspace."
    description="This project link does not match a workspace in the selected college. Choose it from the workspace list."
    action={<Link href="/admin/projects"
      className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">
      Back to workspaces
    </Link>}/>;
  await requireProjectManageAccess(context,canonicalId);
  // Only canonical audited deep-link context survives a legacy redirect.
  // Reject arrays or oversized values rather than reflecting arbitrary URL keys.
  const raw=await searchParams;
  const retained=new URLSearchParams();
  for(const key of ["from","reason"] as const) {
    const value=raw[key];
    if(typeof value==="string"&&value.length<=120&&/^[a-zA-Z0-9 _-]*$/.test(value))
      retained.set(key,value);
  }
  const suffix=retained.toString();
  redirect("/admin/projects/"+encodeURIComponent(canonicalId)+"/summary"+(suffix?"?"+suffix:""));
}
