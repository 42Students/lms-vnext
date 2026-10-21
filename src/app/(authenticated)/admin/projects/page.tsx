import { FilterBar } from "@/components/ui/filter-bar";
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
import { PageBackLink } from "@/components/ui/page-back-link";
import { Tabs } from "@/components/ui/tabs";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { Banner } from "@/components/ui/banner";
import { ProjectWorkspaceRefreshButton } from "@/components/projects/project-workspace-refresh-button";
import {redirect} from "next/navigation";
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
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Project workspaces" actions={<PageBackLink href="/admin/projects" label="Projects" />} />
      <ErrorState title="Project access denied"
        description="Your account cannot access Super Admin project workspaces."
        action={<PageBackLink href="/dashboard" label="Back to dashboard" />}
      />
    </div>;
  }
  const collegeId = getProjectAdminCollegeId(context);

  if (!collegeId) {
    return (
      <div className="min-w-0 space-y-4">
        <PageHeader
          title="Project workspaces"
          description="College project workspaces for students and mentors."
          actions={<ProjectWorkspaceRefreshButton/>}
        />
        <ProjectAdminNav
          basePath="/admin/projects"
          active="workspaces"
        />
        <Banner tone="info" role="status">
          <strong>Select a College to manage Projects</strong>
          <p className="mt-1 text-sm">Choose a college in the header account switcher. The global template catalogue remains available without a selected college.</p>
        </Banner>
        <EmptyState
          title="No college selected"
          description="Pick a college in the header to manage its project workspaces. The Super Admin template catalogue remains available without a selected college."
          action={<Link href="/admin/projects/templates"
            className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">
            Browse project templates
          </Link>}
        />
      </div>
    );
  }

  const parsed = parseAdminProjectsQuery(await searchParams);
  if (!parsed.success) {
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Project workspaces"
        description="College project workspaces for students and mentors."
        actions={<ProjectWorkspaceRefreshButton/>} />
      <ProjectAdminNav basePath="/admin/projects" active="workspaces" />
      <ErrorState title="Invalid project filters"
        description="Check the search, status, page and rows filters, or clear them to continue."
        action={<Link href="/admin/projects" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] w-full md:w-auto">Clear filters</Link>}
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
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Project workspaces"
        description="College project workspaces for students and mentors."
        actions={<ProjectWorkspaceRefreshButton/>} />
      <ProjectAdminNav basePath="/admin/projects" active="workspaces" />
      <Banner tone="warning">Couldn't refresh workspaces. Your filters are unchanged, but previously fetched rows are not reused across college scopes.</Banner>
      <section aria-label="Workspaces" className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4 shadow-none md:p-5">
        <h2 className="mb-3 text-lg font-semibold text-foreground">Workspaces</h2>
        <FilterBar title="Project workspace filters"><ProjectAdminFilters query={query} legacyWorkspaces /></FilterBar>
      </section>
      <ErrorState title="Failed to load project workspaces"
        description="Couldn't refresh workspaces. The workspace list could not be loaded. Your search and filters were not changed; retry to load the current scoped results."
        action={<Link href={"/admin/projects"+(suffix?"?"+suffix:"")}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] w-full md:w-auto">Retry loading workspaces</Link>}
      />
    </div>;
  }
  const result=snapshotsResult.value;
  const templates=templatesResult.ok?templatesResult.value:[];
  // After archival or recovery the requested page can be beyond the end.
  // Clamp within the same college/filter scope instead of showing false empty.
  if(result.total>0&&query.page&&query.page>result.totalPages){
   const params=new URLSearchParams();
   if(query.q)params.set("search",query.q);
   if(query.status)params.set("status",query.status);
   if(query.view)params.set("view",query.view);
   if(query.pageSize&&query.pageSize!==10)params.set("pageSize",String(query.pageSize));
   params.set("page",String(result.totalPages));
   redirect("/admin/projects?"+params.toString());
  }

  return (
    <div className="min-w-0 space-y-4">
      <PageHeader title="Project workspaces"
        description="College project workspaces for students and mentors."
        actions={<ProjectWorkspaceRefreshButton/>} />
      <div className="flex min-w-0 flex-wrap items-center gap-2 print:hidden">
        <CreateProjectControl
          collegeId={collegeId} basePath="/admin/projects"
          templates={templates.map(template=>({
            templateId:template.templateId,title:template.title,
            version:template.version,summary:template.summary,
          }))} />
        <Link href="/admin/projects/workspaces/new"
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">
          Create workspace
        </Link>
        <Link href="/admin/projects/reassign-mentor"
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-primary md:min-h-9">
          Bulk reassign mentor
        </Link>
        <Link href="/admin/projects/deleted"
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-primary md:min-h-9">
          Deleted workspaces
        </Link>
      </div>
      <ProjectAdminNav basePath="/admin/projects" active="workspaces" />

      {!templatesResult.ok ? <Banner tone="warning">
        Project templates are temporarily unavailable. Your workspaces are still visible; refresh to try again.
      </Banner> : null}
      <section aria-label="Workspaces" className="min-w-0 space-y-3 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4 shadow-none md:p-5">
       <h2 className="m-0 text-lg font-semibold text-foreground">Workspaces</h2>
      <Tabs ariaLabel="Workspace display mode" renderPanel={false} value={view??"table"}
        items={[
          {value:"table",label:"Table",href:viewHref("table"),count:result.total},
          {value:"cards",label:"Cards",href:viewHref("cards"),count:result.total},
        ]} />
      <FilterBar title="Project workspace filters"><ProjectAdminFilters query={query} legacyWorkspaces /></FilterBar>
      <ListToolbar label="Workspaces" viewCount={result.total}
        exportAction={<ProjectWorkspacePageExport items={result.items.map(item=>({
          id:item.id,title:item.title,mentorName:item.mentorName,status:item.status,
          riskReasons:item.riskReasons,
          memberCount:item.memberCount,progressPercent:item.progressPercent,updatedAt:item.updatedAt,
        }))}/>} />
      <ProjectAdminWorkspaceList
        compactAdmin
        view={view}
        items={result.items.map((project) => ({
          id: project.id,
          title: project.title,
          summary: project.summary,
          templateTitle: templates.find(template => template.templateId === project.templateId)?.title ?? null,
          templateId:project.templateId,
          riskReasons: project.riskReasons,
          status: project.status,
          updatedAt: project.updatedAt,
          mentorName: project.mentorName,
          memberCount: project.memberCount,
          progressPercent:
            project.progressPercent,
        }))}
        basePath="/admin/projects"
        emptyTitle={query.q||query.status?"No workspaces match your search/filter":"No workspaces available for this college"}
        emptyDescription={query.q||query.status?
         "Clear search and status to see all workspaces available in this college.":
         "Create a workspace using a project template assigned to this college."}
      />

      <ProjectAdminPagination
        basePath="/admin/projects"
        query={query}
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
      />
      <p className="text-xs text-muted-foreground">Showing {result.items.length} of {result.total} authorized college workspaces. CSV exports the current permissioned page, not all workspaces.</p>
      </section>
    </div>
  );
}
