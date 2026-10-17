import Link from "next/link";

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
import { listProjectAdminSnapshots } from "@/modules/projects/admin-insights-service";
import { listAssignedProjectTemplates } from "@/modules/projects/template-service";

function one(
  value: string | string[] | undefined,
) {
  return Array.isArray(value)
    ? value[0]
    : value;
}

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
  const membership = context.membership;
  if (!membership) {
    return <main className="space-y-4"><PageHeader title="Project workspaces"
     description="Select a college to continue."/>
     <p role="alert" className="rounded-xl border border-border bg-surface p-4 text-sm text-body">
      Project workspaces are college-scoped. Choose an active college from the account switcher before opening this page.
     </p>
     <Link href="/dashboard" className="inline-flex min-h-11 items-center text-primary-text underline">Back to dashboard</Link>
    </main>;
  }

  const params = await searchParams;
  const query: ProjectAdminCollectionQuery = {
    q: one(params.q),
    view:one(params.view)==="table"?"table":"cards",
    status: one(
      params.status,
    ) as ProjectAdminCollectionQuery["status"],
    page: Number(one(params.page) ?? 1),
    pageSize: Number(
      one(params.pageSize) ?? 25,
    ),
  };

  const [result, templates] = await Promise.all([
    listProjectAdminSnapshots(
      context,
      membership.collegeId,
      query,
    ),
    listAssignedProjectTemplates(
      context,
      membership.collegeId,
    ),
  ]);

  const items=result.items.map(project=>({
   id:project.id,title:project.title,summary:project.summary,status:project.status,
   updatedAt:project.updatedAt,mentorName:project.mentorName,memberCount:project.memberCount,
   templateTitle:templates.find(template=>template.templateId===project.templateId)?.title??null,
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
          className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">
          Create workspace
        </Link>}
      />

      <div className="flex flex-wrap gap-2">
      <Link className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text hover:bg-surface" href="/college/projects/create">Create workspace</Link>
      <Link className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold hover:bg-surface" href="/college/projects/workspaces/new">Split class into teams / Add whole class</Link>
      <Link className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text hover:bg-surface" href="/college/projects/reassign-mentor">Bulk reassign mentor</Link></div>

      <div className="flex flex-wrap items-center gap-3">
       <ProjectAdminWorkspacePageExport items={items}/>
       <Link href={viewHref("cards")} aria-current={query.view==="cards"?"page":undefined} className="min-h-10 rounded border border-border px-3 py-2 text-sm text-primary-text">Cards</Link>
       <Link href={viewHref("table")} aria-current={query.view==="table"?"page":undefined} className="min-h-10 rounded border border-border px-3 py-2 text-sm text-primary-text">List</Link>
       <Link href="/college/projects?status=ARCHIVED" className="min-h-10 rounded border border-border px-3 py-2 text-sm text-primary-text">Archived workspaces</Link>
      </div>
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
