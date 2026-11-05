import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { NeedsDoingChips } from "@/components/ui/needs-doing-chips";

import { StatusBadge } from "@/components/ui/status-badge";
import { Timeline, TimelineEntry } from "@/components/ui/timeline";
import {getCurrentRequestContext} from "@/auth/request-context";
import {EmptyState} from "@/components/ui/empty-state";
import {ErrorState} from "@/components/ui/error-state";
import {mentorTimelineHref,mentorTimelineQuerySchema}
  from "@/modules/projects/mentor-project-timeline-model";
import {getMentorProjectTimeline} from "@/modules/projects/mentor-project-timeline-service";
import {singleValueMentorFilters} from "@/modules/projects/mentor-filter-query";
import { Heading } from "@/components/ui/heading";
import { TextLink } from "@/components/ui/text-link";
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
  if(!parsed.success)return <div className="min-w-0 space-y-4">
    <PageHeader title="Release & Sprint timeline"/>
    <ErrorState title="Invalid timeline selector" description="Choose valid release, sprint and page filters."
      action={<TextLink href="/mentor/projects" className="inline-flex min-h-11 items-center md:min-h-9">Projects</TextLink>}/>
  </div>;
  const data=await getMentorProjectTimeline(
    await getCurrentRequestContext(),parsed.data,
  );
  const filtered=parsed.data.releaseStatus!=="ALL"||parsed.data.sprintStatus!=="ALL";
  return <div className="min-w-0 max-w-full space-y-4">
    <PageHeader title="Release & Sprint timeline"
      description={data.enabled?data.projectTitle:"Projects access is disabled; no timeline was loaded."}
      actions={<TextLink href={"/mentor/projects/"+encodeURIComponent(p.projectId)+"?tab=sprints"}
        className="inline-flex min-h-11 items-center text-sm md:min-h-9">
        Sprint workspace
      </TextLink>} />
    {!data.enabled?<section role="status"
      className="border-b border-border pb-4">
      Projects access is disabled; no timeline was loaded.
    </section>:<>
      <div className="min-w-0 space-y-2 border-b border-border pb-3">
      <NeedsDoingChips className="min-w-0" label="Release status filters:" selectedKey={data.query.releaseStatus}
        items={(["ALL","PLANNED","IN_PROGRESS","SHIPPED"] as const).map(status=>({
          key: status, label: status.replaceAll("_"," "),
          href: mentorTimelineHref({...data.query,releaseStatus:status,page:1}),
        }))} />
      <NeedsDoingChips className="min-w-0" label="Sprint status filters:" selectedKey={data.query.sprintStatus}
        items={(["ALL","PLANNED","ACTIVE","COMPLETED"] as const).map(status=>({
          key: status, label: status==="ALL"?"All Sprint states":status,
          href: mentorTimelineHref({...data.query,sprintStatus:status,page:1}),
        }))} />
      </div>
      <p role="status" aria-live="polite" className="text-sm text-body leading-[1.6]">
        {data.total.toLocaleString("en-IN")} registered release{data.total===1?"":"s"} match.
      </p>
      {data.items.length===0?<EmptyState title="No matching registered releases"
        description="No persisted release matches the filter. Missing milestones, start dates or historic schedules are not reconstructed." action={filtered?<TextLink href={mentorTimelineHref({...data.query,releaseStatus:"ALL",sprintStatus:"ALL",page:1})} className="inline-flex min-h-11 items-center md:min-h-9">Clear</TextLink>:<TextLink href={"/mentor/projects/"+encodeURIComponent(p.projectId)+"?tab=sprints"} className="inline-flex min-h-11 items-center md:min-h-9">Sprint workspace</TextLink>}/>
      :<Timeline aria-label="Registered releases">
        {data.items.map(release=><TimelineEntry key={release.id}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Heading level={2} size="base" className="m-0 leading-6 text-[var(--lms-heading)]">
              Release {release.sequence+1}: {release.title}
            </Heading>
            <StatusBadge tone={release.status==="SHIPPED"?"success":release.status==="IN_PROGRESS"?"info":"neutral"}>{release.status}</StatusBadge>
          </div>
          {release.sprints.length===0
            ?<p className="mt-3 text-sm text-body leading-[22px]">No registered Sprints in this Release.</p>
            :<ol aria-label="Sprints in this release" className="mt-3 divide-y divide-[var(--lms-canvas-border)]">{release.sprints.map(sprint=>
              <li key={sprint.id} className="min-w-0 py-[var(--lms-space-3)]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Heading level={3} size="sm" className="m-0 leading-5 text-[var(--lms-heading)]">
                    Sprint {sprint.sequence+1}: {sprint.title}
                  </Heading>
                  <StatusBadge tone={sprint.status==="COMPLETED"?"success":sprint.status==="ACTIVE"?"info":"neutral"}>{sprint.status}</StatusBadge>
                </div>
                <p className="mt-1 text-sm text-body leading-[22px]">
                  {sprint.doneCount} / {sprint.taskCount} registered tasks Done
                  {" · "}
                  {sprint.progressPercent===null
                    ?"Progress unknown (no tasks)":sprint.progressPercent+"% recorded completion"}
                </p>
              </li>)}</ol>}
        </TimelineEntry>)}</Timeline>}
      {data.totalPages>1?<Pagination label="Release timeline pages" page={data.page} pageCount={data.totalPages} hrefForPage={page=>mentorTimelineHref({...data.query,page})}/>:null}
    </>}
    <p className="text-xs text-muted-foreground leading-5">
      The registered schema has no planned start/end dates on Releases or Sprints.
      This is sequence and lifecycle progression only—not a calendar schedule,
      delivery forecast or claim of milestone acceptance.
    </p>
  </div>;
}
