import { Pagination } from "@/components/ui/pagination";
import { NeedsDoingChips } from "@/components/ui/needs-doing-chips";
import { StatusBadge } from "@/components/ui/status-badge";
import { Timeline, TimelineEntry } from "@/components/ui/timeline";
import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {EmptyState} from "@/components/ui/empty-state";
import {mentorTimelineHref,mentorTimelineQuerySchema}
  from "@/modules/projects/mentor-project-timeline-model";
import {getMentorProjectTimeline} from "@/modules/projects/mentor-project-timeline-service";
import {singleValueMentorFilters} from "@/modules/projects/mentor-filter-query";
type Search={releaseStatus?:string|string[];sprintStatus?:string|string[];page?:string|string[]};
export default async function MentorProjectTimelinePage({
  params,searchParams,
}:{params:Promise<{projectId:string}>;searchParams:Promise<Search>}){
  const [p,q]=await Promise.all([params,searchParams]);
  const normalized=singleValueMentorFilters({
    releaseStatus:q.releaseStatus,sprintStatus:q.sprintStatus,page:q.page,
  });
  const parsed=mentorTimelineQuerySchema.safeParse(
    normalized?{projectId:p.projectId,...normalized}:null,
  );
  if(!parsed.success)return <section role="alert" className="space-y-2">
    <h1 className="text-[30px] font-semibold leading-[1.35] tracking-[-0.02em] text-[var(--lms-heading)]">Invalid timeline selector</h1>
    <Link href="/mentor/projects" className="inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lms-inline-link">Projects</Link>
  </section>;
  const data=await getMentorProjectTimeline(
    await getCurrentRequestContext(),parsed.data,
  );
  return <div className="min-w-0 max-w-full space-y-6">
    <PageHeader eyebrow="Mentor · Project" title="Release &amp; Sprint timeline"
      description={data.enabled?data.projectTitle:"Projects access is disabled; no timeline was loaded."}
      actions={<Link href={"/mentor/projects/"+encodeURIComponent(p.projectId)+"?tab=sprints"}
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 py-2 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        Sprint workspace
      </Link>} />
    {!data.enabled?<section role="status"
      className="border-b border-border pb-5">
      Projects access is disabled; no timeline was loaded.
    </section>:<>
      <NeedsDoingChips label="Release status filters:" selectedKey={data.query.releaseStatus}
        items={(["ALL","PLANNED","IN_PROGRESS","SHIPPED"] as const).map(status=>({
          key: status, label: status.replaceAll("_"," "),
          href: mentorTimelineHref({...data.query,releaseStatus:status,page:1}),
        }))} />
      <NeedsDoingChips label="Sprint status filters:" selectedKey={data.query.sprintStatus}
        items={(["ALL","PLANNED","ACTIVE","COMPLETED"] as const).map(status=>({
          key: status, label: status==="ALL"?"All Sprint states":status,
          href: mentorTimelineHref({...data.query,sprintStatus:status,page:1}),
        }))} />
      <p className="text-sm text-body">
        {data.total} registered release{data.total===1?"":"s"} match.
      </p>
      {data.items.length===0?<EmptyState title="No matching registered Releases"
        description="No persisted release matches the filter. Missing milestones, start dates or historic schedules are not reconstructed."/>
      :<Timeline aria-label="Registered releases">
        {data.items.map(release=><TimelineEntry key={release.id}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-foreground">
              Release {release.sequence+1}: {release.title}
            </h2>
            <StatusBadge tone={release.status==="SHIPPED"?"success":release.status==="IN_PROGRESS"?"info":"neutral"}>{release.status}</StatusBadge>
          </div>
          {release.sprints.length===0
            ?<p className="mt-3 text-sm text-body">No registered Sprints in this Release.</p>
            :<ol className="mt-3 grid gap-3">{release.sprints.map(sprint=>
              <li key={sprint.id} className="rounded-[var(--lms-control-radius)] bg-surface-subtle p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-foreground">
                    Sprint {sprint.sequence+1}: {sprint.title}
                  </h3>
                  <StatusBadge tone={sprint.status==="COMPLETED"?"success":sprint.status==="ACTIVE"?"info":"neutral"}>{sprint.status}</StatusBadge>
                </div>
                <p className="mt-1 text-sm text-body">
                  {sprint.doneCount} / {sprint.taskCount} registered tasks Done
                  {" · "}
                  {sprint.progressPercent===null
                    ?"Progress unknown (no tasks)":sprint.progressPercent+"% recorded completion"}
                </p>
              </li>)}</ol>}
        </TimelineEntry>)}</Timeline>}
      <Pagination label="Release timeline pages" page={data.page} pageCount={data.totalPages} hrefForPage={page=>mentorTimelineHref({...data.query,page})}/>
    </>}
    <p className="text-xs text-muted-foreground">
      The registered schema has no planned start/end dates on Releases or Sprints.
      This is sequence and lifecycle progression only—not a calendar schedule,
      delivery forecast or claim of milestone acceptance.
    </p>
  </div>;
}
