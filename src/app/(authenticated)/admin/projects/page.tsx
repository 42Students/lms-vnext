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
  const collegeId =
    context.adminScope?.collegeId ?? null;

  if (!collegeId) {
    return (
      <div className="space-y-6">
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

  const params = await searchParams;
  const view=one(params.view)==="cards"?"cards":"table";
  const query: ProjectAdminCollectionQuery = {
    q: one(params.search) ?? one(params.q),
    status: one(
      params.status,
    ) as ProjectAdminCollectionQuery["status"],
    page: Number(one(params.page) ?? 1),
    pageSize: Number(
      one(params.pageSize) ?? 20,
    ),
  };

  const [result, templates] = await Promise.all([
    listProjectAdminSnapshots(
      context,
      collegeId,
      query,
    ),
    listAssignedProjectTemplates(
      context,
      collegeId,
    ),
  ]);

  return (
    <div className="space-y-6">
      <ProjectAdminNav
        basePath="/admin/projects"
        active="workspaces"
      />
      <PageHeader
        eyebrow="Super Admin"
        title="Project workspaces"
        description="Live projects, each run by a mentor with a team of students."
        actions={
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
        }
      />

      <div className="flex flex-wrap gap-2"><Link className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold hover:bg-surface" href="/admin/projects/workspaces/new">Create workspace</Link>
        <Link className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold hover:bg-surface" href="/admin/projects/reassign-mentor">Bulk reassign mentor</Link></div>

      <ProjectAdminFilters query={query} legacyWorkspaces />

      <nav className="flex gap-2 text-sm font-semibold" aria-label="Workspace display mode">
        <Link href={"/admin/projects?view=table"+(query.q?"&q="+encodeURIComponent(query.q):"")+
          (query.status?"&status="+query.status:"")} aria-current={view==="table"?"page":undefined}
          className="min-h-10 rounded border border-border px-3 py-2 text-primary-text">Table</Link>
        <Link href={"/admin/projects?view=cards"+(query.q?"&q="+encodeURIComponent(query.q):"")+
          (query.status?"&status="+query.status:"")} aria-current={view==="cards"?"page":undefined}
          className="min-h-10 rounded border border-border px-3 py-2 text-primary-text">Cards</Link>
      </nav>
      <ProjectWorkspacePageExport items={result.items.map(item=>({
        id:item.id,title:item.title,mentorName:item.mentorName,status:item.status,
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
