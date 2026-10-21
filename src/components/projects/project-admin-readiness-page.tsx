import { EmptyState } from "@/components/ui/empty-state";
import {AdminReadinessWorkspacePicker} from "./admin-readiness-workspace-picker";
import Link from "next/link";
import { listCollegeActiveReadinessOverrides } from "@/modules/projects/admin-readiness-overrides-service";
import {listCollegeReadinessWorkspaceChoices,listCollegeReadinessReleases,
 resolveCollegeReadinessWorkspaceId} from "@/modules/projects/college-readiness-releases-service";
import {requireProjectManageAccess} from "@/modules/projects/access";
import {getProjectReadiness} from "@/modules/projects/readiness-service";
import {effectiveProjectSubmissionReady} from "@/modules/projects/readiness-override-model";
import {ProjectReadinessOverrideForm} from "./project-readiness-override-form";
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
import { FilterBar } from "@/components/ui/filter-bar";
import { Disclosure } from "@/components/ui/disclosure";
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
  if(!validPage||!validSize||!validStatus)return <div className="min-w-0 space-y-4">
    <PageHeader title="Submission readiness" actions={<PageBackLink href={basePath} label="Project workspaces" />}/>
    <ProjectAdminNav basePath={basePath} active="readiness" />
    <ErrorState title="Invalid readiness filters"
      description="Review the workspace status, page or rows filters. No workspace records were loaded."
      action={<Link href={basePath+"/readiness"} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary)] md:min-h-9">Clear filters</Link>}/>
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
  if (!read.ok) return <div className="min-w-0 space-y-4">
    <PageHeader title="Submission readiness"
      description="Execution completion and final-delivery readiness across project workspaces."
      actions={<PageBackLink href={basePath} label="Project workspaces" />} />
    <ProjectAdminNav basePath={basePath} active="readiness" />
    <ErrorState title="Submission readiness unavailable"
      description="Couldn't load workspaces. Check the selected college and retry."
      action={<Link href={basePath+"/readiness"} className="inline-flex min-h-11 items-center text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary)] md:min-h-9">Retry readiness</Link>} />
  </div>;
  const [result, activeOverrides, workspaceChoices] = read.value;
  const requested=one(searchParams.projectId)??one(searchParams.workspaceId);
  const chosenId=requested?await resolveCollegeReadinessWorkspaceId(
    context,collegeId,requested).catch(()=>null):null;
  const selectedScope=chosenId?await requireProjectManageAccess(context,chosenId)
    .then(scope=>scope.collegeId===collegeId?scope:null).catch(()=>null):null;
  const selected=selectedScope?.project.id??null;
  const outsideScope=Boolean(requested&&!selected);
  const pickerChoices=selectedScope&&!workspaceChoices.some(item=>item.id===selected)
    ?[{id:selectedScope.project.id,title:selectedScope.project.title,
      status:selectedScope.project.status},...workspaceChoices]:workspaceChoices;
  const [readinessRead,releasesRead]=selected?await Promise.allSettled([
    getProjectReadiness(context,selected),
    listCollegeReadinessReleases(context,collegeId,selected),
  ]):[null,null];
  const selectedReadiness=readinessRead?.status==="fulfilled"?readinessRead.value:null;
  const releaseUnavailable=releasesRead?.status==="rejected";
  const releaseContext=releasesRead?.status==="fulfilled"?releasesRead.value:[];
  const readinessPath=basePath+"/readiness";
  const rawOverridesPage=one(searchParams.overridePage)??"1";
  const overridePage=/^[1-9][0-9]*$/.test(rawOverridesPage)&&Number.isSafeInteger(Number(rawOverridesPage))
    ?Math.min(Number(rawOverridesPage),10000):1;
  const matchingOverrides=activeOverrides.filter(row=>!query.q||
    row.workspace.toLowerCase().includes(query.q.toLowerCase()));
  const overrideTotalPages=Math.max(1,Math.ceil(matchingOverrides.length/25));
  const currentOverridePage=Math.min(overridePage,overrideTotalPages);
  const visibleOverrides=matchingOverrides.slice((currentOverridePage-1)*25,currentOverridePage*25);

  return (
    <div className="min-w-0 space-y-4">
      <div className="min-w-0">
        <PageBackLink href={basePath} label="Project workspaces" />
        <PageHeader title="Submission readiness"
          description="Execution completion and final-delivery readiness across project workspaces. See whether each team is ready to submit, and override the gate when you need to." />
      </div>
      <ProjectAdminNav basePath={basePath} active="readiness" />
      <Disclosure title={"Active overrides ("+activeOverrides.length+")"} defaultOpen={activeOverrides.length>0} className="border-b border-border pb-4" contentClassName="min-w-0 pt-3">
        {!activeOverrides.length ? <p className="mt-3 text-sm text-muted-foreground">
          No workspace currently has a manual override — every gate is running on its own completion state.
        </p> : <DataTable<(typeof activeOverrides)[number]>
          caption="Active overrides"
          rows={visibleOverrides}
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
        {matchingOverrides.length>25?<nav className="mt-3 flex flex-wrap items-center gap-3 text-sm"
          aria-label="Override pages">
          <span>Page {currentOverridePage} of {overrideTotalPages} · {matchingOverrides.length} matching overrides</span>
          <Link href={readinessPath+"?overridePage="+Math.max(1,currentOverridePage-1)}
            className="text-link underline">Previous</Link>
          <Link href={readinessPath+"?overridePage="+Math.min(overrideTotalPages,currentOverridePage+1)}
            className="text-link underline">Next</Link>
        </nav>:null}
      </Disclosure>
      <Disclosure title="Select workspace" className="border-b border-border pb-4" defaultOpen contentClassName="space-y-3 pt-3">
        {outsideScope ? <Banner tone="warning" role="alert">
          This workspace could not be found in the selected college. Check its
          ID or slug, or switch colleges in the header and try again.
        </Banner> : null}
        {!selected?<Banner tone="info">Select a workspace to see current readiness,
          its releases and any manual override. Choose a college workspace below.
        </Banner>:null}
        <AdminReadinessWorkspacePicker key={selected??"no-selection"}
          items={pickerChoices} selected={selected} action={readinessPath}/>
        {selected ? <>
          <Link href={basePath+"/"+selected+"/readiness"} className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
            Manage override
          </Link>
          <section aria-label="Current readiness" className="space-y-3 border-y border-border py-4">
            <h3 className="text-base font-semibold">Current readiness</h3>
            {selectedReadiness?<>
              <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                <div><dt className="text-xs font-semibold text-body">State</dt>
                  <dd className="mt-1 font-semibold">{
                    selectedReadiness.readinessOverride.state==="FORCE_UNLOCK"?"Ready (manual)":
                    selectedReadiness.readinessOverride.state==="FORCE_BLOCK"?"Not ready (manual)":
                    effectiveProjectSubmissionReady(selectedReadiness.execution.complete,null)?"Ready":"Not ready"
                  }</dd></div>
                <div><dt className="text-xs font-semibold text-body">Reason</dt>
                  <dd className="mt-1 whitespace-pre-wrap">{
                    selectedReadiness.readinessOverride.note??
                    (selectedReadiness.execution.complete?"All tasks and sprints are complete":
                      "Incomplete tasks or sprints")
                  }</dd></div>
                <div><dt className="text-xs font-semibold text-body">Submission status</dt>
                  <dd className="mt-1">{selectedReadiness.finalSubmission.latest?.status??"Not submitted"}</dd></div>
              </dl>
              <p className="text-xs text-body">
                Tasks {selectedReadiness.execution.tasks.done}/{selectedReadiness.execution.tasks.total}
                {" · "}Sprints {selectedReadiness.execution.sprints.completed}/{selectedReadiness.execution.sprints.total}
              </p>
            </>:<ErrorState title="Readiness could not be loaded"
              description="The selected workspace's readiness could not be loaded. Retry the workspace; previous readiness values are not shown."
              action={<Link href={readinessPath+"?projectId="+encodeURIComponent(selected)}
                className="text-link underline">Retry readiness</Link>}/>}
          </section>
          <section className="space-y-2">
            <h3 className="text-base font-semibold">Releases</h3>
            <p className="text-xs text-body">
              Releases are context only; shipping them does not block submission readiness.
            </p>
            {releaseUnavailable?<ErrorState title="Couldn't load releases"
              description="Release details are unavailable. Current readiness remains accessible."
              action={<Link href={readinessPath+"?projectId="+encodeURIComponent(selected)}
                className="text-link underline">Retry releases</Link>}/>:null}
          </section>
          {!releaseUnavailable&&!releaseContext.length ? <EmptyState title="No releases recorded" description="There are no releases for this workspace yet."/> :!releaseUnavailable?
            <DataTable<(typeof releaseContext)[number]>
              caption="Readiness releases"
              rows={releaseContext}
              getRowKey={release=>release.id}
              columns={[
                {key:"release",header:"Release",mobilePriority:"primary",cell:release=>release.title},
                {key:"status",header:"Status",mobilePriority:"secondary",cell:release=><StatusBadge tone={release.status==="SHIPPED"?"success":release.status==="IN_PROGRESS"?"info":"neutral"}>{release.status==="SHIPPED"?"Shipped":release.status==="IN_PROGRESS"?"In progress":"Planned"}</StatusBadge>},
                {key:"sprints",header:"Sprints",mobilePriority:"secondary",cell:release=>release.completedSprints+"/"+release.sprintCount},
                {key:"points",header:"Points",mobilePriority:"secondary",cell:release=>release.completedPoints+"/"+release.committedPoints},
                {key:"target",header:"Target date",mobilePriority:"secondary",cell:release=>release.targetDate??"—"},
              ]}
              empty={<EmptyState title="No releases recorded" description="This workspace has no recorded releases." />}
            />:null}
          {selectedReadiness?<section className="space-y-3 border-t border-border pt-4">
            <h3 className="text-base font-semibold">Manual override</h3>
            <ProjectReadinessOverrideForm
              key={selected+":"+selectedScope?.project.updatedAt.toISOString()}
              projectId={selected}
              initialState={selectedReadiness.readinessOverride.state}
              initialNote={selectedReadiness.readinessOverride.note}
              hasSubmission={Boolean(selectedReadiness.finalSubmission.latest)}
              compactLayout/>
          </section>:null}
        </> : null}
      </Disclosure>
      <div className="flex min-w-0 flex-wrap items-center justify-end">
      <a href={"/api/projects/readiness-overrides/export?collegeId=" + encodeURIComponent(collegeId)}
        className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3.5 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Export overrides CSV</a>
      </div>
      <FilterBar title="Filters"><ProjectAdminFilters query={query} /></FilterBar>
      <ListToolbar label="Readiness workspaces" viewCount={result.total} />

      {!result.items.length ? (
        <EmptyState title="No matching project workspaces" description="No project workspaces match these filters."
          action={<Link href={readinessPath} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Clear filters</Link>}/>
      ) : (
        <div className="min-w-0 space-y-2">
          {result.items.map((project) => (
            <article
              key={project.id}
              className="min-w-0 border-b border-border py-4 last:border-b-0"
            >
              <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Link
                    href={
                      basePath +
                      "/" +
                      project.id +
                      "/readiness"
                    }
                    className="inline-flex min-h-11 max-w-full items-center break-words text-base font-semibold text-foreground hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9"
                  >
                    {project.title}
                  </Link>

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

              <div className="mt-4 grid min-w-0 grid-cols-1 gap-x-4 gap-y-2 border-y border-border py-2 md:grid-cols-4">
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
    <div className="min-w-0 py-2">
      <p className="m-0 text-xs font-semibold text-muted-foreground">
        {label}
      </p>
      <p className="mb-0 mt-1 text-sm font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}
