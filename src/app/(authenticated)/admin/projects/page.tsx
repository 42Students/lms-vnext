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
      <PageHeader title="Workspaces" actions={<PageBackLink href="/admin/projects" label="Projects" />} />
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
          title="Workspaces"
          description="Live projects, each run by a mentor with a team of students."
          actions={<PageBackLink href="/admin/projects" label="Projects" />}
        />
        <ProjectAdminNav
          basePath="/admin/projects"
          active="workspaces"
        />
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
      <PageHeader title="Workspaces"
        description="Live projects, each run by a mentor with a team of students."
        actions={<PageBackLink href="/admin/projects" label="Projects" />} />
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
      <PageHeader title="Workspaces"
        description="Live projects, each run by a mentor with a team of students."
        actions={<PageBackLink href="/admin/projects" label="Projects" />} />
      <ProjectAdminNav basePath="/admin/projects" active="workspaces" />
      <ErrorState title="Failed to load project workspaces"
        description="Couldn't refresh workspaces. The workspace list could not be loaded. Your search and filters were not changed; retry to load the current scoped results."
        action={<Link href={"/admin/projects"+(suffix?"?"+suffix:"")}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] w-full md:w-auto">Retry loading workspaces</Link>}
      />
    </div>;
  }
  const result=snapshotsResult.value;
  const templates=templatesResult.ok?templatesResult.value:[];

  return (
    <div className="min-w-0 space-y-4">
      <PageHeader title="Workspaces"
        description="Live projects, each run by a mentor with a team of students." />
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
      <Tabs ariaLabel="Workspace display mode" renderPanel={false} value={view??"table"}
        items={[
          {value:"table",label:"Table",href:viewHref("table"),count:result.total},
          {value:"cards",label:"Cards",href:viewHref("cards"),count:result.total},
        ]} />
      <FilterBar title="Project workspace filters"><ProjectAdminFilters query={query} legacyWorkspaces /></FilterBar>
      <ListToolbar label="Project workspaces" viewCount={result.total}
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
