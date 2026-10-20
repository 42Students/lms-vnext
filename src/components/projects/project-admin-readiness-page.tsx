import { EmptyState } from "@/components/ui/empty-state";
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
import { PageBackLink } from "@/components/ui/page-back-link";
import { ErrorState } from "@/components/ui/error-state";
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
  searchParams,
}: {
  collegeId: string;
  basePath: string;
  eyebrow?: string;
  searchParams: Record<
    string,
    string | string[] | undefined
  >;
}) {
  const context = await getCurrentRequestContext();
  const pageValue=one(searchParams.page);
  const sizeValue=one(searchParams.pageSize);
  const statusValue=one(searchParams.status);
  const validPage=pageValue===undefined||(/^[1-9][0-9]*$/.test(pageValue)&&Number.isSafeInteger(Number(pageValue)));
  const validSize=sizeValue===undefined||["10","20","25","50","100"].includes(sizeValue);
  const validStatus=statusValue===undefined||statusValue===""||
    ["PLANNED","ACTIVE","COMPLETED","ARCHIVED"].includes(statusValue);
  if(!validPage||!validSize||!validStatus)return <div className="min-w-0 space-y-6">
    <PageHeader title="Submission readiness" actions={<PageBackLink href={basePath} label="Project workspaces" />}/>
    <ProjectAdminNav basePath={basePath} active="readiness" />
    <ErrorState title="Invalid readiness filters"
      description="Review the workspace status, page or rows filters. No workspace records were loaded."
      action={<Link href={basePath+"/readiness"} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Clear filters</Link>}/>
  </div>;
  const query: ProjectAdminCollectionQuery = {
    q: one(searchParams.q),
    status: one(searchParams.status) as ProjectAdminCollectionQuery["status"],
    page: Number(one(searchParams.page) ?? 1),
    pageSize: Number(
      one(searchParams.pageSize) ?? 25,
    ),
  };
  const read = await Promise.all([
    listProjectAdminSnapshots(context, collegeId, query),
    listCollegeActiveReadinessOverrides(context, collegeId),
    listCollegeReadinessWorkspaceChoices(context,collegeId),
  ]).then(value => ({ ok: true as const, value }))
    .catch(() => ({ ok: false as const }));
  if (!read.ok) return <div className="min-w-0 space-y-6">
    <PageHeader title="Submission readiness"
      description="Execution completion and final-delivery readiness across project workspaces."
      actions={<PageBackLink href={basePath} label="Project workspaces" />} />
    <ProjectAdminNav basePath={basePath} active="readiness" />
    <ErrorState title="Submission readiness unavailable"
      description="The readiness workspaces could not be loaded. Choose the selected college and retry."
      action={<Link href={basePath+"/readiness"} className="inline-flex min-h-11 items-center text-primary-text underline md:min-h-9">Retry readiness</Link>} />
  </div>;
  const [result, activeOverrides, workspaceChoices] = read.value;
  const chosenId=z.string().uuid().safeParse(one(searchParams.projectId) ?? one(searchParams.workspaceId)).data;
  const selected=chosenId && workspaceChoices.some(item=>item.id===chosenId)?chosenId:null;
  const outsideScope=Boolean(chosenId&&!selected);
  const releaseContext=selected?await listCollegeReadinessReleases(context,collegeId,selected):[];
  const readinessPath =
    basePath + "/readiness";

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Submission readiness"
        description="Execution completion and final-delivery readiness across project workspaces. See whether each team is ready to submit, and override the gate when you need to."
        actions={<div className="flex min-w-0 flex-wrap items-center gap-2 md:justify-end">
          <PageBackLink href={basePath} label="Project workspaces" />
          <a href={"/api/projects/readiness-overrides/export?collegeId=" + encodeURIComponent(collegeId)}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3.5 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9 md:w-auto">Export overrides CSV</a></div>}
      />
      <ProjectAdminNav basePath={basePath} active="readiness" />
      <section className="border-b border-border pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-foreground">Active overrides ({activeOverrides.length})</h2>
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
          empty={<EmptyState title="No matching overrides" description="No workspace overrides match these filters." />}
        />}
      </section>
      <section className="space-y-3 border-b border-border pb-5">
        <h2 className="text-base font-semibold text-foreground">Select workspace</h2>
        {outsideScope ? <Banner tone="warning" role="alert">This workspace belongs to a different college — switch colleges in the header and try again.</Banner> : null}
        <AdminReadinessWorkspacePicker items={workspaceChoices} selected={selected} action={readinessPath}/>
        {selected ? <>
          <Link href={basePath+"/"+selected+"/readiness"} className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
            Manage override
          </Link>
          <h3 className="text-sm font-semibold">Releases</h3>
          {!releaseContext.length ? <EmptyState title="No releases recorded" description="There are no releases for this workspace yet."/> :
            <DataTable<(typeof releaseContext)[number]>
              caption="Readiness releases"
              rows={releaseContext}
              getRowKey={release=>release.id}
              columns={[
                {key:"release",header:"Release",mobilePriority:"primary",cell:release=>release.title},
                {key:"status",header:"Status",mobilePriority:"secondary",cell:release=><StatusBadge tone={release.status==="SHIPPED"?"success":release.status==="IN_PROGRESS"?"info":"neutral"}>{release.status==="SHIPPED"?"Shipped":release.status==="IN_PROGRESS"?"In progress":"Planned"}</StatusBadge>},
                {key:"sprints",header:"Sprints",mobilePriority:"secondary",cell:release=>release.completedSprints+"/"+release.sprintCount},
                {key:"points",header:"Points",mobilePriority:"secondary",cell:release=>release.points},
                {key:"target",header:"Target date",mobilePriority:"secondary",cell:release=>release.targetDate??"—"},
              ]}
              empty={<EmptyState title="No releases recorded" description="This workspace has no recorded releases." />}
            />}
        </> : null}
      </section>
      <ProjectAdminFilters query={query} />
      <ListToolbar label="Readiness workspaces" viewCount={result.total} />

      {!result.items.length ? (
        <EmptyState title="No matching project workspaces" description="No project workspaces match these filters."/>
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

              <div className="mt-4 grid min-w-0 grid-cols-1 divide-y divide-border border-y border-border md:grid-cols-2 md:divide-x md:divide-y-0 min-[1366px]:grid-cols-4">
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
    <div className="min-w-0 px-3 py-3">
      <p className="m-0 text-xs font-semibold text-muted-foreground">
        {label}
      </p>
      <p className="mb-0 mt-1 text-sm font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}
