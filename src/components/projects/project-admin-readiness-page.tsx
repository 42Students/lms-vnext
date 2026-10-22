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
import {MetricBar} from "@/components/ui/metric-bar";
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
  const pageValue=one(searchParams["page"]);
  const sizeValue=one(searchParams["pageSize"]);
  const statusValue=one(searchParams["status"]);
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
  const searchQuery = one(searchParams["q"]);
  const selectedStatus = one(searchParams["status"]) as ProjectAdminCollectionQuery["status"];
  const query: ProjectAdminCollectionQuery = {
    ...(searchQuery !== undefined ? { q: searchQuery } : {}),
    ...(selectedStatus !== undefined ? { status: selectedStatus } : {}),
    page: Number(one(searchParams["page"]) ?? 1),
    pageSize: Number(one(searchParams["pageSize"]) ?? 25),
  };
  // Independent fetches: one failed overrides/choice read must not masquerade
  // as an empty successful response or disable the main readiness list.
  const [snapshotsResult,overridesResult,choicesResult] = await Promise.allSettled([
    listProjectAdminSnapshots(context, collegeId, query),
    listCollegeActiveReadinessOverrides(context, collegeId),
    listCollegeReadinessWorkspaceChoicePage(context,collegeId,{page:1,search:""}),
  ]);
  if (snapshotsResult.status!=="fulfilled") return <div className="min-w-0 space-y-4">
    <PageHeader title="Submission readiness"
      description="Execution completion and final-delivery readiness across project workspaces."
      actions={<PageBackLink href={basePath} label="Project workspaces" />} />
    <ProjectAdminNav basePath={basePath} active="readiness" />
    <ErrorState title="Submission readiness unavailable"
      description="Couldn't load workspaces. Check the selected college and retry."
      action={<Link href={basePath+"/readiness"} className="inline-flex min-h-11 items-center text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary)] md:min-h-9">Retry readiness</Link>} />
  </div>;
  const result=snapshotsResult.value;
  const overridesFailed=overridesResult.status!=="fulfilled";
  const choicesFailed=choicesResult.status!=="fulfilled";
  const activeOverrides=overridesResult.status==="fulfilled"?overridesResult.value:[];
  const workspaceChoices=choicesResult.status==="fulfilled"?choicesResult.value:
    {items:[],total:0,page:1,pageSize:25,totalPages:1};
  const requested=one(searchParams["projectId"])??one(searchParams["workspaceId"]);
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
  const selectedHasFinalSubmission=Boolean(selectedReadiness?.finalSubmission.latest &&
    selectedReadiness.finalSubmission.latest.status!=="DRAFT");
  const releaseUnavailable=releasesRead?.status==="rejected";
  const releaseContext=releasesRead?.status==="fulfilled"?releasesRead.value:[];
  const readinessPath=basePath+"/readiness";
  const rawOverridesPage=one(searchParams["overridePage"])??"1";
  const overridePage=/^[1-9][0-9]*$/.test(rawOverridesPage)&&Number.isSafeInteger(Number(rawOverridesPage))
    ?Math.min(Number(rawOverridesPage),10000):1;
  const matchingOverrides=activeOverrides.filter(row=>!query.q||
    row.workspace.toLowerCase().includes(query.q.toLowerCase()));
  const overrideTotalPages=Math.max(1,Math.ceil(matchingOverrides.length/25));
  const currentOverridePage=Math.min(overridePage,overrideTotalPages);
  const visibleOverrides=matchingOverrides.slice((currentOverridePage-1)*25,currentOverridePage*25);
  const overridePageHref=(page:number)=>{
    const params=new URLSearchParams();
    for(const name of ["q","status","page","pageSize","projectId","workspaceId"] as const){
      const value=one(searchParams[name]);
      if(value&&value.length<=120)params.set(name,value);
    }
    params.set("overridePage",String(page));
    return readinessPath+"?"+params.toString();
  };
  const exportHref="/api/projects/readiness-overrides/export?collegeId="+
    encodeURIComponent(collegeId)+"&projectIds="+
    encodeURIComponent(visibleOverrides.map(row=>row.projectId).join(","));

  return (
    <div className="min-w-0 max-w-[1040px] space-y-4">
      <div className="min-w-0">
        <PageBackLink href={basePath} label="Project workspaces" />
        <PageHeader title="Submission readiness"
          description="See whether each team is ready to submit, and override the gate when you need to." />
      </div>
      <ProjectAdminNav basePath={basePath} active="readiness" />
      <Disclosure title={<span className="flex items-center gap-2">Active overrides <Badge tone={activeOverrides.length?"warning":"neutral"}>{activeOverrides.length}</Badge></span>} defaultOpen={activeOverrides.length>0} className="border-b border-border pb-4" contentClassName="min-w-0 pt-3">
        {overridesFailed ? <Banner role="alert" tone="warning">
          Active overrides could not be loaded. Retry readiness before relying on this list.
        </Banner> : !activeOverrides.length ? <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-success-text">
          <svg aria-hidden="true" className="size-4 shrink-0" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9"/><path d="m7 12 3 3 7-7"/>
          </svg>
          No workspace currently has a manual override
        </p> : <DataTable<(typeof activeOverrides)[number]>
          caption="Active overrides"
          rows={visibleOverrides}
          getRowKey={row=>row.projectId}
          columns={[
            {key:"workspace",header:"Workspace",mobilePriority:"primary",cell:row=><span className="flex flex-wrap items-center gap-2">{row.workspace}{row.archived?<StatusBadge tone="neutral">Archived</StatusBadge>:null}</span>},
            {key:"direction",header:"Override",mobilePriority:"secondary",cell:row=><StatusBadge tone={row.overrideValue?"success":"warning"}>{row.overrideValue?"✓ Force unlocked":"! Force blocked"}</StatusBadge>},
            {key:"note",header:"Note",mobilePriority:"secondary",cell:row=>row.note},
            {key:"by",header:"By",mobilePriority:"secondary",cell:row=>row.by},
            {key:"at",header:"At",mobilePriority:"secondary",cell:row=>new Intl.DateTimeFormat("en-IN",{
              dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
            }).format(row.at)},
            {key:"action",header:"Action",mobilePriority:"action",cell:row=><Link
              className="inline-flex min-h-11 items-center font-semibold text-primary-text underline"
              href={readinessPath+"?projectId="+encodeURIComponent(row.projectId)+"#manual-override"}>Manage</Link>},
          ]}
          empty={<EmptyState title="No matching overrides" description="No workspace overrides match these filters." />}
        />}
        {matchingOverrides.length>25?<nav aria-label="Active override pages" className="mt-3 flex items-center justify-between gap-2 text-sm">
          <span>Page {currentOverridePage} of {overrideTotalPages}</span>
          <div className="flex gap-3">{currentOverridePage>1?<Link href={overridePageHref(currentOverridePage-1)} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Previous</Link>:null}
            {currentOverridePage<overrideTotalPages?<Link href={overridePageHref(currentOverridePage+1)} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Next</Link>:null}</div>
        </nav>:null}
      </Disclosure>
      <div className="flex min-w-0 flex-wrap items-center justify-end">
        {visibleOverrides.length&&!overridesFailed?<a download href={exportHref}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3.5 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.8" className="size-4"><path d="M12 3v12m-4-4 4 4 4-4M4 17v3h16v-3"/></svg>
          Export displayed page CSV
        </a>:<span aria-disabled="true" className="inline-flex min-h-11 cursor-not-allowed items-center rounded-[var(--lms-control-radius)] border border-border px-3.5 text-sm text-muted-foreground opacity-60 md:min-h-9">
          Export displayed page CSV
        </span>}
      </div>
      <Disclosure title="Select workspace" className="border-b border-border pb-4" defaultOpen contentClassName="space-y-3 pt-3">
        {choicesFailed?<Banner tone="warning" role="alert">
          Workspace choices could not be loaded. Retry readiness to select a workspace.
        </Banner>:null}
        {outsideScope ? <Banner tone="warning" role="alert">
          This workspace could not be found in the selected college. Check its
          ID or slug, or switch colleges in the header and try again.
        </Banner> : null}
        {!selected?<Banner tone="info">Select a workspace to see current readiness,
          its releases and any manual override. Choose a college workspace below.
        </Banner>:null}
        {!choicesFailed?<AdminReadinessWorkspacePicker key={selected??"no-selection"}
          items={pickerChoices} selected={selected} action={readinessPath}
          collegeId={collegeId} initialTotal={workspaceChoices.total}/>:null}
        {selected ? <>
          <Link href={readinessPath+"?projectId="+encodeURIComponent(selected)+"#manual-override"} className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
            Manage override
          </Link>
          <section aria-label="Current readiness" className="space-y-3 border-y border-border py-4">
            <h3 className="text-base font-semibold">Current readiness</h3>
            {selectedReadiness?<>
              <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-xs font-semibold text-body">State</dt>
                  <dd className="mt-1 font-semibold">{
                    selectedHasFinalSubmission?"Submission already exists":
                    selectedReadiness.readinessOverride.state==="FORCE_UNLOCK"?"Ready (manual)":
                    selectedReadiness.readinessOverride.state==="FORCE_BLOCK"?"Not ready (manual)":
                    effectiveProjectSubmissionReady(selectedReadiness.execution.complete,null)?"Ready":"Not ready"
                  }</dd></div>
                <div><dt className="text-xs font-semibold text-body">Reason</dt>
                  <dd className="mt-1 whitespace-pre-wrap">{
                    (selectedHasFinalSubmission?
                       "An existing final submission takes precedence over manual overrides.":
                       selectedReadiness.readinessOverride.note)??
                    (selectedReadiness.execution.complete?"All tasks and sprints are complete":
                      "Incomplete tasks or sprints")
                  }</dd></div>
                <div><dt className="text-xs font-semibold text-body">Submission status</dt>
                  <dd className="mt-1">{selectedReadiness.finalSubmission.latest?.status??"Not submitted"}</dd></div>
                <div><dt className="text-xs font-semibold text-body">Tasks completed</dt>
                  <dd className="mt-1">{selectedReadiness.execution.tasks.done} / {selectedReadiness.execution.tasks.total}</dd></div>
                <div><dt className="text-xs font-semibold text-body">Sprints completed</dt>
                  <dd className="mt-1">{selectedReadiness.execution.sprints.completed} / {selectedReadiness.execution.sprints.total}</dd></div>
                <div><dt className="text-xs font-semibold text-body">Releases shipped</dt>
                  <dd className="mt-1">{selectedReadiness.execution.releases.shipped} / {selectedReadiness.execution.releases.total}</dd></div>
                <div><dt className="text-xs font-semibold text-body">Override active</dt>
                  <dd className="mt-1">{selectedReadiness.readinessOverride.state?"Yes":"No"}</dd></div>
                <div><dt className="text-xs font-semibold text-body">Override note</dt>
                  <dd className="mt-1 whitespace-pre-wrap">{selectedReadiness.readinessOverride.note||"—"}</dd></div>
                <div><dt className="text-xs font-semibold text-body">Set by / at</dt>
                  <dd className="mt-1">{selectedReadiness.readinessOverride.overriddenBy||"—"}
                  {" · "}{selectedReadiness.readinessOverride.occurredAt?
                    new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",
                      timeZone:"Asia/Kolkata"}).format(new Date(selectedReadiness.readinessOverride.occurredAt)):"—"}</dd></div>
              </dl>
              <div className="grid gap-3 border-t border-border pt-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-body">Task completion</p>
                  <MetricBar role="progressbar" label="Task completion" maximum={100}
                    value={selectedReadiness.execution.tasks.total?
                      Math.round(100*selectedReadiness.execution.tasks.done/
                        selectedReadiness.execution.tasks.total):0}/>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-body">Sprint completion</p>
                  <MetricBar role="progressbar" label="Sprint completion" maximum={100}
                    value={selectedReadiness.execution.sprints.total?
                      Math.round(100*selectedReadiness.execution.sprints.completed/
                        selectedReadiness.execution.sprints.total):0}/>
                </div>
              </div>
              <p className="text-xs text-body">
                Task and sprint completion drive the server-side readiness gate.
                Release progress is shown separately for planning context.
              </p>
            </>:<ErrorState title="Readiness could not be loaded"
              description="The selected workspace's readiness could not be loaded. Retry the workspace; previous readiness values are not shown."
              action={<Link href={readinessPath+"?projectId="+encodeURIComponent(selected)}
                className="text-link underline">Retry readiness</Link>}/>}
          </section>
          <h3 className="text-sm font-semibold">Releases</h3>
          {releaseUnavailable?<Banner tone="warning" role="alert">Couldn't load releases. Retry this page to review release readiness.</Banner>:
           !releaseContext.length ? <EmptyState title="No releases defined" description="No releases defined on this project."/> :
            <DataTable<(typeof releaseContext)[number]>
              caption="Readiness releases"
              rows={releaseContext}
              getRowKey={release=>release.id}
              columns={[
                {key:"release",header:"Release",mobilePriority:"primary",cell:release=>release.title},
                {key:"status",header:"Status",mobilePriority:"secondary",cell:release=><StatusBadge tone={release.status==="SHIPPED"?"success":release.status==="IN_PROGRESS"?"info":"neutral"}>{release.status==="SHIPPED"?"Shipped":release.status==="IN_PROGRESS"?"In progress":"Planned"}</StatusBadge>},
                {key:"sprints",header:"Sprints",mobilePriority:"secondary",cell:release=>release.completedSprints+"/"+release.sprintCount},
                {key:"points",header:"Points",mobilePriority:"secondary",cell:release=>
                  release.completedPoints+"/"+release.committedPoints},
                {key:"target",header:"Target date",mobilePriority:"secondary",cell:release=>release.targetDate??"—"},
              ]}
              empty={<EmptyState title="No releases recorded" description="This workspace has no recorded releases." />}
            />}
        </> : null}
      </Disclosure>
      {selected && selectedReadiness?<section id="manual-override" aria-label="Manual override" className="scroll-mt-24 space-y-3 border-t border-border pt-4">
        <h2 className="text-lg font-semibold text-foreground">Manual override</h2>
        <p className="text-sm text-muted-foreground">The override changes submission gating and is recorded in the project audit trail.</p>
        <ProjectReadinessOverrideForm projectId={selected}
          initialState={selectedReadiness.readinessOverride.state}
          initialNote={selectedReadiness.readinessOverride.note}
          hasSubmission={selectedReadiness.finalSubmission.latest!==null} compactLayout/>
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
