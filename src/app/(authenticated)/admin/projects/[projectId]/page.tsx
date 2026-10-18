import { notFound, redirect } from "next/navigation";
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
}: {
  params: Promise<{ projectId: string }>;
}) {
  const context = await getCurrentRequestContext();
  if (!isSuperAdmin(context)) {
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  }
  const { projectId } = await params;
  const parsed = projectInstanceIdSchema.safeParse(projectId);
  if (!parsed.success) notFound();
  await requireProjectManageAccess(context, parsed.data);
  redirect(
    "/admin/projects/" +
      encodeURIComponent(parsed.data) +
      "/summary",
  );
}
