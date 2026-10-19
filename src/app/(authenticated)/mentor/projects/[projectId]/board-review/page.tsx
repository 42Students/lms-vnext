import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {EmptyState} from "@/components/ui/empty-state";
import {mentorBoardReviewHref,mentorBoardReviewQuerySchema}
  from "@/modules/projects/mentor-board-review-model";
import {getMentorBoardReview} from "@/modules/projects/mentor-board-review-service";
import {singleValueMentorFilters} from "@/modules/projects/mentor-filter-query";
type Params={status?:string|string[];priority?:string|string[];
  sprintId?:string|string[];search?:string|string[];page?:string|string[]};
export default async function MentorBoardReviewPage({
  params,searchParams,
}:{params:Promise<{projectId:string}>;searchParams:Promise<Params>}){
  const [{projectId},raw]=await Promise.all([params,searchParams]);
  const normalized=singleValueMentorFilters({
    status:raw.status,priority:raw.priority,sprintId:raw.sprintId,
    search:raw.search,page:raw.page,
  });
  const validated=mentorBoardReviewQuerySchema.safeParse(
    normalized?{projectId,...normalized}:null,
  );
  if(!validated.success)return <section role="alert" className="space-y-3">
    <h1 className="text-[30px] font-semibold leading-[1.35] tracking-[-0.02em] text-[var(--lms-heading)]">Invalid board filters</h1>
    <Link href="/mentor/projects" className="inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Projects</Link>
  </section>;
  const data=await getMentorBoardReview(await getCurrentRequestContext(),validated.data);
  const base="/mentor/projects/"+encodeURIComponent(projectId);
  return <div className="min-w-0 max-w-full space-y-5">
    <PageHeader eyebrow="Mentor · Project" title="Task board status"
      description={data.enabled?data.projectTitle:"Projects access is disabled; no tasks were loaded."}
      actions={<Link href={base+"?tab=board"}
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 py-2 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        Full task workspace
      </Link>}/>
    {!data.enabled?
      <section role="status" className="border-b border-border pb-4">
        Projects access is disabled; no tasks were loaded.
      </section>:<>
      <section aria-label="Registered task counts" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {(["TODO","IN_PROGRESS","BLOCKED","IN_REVIEW","DONE"] as const).map(status=>
          <article key={status} className="rounded-xl border border-border bg-surface p-3">
            <h2 className="text-xs font-semibold text-muted-foreground">{status.replaceAll("_"," ")}</h2>
            <p className="mt-2 text-xl font-bold tabular-nums">{data.totals[status]}</p>
          </article>)}
      </section>
      <p className="text-sm text-body">{data.count} registered tasks ·
        {data.completedPercent===null?" Completion unknown (no tasks)":
          " "+data.completedPercent+"% recorded DONE tasks"}
      </p>
      <form method="get" action={base+"/board-review"}
        className="flex flex-wrap items-end gap-3 border-b border-border pb-4">
        <label className="grid gap-1 text-sm">Search tasks or sprints
          <Input type="search" name="search" maxLength={100} defaultValue={data.query.search}
            className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface p-2"/>
        </label>
        <label className="grid gap-1 text-sm">Status
          <Select name="status" defaultValue={data.query.status}
            className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface p-2">
            {(["ALL","TODO","IN_PROGRESS","BLOCKED","IN_REVIEW","DONE"] as const).map(state=>
              <option key={state} value={state}>{state.replaceAll("_"," ")}</option>)}
          </Select>
        </label>
        <label className="grid gap-1 text-sm">Priority
          <Select name="priority" defaultValue={data.query.priority??"ALL"}
            className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface p-2">
            {(["ALL","LOW","MEDIUM","HIGH","CRITICAL"] as const).map(value=>
              <option key={value} value={value}>{value}</option>)}
          </Select>
        </label>
        <label className="grid gap-1 text-sm">Sprint
          <Select name="sprintId" defaultValue={data.query.sprintId??"ALL"}
            className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface p-2">
            <option value="ALL">All sprints</option>
            {data.sprints.map(s=><option key={s.id} value={s.id}>{s.title}</option>)}
          </Select>
        </label>
        <Button type="submit" variant="primary">
          Filter
        </Button>
        <Link href={base+"/board-review"} className="inline-flex min-h-11 items-center px-3 py-2 text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Clear</Link>
      </form>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link href={"/api/projects/"+encodeURIComponent(projectId)+"/mentor-board-export"+
          (mentorBoardReviewHref({...data.query,page:1}).split("?")[1]?
            "?"+mentorBoardReviewHref({...data.query,page:1}).split("?")[1]:"")}
          download className="min-h-11 rounded-[var(--lms-control-radius)] border border-border px-4 py-2 font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          Download filtered CSV (max 500)
        </Link>
        {data.exportOmitted>0?<span role="status">
          CSV omits {data.exportOmitted} matching tasks beyond the export cap.
        </span>:null}
      </div>
      <section aria-label="Sprint status summaries" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-foreground">Sprint summaries</h2>
          <Link href={"/api/projects/"+encodeURIComponent(projectId)+"/mentor-sprint-summary-export"+
            (mentorBoardReviewHref({...data.query,page:1}).split("?")[1]?
              "?"+mentorBoardReviewHref({...data.query,page:1}).split("?")[1]:"")}
            download className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            Download filtered Sprint summary CSV (max 100)
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">
          These counts use the current Board filters. Completion is unknown when no tasks match.
          Every Sprint also shows its total registered task count.
        </p>
        {data.sprintSummaries.length===0?
          <p className="rounded-[var(--lms-control-radius)] border border-border bg-surface p-4 text-sm text-body">
            No registered Sprint matches the selected Sprint filter.
          </p>:
          <div className="grid gap-3 sm:grid-cols-2">
            {data.sprintSummaries.slice(0,6).map(sprint=>
              <article key={sprint.id} className="rounded-xl border border-border bg-surface p-4">
                <h3 className="break-words font-semibold">{sprint.title}</h3>
                <p className="mt-2 text-sm text-body">{sprint.matchingTasks} matching of
                  {" "}{sprint.registeredTasks} registered tasks</p>
                <p className="mt-1 text-sm text-body">
                  Done {sprint.done} · Blocked {sprint.blocked} · Awaiting review {sprint.awaitingReview}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Matching completion: {sprint.matchingDonePercent===null?"Unknown":
                    sprint.matchingDonePercent+"%"}
                </p>
              </article>)}
          </div>}
        {data.sprintSummaries.length>6?
          <p className="text-xs text-muted-foreground">
            Showing the first six of {data.sprintSummaries.length} Sprints.
            Download the capped CSV for more recorded summaries.
          </p>:null}
        {data.sprintSummaryExportOmitted>0?<p role="status" className="text-xs text-body">
          CSV omits {data.sprintSummaryExportOmitted} Sprints beyond the 100-row cap.
        </p>:null}
      </section>
      {data.items.length===0?<EmptyState
        title={data.count===0?"No registered project tasks":"No tasks match these filters"}
        description={data.count===0?
          "This project has no stored tasks. No workload or assignment is inferred.":
          "The stored tasks do not match your filters. Clear filters to view the whole board."}/>:
        <ol className="divide-y divide-border">{data.items.map(row=><li key={row.id}
          className="py-4">
          <h2 className="break-words font-semibold">{row.title}</h2>
          <p className="mt-2 text-sm text-body">{row.status.replaceAll("_"," ")} ·
            {row.priority} priority · {row.sprintTitle}</p>
        </li>)}</ol>}
      <Pagination label="Board status pages" page={data.page} pageCount={data.totalPages} hrefForPage={page=>mentorBoardReviewHref({...data.query,page})}/>
    </>}
    <p className="text-xs text-muted-foreground">Only registered task status, priority
      and sprint linkage are shown. No task assignee, effort or workload values
      are persisted in this DB version. Use the full workspace for authorized actions.</p>
  </div>;
}
