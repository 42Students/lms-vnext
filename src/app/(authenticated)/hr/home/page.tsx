import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { hasActiveRecruiter } from "@/modules/identity/context";
import { buildRecruiterToday, recruiterTodayWeek } from "@/modules/placements/recruiter-today-model";
import { projectHrTodayResultsDue } from "@/modules/placements/hr-today-results-due-model";
import { listOwnRecruiterPlacementJobs } from "@/modules/placements/recruiter-service";
import { listRecruiterCalendarEvents } from "@/modules/placements/recruiter-calendar-service";
import { recruiterDriveDraftHref } from "@/modules/placements/hr-drive-draft-links";
import { listHrNotifications } from "@/modules/placements/hr-notifications-service";
import { hrTodayUnreadAction } from "@/modules/placements/hr-today-unread-model";

const querySchema = z.object({collegeId: z.string().uuid().optional()}).strict();
function first(value: string | string[] | undefined) {return Array.isArray(value) ? value[0] : value;}
function when(value: Date) {return new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(value);}

export default async function HrHomePage({searchParams}: {searchParams:Promise<{collegeId?:string | string[]}>}) {
  const context = await getCurrentRequestContext();
  if (!hasActiveRecruiter(context) || !context.recruiter) redirect("/dashboard");
  const parsed = querySchema.safeParse({collegeId:first((await searchParams).collegeId)});
  if (!parsed.success) return <div className="space-y-5"><PageHeader eyebrow="Recruiter" title="Today" />
    <ErrorState title="Invalid college selection" description="The selected college ID is invalid."
      action={<Link href="/hr/home" className="text-primary-text underline">Choose again</Link>} /></div>;
  const recruiter = context.recruiter;
  const grants = recruiter.grants;
  const selectedId = parsed.data.collegeId ?? (grants.length === 1 ? grants[0]!.collegeId : null);
  if (selectedId && !grants.some(grant => grant.collegeId === selectedId)) notFound();
  if (!selectedId) return <div className="space-y-6">
    <PageHeader eyebrow="Employer Recruiter" title="Today" description={"College access for " + recruiter.companyName} />
    {grants.length === 0 ? <EmptyState title="No active college access" description="Ask the placement cell that invited you to restore access." /> :
    <section className="grid gap-3 sm:grid-cols-2">{grants.map(grant =>
      <Link key={grant.id} href={"/hr/home?collegeId=" + encodeURIComponent(grant.collegeId)}
        className="rounded-lg border border-border bg-surface p-5 hover:border-primary"><span className="font-semibold">{grant.collegeName}</span>
        <span className="mt-1 block text-sm text-muted-foreground">Open recruiter Today</span></Link>)}</section>}
    <Link href="/hr/profile" className="text-sm text-primary-text">Your profile</Link>
  </div>;
  const grant = grants.find(item => item.collegeId === selectedId)!;
  // eslint-disable-next-line react-hooks/purity -- request-time server dashboard needs a current clock for deadlines.
  const now = new Date();
  const week = recruiterTodayWeek(now);
  const [jobs, calendar, inbox] = await Promise.all([
    listOwnRecruiterPlacementJobs(context),
    listRecruiterCalendarEvents(context, week),
    listHrNotifications(context,{collegeId:selectedId,unreadOnly:"true"}),
  ]);
  const today = buildRecruiterToday(jobs, calendar.events, selectedId, now);
  const collegeJobs = jobs.filter(row => row.collegeId === selectedId && row.job.archivedAt === null);
  const dueResults = projectHrTodayResultsDue(calendar.resultsDue, collegeJobs.map(row => row.job.id));
  const unreadAction=hrTodayUnreadAction({...inbox,collegeId:selectedId});
  const actions = [
    {label:"Live drives", value:today.live, url:"/hr/drives?collegeId=" + encodeURIComponent(selectedId) + "&view=LIVE"},
    {label:"Deadlines within 7 days", value:today.dueSoon.length, url:"/hr/drives?collegeId=" + encodeURIComponent(selectedId) + "&view=LIVE"},
    {label:"Scheduled rounds this week", value:today.upcomingRounds.length, url:"/hr/calendar"},
    {label:"Results due this week", value:dueResults.length, url:"/hr/calendar"},
    ...(unreadAction ? [unreadAction] : []),
  ];
  return <div className="space-y-6">
    <PageHeader eyebrow="Employer Recruiter" title="Today"
      description={recruiter.companyName + " · " + grant.collegeName + ". Your live employer hiring activity."}
      actions={<Link href={recruiterDriveDraftHref({collegeId:selectedId})}
        className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">
        Request a Drive · preview
      </Link>} />
    {grants.length > 1 ? <nav aria-label="Choose college" className="flex flex-wrap gap-2">{grants.map(item=>
      <Link key={item.id} href={"/hr/home?collegeId="+encodeURIComponent(item.collegeId)}
        aria-current={item.collegeId === selectedId ? "page" : undefined}
        className={item.collegeId === selectedId ? "rounded-full bg-primary px-3 py-2 text-sm text-on-primary" : "rounded-full border border-border px-3 py-2 text-sm text-body"}>{item.collegeName}</Link>)}</nav> : null}
    <section aria-label="Recruiter tasks" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{actions.map(action=>
      <Link key={action.label} href={action.url} className="rounded-xl border border-border bg-surface p-5 hover:border-primary">
        <span className="block text-sm text-body">{action.label}</span><span className="mt-2 block text-2xl font-bold tabular-nums text-foreground">{action.value}</span>
      </Link>)}</section>
    <section className="rounded-xl border border-border bg-surface p-5">
      <h2 className="font-semibold text-foreground">Actionable deadlines</h2>
      {today.dueSoon.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{today.dueSoon.map(item =>
        <Link key={item.job.id} href={"/hr/placements/jobs/" + item.job.id}
          className="rounded-md border border-border p-3 hover:border-primary"><span className="block font-medium text-foreground">{item.job.title}</span>
          <span className="mt-1 block text-sm text-body">Applications close {when(item.job.applicationDeadline!)}</span></Link>)}</div> :
        <p className="mt-3 text-sm text-muted-foreground">No application deadlines in the next seven days.</p>}
    </section>
    <section className="rounded-xl border border-border bg-surface p-5">
      <h2 className="font-semibold text-foreground">This week · upcoming rounds</h2>
      {today.upcomingRounds.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{today.upcomingRounds.map(event =>
        <Link key={event.id} href={"/hr/placements/jobs/" + event.jobId + "?tab=rounds"}
          className="rounded-md border border-border p-3 hover:border-primary"><span className="block font-medium text-foreground">{event.title}</span>
          <span className="mt-1 block text-sm text-body">{event.jobTitle} · {when(event.startsAt)}</span></Link>)}</div> :
        <p className="mt-3 text-sm text-muted-foreground">No upcoming scheduled rounds for this college during this week.</p>}
    </section>
    <section className="rounded-xl border border-border bg-surface p-5">
      <h2 className="font-semibold text-foreground">Results due this week</h2>
      <p className="mt-1 text-sm text-body">Only recorded result deadlines on this college&apos;s authorized employer rounds; no outside messages or invitations are sent.</p>
      {dueResults.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{dueResults.map(item =>
        <Link key={item.id} href={"/hr/placements/jobs/"+item.jobId+"?tab=rounds"}
          className="min-w-0 rounded-md border border-border p-3 hover:border-primary">
          <span className="block break-words font-medium text-foreground">{item.roundName}</span>
          <span className="mt-1 block text-sm text-body">{item.jobTitle} · {when(item.dueAt)} IST</span>
        </Link>)}</div> : <p className="mt-3 text-sm text-muted-foreground">No upcoming results deadlines are recorded for this college this week.</p>}
    </section>
    <section className="rounded-xl border border-border bg-surface p-5">
      <h2 className="font-semibold text-foreground">Waiting</h2>
      <p className="mt-2 text-sm text-body">Drive request approvals, messages and placement-cell responses are not connected to a recruiter-visible persisted workflow yet. No waiting counts are inferred from published jobs.</p>
    </section>
    <div className="flex flex-wrap gap-4 text-sm"><Link className="text-primary-text" href={"/hr/drives?collegeId=" + encodeURIComponent(selectedId)}>Browse drives</Link>
      <Link className="text-primary-text" href={"/hr/company?collegeId=" + encodeURIComponent(selectedId)}>Company & Team</Link>
      <Link className="text-primary-text" href={"/hr/messages?collegeId="+encodeURIComponent(selectedId)}>Messages & Notifications</Link>
      <Link className="text-primary-text" href={"/hr/activity?collegeId="+encodeURIComponent(selectedId)}>Hiring activity</Link>
      <Link className="text-primary-text" href="/hr/profile">Your profile</Link></div>
  </div>;
}
