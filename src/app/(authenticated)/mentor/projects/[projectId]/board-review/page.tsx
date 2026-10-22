import { FilterBar } from "@/components/ui/filter-bar";
import { Disclosure } from "@/components/ui/disclosure";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
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
    <PageHeader title={"Invalid board filters"} />
    <Link href="/mentor/projects" className="inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] lms-inline-link hover:text-[var(--lms-primary-text)] md:min-h-[var(--lms-control-height)]">Projects</Link>
  </section>;
  const data=await getMentorBoardReview(await getCurrentRequestContext(),validated.data);
  const base="/mentor/projects/"+encodeURIComponent(projectId);
  const filtered=data.enabled&&(Boolean(data.query.search)||data.query.status!=="ALL"||data.query.priority!=="ALL"||Boolean(data.query.sprintId&&data.query.sprintId!=="ALL"));
  return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
    <PageHeader eyebrow="Mentor · Project" title="Task board status"
      description={data.enabled?data.projectTitle:"Projects access is disabled; no tasks were loaded."}
      actions={<Link data-unskin="" href={base+"?tab=board"}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
        Full task workspace
      </Link>}/>
    {!data.enabled?
      <section role="status" className="border-b border-border pb-4">
        Projects access is disabled; no tasks were loaded.
      </section>:<>
      <FilterBar title="Filters"><form method="get" action={base+"/board-review"} role="search" aria-label="Task board review filters"
        className="grid min-w-0 items-end gap-[8px] border-b border-border pb-4 md:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))_auto_auto]">
        <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Search tasks or sprints
          <Input type="search" name="search" maxLength={100} defaultValue={data.query.search}
            className="min-h-11 w-full md:min-h-9"/>
        </label>
        <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Status
          <Select name="status" defaultValue={data.query.status}
            className="min-h-11 w-full md:min-h-9">
            {(["ALL","TODO","IN_PROGRESS","BLOCKED","IN_REVIEW","DONE"] as const).map(state=>
              <option key={state} value={state}>{state.replaceAll("_"," ")}</option>)}
          </Select>
        </label>
        <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Priority
          <Select name="priority" defaultValue={data.query.priority??"ALL"}
            className="min-h-11 w-full md:min-h-9">
            {(["ALL","LOW","MEDIUM","HIGH","CRITICAL"] as const).map(value=>
              <option key={value} value={value}>{value}</option>)}
          </Select>
        </label>
        <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Sprint
          <Select name="sprintId" defaultValue={data.query.sprintId??"ALL"}
            className="min-h-11 w-full md:min-h-9">
            <option value="ALL">All sprints</option>
            {data.sprints.map(s=><option key={s.id} value={s.id}>{s.title}</option>)}
          </Select>
        </label>
        <Button type="submit" variant="primary" className="min-h-11 w-full md:min-h-9 xl:w-auto">
          Filter
        </Button>
        {filtered?<Link href={base+"/board-review"} className="inline-flex min-h-11 items-center px-3 py-2 text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] lms-inline-link hover:text-[var(--lms-primary-text)] md:min-h-[var(--lms-control-height)]">Clear</Link>:null}
      </form></FilterBar>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link data-unskin="" href={"/api/projects/"+encodeURIComponent(projectId)+"/mentor-board-export"+
          (mentorBoardReviewHref({...data.query,page:1}).split("?")[1]?
            "?"+mentorBoardReviewHref({...data.query,page:1}).split("?")[1]:"")}
          download className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
          Download filtered CSV (max 500)
        </Link>
        {data.exportOmitted>0?<span role="status">
          CSV omits {data.exportOmitted} matching tasks beyond the export cap.
        </span>:null}
      </div>
      {data.items.length===0?<EmptyState
        title={data.count===0?"No registered project tasks":"No tasks match these filters"}
        description={data.count===0?
          "This project has no stored tasks. No workload or assignment is inferred.":
          "The stored tasks do not match your filters. Clear filters to view the whole board."} action={filtered?<Link href={base+"/board-review"} className="inline-flex min-h-11 items-center text-link underline md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Clear</Link>:<Link href={base+"?tab=board"} className="inline-flex min-h-11 items-center text-link underline md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Full task workspace</Link>} />:
        <ol className="divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">{data.items.map(row=><li key={row.id}
          className="py-[var(--lms-space-3)]">
          <h2 className="m-0 break-words text-base font-semibold leading-6 text-[var(--lms-heading)]">{row.title}</h2>
          <p className="mt-2 text-sm text-body leading-[22px]">{row.status.replaceAll("_"," ")} ·
            {row.priority} priority · {row.sprintTitle}</p>
        </li>)}</ol>}
      {data.totalPages>1?<Pagination label="Board status pages" page={data.page} pageCount={data.totalPages} hrefForPage={page=>mentorBoardReviewHref({...data.query,page})}/>:null}
      <Disclosure title="Registered task counts" className="min-w-0 border-t border-border py-3" contentClassName="pt-3">
      <section aria-label="Registered task counts" className="grid gap-3 min-[768px]:grid-cols-2 min-[1280px]:grid-cols-5">
         {(["TODO","IN_PROGRESS","BLOCKED","IN_REVIEW","DONE"] as const).map(status=>
           <StatTile key={status} label={status.replaceAll("_"," ")} value={data.totals[status]} className="min-h-[104px]" />)}
       </section>
      <p className="text-sm text-body leading-[22px]">{data.count} registered tasks ·
        {data.completedPercent===null?" Completion unknown (no tasks)":
          " "+data.completedPercent+"% recorded DONE tasks"}
      </p>
      </Disclosure>
      <section aria-label="Sprint status summaries" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-lg leading-7 text-[var(--lms-heading)]">Sprint summaries</h2>
          <Link data-unskin="" href={"/api/projects/"+encodeURIComponent(projectId)+"/mentor-sprint-summary-export"+
            (mentorBoardReviewHref({...data.query,page:1}).split("?")[1]?
              "?"+mentorBoardReviewHref({...data.query,page:1}).split("?")[1]:"")}
            download className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
            Download filtered Sprint summary CSV (max 100)
          </Link>
        </div>
        <p className="text-xs text-muted-foreground leading-5">
          These counts use the current Board filters. Completion is unknown when no tasks match.
          Every Sprint also shows its total registered task count.
        </p>
        {data.sprintSummaries.length===0?
          <p className="border-b border-[var(--lms-canvas-border)] py-[var(--lms-space-3)] text-sm text-body leading-[22px]">
            No registered Sprint matches the selected Sprint filter.
          </p>:
          <div className="grid gap-3 md:grid-cols-2">
            {data.sprintSummaries.slice(0,6).map(sprint=>
              <article key={sprint.id} className="border-b border-[var(--lms-canvas-border)] py-[var(--lms-space-4)]">
                <h3 className="break-words font-semibold text-[var(--lms-heading)] text-[var(--lms-font-md)] leading-[24px] min-[768px]:text-[var(--lms-font-lg)] min-[768px]:leading-[26px]">{sprint.title}</h3>
                <p className="mt-2 text-sm text-body leading-[22px]">{sprint.matchingTasks} matching of
                  {" "}{sprint.registeredTasks} registered tasks</p>
                <p className="mt-1 text-sm text-body leading-[22px]">
                  Done {sprint.done} · Blocked {sprint.blocked} · Awaiting review {sprint.awaitingReview}
                </p>
                <p className="mt-1 text-xs text-muted-foreground leading-5">
                  Matching completion: {sprint.matchingDonePercent===null?"Unknown":
                    sprint.matchingDonePercent+"%"}
                </p>
              </article>)}
          </div>}
        {data.sprintSummaries.length>6?
          <p className="text-xs text-muted-foreground leading-5">
            Showing the first six of {data.sprintSummaries.length} Sprints.
            Download the capped CSV for more recorded summaries.
          </p>:null}
        {data.sprintSummaryExportOmitted>0?<p role="status" className="text-xs text-body leading-5">
          CSV omits {data.sprintSummaryExportOmitted} Sprints beyond the 100-row cap.
        </p>:null}
      </section>

    </>}
    <p className="text-xs text-muted-foreground leading-5">Only registered task status, priority
      and sprint linkage are shown. No task assignee, effort or workload values
      are persisted in this DB version. Use the full workspace for authorized actions.</p>
  </div>;
}
