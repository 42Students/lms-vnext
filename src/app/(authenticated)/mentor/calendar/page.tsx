import { PageHeader } from "@/components/ui/page-header";
import {Button} from "@/components/ui/button";
import {MentorProjectsUnavailable} from "@/components/projects/mentor-projects-unavailable";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import {getCurrentRequestContext} from "@/auth/request-context";
import { hasActiveMembership, hasMembershipRole } from "@/modules/identity/context";
import { redirect } from "next/navigation";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {FilterBar} from "@/components/ui/filter-bar";
import {Disclosure} from "@/components/ui/disclosure";
import {MentorMeetingsCalendar} from "@/components/projects/mentor-meetings-calendar";
import {MentorCalendarQuickSchedule} from "@/components/projects/mentor-calendar-quick-schedule";
import {MentorGoogleCalendarAccount} from "@/components/projects/mentor-google-calendar-account";
import {mentorGoogleConnectionState} from "@/modules/projects/mentor-google-calendar-connection-service";
import {listMyProjectInstances} from "@/modules/projects/member-service";
import {MentorCalendarLoadFailure} from "@/components/projects/mentor-calendar-load-failure";
import {listMyMentorCalendarMeetings,listMyMentorSchedulableSprints} from "@/modules/projects/mentor-calendar-service";
import {mentorCalendarCanMutateMeeting} from "@/modules/projects/mentor-calendar-mutation-access-model";
import {ProjectsServiceError} from "@/modules/projects/errors";
import {singleValueMentorCalendarFilters} from "@/modules/projects/mentor-filter-query";
import {mentorCalendarFiltersSchema,filterMentorCalendar}
  from "@/modules/projects/mentor-calendar-filter-model";
import { Label } from "@/components/ui/label";
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";
export const dynamic="force-dynamic";
type Search={sprint?:string|string[];join?:string|string[];projectId?:string|string[];attention?:string|string[];status?:string|string[];type?:string|string[];projectState?:string|string[];search?:string|string[];period?:string|string[]};
export default async function MentorCalendarPage({searchParams}:{
  searchParams:Promise<Search>;
}){
  const context=await getCurrentRequestContext();
  if(!hasActiveMembership(context)||!hasMembershipRole(context,"MENTOR"))redirect("/dashboard");
  const raw=await searchParams;
  const parsed=mentorCalendarFiltersSchema.safeParse(singleValueMentorCalendarFilters({
    sprint:raw.sprint,join:raw.join,projectId:raw.projectId,
    attention:raw.attention,status:raw.status,type:raw.type,
    projectState:raw.projectState,search:raw.search,period:raw.period,
  }));
  if(!parsed.success)return <section role="alert" className="space-y-3">
    <PageHeader title="Mentor calendar" description="Invalid meeting filters" />
    <p className="text-sm text-body">These filters could not be applied. No meeting information was loaded.</p>
    <TextLink href="/mentor/calendar" className="inline-flex min-h-11 items-center md:min-h-[var(--lms-control-height)]">Clear filters</TextLink>
  </section>;
  const access=await resolveOptionalModuleAccess(context).catch(()=>null);
  if(access?.projects.enabled!==true)return <MentorProjectsUnavailable loadFailed={access===null}/>;
  const calendarRead=await listMyMentorCalendarMeetings(context)
    .then(items=>({items,reason:null as null|"PROJECT_ACCESS_DENIED"|"UNKNOWN"}))
    .catch((error:unknown)=>({
      items:null,
      reason:error instanceof ProjectsServiceError&&error.code==="PROJECT_ACCESS_DENIED"?
        "PROJECT_ACCESS_DENIED" as const:"UNKNOWN" as const,
    }));
  if(calendarRead.items===null)return <div className="min-w-0 max-w-full space-y-6">
    <PageHeader title="Meetings" description="Every scheduled meeting across your assigned projects, in one place."/>
    <MentorCalendarLoadFailure reason={calendarRead.reason??"UNKNOWN"}/>
  </div>;
  const meetings=calendarRead.items;
  const googleConnection=await mentorGoogleConnectionState(context)
    .catch(()=>({connected:false,available:false,connectedAt:null}));
  const assigned=(await listMyProjectInstances(context))
    .filter(row=>row.project.collegeId===context.membership?.collegeId&&
      !row.project.deletedAt&&mentorCalendarCanMutateMeeting({
        memberRole:row.memberRole,roleKind:row.memberRoleKind,
        canMutate:row.memberCanMutate,projectStatus:row.project.status,
      }));
  const schedulable=await listMyMentorSchedulableSprints(context,assigned);
  const choices=assigned.map(row=>({
    id:row.project.id,title:row.project.title,
    updatedAt:row.project.updatedAt.toISOString(),
    sprints:schedulable.filter(item=>item.projectId===row.project.id)
      .map(item=>({id:item.id,title:item.title,sequence:item.sequence,status:item.status})),
  }));
  // eslint-disable-next-line react-hooks/purity -- Server snapshot drives IST period filters and initial client clock.
  const now=new Date();
  const displayed=filterMentorCalendar(meetings,parsed.data,now);
  const activeCount=Number(Boolean(parsed.data.search))+Number(parsed.data.attention!=="ALL")+Number(parsed.data.period!=="ALL")+
    Number(Boolean(parsed.data.projectId))+Number(parsed.data.sprint!=="ALL")+Number(parsed.data.join!=="ALL")+
    Number(parsed.data.status!=="ALL")+Number(parsed.data.type!=="ALL")+Number(parsed.data.projectState!=="ALL");
  const advancedCount=Number(Boolean(parsed.data.projectId))+Number(parsed.data.sprint!=="ALL")+Number(parsed.data.join!=="ALL")+
    Number(parsed.data.status!=="ALL")+Number(parsed.data.type!=="ALL")+Number(parsed.data.projectState!=="ALL");
  return <div className="min-w-0 max-w-full space-y-6">
    <div className="prototype-mentor-calendar-heading">
      <PageHeader title="Meetings"
        description="Every scheduled meeting across your assigned projects, in one place."/>

    </div>
    <section className="prototype-mentor-meetings-surface min-w-0"
      aria-label="Meeting dates and history">
      <MentorMeetingsCalendar meetings={displayed}
      // eslint-disable-next-line react-hooks/purity -- Current instant is supplied by server for hydration, refreshed on the client.
      initialNow={now.toISOString()}/>
    </section>
      <Disclosure title="Scheduling and Google Calendar" className="min-w-0">
        <div className="mt-3 flex min-w-0 flex-wrap gap-3">
          <MentorCalendarQuickSchedule projects={choices}
            googleConnected={googleConnection.connected}/>
          <MentorGoogleCalendarAccount {...googleConnection}/>
        </div>
      </Disclosure>
    <Disclosure title={"Search & filters"+(activeCount?" ("+activeCount+" active)":"")}
      defaultOpen={activeCount>0} className="min-w-0 border-t border-border pt-3"
      contentClassName="pt-3">
      <p className="mb-3 text-xs text-body">Filter the Upcoming and Past meetings above;
        choose Filter to apply a new search.</p>
    <FilterBar title="Meeting filters" activeCount={activeCount}
      search={<Label stack>Search
        <Input type="search" name="search" form="mentor-calendar-filters" maxLength={100}
          defaultValue={parsed.data.search} placeholder="Meeting or project"/>
      </Label>}>
    <form id="mentor-calendar-filters" method="get" role="search" aria-label="Mentor meeting filters" action="/mentor/calendar"
      className="min-w-0 space-y-3 border-b border-border pb-4">
      <div className="grid min-w-0 items-end gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
      <Label stack className="min-w-0 max-w-full">Action needed
        <Select name="attention" defaultValue={parsed.data.attention} className="min-h-11 md:min-h-9 w-full max-w-full">
          <option value="ALL">All meetings</option><option value="OVERDUE_REQUESTED">Past-dated meeting requests still awaiting response</option>
          <option value="SOON_SCHEDULED">Scheduled within 48 hours</option>
          <option value="MISSED_SCHEDULED">Past-day scheduled meetings without completion</option>
          <option value="NOTES_MISSING">Completed meetings with no recorded notes or outcome</option>
        </Select>
      </Label>
      <Label stack>IST dates
        <Select name="period" defaultValue={parsed.data.period}
          className="min-h-11 md:min-h-9">
          <option value="ALL">All dates</option><option value="TODAY">Today</option>
          <option value="NEXT_7_DAYS">Next 7 IST days</option>
          <option value="PAST_7_DAYS">Previous 7 IST days</option>
        </Select>
      </Label>
        <Button type="submit" variant="primary" className="min-h-11 w-full md:min-h-9 lg:w-auto">Filter</Button>
      </div>
      <Disclosure title="More filters" defaultOpen={advancedCount>0} contentClassName="pt-3" className="min-w-0">
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Label stack>Assigned project
        <Select name="projectId" defaultValue={parsed.data.projectId??""}
          className="min-h-11 md:min-h-9 max-w-full">
          <option value="">All projects with meetings</option>
          {[...new Map(meetings.map(row=>[row.projectId,row.projectTitle])).entries()]
            .sort((a,b)=>a[1].localeCompare(b[1])||a[0].localeCompare(b[0]))
            .map(([id,title])=><option key={id} value={id}>{title}</option>)}
        </Select>
      </Label>
      <Label stack>Sprint association
        <Select name="sprint" defaultValue={parsed.data.sprint} className="min-h-11 md:min-h-9">
          <option value="ALL">All meetings</option><option value="LINKED">Linked to a recorded Sprint</option>
          <option value="UNLINKED">No linked Sprint</option>
        </Select>
      </Label>
      <Label stack>Join link
        <Select name="join" defaultValue={parsed.data.join}
          className="min-h-11 md:min-h-9">
          <option value="ALL">All meetings</option><option value="HAS_SAFE_LINK">Valid join link</option>
          <option value="NO_SAFE_LINK">No safe join link</option>
        </Select>
      </Label>
      <Label stack>Status
        <Select name="status" defaultValue={parsed.data.status}
          className="min-h-11 md:min-h-9">
          {(["ALL","DRAFT","REQUESTED","SCHEDULED","RESCHEDULED","COMPLETED","CANCELLED"] as const).map(status=>
            <option key={status} value={status}>{status.replaceAll("_"," ")}</option>)}
        </Select>
      </Label>
      <Label stack>Meeting type
        <Select name="type" defaultValue={parsed.data.type}
          className="min-h-11 md:min-h-9">
          <option value="ALL">All types</option>
          <option value="GENERAL">General</option><option value="PLANNING">Planning</option>
          <option value="STANDUP">Standup</option><option value="REVIEW">Review</option>
          <option value="RETRO">Retrospective</option>
        </Select>
      </Label>
      <Label stack>Assigned project state
        <Select name="projectState" defaultValue={parsed.data.projectState}
          className="min-h-11 md:min-h-9">
          <option value="ALL">All project states</option>
          <option value="PLANNED">Planned</option><option value="ACTIVE">Active</option>
          <option value="COMPLETED">Completed</option><option value="ARCHIVED">Archived</option>
        </Select>
      </Label>
        </div>
      </Disclosure>
      {activeCount>0?<TextLink href="/mentor/calendar" className="inline-flex min-h-11 items-center text-sm md:min-h-9">Clear</TextLink>:null}
    </form>
    </FilterBar>
     <div className="flex flex-wrap items-center gap-3 text-sm">
      <ButtonLink variant="secondary" data-unskin="" href={"/api/mentor/calendar/export?"+new URLSearchParams({
        sprint:parsed.data.sprint,join:parsed.data.join,projectId:parsed.data.projectId??"",attention:parsed.data.attention,status:parsed.data.status,type:parsed.data.type,
        projectState:parsed.data.projectState,
        search:parsed.data.search,period:parsed.data.period,
      }).toString()} download>
        Export filtered meeting metadata CSV (max 200)
      </ButtonLink>
      {displayed.length>200?<span role="status">Export omits {displayed.length-200} meetings.</span>:null}
    </div>
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">    <p className="text-sm text-body">{displayed.length} matching meeting{displayed.length===1?"":"s"} of {meetings.length} currently assigned.</p>
      {displayed.length===0 && activeCount>0 ? <TextLink href="/mentor/calendar" className="inline-flex min-h-11 items-center md:min-h-9">Clear</TextLink> : null}
    </div>
    </Disclosure>
  </div>;
}
