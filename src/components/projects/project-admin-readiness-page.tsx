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
        description="Execution completion and final-delivery readiness across project workspaces."
      />
      <p className="text-sm text-body">See whether each team is ready to submit, and override the gate when you need to.</p>
      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Active overrides ({activeOverrides.length})</h2>
          <a href={"/api/projects/readiness-overrides/export?collegeId=" + encodeURIComponent(collegeId)}
            className="min-h-10 rounded-md border border-border px-3 py-2 text-sm font-semibold text-primary-text">
            Export overrides CSV
          </a>
        </div>
        {!activeOverrides.length ? <p className="mt-3 text-sm text-muted-foreground">
          No workspace currently has a manual override — every gate is running on its own completion state.
        </p> : <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead><tr className="border-b border-border text-xs text-muted-foreground">
              <th className="p-2">Workspace</th><th className="p-2">Override</th>
              <th className="p-2">Note</th><th className="p-2">By</th>
              <th className="p-2">At</th><th className="p-2">Action</th>
            </tr></thead>
            <tbody>{activeOverrides
              .filter(row => !query.q || row.workspace.toLowerCase().includes(query.q.toLowerCase()))
              .map(row => <tr key={row.projectId} className="border-b border-border">
                <td className="p-2">{row.workspace}</td>
                <td className="p-2">{row.direction}</td>
                <td className="max-w-xs break-words p-2">{row.note}</td>
                <td className="p-2">{row.by}</td>
                <td className="p-2">{new Intl.DateTimeFormat("en-IN", {
                  dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata",
                }).format(row.at)}</td>
                <td className="p-2"><Link className="font-semibold text-primary-text underline"
                  href={basePath + "/" + row.projectId + "/readiness"}>Manage</Link></td>
              </tr>)}
            </tbody>
          </table>
        </div>}
      </section>
      <section className="space-y-3 rounded-xl border border-border bg-surface p-5">
        <h2 className="text-base font-semibold">Select workspace</h2>
        <AdminReadinessWorkspacePicker items={workspaceChoices} selected={selected} action={readinessPath}/>
        {selected ? <>
          <Link href={basePath+"/"+selected+"/readiness"} className="text-sm font-semibold text-primary-text underline">
            Manage override
          </Link>
          <h3 className="text-sm font-semibold">Releases</h3>
          {!releaseContext.length ? <p className="text-sm text-muted-foreground">No releases recorded.</p> :
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead><tr className="border-b border-border text-muted-foreground">
                  <th className="p-2">Release</th><th className="p-2">Status</th>
                  <th className="p-2">Sprints</th><th className="p-2">Points</th>
                  <th className="p-2">Target date</th>
                </tr></thead>
                <tbody>{releaseContext.map(release=><tr key={release.id} className="border-b border-border">
                  <td className="p-2 font-semibold">{release.title}</td>
                  <td className="p-2">{release.status==="SHIPPED"?"Shipped":
                    release.status==="IN_PROGRESS"?"In progress":"Planned"}</td>
                  <td className="p-2">{release.completedSprints}/{release.sprintCount}</td>
                  <td className="p-2">{release.points}</td>
                  <td className="p-2">{release.targetDate??"—"}</td>
                </tr>)}</tbody>
              </table>
            </div>}
        </> : null}
      </section>
      <ProjectAdminFilters query={query} />

      {!result.items.length ? (
        <section className="rounded-xl border border-border bg-surface p-6 text-sm text-muted-foreground">
          No project workspaces match these filters.
        </section>
      ) : (
        <div className="space-y-3">
          {result.items.map((project) => (
            <article
              key={project.id}
              className="rounded-xl border border-border bg-surface p-5"
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
