import { redirect } from "next/navigation";
import Link from "next/link";
import { ErrorState } from "@/components/ui/error-state";
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
  const parsed = projectInstanceIdSchema.safeParse(projectId);
  if (!parsed.success) return <ErrorState title="Could not load this workspace."
    description="The workspace ID in this link is invalid. Return to workspaces and select a valid project."
    action={<Link href="/admin/projects"
      className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">
      Back to workspaces
    </Link>}/>;
  await requireProjectManageAccess(context, parsed.data);
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
  redirect("/admin/projects/"+encodeURIComponent(parsed.data)+"/summary"+(suffix?"?"+suffix:""));
}
