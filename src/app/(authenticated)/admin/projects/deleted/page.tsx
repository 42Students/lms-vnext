import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { getProjectAdminCollegeId } from "@/modules/projects/admin-college-scope";
import { listSoftDeletedProjectWorkspaces } from "@/modules/projects/project-soft-delete-service";

export default async function DeletedAdminProjectsPage() {
  const context = await getCurrentRequestContext();
  const collegeId = getProjectAdminCollegeId(context);
  const projects = collegeId
    ? await listSoftDeletedProjectWorkspaces(context, collegeId)
    : [];
  return <div className="min-w-0 space-y-5">
    <PageHeader title="Deleted workspaces"
      description="Soft-deleted Project workspaces are retained and can be recovered by an authorized administrator."
      actions={<Link href="/admin/projects"
        className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-link">
        Back to workspaces
      </Link>} />
    {!collegeId
      ? <EmptyState title="No college selected" description="Choose a college from the account switcher to view deleted workspaces." />
      : projects.length === 0
        ? <EmptyState title="No deleted workspaces" description="Workspaces moved to Deleted workspaces will appear here for recovery." />
        : <div className="min-w-0 divide-y divide-border border-y border-border">
          {projects.map(project => <article key={project.id}
            className="flex min-w-0 flex-wrap items-start justify-between gap-3 py-4">
            <div className="min-w-0">
              <p className="m-0 break-words font-semibold text-foreground">{project.title}</p>
              <p className="mt-1 text-xs text-body">
                Deleted {project.deletedAt ? project.deletedAt.toLocaleString("en-IN", {
                  timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short",
                }) : "—"} · Archived for safety
              </p>
            </div>
            <Link href={"/admin/projects/" + encodeURIComponent(project.id) + "/summary"}
              className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-link">
              Review and recover
            </Link>
          </article>)}
        </div>}
    {projects.length === 200
      ? <p role="status" className="text-sm text-body">Showing the first 200 deleted workspaces.</p>
      : null}
  </div>;
}
