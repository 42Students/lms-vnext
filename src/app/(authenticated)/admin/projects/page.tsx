import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import {
  ProjectAdminFilters,
  ProjectAdminPagination,
  type ProjectAdminCollectionQuery,
} from "@/components/projects/project-admin-collection-controls";
import { CreateProjectControl } from "@/components/projects/project-create-control";
import { ProjectAdminNav } from "@/components/projects/project-admin-nav";
import { ProjectAdminWorkspaceList } from "@/components/projects/project-admin-workspace-list";
import {ProjectWorkspacePageExport} from "@/components/projects/project-workspace-page-export";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { parseAdminProjectsQuery } from "@/modules/projects/admin-projects-query-model";
import { PageHeader } from "@/components/ui/page-header";
import { listProjectAdminSnapshots } from "@/modules/projects/admin-insights-service";
import { listAssignedProjectTemplates } from "@/modules/projects/template-service";
import { isSuperAdmin } from "@/modules/identity/context";
import { getProjectAdminCollegeId } from "@/modules/projects/admin-college-scope";

export default async function SuperAdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<
    Record<
      string,
      string | string[] | undefined
    >
  >;
}) {
  const context = await getCurrentRequestContext();
  // The /admin layout is not an authorization substitute. Reject a disabled
  // or non-Super-Admin actor before any project or template service call.
  if (!isSuperAdmin(context)) {
    return <div className="min-w-0 space-y-6">
      <PageHeader eyebrow="Super Admin" title="Project workspaces" />
      <ErrorState title="Project access denied"
        description="Your account cannot access Super Admin project workspaces."
        action={<Link href="/dashboard" className="font-semibold text-primary-text underline">Back to dashboard</Link>}
      />
    </div>;
  }
  const collegeId = getProjectAdminCollegeId(context);

  if (!collegeId) {
    return (
      <div className="min-w-0 space-y-6">
        <ProjectAdminNav
          basePath="/admin/projects"
          active="workspaces"
        />
        <PageHeader
          eyebrow="Super Admin"
          title="Project workspaces"
          description="Live projects, each run by a mentor with a team of students."
        />
        <EmptyState
          title="No college selected"
          description="Pick a college in the header to manage its project workspaces."
        />
      </div>
    );
  }

  const parsed = parseAdminProjectsQuery(await searchParams);
  if (!parsed.success) {
    return <div className="min-w-0 space-y-6">
      <PageHeader eyebrow="Super Admin" title="Project workspaces"
        description="Live projects, each run by a mentor with a team of students." />
      <ErrorState title="Invalid project filters"
        description="Check the search, status, page and rows filters, or clear them to continue."
        action={<Link href="/admin/projects" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">Clear filters</Link>}
      />
    </div>;
  }
  const query: ProjectAdminCollectionQuery = parsed.data;
  // The strict service schema accepts database filters only, not the
  // presentational view toggle. Keep cards/table navigation in the UI.
  const serviceQuery = {
    q: query.q, status: query.status, page: query.page, pageSize: query.pageSize,
  };
  const view = parsed.data.view;
  const viewHref = (targetView:"table"|"cards") => {
    const params=new URLSearchParams();
    params.set("view",targetView);
    if(query.q)params.set("search",query.q);
    if(query.status)params.set("status",query.status);
    if(query.page && query.page>1)params.set("page",String(query.page));
    if(query.pageSize && query.pageSize!==20)params.set("pageSize",String(query.pageSize));
    return "/admin/projects?"+params.toString();
  };

  // Both independent reads are settled. A template outage must not hide the
  // authorized workspace rows; a workspace outage must not masquerade as an
  // empty directory (or leak a database exception to the customer).
  const [snapshotsResult, templatesResult] = await Promise.all([
    listProjectAdminSnapshots(context, collegeId, serviceQuery)
      .then(value => ({ok:true as const,value}))
      .catch(() => ({ok:false as const})),
    listAssignedProjectTemplates(context, collegeId)
      .then(value => ({ok:true as const,value}))
      .catch(() => ({ok:false as const})),
  ]);
  if (!snapshotsResult.ok) {
    const retryParams = new URLSearchParams();
    if (query.q) retryParams.set("search", query.q);
    if (query.status) retryParams.set("status", query.status);
    if (query.view) retryParams.set("view", query.view);
    if (query.page) retryParams.set("page", String(query.page));
    if (query.pageSize) retryParams.set("pageSize", String(query.pageSize));
    const suffix = retryParams.toString();
    return <div className="min-w-0 space-y-6">
      <ProjectAdminNav basePath="/admin/projects" active="workspaces" />
      <PageHeader eyebrow="Super Admin" title="Project workspaces"
        description="Live projects, each run by a mentor with a team of students." />
      <ErrorState title="Project workspaces unavailable"
        description="The workspace list could not be loaded. Your search and filters were not changed."
        action={<Link href={"/admin/projects"+(suffix?"?"+suffix:"")}
          className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">Retry loading workspaces</Link>}
      />
    </div>;
  }
  const result=snapshotsResult.value;
  const templates=templatesResult.ok?templatesResult.value:[];

  return (
    <div className="min-w-0 space-y-6">
      <ProjectAdminNav
        basePath="/admin/projects"
        active="workspaces"
      />
      <PageHeader
        eyebrow="Super Admin"
        title="Project workspaces"
        description="Live projects, each run by a mentor with a team of students."
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3.5 text-sm font-semibold text-primary-text hover:bg-primary-subtle sm:min-h-9" href="/admin/projects/reassign-mentor">Bulk reassign mentor</Link>
            <Link className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3.5 text-sm font-semibold text-primary-text hover:bg-primary-subtle sm:min-h-9" href="/admin/projects/workspaces/new">Create workspace</Link>
            <CreateProjectControl
              collegeId={collegeId}
              basePath="/admin/projects"
              templates={templates.map((template) => ({
                templateId: template.templateId,
                title: template.title,
                version: template.version,
                summary: template.summary,
              }))}
            />
          </div>
        }
      />

      {!templatesResult.ok && (
        <p role="status" className="border-l-2 border-warning-border bg-warning-subtle px-3 py-2 text-sm leading-5 text-body">
          Project templates are temporarily unavailable. Your workspaces are still visible; refresh to try again.
        </p>
      )}
      <ProjectAdminFilters query={query} legacyWorkspaces />

      <nav className="flex gap-2 border-b border-border text-sm font-semibold" aria-label="Workspace display mode">
        <Link href={viewHref("table")} aria-current={view==="table"?"page":undefined}
          className="inline-flex min-h-9 items-center border-b-[3px] border-transparent px-3 text-sm font-semibold text-body hover:text-primary-text aria-[current=page]:border-primary aria-[current=page]:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Table</Link>
        <Link href={viewHref("cards")} aria-current={view==="cards"?"page":undefined}
          className="inline-flex min-h-9 items-center border-b-[3px] border-transparent px-3 text-sm font-semibold text-body hover:text-primary-text aria-[current=page]:border-primary aria-[current=page]:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Cards</Link>
      </nav>
      <ProjectWorkspacePageExport items={result.items.map(item=>({
        id:item.id,title:item.title,mentorName:item.mentorName,status:item.status,
        riskReasons:item.riskReasons,
        memberCount:item.memberCount,progressPercent:item.progressPercent,updatedAt:item.updatedAt,
      }))}/>
      <ProjectAdminWorkspaceList
        view={view}
        items={result.items.map((project) => ({
          id: project.id,
          title: project.title,
          summary: project.summary,
          status: project.status,
          updatedAt: project.updatedAt,
          mentorName: project.mentorName,
          memberCount: project.memberCount,
          progressPercent:
            project.progressPercent,
        }))}
        basePath="/admin/projects"
        emptyTitle="No Projects match these filters"
        emptyDescription="Clear the filters, or create a Project from a published template assigned to this college."
      />

      <ProjectAdminPagination
        basePath="/admin/projects"
        query={query}
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
      />
    </div>
  );
}
