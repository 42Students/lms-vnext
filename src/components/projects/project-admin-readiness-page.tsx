import {AdminReadinessWorkspacePicker} from "./admin-readiness-workspace-picker";
import Link from "next/link";
import { listCollegeActiveReadinessOverrides } from "@/modules/projects/admin-readiness-overrides-service";
import {listCollegeReadinessWorkspaceChoices,listCollegeReadinessReleases} from "@/modules/projects/college-readiness-releases-service";
import {z} from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import {
  ProjectAdminFilters,
  ProjectAdminPagination,
  type ProjectAdminCollectionQuery,
} from "@/components/projects/project-admin-collection-controls";
import { ProjectAdminNav } from "@/components/projects/project-admin-nav";
import { PageHeader } from "@/components/ui/page-header";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { Banner } from "@/components/ui/banner";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  listProjectAdminSnapshots,
} from "@/modules/projects/admin-insights-service";

function one(
  value: string | string[] | undefined,
) {
  return Array.isArray(value)
    ? value[0]
    : value;
}

function tone(status: string) {
  if (
    status === "COMPLETED" ||
    status === "APPROVED"
  ) {
    return "success" as const;
  }
  if (
    status === "ACTIVE" ||
    status === "SUBMITTED"
  ) {
    return "info" as const;
  }
  if (
    status === "ARCHIVED"
  ) {
    return "neutral" as const;
  }
  return "warning" as const;
}

export async function ProjectAdminReadinessPage({
  collegeId,
  basePath,
  eyebrow,
  searchParams,
}: {
  collegeId: string;
  basePath: string;
  eyebrow: string;
  searchParams: Record<
    string,
    string | string[] | undefined
  >;
}) {
  const context = await getCurrentRequestContext();
  const query: ProjectAdminCollectionQuery = {
    q: one(searchParams.q),
    status: one(searchParams.status) as ProjectAdminCollectionQuery["status"],
    page: Number(one(searchParams.page) ?? 1),
    pageSize: Number(
      one(searchParams.pageSize) ?? 25,
    ),
  };
  const [result, activeOverrides, workspaceChoices] = await Promise.all([
    listProjectAdminSnapshots(context, collegeId, query),
    listCollegeActiveReadinessOverrides(context, collegeId),
    listCollegeReadinessWorkspaceChoices(context,collegeId),
  ]);
  const chosenId=z.string().uuid().safeParse(one(searchParams.projectId) ?? one(searchParams.workspaceId)).data;
  const selected=chosenId && workspaceChoices.some(item=>item.id===chosenId)?chosenId:null;
  const outsideScope=Boolean(chosenId&&!selected);
  const releaseContext=selected?await listCollegeReadinessReleases(context,collegeId,selected):[];
  const readinessPath =
    basePath + "/readiness";

  return (
    <div className="space-y-6">
      <ProjectAdminNav
        basePath={basePath}
        active="readiness"
      />
      <PageHeader
        eyebrow={eyebrow}
        title="Submission readiness"
        description="Execution completion and final-delivery readiness across project workspaces. See whether each team is ready to submit, and override the gate when you need to."
        actions={<a href={"/api/projects/readiness-overrides/export?collegeId=" + encodeURIComponent(collegeId)}
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3.5 text-sm font-semibold text-primary-text hover:bg-primary-subtle sm:min-h-9">Export overrides CSV</a>}
      />
      <section className="border-b border-border pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Active overrides ({activeOverrides.length})</h2>
        </div>
        {!activeOverrides.length ? <p className="mt-3 text-sm text-muted-foreground">
          No workspace currently has a manual override — every gate is running on its own completion state.
        </p> : <DataTable<(typeof activeOverrides)[number]>
          caption="Active overrides"
          rows={activeOverrides.filter(row=>!query.q||row.workspace.toLowerCase().includes(query.q.toLowerCase()))}
          getRowKey={row=>row.projectId}
          columns={[
            {key:"workspace",header:"Workspace",mobilePriority:"primary",cell:row=>row.workspace},
            {key:"direction",header:"Override",mobilePriority:"secondary",cell:row=>row.direction},
            {key:"note",header:"Note",mobilePriority:"secondary",cell:row=>row.note},
            {key:"by",header:"By",mobilePriority:"secondary",cell:row=>row.by},
            {key:"at",header:"At",mobilePriority:"secondary",cell:row=>new Intl.DateTimeFormat("en-IN",{
              dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
            }).format(row.at)},
            {key:"action",header:"Action",mobilePriority:"action",cell:row=><Link
              className="inline-flex min-h-11 items-center font-semibold text-primary-text underline"
              href={basePath+"/"+row.projectId+"/readiness"}>Manage</Link>},
          ]}
          empty={<p role="status" className="text-sm text-body">No workspace overrides match these filters.</p>}
        />}
      </section>
      <section className="space-y-3 border-b border-border pb-5">
        <h2 className="text-base font-semibold">Select workspace</h2>
        {outsideScope ? <Banner tone="warning" role="alert">This workspace belongs to a different college — switch colleges in the header and try again.</Banner> : null}
        <AdminReadinessWorkspacePicker items={workspaceChoices} selected={selected} action={readinessPath}/>
        {selected ? <>
          <Link href={basePath+"/"+selected+"/readiness"} className="text-sm font-semibold text-primary-text underline">
            Manage override
          </Link>
          <h3 className="text-sm font-semibold">Releases</h3>
          {!releaseContext.length ? <p className="text-sm text-muted-foreground">No releases recorded.</p> :
            <DataTable<(typeof releaseContext)[number]>
              caption="Readiness releases"
              rows={releaseContext}
              getRowKey={release=>release.id}
              columns={[
                {key:"release",header:"Release",mobilePriority:"primary",cell:release=>release.title},
                {key:"status",header:"Status",mobilePriority:"secondary",cell:release=>release.status==="SHIPPED"?"Shipped":release.status==="IN_PROGRESS"?"In progress":"Planned"},
                {key:"sprints",header:"Sprints",mobilePriority:"secondary",cell:release=>release.completedSprints+"/"+release.sprintCount},
                {key:"points",header:"Points",mobilePriority:"secondary",cell:release=>release.points},
                {key:"target",header:"Target date",mobilePriority:"secondary",cell:release=>release.targetDate??"—"},
              ]}
              empty={<p role="status" className="text-sm text-body">No releases recorded.</p>}
            />}
        </> : null}
      </section>
      <ProjectAdminFilters query={query} />
      <ListToolbar label="Readiness workspaces" viewCount={result.total} />

      {!result.items.length ? (
        <section className="border-b border-border py-6 text-sm text-muted-foreground">
          No project workspaces match these filters.
        </section>
      ) : (
        <div className="space-y-3">
          {result.items.map((project) => (
            <article
              key={project.id}
              className="border-b border-border py-5 last:border-b-0"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    href={
                      basePath +
                      "/" +
                      project.id +
                      "/readiness"
                    }
                    className="text-base font-semibold text-foreground hover:text-primary-text"
                  >
                    {project.title}
                  </Link>
                  <Link href={basePath + "/" + project.id + "/readiness"} className="ml-3 text-sm text-primary-text underline">Manage</Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {project.mentorName
                      ? "Mentor: " +
                        project.mentorName
                      : "No primary mentor"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge
                    tone={tone(project.status)}
                  >
                    {project.status}
                  </StatusBadge>
                  <StatusBadge
                    tone={
                      project.executionComplete
                        ? "success"
                        : "warning"
                    }
                  >
                    {project.executionComplete
                      ? "Execution complete"
                      : "Execution incomplete"}
                  </StatusBadge>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Metric
                  label="Progress"
                  value={
                    project.progressPercent + "%"
                  }
                />
                <Metric
                  label="Tasks"
                  value={
                    project.doneTaskCount +
                    "/" +
                    project.taskCount
                  }
                />
                <Metric
                  label="Sprints"
                  value={
                    project.completedSprintCount +
                    "/" +
                    project.sprintCount
                  }
                />
                <Metric
                  label="Releases"
                  value={
                    project.shippedReleaseCount +
                    "/" +
                    project.releaseCount
                  }
                />
              </div>

              <p className="mb-0 mt-4 text-sm text-body">
                Final delivery:{" "}
                <strong>
                  {project.latestSubmission?.status ??
                    "Not started"}
                </strong>
              </p>
            </article>
          ))}
        </div>
      )}

      <ProjectAdminPagination
        basePath={readinessPath}
        query={query}
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
      />
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-muted px-3 py-2">
      <p className="m-0 text-xs font-semibold text-muted-foreground">
        {label}
      </p>
      <p className="mb-0 mt-1 text-sm font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}
