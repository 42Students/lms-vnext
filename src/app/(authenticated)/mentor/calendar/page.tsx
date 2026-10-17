import Link from "next/link";
import {MentorProjectsUnavailable} from "@/components/projects/mentor-projects-unavailable";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {MentorMeetingsCalendar} from "@/components/projects/mentor-meetings-calendar";
import {listMyMentorCalendarMeetings} from "@/modules/projects/mentor-calendar-service";
import {singleValueMentorFilters} from "@/modules/projects/mentor-filter-query";
import {mentorCalendarFiltersSchema,filterMentorCalendar}
  from "@/modules/projects/mentor-calendar-filter-model";
export const dynamic="force-dynamic";
type Search={sprint?:string|string[];join?:string|string[];projectId?:string|string[];attention?:string|string[];status?:string|string[];type?:string|string[];projectState?:string|string[];search?:string|string[];period?:string|string[]};
export default async function MentorCalendarPage({searchParams}:{
  searchParams:Promise<Search>;
}){
  const raw=await searchParams;
  const parsed=mentorCalendarFiltersSchema.safeParse(singleValueMentorFilters({
    sprint:raw.sprint,join:raw.join,projectId:raw.projectId,
    attention:raw.attention,status:raw.status,type:raw.type,
    projectState:raw.projectState,search:raw.search,period:raw.period,
  }));
  if(!parsed.success)return <section role="alert" className="space-y-3">
    <h1>Invalid meeting filters</h1>
    <Link href="/mentor/calendar" className="text-primary-text underline">Clear filters</Link>
  </section>;
  const context=await getCurrentRequestContext();
  const access=await resolveOptionalModuleAccess(context).catch(()=>null);
  if(access?.projects.enabled!==true)return <MentorProjectsUnavailable/>;
  const meetings=await listMyMentorCalendarMeetings(context);
  // eslint-disable-next-line react-hooks/purity -- Server snapshot drives IST period filters and initial client clock.
  const now=new Date();
  const displayed=filterMentorCalendar(meetings,parsed.data,now);
  return <div className="space-y-5">
    <PageHeader title="Meetings"
      description="Every scheduled meeting across your assigned projects, in one place."/>
    <form method="get" action="/mentor/calendar"
      className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
      <label className="grid gap-1 text-sm font-semibold text-body">Search
        <input type="search" name="search" maxLength={100}
          defaultValue={parsed.data.search}
          placeholder="Meeting or project" className="min-h-10 rounded-md border border-border bg-background px-3"/>
      </label>
      <label className="grid min-w-0 max-w-full gap-1 text-sm font-semibold text-body">Action needed
        <select name="attention" defaultValue={parsed.data.attention} className="min-h-10 w-full max-w-full rounded-md border border-border bg-background px-3">
          <option value="ALL">All meetings</option><option value="OVERDUE_REQUESTED">Past-dated meeting requests still awaiting response</option>
          <option value="SOON_SCHEDULED">Scheduled within 48 hours</option>
          <option value="MISSED_SCHEDULED">Past-day scheduled meetings without completion</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">Assigned project
        <select name="projectId" defaultValue={parsed.data.projectId??""}
          className="min-h-10 max-w-full rounded-md border border-border bg-background px-3">
          <option value="">All projects with meetings</option>
          {[...new Map(meetings.map(row=>[row.projectId,row.projectTitle])).entries()]
            .sort((a,b)=>a[1].localeCompare(b[1])||a[0].localeCompare(b[0]))
            .map(([id,title])=><option key={id} value={id}>{title}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">Sprint association
        <select name="sprint" defaultValue={parsed.data.sprint} className="min-h-10 rounded-md border border-border bg-background px-3">
          <option value="ALL">All meetings</option><option value="LINKED">Linked to a recorded Sprint</option>
          <option value="UNLINKED">No linked Sprint</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">Join link
        <select name="join" defaultValue={parsed.data.join}
          className="min-h-10 rounded-md border border-border bg-background px-3">
          <option value="ALL">All meetings</option><option value="HAS_SAFE_LINK">Valid join link</option>
          <option value="NO_SAFE_LINK">No safe join link</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">Status
        <select name="status" defaultValue={parsed.data.status}
          className="min-h-10 rounded-md border border-border bg-background px-3">
          {(["ALL","REQUESTED","SCHEDULED","COMPLETED","CANCELLED"] as const).map(status=>
            <option key={status} value={status}>{status.replaceAll("_"," ")}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">Meeting type
        <select name="type" defaultValue={parsed.data.type}
          className="min-h-10 rounded-md border border-border bg-background px-3">
          <option value="ALL">All types</option>
          <option value="GENERAL">General</option><option value="PLANNING">Planning</option>
          <option value="STANDUP">Standup</option><option value="REVIEW">Review</option>
          <option value="RETRO">Retrospective</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">Assigned project state
        <select name="projectState" defaultValue={parsed.data.projectState}
          className="min-h-10 rounded-md border border-border bg-background px-3">
          <option value="ALL">All project states</option>
          <option value="PLANNED">Planned</option><option value="ACTIVE">Active</option>
          <option value="COMPLETED">Completed</option><option value="ARCHIVED">Archived</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">IST dates
        <select name="period" defaultValue={parsed.data.period}
          className="min-h-10 rounded-md border border-border bg-background px-3">
          <option value="ALL">All dates</option><option value="TODAY">Today</option>
          <option value="NEXT_7_DAYS">Next 7 IST days</option>
          <option value="PAST_7_DAYS">Previous 7 IST days</option>
        </select>
      </label>
      <button type="submit" className="min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">Filter</button>
      <Link href="/mentor/calendar" className="inline-flex min-h-10 items-center text-sm text-primary-text underline">Clear</Link>
    </form>
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <Link href={"/api/mentor/calendar/export?"+new URLSearchParams({
        sprint:parsed.data.sprint,join:parsed.data.join,projectId:parsed.data.projectId??"",attention:parsed.data.attention,status:parsed.data.status,type:parsed.data.type,
        projectState:parsed.data.projectState,
        search:parsed.data.search,period:parsed.data.period,
      }).toString()} download className="inline-flex min-h-10 items-center rounded-md border border-border px-4 font-semibold text-primary-text">
        Export filtered meeting metadata CSV (max 200)
      </Link>
      {displayed.length>200?<span role="status">Export omits {displayed.length-200} meetings.</span>:null}
    </div>
    <p className="text-sm text-body">{displayed.length} matching meeting{displayed.length===1?"":"s"} of {meetings.length} currently assigned.</p>
    <MentorMeetingsCalendar meetings={displayed}
      // eslint-disable-next-line react-hooks/purity -- Current instant is supplied by server for hydration, refreshed on the client.
      initialNow={now.toISOString()}/>
  </div>;
}
