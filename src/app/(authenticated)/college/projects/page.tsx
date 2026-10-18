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
     <p role="alert" className="rounded-xl border border-border bg-surface p-4 text-sm text-body">
      Project workspaces are college-scoped. Choose an active college from the account switcher before opening this page.
     </p>
     <Link href="/dashboard" className="inline-flex min-h-11 items-center text-[var(--lms-teal-deep)] underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">Back to dashboard</Link>
    </div>;
  }

  const parsed = parseCollegeProjectsQuery(await searchParams);
  if (!parsed.success) {
    return <div className="space-y-4">
      <PageHeader title="Workspaces" description="Live projects, each run by a mentor with a team of students." />
      <ErrorState title="Invalid project filters"
        description="Check the search, status, page and rows filters, or clear them to continue."
        action={<Link href="/college/projects" className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-teal-deep)] underline">Clear filters</Link>}
      />
    </div>;
  }
  const query: ProjectAdminCollectionQuery = parsed.data;
  // Failure to read optional template labels must not hide the actual projects.
  const [result, templatesResult] = await Promise.all([
    listProjectAdminSnapshots(context, collegeId, query),
    listAssignedProjectTemplates(context, collegeId)
      .then(value => ({ ok: true as const, value }))
      .catch(() => ({ ok: false as const })),
  ]);
  // A workspace archived from another tab can empty an old page bookmark.
  // Re-open the last valid page with all filters intact; do not show "Page 9
  // of 2" or lose the user's search after concurrent archive operations.
  const canonical=canonicalCollegeProjectsPageHref(query,result.totalPages);
  if(canonical)redirect(canonical);
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
          className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">
          Create workspace
        </Link>}
      />

      <nav aria-label="Project workspace tools" className="flex min-w-0 flex-wrap gap-2">
      <Link className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]" href="/college/projects/workspaces/new">Split class into teams / Add whole class</Link>
      <Link className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-[var(--lms-teal-deep)] hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]" href="/college/projects/reassign-mentor">Bulk reassign mentor</Link></nav>

      <nav aria-label="Workspace display and archive" className="flex min-w-0 flex-wrap items-center gap-3">
       <ProjectAdminWorkspacePageExport items={items}/>
       <Link href={viewHref("cards")} aria-current={query.view==="cards"?"page":undefined} className="min-h-11 rounded border border-border px-3 py-2 text-sm text-[var(--lms-teal-deep)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)] inline-flex items-center">Cards</Link>
       <Link href={viewHref("table")} aria-current={query.view==="table"?"page":undefined} className="min-h-11 rounded border border-border px-3 py-2 text-sm text-[var(--lms-teal-deep)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)] inline-flex items-center">List</Link>
       <Link href="/college/projects?status=ARCHIVED" className="min-h-11 rounded border border-border px-3 py-2 text-sm text-[var(--lms-teal-deep)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)] inline-flex items-center">Archived workspaces</Link>
      </nav>
      {!templatesResult.ok && <p role="status" className="rounded-lg border border-border bg-surface p-3 text-sm text-body">Template names are unavailable right now. Workspaces are still listed; try refreshing this page.</p>}
      <ProjectAdminFilters query={query} />

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
