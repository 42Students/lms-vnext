import Link from "next/link";
import {redirect} from "next/navigation";
import {AuthorizationError} from "@/modules/permissions/policy";

import { getCurrentRequestContext } from "@/auth/request-context";
import {
  ProjectAdminFilters,
  ProjectAdminPagination,
  type ProjectAdminCollectionQuery,
} from "@/components/projects/project-admin-collection-controls";
import { ProjectAdminNav } from "@/components/projects/project-admin-nav";
import { ProjectAdminWorkspaceList } from "@/components/projects/project-admin-workspace-list";
import {ProjectAdminWorkspacePageExport} from "@/components/projects/project-admin-workspace-page-export";
import { PageHeader } from "@/components/ui/page-header";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { FilterBar } from "@/components/ui/filter-bar";
import { Banner } from "@/components/ui/banner";
import { ErrorState } from "@/components/ui/error-state";
import {parseCollegeProjectsQuery,canonicalCollegeProjectsPageHref} from "@/modules/projects/college-projects-query-model";
import { getProjectAdminCollegeId } from "@/modules/projects/admin-college-scope";
import { listProjectAdminSnapshots } from "@/modules/projects/admin-insights-service";
import { listAssignedProjectTemplates } from "@/modules/projects/template-service";

export default async function CollegeProjectsPage({
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
  const collegeId = getProjectAdminCollegeId(context);
  if (!collegeId) {
    return <div className="min-w-0 space-y-4">
      <ProjectAdminNav basePath="/college/projects" active="workspaces"/>
      <PageHeader title="Project workspaces" description="Select a college to continue."/>
      <ErrorState title="No college selected"
        description="Project workspaces are college-scoped. Choose an active college from the account switcher before opening this page."
        action={<Link href="/dashboard" className="inline-flex min-h-11 md:min-h-9 items-center font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Back to dashboard</Link>}/>
    </div>;
  }

  const parsed = parseCollegeProjectsQuery(await searchParams);
  if (!parsed.success) {
    return <div className="min-w-0 space-y-4">
      <ProjectAdminNav basePath="/college/projects" active="workspaces"/>
      <PageHeader title="Project workspaces" description="Live projects, each run by a mentor with a team of students." />
      <ErrorState title="Invalid project filters"
        description="Check the search, status, page and rows filters, or clear them to continue."
        action={<Link href="/college/projects" className="inline-flex min-h-11 items-center font-semibold text-link underline lms-inline-link md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Clear filters</Link>}
      />
    </div>;
  }
  const query: ProjectAdminCollectionQuery = parsed.data;
  // The strict service schema accepts database filters only, not the
  // presentational view toggle. Keep cards/table navigation in the UI.
  const serviceQuery = {
    q: query.q, status: query.status, page: query.page, pageSize: query.pageSize,
  };
  // Optional labels may fail independently, but an essential workspace read
  // must show a true retry state rather than throw or display a false empty list.
  const [snapshotsResult, templatesResult] = await Promise.all([
    listProjectAdminSnapshots(context, collegeId, serviceQuery)
      .then(value => ({ ok: true as const, value }))
      .catch((error:unknown) => ({ ok: false as const,error })),
    listAssignedProjectTemplates(context, collegeId)
      .then(value => ({ ok: true as const, value }))
      .catch(() => ({ ok: false as const })),
  ]);
  if(!snapshotsResult.ok){
    if(snapshotsResult.error instanceof AuthorizationError)throw snapshotsResult.error;
    const retry=new URLSearchParams();
    if(query.q)retry.set("q",query.q);
    if(query.status)retry.set("status",query.status);
    if(query.page)retry.set("page",String(query.page));
    if(query.pageSize)retry.set("pageSize",String(query.pageSize));
    if(query.view)retry.set("view",query.view);
    const suffix=retry.toString();
    return <div className="min-w-0 space-y-6">
      <ProjectAdminNav basePath="/college/projects" active="workspaces"/>
      <PageHeader title="Project workspaces"
        description="Live projects, each run by a mentor with a team of students."/>
      <ErrorState title="Workspaces could not be loaded"
        description="Failed to load project workspaces. Your search and filters were not changed."
        action={<Link href={"/college/projects"+(suffix?"?"+suffix:"")}
          className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Retry</Link>}/>
    </div>;
  }
  const result=snapshotsResult.value;
  const canonical=canonicalCollegeProjectsPageHref(query,result.totalPages);
  if(canonical)redirect(canonical);
  const templateTitles = new Map(
    (templatesResult.ok ? templatesResult.value : []).map(template => [template.templateId, template.title]),
  );
  const items=result.items.map(project=>({
   id:project.id,title:project.title,summary:project.summary,status:project.status,
   updatedAt:project.updatedAt,mentorName:project.mentorName,memberCount:project.memberCount,
   courseLabel:project.courseLabel,phase:project.phase,dueLabel:project.dueLabel,
   templateTitle:project.templateId ? (templateTitles.get(project.templateId)??null) : null,
   templateId:project.templateId,
   progressPercent:project.progressPercent,
   riskReasons:project.riskReasons,
  }));
  return (
    <div className="min-w-0 space-y-4 md:space-y-6">
      <ProjectAdminNav
        basePath="/college/projects"
        active="workspaces"
      />
      <PageHeader
        title="Project workspaces"
        description="Live projects, each run by a mentor with a team of students."
        actions={<div className="flex min-w-0 flex-wrap items-center gap-3">
          <Link href="/college/projects/create" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-semibold text-on-primary md:min-h-9">Create workspace</Link>
          <Link href="/college/projects/reassign-mentor" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Bulk reassign mentor</Link>
          <Link href="/college/projects/deleted" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Deleted workspaces</Link>
        </div>}
      />

      {!templatesResult.ok && <Banner tone="warning">Template names are unavailable right now. Workspaces are still listed; try refreshing this page.</Banner>}
      <FilterBar title="Filters"><ProjectAdminFilters query={query} legacyWorkspaces
        searchParamName="q" atRiskHref="/college/projects/at-risk" /></FilterBar>
      <section aria-label="Project workspaces directory" className="min-w-0 space-y-3">
       <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[var(--lms-heading)]">Project workspaces</h2>
        <div className="flex min-w-0 items-center gap-3 text-sm">
         <Link href="/college/projects/at-risk" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Needs attention</Link>
         {query.view==="cards"?<Link href="/college/projects?view=table" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">View list</Link>:null}
        </div>
       </div>
       <ListToolbar label="College project workspaces" viewCount={result.total}
        exportAction={<ProjectAdminWorkspacePageExport items={items}/>} />
      </section>

      <ProjectAdminWorkspaceList
        items={items}
        view={query.view}
        basePath="/college/projects"
        emptyTitle={query.q||query.status?"No workspaces match your search/filter":"No workspaces available for this college"}
        emptyDescription={query.q||query.status?"Clear the search and filters to see all workspaces.":"Start by creating a workspace or assigning a published project template."}
      />

      <ProjectAdminPagination
        basePath="/college/projects"
        query={query}
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
      />
    </div>
  );
}
