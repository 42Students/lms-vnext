import Link from "next/link";
import {redirect} from "next/navigation";

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
import { Tabs } from "@/components/ui/tabs";
import { ListToolbar } from "@/components/ui/list-toolbar";
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
    return <div className="space-y-4"><PageHeader title="Workspaces"
     description="Select a college to continue."/>
     <p role="alert" className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4 text-sm text-body">
      Project workspaces are college-scoped. Choose an active college from the account switcher before opening this page.
     </p>
     <Link href="/dashboard" className="inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Back to dashboard</Link>
    </div>;
  }

  const parsed = parseCollegeProjectsQuery(await searchParams);
  if (!parsed.success) {
    return <div className="space-y-4">
      <PageHeader title="Workspaces" description="Live projects, each run by a mentor with a team of students." />
      <ErrorState title="Invalid project filters"
        description="Check the search, status, page and rows filters, or clear them to continue."
        action={<Link href="/college/projects" className="inline-flex min-h-11 items-center font-semibold text-link underline">Clear filters</Link>}
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
      .catch(() => ({ ok: false as const })),
    listAssignedProjectTemplates(context, collegeId)
      .then(value => ({ ok: true as const, value }))
      .catch(() => ({ ok: false as const })),
  ]);
  if(!snapshotsResult.ok){
    const retry=new URLSearchParams();
    if(query.q)retry.set("q",query.q);
    if(query.status)retry.set("status",query.status);
    if(query.page)retry.set("page",String(query.page));
    if(query.pageSize)retry.set("pageSize",String(query.pageSize));
    if(query.view)retry.set("view",query.view);
    const suffix=retry.toString();
    return <div className="min-w-0 space-y-6">
      <PageHeader title="Workspaces"
        description="Live projects, each run by a mentor with a team of students."/>
      <ErrorState title="Project workspaces unavailable"
        description="The workspace list could not be loaded. Your search and filters were not changed."
        action={<Link href={"/college/projects"+(suffix?"?"+suffix:"")}
          className="inline-flex min-h-11 items-center font-semibold text-link underline">Retry loading workspaces</Link>}/>
    </div>;
  }
  const result=snapshotsResult.value;
  const templateTitles = new Map(
    (templatesResult.ok ? templatesResult.value : []).map(template => [template.templateId, template.title]),
  );
  const items=result.items.map(project=>({
   id:project.id,title:project.title,summary:project.summary,status:project.status,
   updatedAt:project.updatedAt,mentorName:project.mentorName,memberCount:project.memberCount,
   templateTitle:project.templateId ? (templateTitles.get(project.templateId)??null) : null,
   progressPercent:project.progressPercent,
   riskReasons:project.riskReasons,
  }));
  const viewHref=(view:"cards"|"table")=>"/college/projects?"+new URLSearchParams({
   ...(query.q?{q:query.q}:{}),...(query.status?{status:query.status}:{}),
   ...(query.pageSize?{pageSize:String(query.pageSize)}:{}),view,
  }).toString();
  return (
    <div className="space-y-6">
      <ProjectAdminNav
        basePath="/college/projects"
        active="workspaces"
      />
      <PageHeader
        title="Workspaces"
        description="Live projects, each run by a mentor with a team of students."
        actions={<Link href="/college/projects/create"
          className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-semibold text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          Create workspace
        </Link>}
      />

      <nav aria-label="Project workspace tools" className="flex min-w-0 flex-wrap gap-2">
      <Link className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" href="/college/projects/workspaces/new">Split class into teams / Add whole class</Link>
      <Link className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" href="/college/projects/reassign-mentor">Bulk reassign mentor</Link></nav>

      <Tabs ariaLabel="Workspace display and archive" renderPanel={false}
        value={query.status==="ARCHIVED"?"archived":query.view??"cards"}
        items={[
          {value:"cards",label:"Cards",href:viewHref("cards"),count:result.total},
          {value:"table",label:"List",href:viewHref("table"),count:result.total},
          {value:"archived",label:"Archived workspaces",href:"/college/projects?status=ARCHIVED"},
        ]} />
      {!templatesResult.ok && <p role="status" className="border-b border-border pb-3 text-sm text-body">Template names are unavailable right now. Workspaces are still listed; try refreshing this page.</p>}
      <ProjectAdminFilters query={query} />
      <ListToolbar label="College project workspaces" viewCount={result.total}
        exportAction={<ProjectAdminWorkspacePageExport items={items}/>} />

      <ProjectAdminWorkspaceList
        items={items}
        view={query.view}
        basePath="/college/projects"
        emptyTitle="No Projects match these filters"
        emptyDescription="Clear the filters, or create a Project from an assigned published template."
      />

      <p role="status" className="text-sm text-muted-foreground">{result.total===0?"0 of 0 workspaces":`${(result.page-1)*(query.pageSize??25)+1}–${Math.min(result.page*(query.pageSize??25),result.total)} of ${result.total} workspaces`}</p>
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
