import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import Link from "next/link";
import { redirect } from "next/navigation";
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
import {recruiterCollegeCardDetail} from "@/modules/placements/recruiter-college-card-service";
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
  if (!parsed.success) return <div className="min-w-0 max-w-full space-y-4 md:space-y-6"><PageHeader title="Today" />
    <ErrorState title="Invalid college selection" description="The selected college ID is invalid."
      action={<Link href="/hr/home" className="min-h-11 md:min-h-9 inline-flex items-center text-primary-text underline hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Choose again</Link>} /></div>;
  const recruiter = context.recruiter;
  const grants = recruiter.grants;
  const selectedId = parsed.data.collegeId ?? (grants.length === 1 ? grants[0]!.collegeId : null);
  if (selectedId && !grants.some(grant => grant.collegeId === selectedId)) {
    return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
      <PageHeader title="Today" />
      <ErrorState title="College access unavailable"
        description="This college is not part of your active recruiter access. Your invitation may have expired or been revoked. Ask the college placement cell to restore access."
        action={<Link href="/hr/home" className="inline-flex min-h-11 items-center text-primary-text underline md:min-h-9">Choose college</Link>} />
    </div>;
  }
  if (!selectedId) {
    let access: Awaited<ReturnType<typeof getRecruiterSelfGrantOverview>>;
    try { access = await getRecruiterSelfGrantOverview(context); }
    catch {
      return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
        <PageHeader title="Today" />
        <ErrorState title="We couldn't load your account"
          description="We could not verify your college access. No college details are shown until the account lookup succeeds."
          action={<Link href="/hr/home" className="inline-flex min-h-11 items-center text-primary-text underline md:min-h-9">Retry</Link>} />
      </div>;
    }
    const byId=new Map(access.grants.map(item=>[item.id,item]));
    const visible=grants.filter(item=>byId.has(item.id));
    const limited=visible.slice(0,12);
    const details=await Promise.allSettled(limited.map(item=>recruiterCollegeCardDetail(context,item.collegeId)));
    const richByGrant=new Map(limited.map((item,index)=>[item.id,
      details[index]?.status==="fulfilled"?(details[index] as PromiseFulfilledResult<Awaited<ReturnType<typeof recruiterCollegeCardDetail>>>).value:null]));
    return <div className="min-w-0 max-w-full space-y-6">
    <PageHeader title="Today" description={"College access for " + recruiter.companyName} />
    <p className="text-sm text-body leading-[22px]">Choose an authorized college to view its own drives, notifications and applicant shares. Counts are not combined across colleges.</p>
    {visible.length>12?<Alert tone="warning">Showing 12 authorized college summaries. Open Colleges to explore others.</Alert>:null}
    {visible.length === 0 ? <EmptyState title="Open this on your college&apos;s placement address" description="Your recruiter account works inside one college&apos;s placement site. Ask the placement cell that invited you to restore access." /> :
    <section className="min-w-0 divide-y divide-[var(--lms-canvas-border)]">{limited.map(grant => {
      const detail=byId.get(grant.id)!;
      const rich=richByGrant.get(grant.id);
      return <article key={grant.id} className="space-y-3 border-b border-[var(--lms-canvas-border)] py-4">
        <div className="flex min-w-0 items-start gap-3">
          {rich?.logoUrl?<img src={rich.logoUrl} alt="" width={48} height={48} className="size-12 shrink-0 rounded border border-border object-contain"/>:
           <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded border border-border bg-muted text-lg font-semibold">{detail.collegeName.slice(0,1)}</span>}
          <div className="min-w-0"><h2 className="break-words text-[var(--lms-font-lg)] font-semibold leading-[26px] text-[var(--lms-heading)] min-[768px]:text-[var(--lms-font-xl)] min-[768px]:leading-7">{detail.collegeName}</h2>
            <p className="text-xs text-body">{detail.collegeCode?"College code: "+detail.collegeCode:"College code unavailable"} · Verified recruiter access</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Access granted: {detail.grantedAtLabel} (IST) · {detail.accessUntilLabel}</p>
        <p className="text-xs text-muted-foreground">Membership key: {rich?.memberKey??grant.id}</p>
        {rich?<div className="grid gap-2 text-sm sm:grid-cols-2">
          <p><strong>Active learners:</strong> {rich.studentCount??"Unavailable"}</p>
          <p><strong>Your drives:</strong> {rich.allDriveCount??"Unavailable"} {rich.liveDriveCount!==null?(" · "+rich.liveDriveCount+" live"):""}</p>
          <div className="sm:col-span-2"><strong>Branches:</strong> {rich.branches===null?"Unavailable":rich.branches.length?
            <span className="mt-1 flex flex-wrap gap-1">{rich.branches.map(branch=><span key={branch} className="rounded border border-border px-2 py-1 text-xs">{branch}</span>)}</span>:"No branches recorded"}</div>
          <p className="sm:col-span-2"><strong>TPO contact:</strong> {rich.tpoContact?
            <span>{rich.tpoContact.name}{rich.tpoContact.email?" · "+rich.tpoContact.email:""}</span>:"No TPO contact available"}</p>
        </div>:<Alert tone="warning">College details are temporarily unavailable. Missing information is not zero.</Alert>}
        {rich?.errors.length?<p role="status" className="text-xs text-muted-foreground">Could not load: {rich.errors.join(", ")}. Retry to refresh.</p>:null}
        <Link href={"/hr/home?collegeId="+encodeURIComponent(grant.collegeId)}
          className="inline-flex min-h-11 min-[768px]:min-h-9 items-center rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-[650] text-on-primary hover:border-[var(--lms-button-primary-hover)] hover:bg-[var(--lms-button-primary-hover)] active:border-[var(--lms-button-primary-hover)] active:bg-[var(--lms-button-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
          Open recruiter Today
        </Link>
      </article>;
    })}</section>}
    <Link href="/hr/profile" className="inline-flex min-h-11 items-center text-sm text-primary-text hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Your profile</Link>
  </div>;
  }
  const grant = grants.find(item => item.collegeId === selectedId)!;
  // eslint-disable-next-line react-hooks/purity -- request-time server dashboard needs a current clock for deadlines.
  const now = new Date();
  const week = recruiterTodayWeek(now);
  let jobs: Awaited<ReturnType<typeof listOwnRecruiterPlacementJobs>>;
  try { jobs=await listOwnRecruiterPlacementJobs(context,selectedId,{limit:500}); }
  catch {
    return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
      <PageHeader title="Today" />
      <ErrorState title="We could not load what needs you today."
        description="Your verified employer drives could not be loaded. We have not treated missing data as zero tasks."
        action={<Link href={"/hr/home?collegeId="+encodeURIComponent(selectedId)}
          className="inline-flex min-h-11 items-center text-primary-text underline md:min-h-9">Retry</Link>} />
    </div>;
  }
  // The 500-job preview is not a historical total.
  const recentJobCapReached=jobs.length===500;
  const [calendarResult,inboxResult,conversationResult]=await Promise.allSettled([
    listRecruiterCalendarEvents(context,week),
    listHrNotifications(context,{collegeId:selectedId,unreadOnly:"true"}),
    listHrConversations(context,{collegeId:selectedId,page:1}),
  ]);
  const calendar=calendarResult.status==="fulfilled"?calendarResult.value:
    {events:[],resultsDue:[]};
  const unavailableSources = [
    ...(calendarResult.status==="rejected" ? ["Calendar and result deadlines"] : []),
    ...(inboxResult.status==="rejected" ? ["Notifications"] : []),
    ...(conversationResult.status==="rejected" ? ["Conversations"] : []),
  ];
  const conversations=conversationResult.status==="fulfilled"?conversationResult.value:null;
  const summaryPartiallyUnavailable=calendarResult.status==="rejected"||
    inboxResult.status==="rejected"||conversationResult.status==="rejected";
  const today = buildRecruiterToday(jobs, calendar.events, selectedId, now);
  const collegeJobs = jobs.filter(row => row.collegeId === selectedId && row.job.archivedAt === null);
  const dueResults = projectHrTodayResultsDue(calendar.resultsDue, collegeJobs.map(row => row.job.id));
  const liveDrives=hrTodayLiveDriveRows(jobs,selectedId,recruiter.companyId);
  const liveDriveCounts=await recruiterVisiblePortfolioCounts(
    context,selectedId,liveDrives.map(row=>row.job.id),
  ).catch(() => null);
  const mostSharedLiveId=liveDriveCounts ? [...liveDrives].sort((left,right)=>
    (liveDriveCounts[right.job.id]?.sharedApplicants??0)-(liveDriveCounts[left.job.id]?.sharedApplicants??0))[0]?.job.id??null : null;
  const unreadAction=inboxResult.status==="fulfilled"?hrTodayUnreadAction({...inboxResult.value,collegeId:selectedId}):null;
  const conversationSignals = conversations?.status==="READY"
    ? hrTodayConversationSignals(conversations.items,conversations.total)
    : null;
  const requestsResult=await listOwnRecruiterDriveRequests(context,selectedId)
   .then(value=>({ok:true as const,value})).catch(()=>({ok:false as const}));
  const requests=requestsResult.ok?requestsResult.value:[];
  const [changeResult,slotsResult,offersResult]=await Promise.allSettled([
    listRecruiterTodayChangeRequests(selectedId,collegeJobs.map(row=>row.job.id)),
    listRecruiterTodayRoundsNeedingSlots(selectedId,collegeJobs.map(row=>row.job.id),now),
    listRecruiterTodayOfferActions(selectedId,collegeJobs.map(row=>row.job.id)),
  ]);
  const changeRequests=changeResult.status==="fulfilled"?changeResult.value:[];
  const roundsNeedingSlots=slotsResult.status==="fulfilled"?slotsResult.value:[];
  const offerActions=offersResult.status==="fulfilled"?offersResult.value:[];
  const actionQueue=buildRecruiterActionQueue({jobs,collegeId:selectedId,companyId:recruiter.companyId,now,
    unread:unreadAction?.value??0,resultsDue:dueResults,
    unreadConversations:conversationSignals?.unread??[],
    returnedRequests:requests,changeRequests,roundsNeedingSlots,offerActions,
  });
  // Pending formal requests count as drives, even before publication.
  const requestCount=requestsResult.ok?requests.length:null;
  const otherSignalsUnavailable=!requestsResult.ok||changeResult.status==="rejected"||
   slotsResult.status==="rejected"||offersResult.status==="rejected";
  const waitingRequests=recruiterTodayWaitingRequests(requests);
  const weekEvents=recruiterTodayWeekEvents({events:calendar.events,resultsDue:dueResults,allowedJobs:collegeJobs.map(row=>row.job.id),now});
  let profile: Awaited<ReturnType<typeof getRecruiterSelfProfile>>;
  try { profile = await getRecruiterSelfProfile(context); }
  catch {
    return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
      <PageHeader title="Today" />
      <ErrorState title="We couldn't load your account"
        description="Your recruiter profile could not be verified. Other college records have not been substituted for your account."
        action={<Link href={"/hr/home?collegeId="+encodeURIComponent(selectedId)}
          className="inline-flex min-h-11 items-center text-primary-text underline md:min-h-9">Retry</Link>} />
    </div>;
  }
  const greeting = recruiterTodayGreeting(now,profile.displayName,recruiter.companyName,actionQueue.length);
  const actions = [
    {label:"Live drives", value:today.live, url:"/hr/drives?collegeId=" + encodeURIComponent(selectedId) + "&view=LIVE"},
    {label:"Deadlines within 7 days", value:today.dueSoon.length, url:"/hr/drives?collegeId=" + encodeURIComponent(selectedId) + "&view=LIVE"},
    ...(calendarResult.status==="fulfilled" ? [
      {label:"Scheduled rounds this week", value:today.upcomingRounds.length, url:"/hr/calendar"},
      {label:"Results due this week", value:dueResults.length, url:"/hr/calendar"},
    ] : []),
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
        className="inline-flex min-h-11 min-[768px]:min-h-9 items-center rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-[650] text-on-primary hover:border-[var(--lms-button-primary-hover)] hover:bg-[var(--lms-button-primary-hover)] active:border-[var(--lms-button-primary-hover)] active:bg-[var(--lms-button-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
        Request a drive
      </Link>} />
    <HrUnsentDriveAlert collegeId={selectedId}
      storageKey={hrDriveSessionStorageKey(context.user.id,selectedId,null)}/>
    {grants.length > 1 ? <NeedsDoingChips label="Choose college:" selectedKey={selectedId}
      items={grants.map(grant=>({
        key:grant.collegeId,label:grant.collegeName,
        href:"/hr/home?collegeId="+encodeURIComponent(grant.collegeId),
      }))}/> : null}
    {recentJobCapReached?<Alert tone="warning">
      Today is displaying the 500 most recently created employer drives for this college.
      Older drives may not appear in these quick summaries. Open Drives for full history.
    </Alert>:null}
    {(summaryPartiallyUnavailable||otherSignalsUnavailable)?<Alert tone="warning">
      <p className="font-semibold">Drive summary is partially unavailable.</p>
      <p className="mt-1">Unavailable: {[...unavailableSources,...(!requestsResult.ok?["Drive requests"]:[]),
      ...(changeResult.status==="rejected"?["Change requests"]:[]),
      ...(slotsResult.status==="rejected"?["Interview slots"]:[]),
      ...(offersResult.status==="rejected"?["Offer actions"]:[])].join(", ")}. We cannot confirm zero activity for these sources; verified drive data is shown separately.</p>
      <Link href={"/hr/home?collegeId="+encodeURIComponent(selectedId)}
        className="mt-2 inline-flex min-h-11 min-[768px]:min-h-9 items-center font-semibold text-primary-text underline hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Retry</Link>
    </Alert>:null}
    {!liveDriveCounts ? <Alert tone="warning">Shared applicant counts are temporarily unavailable. Missing results have not been displayed as zero applicants.</Alert> : null}
    <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-4">    <section aria-label="Next recruiter actions" className="min-w-0 space-y-3 border-b border-[var(--lms-canvas-border)] pb-6">
      <h2 className="text-[var(--lms-font-lg)] font-semibold leading-[26px] text-[var(--lms-heading)] min-[768px]:text-[var(--lms-font-xl)] min-[768px]:leading-7">Needs you</h2>
      <p className="text-xs text-muted-foreground">Only active drives belonging to your selected college and company appear here.</p>
      {actionQueue.length ? <ul className="min-w-0 divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">
        {actionQueue.map(task => <li key={task.key}>
          <Link href={task.href} className="block min-h-11 min-w-0 py-4 hover:bg-primary-subtle min-[768px]:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-body">
              <span aria-label={task.tone==="URGENT"?"Urgent":task.tone==="SOON"?"Soon":"When you can"}
                className={"inline-block size-2 rounded-full "+(task.tone==="URGENT"?"bg-error":task.tone==="SOON"?"bg-warning":"bg-info")}/>
              <Badge tone={task.tone==="URGENT"?"error":task.tone==="SOON"?"warning":"info"}>
                {task.tone==="URGENT"?"Urgent":task.tone==="SOON"?"Soon":"When you can"}
              </Badge>
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
      </ul> : !recentJobCapReached && collegeJobs.length===0 && requestCount===0 ? (
        <div className="min-w-0 py-4">
          <h3 className="font-semibold text-[var(--lms-heading)]">Start with your first drive</h3>
          <ol className="mt-3 list-inside list-decimal space-y-2 text-sm text-body">
            <li>Describe the role, pay and how you select. It takes a few minutes, and your draft is kept as you type.</li>
            <li>The placement cell reviews it, sets the dates and publishes it to students.</li>
            <li>Applicants show up here; you review them one by one and send results to the placement cell.</li>
          </ol>
          <Link href={recruiterDriveDraftHref({collegeId:selectedId})}
            className="mt-4 inline-flex min-h-11 min-[768px]:min-h-9 items-center rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-[650] text-on-primary hover:border-[var(--lms-button-primary-hover)] hover:bg-[var(--lms-button-primary-hover)] active:border-[var(--lms-button-primary-hover)] active:bg-[var(--lms-button-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
            Request your first drive
          </Link>
        </div>
      ) : (
        <EmptyState title="You are all caught up"
          description="New applicants, replies and decisions from the placement cell will show up here." />
      )}
    </section>

    <details open={waitingRequests.length > 0 || Boolean(conversationSignals?.waiting.length)} className="min-w-0 border-b border-[var(--lms-canvas-border)] pb-4">
      <summary className="flex min-h-11 cursor-pointer items-center text-[16px] font-semibold leading-[26px] text-[var(--lms-heading)] min-[768px]:text-[18px] min-[768px]:leading-7 min-[992px]:text-[20px] min-[992px]:leading-[30px]">With the placement cell</summary>
      <p className="mt-2 text-sm text-body">Formal requests awaiting a college decision. Results and selections require recorded submissions.</p>
      {!requestsResult.ok?<p role="alert" className="mt-3 text-sm text-muted-foreground">Drive request status unavailable. Retry before treating this as empty.</p>:null}
      {waitingRequests.length?<ul className="mt-4 min-w-0 divide-y divide-[var(--lms-canvas-border)]">
        {waitingRequests.map(request=><li key={request.id}>
          <Link href={"/recruiter/drives/new?collegeId="+encodeURIComponent(selectedId)+(request.status==="SENT_BACK"?"&fix=":"&edit=")+encodeURIComponent(request.id)}
            className="block rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] p-4 text-sm text-primary-text min-h-11 min-[768px]:min-h-9 hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
            <span className="block font-semibold">{request.title}</span>
            <span className="mt-1 block text-xs text-body">
              {request.status==="REQUEST"?"Sent for review":"Needs your changes"}
            </span>
          </Link>
        </li>)}
      </ul>:<p role="status" className="mt-3 text-sm text-muted-foreground leading-[1.6]">
        {requestsResult.ok?"No formal drive requests are waiting at this college.":"Request count is unavailable."}
      </p>}
      <h3 className="mt-4 font-semibold text-[var(--lms-heading)]">Conversations waiting for a reply</h3>
      <p className="mt-1 text-sm text-body">These conversations were last updated by you. This does not prove a reply is due.</p>
      {conversationResult.status==="rejected" ? <p role="alert" className="mt-3 text-sm text-muted-foreground">Conversation status unavailable.</p> : conversationSignals?.waiting.length?<ul className="mt-4 grid gap-3 min-[768px]:grid-cols-2">
        {conversationSignals.waiting.map(row=><li key={row.id}>
          <Link href={row.href} className="block rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] p-4 text-sm text-primary-text min-h-11 min-[768px]:min-h-9 hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
            {row.label} · Last message from you
          </Link>
        </li>)}
      </ul>:<p role="status" className="mt-3 text-sm text-muted-foreground leading-[1.6]">
        No recruiter-last-sent conversations on the visible inbox page.
      </p>}
      {conversationSignals?.limitedToCurrentPage?<Link
        href={"/hr/conversations?collegeId="+encodeURIComponent(selectedId)}
        className="mt-3 inline-flex min-h-11 min-[768px]:min-h-9 items-center text-sm text-primary-text hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
        View all conversations
      </Link>:null}
    </details>
      </div>
      <div className="min-w-0">    <section aria-label="This week" className="border-b border-[var(--lms-canvas-border)] pb-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[var(--lms-font-lg)] font-semibold leading-[26px] text-[var(--lms-heading)] min-[768px]:text-[var(--lms-font-xl)] min-[768px]:leading-7">This week</h2>
        <Link href={"/hr/calendar?collegeId="+encodeURIComponent(selectedId)} className="inline-flex min-h-11 items-center text-sm text-primary-text hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Full calendar</Link>
      </div>
      {calendarResult.status==="rejected" ? <p role="alert" className="mt-3 text-sm text-muted-foreground">Calendar unavailable. Retry before checking this week's schedule.</p> :
      weekEvents.length?<ul className="mt-4 min-w-0 divide-y divide-[var(--lms-canvas-border)]">
        {weekEvents.map(item=><li key={item.id}>
          <Link href={item.href} className="block min-h-11 min-w-0 break-words py-3 hover:bg-primary-subtle min-[768px]:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
            <span className="block text-xs font-semibold text-muted-foreground">{item.kind.replaceAll("_"," ")}</span>
            <span className="mt-1 block font-semibold text-foreground">{item.title}</span>
            <span className="mt-1 block text-sm text-body">{item.jobTitle}</span>
            <span className="mt-1 block text-xs text-muted-foreground">
              {item.dayLabel ? item.dayLabel+" · ":""}{new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",weekday:"short",day:"numeric",month:"short",hour:"numeric",minute:"2-digit",hour12:true}).format(item.startsAt)} IST
            </span>
          </Link>
        </li>)}
      </ul>:<p className="mt-3 text-sm text-muted-foreground">Nothing scheduled here in the next 7 days.</p>}
    </section>
</div>
    </div>
    <details className="min-w-0 border-b border-[var(--lms-canvas-border)] pb-4">
      <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-[var(--lms-heading)]">Quick numbers</summary>
      <section aria-label="Recruiter tasks" className="mt-3 grid min-w-0 grid-cols-1 overflow-hidden rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] min-[768px]:grid-cols-3">{actions.map(action=>
      <Link key={action.label} href={action.url} className="flex min-h-11 min-w-0 items-center justify-between gap-3 border-b border-[var(--lms-canvas-border)] p-3 hover:bg-primary-subtle min-[768px]:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
        <span className="block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">{action.label}</span><span className="shrink-0 text-[20px] font-semibold leading-[1.3] tabular-nums text-[var(--lms-heading)]">{action.value}</span>
      </Link>)}</section>
    </details>
    <section aria-label="Live recruiter hiring drives" className="border-b border-[var(--lms-canvas-border)] pb-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[var(--lms-font-lg)] font-semibold leading-[26px] text-[var(--lms-heading)] min-[768px]:text-[var(--lms-font-xl)] min-[768px]:leading-7">Live drive</h2>
        <Link href={"/hr/drives?collegeId="+encodeURIComponent(selectedId)+"&view=LIVE"}
          className="inline-flex min-h-11 items-center text-sm text-primary-text hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">See all live drives</Link>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Applicant counts here show only applicants the placement cell has explicitly shared with you. They are not total college applications; private or unshared submissions are not visible.</p>
      {liveDrives.length?<div className="mt-4 min-w-0 divide-y divide-[var(--lms-canvas-border)]">
        {liveDrives.map(row=><Link key={row.job.id}
          href={"/recruiter/drives/"+encodeURIComponent(row.job.id)}
          className="block min-w-0 break-words py-4 hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
          <span className="block break-words font-semibold text-foreground">{row.job.title}</span>
          {liveDriveCounts&&row.job.id===mostSharedLiveId&&liveDrives.length>1&&(liveDriveCounts[row.job.id]?.sharedApplicants??0)>0?<Badge  tone="neutral" className="mt-1">Most shared applicants in this preview</Badge>:null}
          <span className="mt-1 block text-xs text-muted-foreground">
            {row.job.applicationDeadline?"Applications close "+when(row.job.applicationDeadline)+" IST":"No deadline recorded"}
          </span>
          <span className="mt-2 block text-sm font-semibold text-foreground">
            {liveDriveCounts ? `${liveDriveCounts[row.job.id]?.sharedApplicants??0} shared applicants` : "Shared applicant count unavailable"}
          </span>
          {liveDriveCounts&&(liveDriveCounts[row.job.id]?.sharedApplicants??0)===0?
            <span className="mt-1 block text-xs text-muted-foreground">No shortlisted applicants have been shared yet.</span>:null}
          <span className="mt-2 block text-sm text-primary-text">Open hiring drive →</span>
        </Link>)}
      </div>:<p className="mt-3 text-sm text-muted-foreground">No live, non-archived drives for this employer and college.</p>}
    </section>
    <details open={today.dueSoon.length > 0} className="min-w-0 border-b border-[var(--lms-canvas-border)] pb-4">
      <summary className="flex min-h-11 cursor-pointer items-center text-[16px] font-semibold leading-[26px] text-[var(--lms-heading)] min-[768px]:text-[18px] min-[768px]:leading-7 min-[992px]:text-[20px] min-[992px]:leading-[30px]">Actionable deadlines</summary>
      {today.dueSoon.length ? <div className="mt-4 min-w-0 divide-y divide-[var(--lms-canvas-border)]">{today.dueSoon.map(item =>
        <Link key={item.job.id} href={"/recruiter/drives/" + item.job.id}
          className="block min-h-11 min-w-0 break-words py-3 hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"><span className="block font-medium text-foreground">{item.job.title}</span>
          <span className="mt-1 block text-sm text-body">Applications close {when(item.job.applicationDeadline!)}</span></Link>)}</div> :
        <p className="mt-3 text-sm text-muted-foreground">No application deadlines in the next seven days.</p>}
    </details>
    <details open={today.upcomingRounds.length > 0} className="min-w-0 border-b border-[var(--lms-canvas-border)] pb-4">
      <summary className="flex min-h-11 cursor-pointer items-center text-[16px] font-semibold leading-[26px] text-[var(--lms-heading)] min-[768px]:text-[18px] min-[768px]:leading-7 min-[992px]:text-[20px] min-[992px]:leading-[30px]">This week · upcoming rounds</summary>
      {calendarResult.status==="rejected" ? <p role="alert" className="mt-3 text-sm text-muted-foreground">Round calendar unavailable. Use Retry above.</p> :
      today.upcomingRounds.length ? <div className="mt-4 min-w-0 divide-y divide-[var(--lms-canvas-border)]">{today.upcomingRounds.map(event =>
        <Link key={event.id} href={"/recruiter/drives/" + event.jobId + "?tab=rounds"}
          className="block min-h-11 min-w-0 break-words py-3 hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"><span className="block font-medium text-foreground">{event.title}</span>
          <span className="mt-1 block text-sm text-body">{event.jobTitle} · {when(event.startsAt)}</span></Link>)}</div> :
        <p className="mt-3 text-sm text-muted-foreground">No upcoming scheduled rounds for this college during this week.</p>}
    </details>
    <details open={dueResults.length > 0} className="min-w-0 border-b border-[var(--lms-canvas-border)] pb-4">
      <summary className="flex min-h-11 cursor-pointer items-center text-[16px] font-semibold leading-[26px] text-[var(--lms-heading)] min-[768px]:text-[18px] min-[768px]:leading-7 min-[992px]:text-[20px] min-[992px]:leading-[30px]">Results due this week</summary>
      <p className="mt-1 text-sm text-body">Recorded result deadlines on authorized employer rounds. A past timestamp alone does not establish that results remain outstanding.</p>
      {calendarResult.status==="rejected" ? <p role="alert" className="mt-3 text-sm text-muted-foreground">Result deadlines unavailable. Use Retry above.</p> :
      dueResults.length ? <div className="mt-4 min-w-0 divide-y divide-[var(--lms-canvas-border)]">{dueResults.map(item =>
        <Link key={item.id} href={hrResultsDueHref(item.jobId,item.id)}
          className="block min-h-11 min-w-0 break-words py-3 hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
          <span className="block break-words font-medium text-foreground">{item.roundName}</span>
          <span className="mt-1 block text-sm text-body">{item.jobTitle} · {when(item.dueAt)} IST</span>
          <Badge  tone="neutral" className="mt-2">
            {HR_DEADLINE_URGENCY_LABELS[hrResultDeadlineUrgency(item.dueAt,now)]}
          </Badge>
        </Link>)}</div> : <p className="mt-3 text-sm text-muted-foreground">No upcoming results deadlines are recorded for this college this week.</p>}
    </details>
    <section aria-label="Unread placement-cell conversations"
      className="border-b border-[var(--lms-canvas-border)] pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[var(--lms-font-lg)] font-semibold leading-[26px] text-[var(--lms-heading)] min-[768px]:text-[var(--lms-font-xl)] min-[768px]:leading-7">Replies to read</h2>
        <Link href={hrConversationsHref({collegeId:selectedId,q:"",unreadOnly:"true",page:1})}
          className="inline-flex min-h-11 items-center text-sm text-primary-text hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">View unread conversations</Link>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Only employer-owned threads from your selected college. No message bodies appear on Today.
      </p>
      {conversationResult.status==="rejected" ? <p role="alert" className="mt-3 text-sm text-muted-foreground">Unread conversations unavailable. Use Retry above before drawing conclusions.</p> : conversationSignals?.unread.length?<ul className="mt-4 min-w-0 divide-y divide-[var(--lms-canvas-border)]">
        {conversationSignals.unread.map(row=><li key={row.id}>
          <Link href={row.href} className="block min-h-11 min-w-0 break-words py-3 hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] min-[768px]:min-h-9">
            <span className="block break-words font-semibold text-primary-text">{row.label}</span>
            <span className="mt-1 block text-sm text-body">{row.unread} unread placement-cell messages</span>
          </Link>
        </li>)}
      </ul>:<p role="status" className="mt-3 text-sm text-muted-foreground leading-[1.6]">
        No unread placement-cell conversations on this inbox page.
      </p>}
    </section>

    <details className="min-w-0"><summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-[var(--lms-heading)]">More recruiter links</summary><div className="flex flex-wrap gap-x-4 gap-y-2 text-sm"><Link className="min-h-11 md:min-h-9 inline-flex items-center text-primary-text hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]" href={"/hr/drives?collegeId=" + encodeURIComponent(selectedId)}>Browse drives</Link>
      <Link className="min-h-11 md:min-h-9 inline-flex items-center text-primary-text hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]" href={"/hr/company?collegeId=" + encodeURIComponent(selectedId)}>Company & Team</Link>
      <Link className="min-h-11 md:min-h-9 inline-flex items-center text-primary-text hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]" href={"/recruiter/messages?collegeId="+encodeURIComponent(selectedId)}>Messages</Link>
      <Link className="min-h-11 md:min-h-9 inline-flex items-center text-primary-text hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]" href={"/hr/activity?collegeId="+encodeURIComponent(selectedId)}>Hiring activity</Link>
      <Link className="min-h-11 md:min-h-9 inline-flex items-center text-primary-text hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]" href="/hr/profile">Your profile</Link></div></details>
  </div>;
}
