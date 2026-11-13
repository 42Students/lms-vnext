import {redirect} from "next/navigation";
import {hasMembershipRole} from "@/modules/identity/context";
import {assertMentorProjectRecoveryAccess} from "@/modules/projects/mentor-project-recovery-guard";
import { FilterBar } from "@/components/ui/filter-bar";
import { Disclosure } from "@/components/ui/disclosure";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import { mentorMeetingDisplayStatus } from "@/modules/projects/mentor-meeting-display-status";
import {getCurrentRequestContext} from "@/auth/request-context";
import {EmptyState} from "@/components/ui/empty-state";
import {MentorMeetingReschedule} from "@/components/projects/mentor-meeting-reschedule";
import {getMentorTeamMeetings} from "@/modules/projects/mentor-team-meetings-service";
import { singleValueMentorFilters } from "@/modules/projects/mentor-filter-query";
import {
  mentorTeamMeetingsHref,mentorTeamMeetingsQuerySchema,
} from "@/modules/projects/mentor-team-meetings-model";
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { TextLink } from "@/components/ui/text-link";
import { formatNumberIN } from "@/lib/safe-format";
import { istDateTimeFormatter } from "@/lib/format-date";

import { ROLE } from "@/modules/identity/roles";
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
  if(!parsed.success){
 const recoveryContext=await getCurrentRequestContext();
 if(!hasMembershipRole(recoveryContext,ROLE.MENTOR))redirect("/dashboard");
 await assertMentorProjectRecoveryAccess(recoveryContext,projectId);
 return  <section role="alert" className="space-y-3">
    <PageHeader title={"Invalid meeting history filters"} />
    <p className="text-sm text-body">The filter link is invalid or contains duplicate values. Clear it to return to this project’s meeting log.</p>
    <TextLink href={"/mentor/projects/"+encodeURIComponent(projectId)+"/team-meetings"} className="inline-flex min-h-11 items-center">Clear invalid filters</TextLink>
  </section>;
 }
  const context=await getCurrentRequestContext();
  const data=await getMentorTeamMeetings(context,parsed.data);
  const board="/mentor/projects/"+encodeURIComponent(projectId)+"?tab=team";
  const filtered=parsed.data.status!=="ALL"||parsed.data.type!=="ALL"||parsed.data.outcome!=="ALL"||parsed.data.order!=="NEWEST"||Boolean(parsed.data.search);
  const renderedAt = new Date();
  return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
    <PageHeader eyebrow="Mentor · Project" title="Team &amp; meeting log"
      description={data.enabled?data.projectTitle:"Projects access is disabled. No private team or meeting data was loaded."}
      actions={<TextLink data-unskin="" href={board}
        className="inline-flex min-h-11 items-center text-sm md:min-h-9">
        Team workspace
      </TextLink>} />
    {!data.enabled?<section role="status"
      className="border-b border-border pb-4 text-sm text-body">
      Projects access is disabled. No private team or meeting data was loaded.
    </section>:<>
      <section aria-labelledby="section-active-team-coverage" className="min-w-0 border-b border-border pb-4">
        <Heading level={2} size="base" id="section-active-team-coverage" className="m-0 leading-6 text-[var(--lms-heading)]">Active team coverage</Heading>
        <dl className="mt-4 grid gap-3 md:grid-cols-3">
          <div><dt className="text-xs text-muted-foreground">Learners</dt>
            <dd className="mt-1 text-xl font-semibold">{data.team.learners}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Mentors</dt>
            <dd className="mt-1 text-xl font-semibold">{data.team.mentors}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Primary Mentor</dt>
            <dd className="mt-1 text-sm font-semibold">
              {data.team.primaryRecorded?"Recorded":"Not recorded"}</dd></div>
        </dl>
        <p className="mt-3 text-xs text-muted-foreground leading-5">
          Counts include only registered active same-college project memberships with active
          role grants. No private member identities are loaded.
        </p>
      </section>
      <FilterBar title="Filters" activeCount={Number(data.query.status!=="ALL")+Number(data.query.type!=="ALL")+Number(data.query.outcome!=="ALL")+Number(data.query.order!=="NEWEST")+Number(Boolean(data.query.search))}>
        <form role="search" aria-label="team meetings filters" method="get" action={mentorTeamMeetingsHref({...data.query,page:1}).split("?")[0]}
          className="min-w-0 space-y-3 border-b border-border pb-4">
          <div className="grid min-w-0 items-end gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <Label stack>Meeting status
            <Select name="status" defaultValue={data.query.status}
              className="min-h-11 md:min-h-9">
              <option value="ALL">All</option><option value="REQUESTED">Requested</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>
          </Label>
          <Label stack>Meeting title
            <Input type="search" name="search" maxLength={100}
              defaultValue={data.query.search}
              className="min-h-11 md:min-h-9"/>
          </Label>
            <Button type="submit" variant="primary" className="min-h-11 w-full md:min-h-9 md:w-auto">Filter</Button>
          </div>
          <Disclosure title="Filters" defaultOpen={data.query.type!=="ALL"||data.query.outcome!=="ALL"||data.query.order!=="NEWEST"} className="min-w-0" contentClassName="min-w-0 pt-3 pb-2">
            <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Label stack>Meeting type
            <Select name="type" defaultValue={data.query.type}
              className="min-h-11 md:min-h-9">
              <option value="ALL">All types</option><option value="GENERAL">General</option>
              <option value="PLANNING">Planning</option><option value="STANDUP">Standup</option>
              <option value="REVIEW">Review</option><option value="RETRO">Retrospective</option>
            </Select>
          </Label>
          <Label stack>Recorded outcome
            <Select name="outcome" defaultValue={data.query.outcome}
              className="min-h-11 md:min-h-9">
              <option value="ALL">All meetings</option><option value="RECORDED">With written outcome</option>
              <option value="NOT_RECORDED">Without written outcome</option>
            </Select>
          </Label>
          <Label stack>Meeting order
            <Select name="order" defaultValue={data.query.order}
              className="min-h-11 md:min-h-9">
              <option value="NEWEST">Most recent first</option>
              <option value="OLDEST">Oldest first</option>
            </Select>
          </Label>
            </div>
          </Disclosure>
          {filtered?<TextLink href={mentorTeamMeetingsHref({...data.query,status:"ALL",type:"ALL",outcome:"ALL",order:"NEWEST",search:"",page:1})}
            className="inline-flex min-h-11 items-center text-sm md:min-h-9">Clear</TextLink>:null}
        </form>
      </FilterBar>
      <p className="text-sm text-body leading-[22px]">{formatNumberIN(data.total)} registered meeting{data.total===1?"":"s"} match</p>
      {data.items.length===0?<EmptyState title="No recorded meetings"
        description="No persisted meeting records match this project and filter. No session, outcome or attendance has been inferred." action={filtered?<TextLink href={mentorTeamMeetingsHref({...data.query,status:"ALL",type:"ALL",outcome:"ALL",order:"NEWEST",search:"",page:1})} className="inline-flex min-h-11 items-center md:min-h-9">Clear</TextLink>:<TextLink href={board} className="inline-flex min-h-11 items-center md:min-h-9">Team workspace</TextLink>} />
        :<ol aria-label="team meetings entries" className="divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">{data.items.map(meeting=>
          <li key={meeting.id} className="py-[var(--lms-space-3)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Heading level={2} size="base" className="m-0 leading-6 text-[var(--lms-heading)]">{meeting.title}</Heading>
              <span className="text-xs font-semibold text-body">{mentorMeetingDisplayStatus(meeting.status, meeting.endsAt, renderedAt)}</span>
            </div>
            <p className="mt-2 text-sm text-body leading-[22px]">
              {meeting.type} · {istDateTimeFormatter.format(meeting.startsAt)} IST
            </p>
            <p className="mt-1 text-xs text-muted-foreground leading-5">
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
            <TextLink href={"/mentor/projects/"+encodeURIComponent(projectId)+
              "/meetings/"+encodeURIComponent(meeting.id)+"/notes"}
              className="mt-3 inline-flex min-h-11 items-center text-sm md:min-h-9">
              View outcome notes
            </TextLink>
          </li>)}</ol>}
      {data.totalPages>1?<Pagination label="Meeting history pages" page={data.page} pageCount={data.totalPages} hrefForPage={page=>mentorTeamMeetingsHref({...data.query,page})}/>:null}
    </>}
    <p className="text-xs text-muted-foreground leading-5">
      This list is a registered meeting log, not a recording or attendance register.
      Current assigned Mentors can open the scoped detail to read or update written
      outcomes for completed meetings. Historical overwritten note versions are not preserved.
    </p>
  </div>;
}
