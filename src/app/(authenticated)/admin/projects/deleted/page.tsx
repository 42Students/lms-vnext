import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getProjectAdminCollegeId } from "@/modules/projects/admin-college-scope";
import { listSoftDeletedProjectWorkspaces } from "@/modules/projects/project-soft-delete-service";

export default async function DeletedAdminProjectsPage() {
  const context = await getCurrentRequestContext();
  const collegeId = getProjectAdminCollegeId(context);
  const deletedResult = collegeId
    ? await listSoftDeletedProjectWorkspaces(context, collegeId)
      .then(value => ({ok:true as const,value}))
      .catch(error => {
        if (error instanceof AuthorizationError) throw error;
        return {ok:false as const,value:[]};
      })
    : null;
  return <div className="min-w-0 space-y-5">
    <PageHeader title="Deleted workspaces"
      description="Deleted workspaces you can still restore."
      actions={<Link href="/admin/projects"
        className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-link">
        Back to workspaces
      </Link>} />
    {!collegeId
      ? <div className="min-w-0 space-y-3"><p role="status" className="rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface p-3 text-sm text-body">Select a College to manage Projects</p>
       <EmptyState title="No college selected" description="Choose a college from the account switcher to view deleted workspaces." /></div>
      : !deletedResult?.ok
        ? <ErrorState title="Deleted workspaces could not be loaded"
            description="Failed to load deleted workspaces. The selected college and its workspaces were not changed."
            action={<Link href="/admin/projects/deleted"
              className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">
              Retry
            </Link>}/>
        : deletedResult.value.length === 0
          ? <EmptyState title="No deleted workspaces" description="Workspaces moved to Deleted workspaces will appear here for recovery." />
          : <div aria-label="Deleted workspaces" className="min-w-0 divide-y divide-border rounded-[var(--lms-canvas-radius)] border border-border bg-surface px-4 md:px-5">
          {deletedResult.value.map(project => <article key={project.id}
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
    {deletedResult?.ok && deletedResult.value.length === 200
      ? <p role="status" className="text-sm text-body">Showing the first 200 deleted workspaces.</p>
      : null}
  </div>;
}
