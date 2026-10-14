import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {EmptyState} from "@/components/ui/empty-state";
import {PageHeader} from "@/components/ui/page-header";
import {getMentorTeamMeetings} from "@/modules/projects/mentor-team-meetings-service";
import {
  mentorTeamMeetingsHref,mentorTeamMeetingsQuerySchema,
} from "@/modules/projects/mentor-team-meetings-model";

type Params={status?:string|string[];page?:string|string[]};
const first=(v:string|string[]|undefined)=>Array.isArray(v)?v[0]:v;
export default async function MentorTeamMeetingsPage({
  params,searchParams,
}:{params:Promise<{projectId:string}>;searchParams:Promise<Params>}){
  const [{projectId},raw]=await Promise.all([params,searchParams]);
  const parsed=mentorTeamMeetingsQuerySchema.safeParse({
    projectId,status:first(raw.status)??undefined,
    page:first(raw.page)??undefined,
  });
  if(!parsed.success)return <section role="alert" className="space-y-3">
    <h1 className="text-xl font-semibold">Invalid meeting history filters</h1>
    <Link href="/mentor/projects" className="text-primary-text underline">Projects</Link>
  </section>;
  const context=await getCurrentRequestContext();
  const data=await getMentorTeamMeetings(context,parsed.data);
  const board="/mentor/projects/"+encodeURIComponent(projectId)+"?tab=team";
  return <div className="space-y-6">
    <PageHeader eyebrow="Mentor · Project" title="Team &amp; meeting log"
      description={data.projectTitle}
      actions={<Link href={board}
        className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-primary-text">
        Team workspace
      </Link>} />
    {!data.enabled?<section role="status"
      className="rounded-xl border border-border bg-surface p-5 text-sm text-body">
      Projects access is disabled. No private team or meeting data was loaded.
    </section>:<>
      <section className="rounded-xl border border-border bg-surface p-5">
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
        className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
        <label className="grid gap-1 text-sm font-semibold text-body">Meeting status
          <select name="status" defaultValue={data.query.status}
            className="min-h-10 rounded-md border border-border bg-background px-3 text-foreground">
            <option value="ALL">All</option><option value="REQUESTED">Requested</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </label>
        <button type="submit"
          className="min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">
          Filter
        </button>
        <Link href={mentorTeamMeetingsHref({...data.query,status:"ALL",page:1})}
          className="px-3 py-2 text-sm font-semibold text-primary-text">Clear</Link>
      </form>
      <p className="text-sm text-body">{data.total} registered meeting{data.total===1?"":"s"} match</p>
      {data.items.length===0?<EmptyState title="No recorded meetings"
        description="No persisted meeting records match this project and filter. No session, outcome or attendance has been inferred." />
        :<ol className="grid gap-3">{data.items.map(meeting=>
          <li key={meeting.id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold text-foreground">{meeting.title}</h2>
              <span className="text-xs font-semibold text-body">{meeting.status}</span>
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
            <Link href={"/mentor/projects/"+encodeURIComponent(projectId)+
              "/meetings/"+encodeURIComponent(meeting.id)+"/notes"}
              className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-primary-text underline">
              View outcome notes
            </Link>
          </li>)}</ol>}
      <nav aria-label="Meeting history pages" className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">Page {data.page} of {data.totalPages}</span>
        <div className="flex gap-3">
          {data.page>1?<Link href={mentorTeamMeetingsHref({...data.query,page:data.page-1})}
            className="text-sm font-semibold text-primary-text">Previous</Link>:null}
          {data.page<data.totalPages?<Link href={mentorTeamMeetingsHref({...data.query,page:data.page+1})}
            className="text-sm font-semibold text-primary-text">Next</Link>:null}
        </div>
      </nav>
    </>}
    <p className="text-xs text-muted-foreground">
      This list is a registered meeting log, not a recording or attendance register.
      Current assigned Mentors can open the scoped detail to read or update written
      outcomes for completed meetings. Historical overwritten note versions are not preserved.
    </p>
  </div>;
}
