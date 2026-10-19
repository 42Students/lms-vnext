import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import { mentorMeetingDisplayStatus } from "@/modules/projects/mentor-meeting-display-status";
import {getCurrentRequestContext} from "@/auth/request-context";
import {EmptyState} from "@/components/ui/empty-state";
import {PageHeader} from "@/components/ui/page-header";
import {MentorMeetingReschedule} from "@/components/projects/mentor-meeting-reschedule";
import {getMentorTeamMeetings} from "@/modules/projects/mentor-team-meetings-service";
import { singleValueMentorFilters } from "@/modules/projects/mentor-filter-query";
import {
  mentorTeamMeetingsHref,mentorTeamMeetingsQuerySchema,
} from "@/modules/projects/mentor-team-meetings-model";

type Params={status?:string|string[];type?:string|string[];outcome?:string|string[];order?:string|string[];search?:string|string[];page?:string|string[]};
export default async function MentorTeamMeetingsPage({
  params,searchParams,
}:{params:Promise<{projectId:string}>;searchParams:Promise<Params>}){
  const [{projectId},raw]=await Promise.all([params,searchParams]);
  const normalized=singleValueMentorFilters({
    status:raw.status,type:raw.type,outcome:raw.outcome,
    order:raw.order,search:raw.search,page:raw.page,
  });
  const parsed=mentorTeamMeetingsQuerySchema.safeParse(
    normalized ? {projectId,...normalized} : null,
  );
  if(!parsed.success)return <section role="alert" className="space-y-3">
    <h1 className="font-semibold text-[30px] font-semibold leading-[1.35] tracking-[-0.02em] text-[var(--lms-heading)]">Invalid meeting history filters</h1>
    <Link href="/mentor/projects" className="inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Projects</Link>
  </section>;
  const context=await getCurrentRequestContext();
  const data=await getMentorTeamMeetings(context,parsed.data);
  const board="/mentor/projects/"+encodeURIComponent(projectId)+"?tab=team";
  const renderedAt = new Date();
  return <div className="min-w-0 max-w-full space-y-6">
    <PageHeader eyebrow="Mentor · Project" title="Team &amp; meeting log"
      description={data.enabled?data.projectTitle:"Projects access is disabled. No private team or meeting data was loaded."}
      actions={<Link href={board}
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 py-2 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        Team workspace
      </Link>} />
    {!data.enabled?<section role="status"
      className="border-b border-border pb-4 text-sm text-body">
      Projects access is disabled. No private team or meeting data was loaded.
    </section>:<>
      <section className="border-b border-border pb-5">
        <h2 className="text-base font-semibold text-foreground">Active team coverage</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <div><dt className="text-xs text-muted-foreground">Learners</dt>
            <dd className="mt-1 text-xl font-semibold">{data.team.learners}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Mentors</dt>
            <dd className="mt-1 text-xl font-semibold">{data.team.mentors}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Primary Mentor</dt>
            <dd className="mt-1 text-sm font-semibold">
              {data.team.primaryRecorded?"Recorded":"Not recorded"}</dd></div>
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">
          Counts include only registered active same-college project memberships with active
          role grants. No private member identities are loaded.
        </p>
      </section>
      <form method="get" action={mentorTeamMeetingsHref({...data.query,page:1}).split("?")[0]}
        className="flex flex-wrap items-end gap-3 border-b border-border pb-4">
        <label className="grid gap-1 text-sm font-semibold text-body">Meeting status
          <Select name="status" defaultValue={data.query.status}
            className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3 text-foreground">
            <option value="ALL">All</option><option value="REQUESTED">Requested</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Meeting type
          <Select name="type" defaultValue={data.query.type}
            className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
            <option value="ALL">All types</option><option value="GENERAL">General</option>
            <option value="PLANNING">Planning</option><option value="STANDUP">Standup</option>
            <option value="REVIEW">Review</option><option value="RETRO">Retrospective</option>
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Recorded outcome
          <Select name="outcome" defaultValue={data.query.outcome}
            className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
            <option value="ALL">All meetings</option><option value="RECORDED">With written outcome</option>
            <option value="NOT_RECORDED">Without written outcome</option>
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Meeting order
          <Select name="order" defaultValue={data.query.order}
            className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
            <option value="NEWEST">Most recent first</option>
            <option value="OLDEST">Oldest first</option>
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Meeting title
          <Input type="search" name="search" maxLength={100}
            defaultValue={data.query.search}
            className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3"/>
        </label>
        <Button type="submit" variant="primary">
          Filter
        </Button>
        <Link href={mentorTeamMeetingsHref({...data.query,status:"ALL",type:"ALL",outcome:"ALL",order:"NEWEST",search:"",page:1})}
          className="inline-flex min-h-11 items-center px-3 py-2 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Clear</Link>
      </form>
      <p className="text-sm text-body">{data.total} registered meeting{data.total===1?"":"s"} match</p>
      {data.items.length===0?<EmptyState title="No recorded meetings"
        description="No persisted meeting records match this project and filter. No session, outcome or attendance has been inferred." />
        :<ol className="divide-y divide-border">{data.items.map(meeting=>
          <li key={meeting.id} className="py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold text-foreground">{meeting.title}</h2>
              <span className="text-xs font-semibold text-body">{mentorMeetingDisplayStatus(meeting.status, meeting.endsAt, renderedAt)}</span>
            </div>
            <p className="mt-2 text-sm text-body">
              {meeting.type} · {new Intl.DateTimeFormat("en-IN",{
                dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
              }).format(meeting.startsAt)} IST
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Source timezone: {meeting.timeZone} · Outcome:{" "}
              {meeting.hasOutcome?"Recorded":"Not recorded"}
            </p>
            {meeting.status==="SCHEDULED"&&
             data.projectStatus!=="ARCHIVED"&&data.projectStatus!=="COMPLETED"?
              <div className="mt-3">
                <MentorMeetingReschedule projectId={projectId}
                  meetingId={meeting.id}
                  startsAt={meeting.startsAt.toISOString()}
                  endsAt={meeting.endsAt.toISOString()}
                  updatedAt={meeting.updatedAt.toISOString()}/>
              </div>:null}
            <Link href={"/mentor/projects/"+encodeURIComponent(projectId)+
              "/meetings/"+encodeURIComponent(meeting.id)+"/notes"}
              className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              View outcome notes
            </Link>
          </li>)}</ol>}
      <Pagination label="Meeting history pages" page={data.page} pageCount={data.totalPages} hrefForPage={page=>mentorTeamMeetingsHref({...data.query,page})}/>
    </>}
    <p className="text-xs text-muted-foreground">
      This list is a registered meeting log, not a recording or attendance register.
      Current assigned Mentors can open the scoped detail to read or update written
      outcomes for completed meetings. Historical overwritten note versions are not preserved.
    </p>
  </div>;
}
