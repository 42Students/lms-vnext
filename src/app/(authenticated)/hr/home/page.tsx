import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { hasActiveRecruiter } from "@/modules/identity/context";
import { buildRecruiterToday, recruiterTodayEightDayWindow } from "@/modules/placements/recruiter-today-model";
import { projectHrTodayResultsDue } from "@/modules/placements/hr-today-results-due-model";
import {hrResultsDueHref} from "@/modules/placements/hr-calendar-day-model";
import {hrResultDeadlineUrgency,HR_DEADLINE_URGENCY_LABELS} from "@/modules/placements/hr-result-deadline-urgency-model";
import {hrTodayLiveDriveRows} from "@/modules/placements/hr-today-live-drive-model";
import { listOwnRecruiterPlacementJobs } from "@/modules/placements/recruiter-service";
import {recruiterVisiblePortfolioCounts} from "@/modules/placements/recruiter-portfolio-counts-service";
import { listRecruiterCalendarEvents } from "@/modules/placements/recruiter-calendar-service";
import { recruiterDriveDraftHref } from "@/modules/placements/hr-drive-draft-links";
import { listHrNotifications } from "@/modules/placements/hr-notifications-service";
import { listHrConversations } from "@/modules/placements/hr-conversation-inbox-service";
import { hrTodayConversationSignals } from "@/modules/placements/hr-today-conversation-model";
import { hrConversationsHref } from "@/modules/placements/hr-conversation-urls-model";
import { hrTodayUnreadAction } from "@/modules/placements/hr-today-unread-model";
import { buildRecruiterActionQueue } from "@/modules/placements/hr-today-action-queue-model";
import {listRecruiterTodayChangeRequests} from "@/modules/placements/hr-today-change-request-service";
import {listRecruiterTodayRoundsNeedingSlots} from "@/modules/placements/hr-today-open-slots-service";
import {listRecruiterTodayOfferActions} from "@/modules/placements/hr-today-offer-actions-service";
import {getRecruiterSelfGrantOverview} from "@/modules/placements/recruiter-self-grants-service";
import {listOwnRecruiterDriveRequests} from "@/modules/placements/recruiter-drive-request-service";
import {getRecruiterSelfProfile} from "@/modules/placements/recruiter-profile-service";
import {recruiterTodayGreeting} from "@/modules/placements/recruiter-today-greeting-model";
import {recruiterTodayWaitingRequests} from "@/modules/placements/recruiter-today-waiting-model";
import {recruiterTodayWeekEvents} from "@/modules/placements/recruiter-today-week-events-model";
import {HrUnsentDriveAlert} from "@/components/hr/hr-unsent-drive-alert";
import {hrDriveSessionStorageKey} from "@/modules/placements/hr-unsent-draft-storage-model";

const querySchema = z.object({collegeId: z.string().uuid().optional()}).strict();
function when(value: Date) {return new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(value);}

export default async function HrHomePage({searchParams}: {searchParams:Promise<{collegeId?:string | string[]}>}) {
  const context = await getCurrentRequestContext();
  if (!hasActiveRecruiter(context) || !context.recruiter || context.recruiter.userId !== context.user.id) redirect("/dashboard");
  const parsed = querySchema.safeParse({collegeId:(await searchParams).collegeId});
  if (!parsed.success) return <div className="min-w-0 max-w-full space-y-5"><PageHeader eyebrow="Recruiter" title="Today" />
    <ErrorState title="Invalid college selection" description="The selected college ID is invalid."
      action={<Link href="/hr/home" className="text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Choose again</Link>} /></div>;
  const recruiter = context.recruiter;
  const grants = recruiter.grants;
  const selectedId = parsed.data.collegeId ?? (grants.length === 1 ? grants[0]!.collegeId : null);
  if (selectedId && !grants.some(grant => grant.collegeId === selectedId)) notFound();
  if (!selectedId) {
    const access=await getRecruiterSelfGrantOverview(context);
    const byId=new Map(access.grants.map(item=>[item.id,item]));
    const visible=grants.filter(item=>byId.has(item.id));
    return <div className="min-w-0 max-w-full space-y-6">
    <PageHeader eyebrow="Recruiter" title="Today" description={"College access for " + recruiter.companyName} />
    {visible.length === 0 ? <EmptyState title="Open this on your college&apos;s placement address" description="Your recruiter account works inside one college&apos;s placement site. Ask the placement cell that invited you to restore access." /> :
    <section className="grid gap-3 sm:grid-cols-2">{visible.map(grant => {
      const detail=byId.get(grant.id)!;
      return <article key={grant.id} className="space-y-3 rounded-[var(--lms-control-radius)] border border-border bg-surface p-5">
        <h2 className="font-semibold text-foreground">{detail.collegeName}</h2>
        {detail.collegeCode?<p className="text-xs text-muted-foreground">College code: {detail.collegeCode}</p>:null}
        <p className="text-xs text-muted-foreground">Access granted: {detail.grantedAtLabel} (IST)</p>
        <Link href={"/hr/home?collegeId="+encodeURIComponent(grant.collegeId)}
          className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-[650] text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
          Open recruiter Today
        </Link>
      </article>;
    })}</section>}
    <Link href="/hr/profile" className="text-sm text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Your profile</Link>
  </div>;
  }
  const grant = grants.find(item => item.collegeId === selectedId)!;
  // eslint-disable-next-line react-hooks/purity -- request-time server dashboard needs a current clock for deadlines.
  const now = new Date();
  const week = recruiterTodayEightDayWindow(now);
  const jobs=await listOwnRecruiterPlacementJobs(context,selectedId,{limit:500});
  const recentJobCapReached=jobs.length===500;
  const [calendarResult,inboxResult,conversationResult]=await Promise.allSettled([
    listRecruiterCalendarEvents(context,week),
    listHrNotifications(context,{collegeId:selectedId,unreadOnly:"true"}),
    listHrConversations(context,{collegeId:selectedId,page:1}),
  ]);
  const calendar=calendarResult.status==="fulfilled"?calendarResult.value:
    {events:[],resultsDue:[]};
  const conversations=conversationResult.status==="fulfilled"?conversationResult.value:null;
  const summaryPartiallyUnavailable=calendarResult.status==="rejected"||
    inboxResult.status==="rejected"||conversationResult.status==="rejected";
  const today = buildRecruiterToday(jobs, calendar.events, selectedId, now);
  const collegeJobs = jobs.filter(row => row.collegeId === selectedId && row.job.archivedAt === null);
  const dueResults = projectHrTodayResultsDue(calendar.resultsDue, collegeJobs.map(row => row.job.id));
  const liveDrives=hrTodayLiveDriveRows(jobs,selectedId,recruiter.companyId);
  const liveDriveCounts=await recruiterVisiblePortfolioCounts(context,selectedId,liveDrives.map(row=>row.job.id));
  const mostSharedLiveId=[...liveDrives].sort((left,right)=>
    (liveDriveCounts[right.job.id]?.sharedApplicants??0)-(liveDriveCounts[left.job.id]?.sharedApplicants??0))[0]?.job.id??null;
  const unreadAction=inboxResult.status==="fulfilled"?hrTodayUnreadAction({...inboxResult.value,collegeId:selectedId}):null;
  const conversationSignals = conversations?.status==="READY"
    ? hrTodayConversationSignals(conversations.items,conversations.total)
    : null;
  const requests = await listOwnRecruiterDriveRequests(context,selectedId);
  const [changeRequests,roundsNeedingSlots,offerActions]=await Promise.all([
    listRecruiterTodayChangeRequests(selectedId,collegeJobs.map(row=>row.job.id)),
    listRecruiterTodayRoundsNeedingSlots(selectedId,collegeJobs.map(row=>row.job.id),now),
    listRecruiterTodayOfferActions(selectedId,collegeJobs.map(row=>row.job.id)),
  ]);
  const actionQueue=buildRecruiterActionQueue({jobs,collegeId:selectedId,companyId:recruiter.companyId,now,
    unread:unreadAction?.value??0,resultsDue:dueResults,
    unreadConversations:conversationSignals?.unread??[],
    returnedRequests:requests,changeRequests,roundsNeedingSlots,offerActions,
  });
  // Pending formal requests count as drives, even before publication.
  const requestCount=requests.length;
  const waitingRequests=recruiterTodayWaitingRequests(requests);
  const weekEvents=recruiterTodayWeekEvents({events:calendar.events,resultsDue:dueResults,allowedJobs:collegeJobs.map(row=>row.job.id),now});
  const profile = await getRecruiterSelfProfile(context);
  const greeting = recruiterTodayGreeting(now,profile.displayName,recruiter.companyName,actionQueue.length);
  const actions = [
    {label:"Live drives", value:today.live, url:"/hr/drives?collegeId=" + encodeURIComponent(selectedId) + "&view=LIVE"},
    {label:"Deadlines within 7 days", value:today.dueSoon.length, url:"/hr/drives?collegeId=" + encodeURIComponent(selectedId) + "&view=LIVE"},
    {label:"Scheduled rounds this week", value:today.upcomingRounds.length, url:"/hr/calendar"},
    {label:"Results due this week", value:dueResults.length, url:"/hr/calendar"},
    ...(conversationSignals && conversationSignals.unreadInPage>0 ? [{
      label:"Unread conversations (first page)",value:conversationSignals.unreadInPage,
      url:hrConversationsHref({collegeId:selectedId,q:"",unreadOnly:"true",page:1}),
    }] : []),
    ...(unreadAction ? [unreadAction] : []),
  ];
  return <div className="min-w-0 max-w-full space-y-6">
    <PageHeader title={greeting.title}
      description={greeting.subtitle}
      actions={<Link href={recruiterDriveDraftHref({collegeId:selectedId})}
        className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-[650] text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
        Request a drive
      </Link>} />
    <HrUnsentDriveAlert collegeId={selectedId}
      storageKey={hrDriveSessionStorageKey(context.user.id,selectedId,null)}/>
    {grants.length > 1 ? <nav aria-label="Choose college" className="flex flex-wrap gap-2">{grants.map(item=>
      <Link key={item.id} href={"/hr/home?collegeId="+encodeURIComponent(item.collegeId)}
        aria-current={item.collegeId === selectedId ? "page" : undefined}
        className={item.collegeId === selectedId ? "inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] bg-primary px-3 py-2 text-sm font-semibold text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]" : "inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 py-2 text-sm text-body hover:border-primary hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"}>{item.collegeName}</Link>)}</nav> : null}
    {recentJobCapReached?<aside role="status" className="rounded-[var(--lms-control-radius)] border border-warning bg-surface p-3 text-sm text-body">
      Today is displaying the 500 most recently created employer drives for this college.
      Older drives may not appear in these quick summaries. Open Drives for full history.
    </aside>:null}
    {summaryPartiallyUnavailable?<div role="alert" className="rounded-[var(--lms-control-radius)] border border-warning bg-surface p-4 text-sm text-body">
      <p className="font-semibold">Drive summary is partially unavailable.</p>
      <p className="mt-1">Your available drive information is shown below. Some notifications or calendar events may be missing.</p>
      <Link href={"/hr/home?collegeId="+encodeURIComponent(selectedId)}
        className="mt-2 inline-flex min-h-9 items-center font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Retry</Link>
    </div>:null}
    <section aria-label="Recruiter tasks" className="grid overflow-hidden rounded-[var(--lms-radius-card)] border border-border sm:grid-cols-2 xl:grid-cols-5">{actions.map(action=>
      <Link key={action.label} href={action.url} className="border-b border-border p-5 last:border-b-0 hover:bg-primary-subtle sm:border-b-0 sm:border-r sm:last:border-r-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
        <span className="block text-sm text-body">{action.label}</span><span className="mt-2 block text-2xl font-bold tabular-nums text-foreground">{action.value}</span>
      </Link>)}</section>
    <section aria-label="Next recruiter actions" className="space-y-3 rounded-[var(--lms-radius-card)] border border-border bg-surface p-4 sm:p-5">
      <h2 className="text-lg font-semibold text-foreground">Next up</h2>
      <p className="text-xs text-muted-foreground">Only active drives belonging to your selected college and company appear here.</p>
      {actionQueue.length ? <ul className="grid gap-3 sm:grid-cols-2">
        {actionQueue.map(task => <li key={task.key}>
          <Link href={task.href} className="block min-w-0 rounded-[var(--lms-control-radius)] border border-border p-4 hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] min-h-9">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-body">
              <span aria-hidden="true" className={task.tone==="URGENT"?"size-2 rounded-full bg-error":task.tone==="SOON"?"size-2 rounded-full bg-warning":"size-2 rounded-full bg-primary"}/>
              {task.tone==="URGENT"?"Urgent":task.tone==="SOON"?"Soon":"When you can"}
            </span>
            <span className="mt-2 block break-words font-semibold text-primary-text">{task.label}</span>
            <span className="mt-1 block text-xs text-body">{task.description}</span>
            {task.at?<span className="mt-1 block text-xs text-muted-foreground">
              {task.key.startsWith("due:")||task.key.startsWith("deadline:") ? task.tone==="URGENT"?"Overdue since ":"Due " : "Recorded for "}{new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",weekday:"short",day:"numeric",month:"short",hour:"numeric",minute:"2-digit",hour12:true}).format(task.at)}
            </span>:null}
            <span className="mt-3 block text-sm font-semibold text-primary-text">
              {task.tone==="URGENT"?"Review now →":task.key.startsWith("due:")?"Open results →":"Open →"}
            </span>
          </Link>
        </li>)}
      </ul> : collegeJobs.length===0 && requestCount===0 ? (
        <div className="rounded-[var(--lms-control-radius)] border border-border bg-surface-secondary p-4">
          <h3 className="font-semibold text-foreground">Start with your first drive</h3>
          <ol className="mt-3 list-inside list-decimal space-y-2 text-sm text-body">
            <li>Describe the role, pay and how you select. It takes a few minutes, and your draft is kept as you type.</li>
            <li>The placement cell reviews it, sets the dates and publishes it to students.</li>
            <li>Applicants show up here; you review them one by one and send results to the placement cell.</li>
          </ol>
          <Link href={recruiterDriveDraftHref({collegeId:selectedId})}
            className="mt-4 inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-[650] text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
            Request your first drive
          </Link>
        </div>
      ) : (
        <div role="status" className="rounded-[var(--lms-control-radius)] border border-border bg-surface-secondary p-4">
          <h3 className="font-semibold text-foreground">You are all caught up</h3>
          <p className="mt-2 text-sm text-body">New applicants, replies and decisions from the placement cell will show up here.</p>
        </div>
      )}
    </section>
    <section aria-label="This week" className="border-b border-border pb-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-foreground">This week</h2>
        <Link href={"/hr/calendar?collegeId="+encodeURIComponent(selectedId)} className="text-sm text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Full calendar</Link>
      </div>
      {weekEvents.length?<ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {weekEvents.map(item=><li key={item.id}>
          <Link href={item.href} className="block rounded-[var(--lms-control-radius)] border border-border p-3 hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] min-h-9">
            <span className="block text-xs font-semibold text-muted-foreground">{item.kind.replaceAll("_"," ")}</span>
            <span className="mt-1 block font-semibold text-foreground">{item.title}</span>
            <span className="mt-1 block text-sm text-body">{item.jobTitle}</span>
            <span className="mt-1 block text-xs text-muted-foreground">
              {item.dayLabel ? item.dayLabel+" · ":""}{new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",weekday:"short",day:"numeric",month:"short",hour:"numeric",minute:"2-digit",hour12:true}).format(item.startsAt)} IST
            </span>
          </Link>
        </li>)}
      </ul>:<p className="mt-3 text-sm text-muted-foreground">Nothing scheduled here for the next eight days.</p>}
    </section>
    <section aria-label="Live recruiter hiring drives" className="border-b border-border pb-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-foreground">Live hiring drives</h2>
        <Link href={"/hr/drives?collegeId="+encodeURIComponent(selectedId)+"&view=LIVE"}
          className="text-sm text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">See all live drives</Link>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Applied counts here mean applicants the placement cell has explicitly shared with you; private/unshared submissions are not visible.</p>
      {liveDrives.length?<div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {liveDrives.map(row=><Link key={row.job.id}
          href={"/recruiter/drives/"+encodeURIComponent(row.job.id)}
          className="min-w-0 rounded-[var(--lms-control-radius)] border border-border p-4 hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
          <span className="block break-words font-semibold text-foreground">{row.job.title}</span>
          {row.job.id===mostSharedLiveId&&liveDrives.length>1&&(liveDriveCounts[row.job.id]?.sharedApplicants??0)>0?<span className="mt-1 inline-block rounded-full border border-border px-2 py-0.5 text-xs font-semibold text-body">Most shared applicants in this preview</span>:null}
          <span className="mt-1 block text-xs text-muted-foreground">
            {row.job.applicationDeadline?"Applications close "+when(row.job.applicationDeadline)+" IST":"No deadline recorded"}
          </span>
          <span className="mt-2 block text-sm font-semibold text-foreground">
            {liveDriveCounts[row.job.id]?.sharedApplicants??0} shared applicants
          </span>
          {(liveDriveCounts[row.job.id]?.sharedApplicants??0)===0?
            <span className="mt-1 block text-xs text-muted-foreground">No shortlisted applicants have been shared yet.</span>:null}
          <span className="mt-2 block text-sm text-primary-text">Open hiring drive →</span>
        </Link>)}
      </div>:<p className="mt-3 text-sm text-muted-foreground">No live, non-archived drives for this employer and college.</p>}
    </section>
    <section className="border-b border-border pb-5">
      <h2 className="font-semibold text-foreground">Actionable deadlines</h2>
      {today.dueSoon.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{today.dueSoon.map(item =>
        <Link key={item.job.id} href={"/recruiter/drives/" + item.job.id}
          className="rounded-[var(--lms-control-radius)] border border-border p-3 hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"><span className="block font-medium text-foreground">{item.job.title}</span>
          <span className="mt-1 block text-sm text-body">Applications close {when(item.job.applicationDeadline!)}</span></Link>)}</div> :
        <p className="mt-3 text-sm text-muted-foreground">No application deadlines in the next seven days.</p>}
    </section>
    <section className="border-b border-border pb-5">
      <h2 className="font-semibold text-foreground">This week · upcoming rounds</h2>
      {today.upcomingRounds.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{today.upcomingRounds.map(event =>
        <Link key={event.id} href={"/recruiter/drives/" + event.jobId + "?tab=rounds"}
          className="rounded-[var(--lms-control-radius)] border border-border p-3 hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"><span className="block font-medium text-foreground">{event.title}</span>
          <span className="mt-1 block text-sm text-body">{event.jobTitle} · {when(event.startsAt)}</span></Link>)}</div> :
        <p className="mt-3 text-sm text-muted-foreground">No upcoming scheduled rounds for this college during this week.</p>}
    </section>
    <section className="border-b border-border pb-5">
      <h2 className="font-semibold text-foreground">Results due this week</h2>
      <p className="mt-1 text-sm text-body">Recorded result deadlines on authorized employer rounds. A past timestamp alone does not establish that results remain outstanding.</p>
      {dueResults.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{dueResults.map(item =>
        <Link key={item.id} href={hrResultsDueHref(item.jobId,item.id)}
          className="min-w-0 rounded-[var(--lms-control-radius)] border border-border p-3 hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
          <span className="block break-words font-medium text-foreground">{item.roundName}</span>
          <span className="mt-1 block text-sm text-body">{item.jobTitle} · {when(item.dueAt)} IST</span>
          <span className="mt-2 inline-flex rounded-full border border-border px-2 py-1 text-xs font-semibold text-foreground">
            {HR_DEADLINE_URGENCY_LABELS[hrResultDeadlineUrgency(item.dueAt,now)]}
          </span>
        </Link>)}</div> : <p className="mt-3 text-sm text-muted-foreground">No upcoming results deadlines are recorded for this college this week.</p>}
    </section>
    <section aria-label="Unread placement-cell conversations"
      className="border-b border-border pb-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold text-foreground">Replies to read</h2>
        <Link href={hrConversationsHref({collegeId:selectedId,q:"",unreadOnly:"true",page:1})}
          className="text-sm text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">View unread conversations</Link>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Only employer-owned threads from your selected college. No message bodies appear on Today.
      </p>
      {conversationSignals?.unread.length?<ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {conversationSignals.unread.map(row=><li key={row.id}>
          <Link href={row.href} className="block rounded-[var(--lms-control-radius)] border border-border p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] min-h-9">
            <span className="block break-words font-semibold text-primary-text">{row.label}</span>
            <span className="mt-1 block text-sm text-body">{row.unread} unread placement-cell messages</span>
          </Link>
        </li>)}
      </ul>:<p role="status" className="mt-3 text-sm text-muted-foreground">
        No unread placement-cell conversations on this inbox page.
      </p>}
    </section>
    <section className="border-b border-border pb-5">
      <h2 className="font-semibold text-foreground">With the placement cell</h2>
      <p className="mt-2 text-sm text-body">Formal requests awaiting a college decision. Results and selections require recorded submissions.</p>
      {waitingRequests.length?<ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {waitingRequests.map(request=><li key={request.id}>
          <Link href={"/recruiter/drives/new?collegeId="+encodeURIComponent(selectedId)+(request.status==="SENT_BACK"?"&fix=":"&edit=")+encodeURIComponent(request.id)}
            className="block rounded-[var(--lms-control-radius)] border border-border p-4 text-sm text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] min-h-9">
            <span className="block font-semibold">{request.title}</span>
            <span className="mt-1 block text-xs text-body">
              {request.status==="REQUEST"?"Sent for review":"Needs your changes"}
            </span>
          </Link>
        </li>)}
      </ul>:<p role="status" className="mt-3 text-sm text-muted-foreground">
        No formal drive requests are waiting at this college.
      </p>}
      <h3 className="mt-4 font-semibold text-foreground">Conversations waiting for a reply</h3>
      <p className="mt-1 text-sm text-body">These conversations were last updated by you. This does not prove a reply is due.</p>
      {conversationSignals?.waiting.length?<ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {conversationSignals.waiting.map(row=><li key={row.id}>
          <Link href={row.href} className="block rounded-[var(--lms-control-radius)] border border-border p-4 text-sm text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] min-h-9">
            {row.label} · Last message from you
          </Link>
        </li>)}
      </ul>:<p role="status" className="mt-3 text-sm text-muted-foreground">
        No recruiter-last-sent conversations on the visible inbox page.
      </p>}
      {conversationSignals?.limitedToCurrentPage?<Link
        href={"/hr/conversations?collegeId="+encodeURIComponent(selectedId)}
        className="mt-3 inline-flex min-h-9 items-center text-sm text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
        View all conversations
      </Link>:null}
    </section>
    <div className="flex flex-wrap gap-4 text-sm"><Link className="text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]" href={"/hr/drives?collegeId=" + encodeURIComponent(selectedId)}>Browse drives</Link>
      <Link className="text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]" href={"/hr/company?collegeId=" + encodeURIComponent(selectedId)}>Company & Team</Link>
      <Link className="text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]" href={"/recruiter/messages?collegeId="+encodeURIComponent(selectedId)}>Messages</Link>
      <Link className="text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]" href={"/hr/activity?collegeId="+encodeURIComponent(selectedId)}>Hiring activity</Link>
      <Link className="text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]" href="/hr/profile">Your profile</Link></div>
  </div>;
}
