import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import {getProjectReadiness} from "@/modules/projects/readiness-service";
import {ProjectReadinessOverrideForm} from "./project-readiness-override-form";
import {AdminReadinessWorkspacePicker} from "./admin-readiness-workspace-picker";
import Link from "next/link";
import { listCollegeActiveReadinessOverrides } from "@/modules/projects/admin-readiness-overrides-service";
import {listCollegeReadinessWorkspaceChoicePage,listCollegeReadinessReleases,
 resolveCollegeReadinessWorkspaceId} from "@/modules/projects/college-readiness-releases-service";
import {requireProjectManageAccess} from "@/modules/projects/access";
import {effectiveProjectSubmissionReady} from "@/modules/projects/readiness-override-model";
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
  const read = await Promise.allSettled([
    listProjectAdminSnapshots(context, collegeId, query),
    listCollegeActiveReadinessOverrides(context, collegeId),
    listCollegeReadinessWorkspaceChoicePage(context,collegeId,{page:1,search:""}),
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
  const pickerChoices=selectedScope&&!workspaceChoices.items.some(item=>item.id===selected)
    ?[{id:selectedScope.project.id,title:selectedScope.project.title,
      status:selectedScope.project.status},...workspaceChoices.items]:workspaceChoices.items;
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
    <div className="min-w-0 max-w-[1040px] space-y-4">
      <div className="min-w-0">
        <PageBackLink href={basePath} label="Project workspaces" />
        <PageHeader title="Submission readiness"
          description="See whether each team is ready to submit, and override the gate when you need to." />
      </div>
      <ProjectAdminNav basePath={basePath} active="readiness" />
      <Disclosure title={<span className="flex items-center gap-2">Active overrides <Badge tone={activeOverrides.length?"warning":"neutral"}>{activeOverrides.length}</Badge></span>} defaultOpen={activeOverrides.length>0} className="border-b border-border pb-4" contentClassName="min-w-0 pt-3">
        {!activeOverrides.length ? <p className="mt-3 text-sm text-muted-foreground">
          ✓ No workspace currently has a manual override
        </p> : <DataTable<(typeof activeOverrides)[number]>
          caption="Active overrides"
          rows={overrideRows}
          getRowKey={row=>row.projectId}
          columns={[
            {key:"workspace",header:"Workspace",mobilePriority:"primary",cell:row=>row.workspace},
            {key:"direction",header:"Override",mobilePriority:"secondary",cell:row=><StatusBadge tone={row.overrideValue?"success":"warning"}>{row.overrideValue?"✓ Force unlocked":"! Force blocked"}</StatusBadge>},
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
        {matchingOverrides.length>25?<nav aria-label="Active override pages" className="mt-3 flex items-center justify-between gap-2 text-sm">
          <span>Page {displayedOverridePage} of {overridePageCount}</span>
          <div className="flex gap-3">{displayedOverridePage>1?<Link href={overridePageHref(displayedOverridePage-1)} className="text-primary-text underline">Previous</Link>:null}
            {displayedOverridePage<overridePageCount?<Link href={overridePageHref(displayedOverridePage+1)} className="text-primary-text underline">Next</Link>:null}</div>
        </nav>:null}
      </Disclosure>
      <div className="flex min-w-0 flex-wrap items-center justify-end">
      <a aria-disabled={!matchingOverrides.length} href={matchingOverrides.length?"/api/projects/readiness-overrides/export?collegeId=" + encodeURIComponent(collegeId):undefined}
        className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3.5 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Export overrides CSV</a>
      </div>
      <Disclosure title="Select workspace" className="border-b border-border pb-4" defaultOpen contentClassName="space-y-3 pt-3">
        {outsideScope ? <Banner tone="warning" role="alert">
          This workspace could not be found in the selected college. Check its
          ID or slug, or switch colleges in the header and try again.
        </Banner> : null}
        {!selected?<Banner tone="info">Select a workspace to see current readiness,
          its releases and any manual override. Choose a college workspace below.
        </Banner>:null}
        <AdminReadinessWorkspacePicker key={selected??"no-selection"}
          items={pickerChoices} selected={selected} action={readinessPath}
          collegeId={collegeId} initialTotal={workspaceChoices.total}/>
        {selected ? <>
          {selectedProject?.status==="ARCHIVED"?<Banner tone="warning" role="status">This archived workspace is not in the active picker. You can still review its current manual override.</Banner>:null}
          <section aria-label="Current readiness" className="space-y-2 border-b border-border pb-3">
            <h3 className="text-sm font-semibold">Current readiness — {selectedProject?.title}</h3>
            <p className="text-sm">Workspace status: <strong>{selectedProject?.status}</strong></p>
            {currentReadiness?.error?<Banner tone="warning" role="alert">Couldn't load current readiness. Retry this page.</Banner>:
              currentReadiness?.data?<p className="text-sm">
                Execution: {currentReadiness.data.execution.complete?"Complete":"Incomplete"} ·
                Tasks: {currentReadiness.data.execution.tasks.done}/{currentReadiness.data.execution.tasks.total} ·
                Sprints: {currentReadiness.data.execution.sprints.completed}/{currentReadiness.data.execution.sprints.total}
              </p>:selectedSummary?<p className="text-sm">
                Execution: {selectedSummary.executionComplete?"Complete":"Incomplete"} · Progress: {selectedSummary.progressPercent}%
              </p>:null}
            <p className="text-sm">Manual override: {selectedOverride?selectedOverride.direction:"None"}</p>
          </section>
          <a href="#manual-override" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Manage override</a>
          <h3 className="text-sm font-semibold">Releases</h3>
          {releaseRead.error?<Banner tone="warning" role="alert">Couldn't load releases. Retry this page to review release readiness.</Banner>:
           !releaseContext.length ? <EmptyState title="No releases recorded" description="There are no releases for this workspace yet."/> :
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
      </Disclosure>
      {selected && currentReadiness?.data?<section id="manual-override" aria-label="Manual override" className="scroll-mt-24 space-y-3 border-t border-border pt-4">
        <h2 className="text-lg font-semibold text-foreground">Manual override</h2>
        <p className="text-sm text-muted-foreground">The override changes submission gating and is recorded in the project audit trail.</p>
        <ProjectReadinessOverrideForm projectId={selected}
          initialState={currentReadiness.data.readinessOverride.state}
          initialNote={currentReadiness.data.readinessOverride.note}
          hasSubmission={currentReadiness.data.finalSubmission.latest!==null} compactLayout/>
      </section>:null}
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
