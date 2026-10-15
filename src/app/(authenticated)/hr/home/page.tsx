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
import {hrResultsDueHref} from "@/modules/placements/hr-calendar-day-model";
import {hrResultDeadlineUrgency,HR_DEADLINE_URGENCY_LABELS} from "@/modules/placements/hr-result-deadline-urgency-model";
import {hrTodayLiveDriveRows} from "@/modules/placements/hr-today-live-drive-model";
import { listOwnRecruiterPlacementJobs } from "@/modules/placements/recruiter-service";
import { listRecruiterCalendarEvents } from "@/modules/placements/recruiter-calendar-service";
import { recruiterDriveDraftHref } from "@/modules/placements/hr-drive-draft-links";
import { listHrNotifications } from "@/modules/placements/hr-notifications-service";
import { listHrConversations } from "@/modules/placements/hr-conversation-inbox-service";
import { hrTodayConversationSignals } from "@/modules/placements/hr-today-conversation-model";
import { hrTodayUnreadAction } from "@/modules/placements/hr-today-unread-model";
import { buildRecruiterActionQueue } from "@/modules/placements/hr-today-action-queue-model";
import {getRecruiterSelfGrantOverview} from "@/modules/placements/recruiter-self-grants-service";

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
  if (!selectedId) {
    const access=await getRecruiterSelfGrantOverview(context);
    const byId=new Map(access.grants.map(item=>[item.id,item]));
    const visible=grants.filter(item=>byId.has(item.id));
    return <div className="space-y-6">
    <PageHeader eyebrow="Employer Recruiter" title="Today" description={"College access for " + recruiter.companyName} />
    {visible.length === 0 ? <EmptyState title="No active college access" description="Ask the placement cell that invited you to restore access." /> :
    <section className="grid gap-3 sm:grid-cols-2">{visible.map(grant => {
      const detail=byId.get(grant.id)!;
      return <article key={grant.id} className="space-y-3 rounded-lg border border-border bg-surface p-5">
        <h2 className="font-semibold text-foreground">{detail.collegeName}</h2>
        {detail.collegeCode?<p className="text-xs text-muted-foreground">College code: {detail.collegeCode}</p>:null}
        <p className="text-xs text-muted-foreground">Access granted: {detail.grantedAtLabel} (IST)</p>
        <Link href={"/hr/home?collegeId="+encodeURIComponent(grant.collegeId)}
          className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">
          Open recruiter Today
        </Link>
      </article>;
    })}</section>}
    <Link href="/hr/profile" className="text-sm text-primary-text">Your profile</Link>
  </div>;
  }
  const grant = grants.find(item => item.collegeId === selectedId)!;
  // eslint-disable-next-line react-hooks/purity -- request-time server dashboard needs a current clock for deadlines.
  const now = new Date();
  const week = recruiterTodayWeek(now);
  const [jobs, calendar, inbox, conversations] = await Promise.all([
    listOwnRecruiterPlacementJobs(context),
    listRecruiterCalendarEvents(context, week),
    listHrNotifications(context,{collegeId:selectedId,unreadOnly:"true"}),
    listHrConversations(context,{collegeId:selectedId,page:1}),
  ]);
  const today = buildRecruiterToday(jobs, calendar.events, selectedId, now);
  const collegeJobs = jobs.filter(row => row.collegeId === selectedId && row.job.archivedAt === null);
  const dueResults = projectHrTodayResultsDue(calendar.resultsDue, collegeJobs.map(row => row.job.id));
  const liveDrives=hrTodayLiveDriveRows(jobs,selectedId,recruiter.companyId);
  const unreadAction=hrTodayUnreadAction({...inbox,collegeId:selectedId});
  const conversationSignals = conversations.status==="READY"
    ? hrTodayConversationSignals(conversations.items,conversations.total)
    : null;
  const actionQueue=buildRecruiterActionQueue({jobs,collegeId:selectedId,companyId:recruiter.companyId,unread:unreadAction?.value??0});
  const actions = [
    {label:"Live drives", value:today.live, url:"/hr/drives?collegeId=" + encodeURIComponent(selectedId) + "&view=LIVE"},
    {label:"Deadlines within 7 days", value:today.dueSoon.length, url:"/hr/drives?collegeId=" + encodeURIComponent(selectedId) + "&view=LIVE"},
    {label:"Scheduled rounds this week", value:today.upcomingRounds.length, url:"/hr/calendar"},
    {label:"Results due this week", value:dueResults.length, url:"/hr/calendar"},
    ...(conversationSignals && conversationSignals.unreadInPage>0 ? [{
      label:"Unread conversations (first page)",value:conversationSignals.unreadInPage,
      url:"/hr/conversations?collegeId="+encodeURIComponent(selectedId),
    }] : []),
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
    <section aria-label="Next recruiter actions" className="space-y-3 rounded-xl border border-border bg-surface p-4 sm:p-5">
      <h2 className="text-lg font-semibold text-foreground">Next up</h2>
      <p className="text-xs text-muted-foreground">Only active drives belonging to your selected college and company appear here.</p>
      {actionQueue.length ? <ul className="grid gap-3 sm:grid-cols-2">
        {actionQueue.map(task => <li key={task.key}>
          <Link href={task.href} className="block min-w-0 rounded-lg border border-border p-4 hover:border-primary">
            <span className="block break-words font-semibold text-primary-text">{task.label}</span>
            <span className="mt-1 block text-xs text-body">{task.description}</span>
          </Link>
        </li>)}
      </ul> : <p role="status" className="text-sm text-body">Nothing needs a quick link right now.</p>}
    </section>
    <section aria-label="Live recruiter hiring drives" className="rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-foreground">Live hiring drives</h2>
        <Link href={"/hr/drives?collegeId="+encodeURIComponent(selectedId)+"&view=LIVE"}
          className="text-sm text-primary-text">See all live drives</Link>
      </div>
      {liveDrives.length?<div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {liveDrives.map(row=><Link key={row.job.id}
          href={"/hr/placements/jobs/"+encodeURIComponent(row.job.id)}
          className="min-w-0 rounded-md border border-border p-4 hover:border-primary">
          <span className="block break-words font-semibold text-foreground">{row.job.title}</span>
          <span className="mt-1 block text-xs text-muted-foreground">
            {row.job.applicationDeadline?"Applications close "+when(row.job.applicationDeadline)+" IST":"No deadline recorded"}
          </span>
          <span className="mt-2 block text-sm text-primary-text">Open hiring drive →</span>
        </Link>)}
      </div>:<p className="mt-3 text-sm text-muted-foreground">No live, non-archived drives for this employer and college.</p>}
    </section>
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
      <p className="mt-1 text-sm text-body">Recorded result deadlines on authorized employer rounds. A past timestamp alone does not establish that results remain outstanding.</p>
      {dueResults.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{dueResults.map(item =>
        <Link key={item.id} href={hrResultsDueHref(item.jobId,item.id)}
          className="min-w-0 rounded-md border border-border p-3 hover:border-primary">
          <span className="block break-words font-medium text-foreground">{item.roundName}</span>
          <span className="mt-1 block text-sm text-body">{item.jobTitle} · {when(item.dueAt)} IST</span>
          <span className="mt-2 inline-flex rounded-full border border-border px-2 py-1 text-xs font-semibold text-foreground">
            {HR_DEADLINE_URGENCY_LABELS[hrResultDeadlineUrgency(item.dueAt,now)]}
          </span>
        </Link>)}</div> : <p className="mt-3 text-sm text-muted-foreground">No upcoming results deadlines are recorded for this college this week.</p>}
    </section>
    <section aria-label="Unread placement-cell conversations"
      className="rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold text-foreground">Replies to read</h2>
        <Link href={"/hr/conversations?collegeId="+encodeURIComponent(selectedId)}
          className="text-sm text-primary-text">View conversations</Link>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Only employer-owned threads from your selected college. No message bodies appear on Today.
      </p>
      {conversationSignals?.unread.length?<ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {conversationSignals.unread.map(row=><li key={row.id}>
          <Link href={row.href} className="block rounded-md border border-border p-4">
            <span className="block break-words font-semibold text-primary-text">{row.label}</span>
            <span className="mt-1 block text-sm text-body">{row.unread} unread placement-cell messages</span>
          </Link>
        </li>)}
      </ul>:<p role="status" className="mt-3 text-sm text-muted-foreground">
        No unread placement-cell conversations on this inbox page.
      </p>}
    </section>
    <section className="rounded-xl border border-border bg-surface p-5">
      <h2 className="font-semibold text-foreground">Waiting</h2>
      <p className="mt-2 text-sm text-body">These conversations were last updated by you. A reply might still be needed; no pending approval or reply is inferred.</p>
      {conversationSignals?.waiting.length?<ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {conversationSignals.waiting.map(row=><li key={row.id}>
          <Link href={row.href} className="block rounded-md border border-border p-4 text-sm text-primary-text">
            {row.label} · Last message from you
          </Link>
        </li>)}
      </ul>:<p role="status" className="mt-3 text-sm text-muted-foreground">
        No recruiter-last-sent conversations on the visible inbox page.
      </p>}
      {conversationSignals?.limitedToCurrentPage?<Link
        href={"/hr/conversations?collegeId="+encodeURIComponent(selectedId)}
        className="mt-3 inline-flex min-h-11 items-center text-sm text-primary-text">
        View all conversations
      </Link>:null}
    </section>
    <div className="flex flex-wrap gap-4 text-sm"><Link className="text-primary-text" href={"/hr/drives?collegeId=" + encodeURIComponent(selectedId)}>Browse drives</Link>
      <Link className="text-primary-text" href={"/hr/company?collegeId=" + encodeURIComponent(selectedId)}>Company & Team</Link>
      <Link className="text-primary-text" href={"/hr/messages?collegeId="+encodeURIComponent(selectedId)}>Messages & Notifications</Link>
      <Link className="text-primary-text" href={"/hr/activity?collegeId="+encodeURIComponent(selectedId)}>Hiring activity</Link>
      <Link className="text-primary-text" href="/hr/profile">Your profile</Link></div>
  </div>;
}
