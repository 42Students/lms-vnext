import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
import {RecruiterTodayPrototype} from "@/components/hr/recruiter-today-prototype";
import { Alert } from "@/components/ui/alert";
import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { hasActiveRecruiter } from "@/modules/identity/context";
import { recruiterTodayWeek } from "@/modules/placements/recruiter-today-model";
import { projectHrTodayResultsDue } from "@/modules/placements/hr-today-results-due-model";
import { listOwnRecruiterPlacementJobs } from "@/modules/placements/recruiter-service";
import {recruiterOwnFullPortfolioTotals,recruiterVisiblePortfolioCounts} from "@/modules/placements/recruiter-portfolio-counts-service";
import {hrTodayLiveDriveRows} from "@/modules/placements/hr-today-live-drive-model";
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
import {recruiterTodayHasDriveHistory} from "@/modules/placements/recruiter-today-headline-model";
import {recruiterTodayWaitingRequests} from "@/modules/placements/recruiter-today-waiting-model";
import {recruiterTodayWeekEvents} from "@/modules/placements/recruiter-today-week-events-model";
import {HrUnsentDriveAlert} from "@/components/hr/hr-unsent-drive-alert";
import {hrDriveSessionStorageKey} from "@/modules/placements/hr-unsent-draft-storage-model";

const querySchema = z.object({collegeId: z.string().uuid().optional()}).strict();

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
          <p><strong>Active learners (approx.):</strong> {rich.studentCount??"Suppressed (fewer than 10) or unavailable"}</p>
          <p><strong>Your drives:</strong> {rich.allDriveCount??"Unavailable"} {rich.liveDriveCount!==null?(" · "+rich.liveDriveCount+" live"):""}</p>
          <div className="sm:col-span-2"><strong>Branches:</strong> {rich.branchCounts===null?"Unavailable":rich.branchCounts.length?
            <span className="mt-1 flex flex-wrap gap-1">{rich.branchCounts.map(branch=><span key={branch.branch} className="rounded border border-border px-2 py-1 text-xs">{branch.branch} · about {branch.roundedCount}</span>)}</span>:"No branch counts available for groups of at least 10"}</div>
          <div className="sm:col-span-2"><strong>Verified CGPA groups:</strong> {rich.verifiedCgpaBands===null?"Unavailable":rich.verifiedCgpaBands.length?
            <span className="mt-1 flex flex-wrap gap-1">{rich.verifiedCgpaBands.map(band=><span key={band.label} className="rounded border border-border px-2 py-1 text-xs">{band.label} · about {band.roundedCount}</span>)}</span>:"No verified CGPA bands meet the minimum group size"}</div>
          <p className="sm:col-span-2 text-xs text-muted-foreground">For learner privacy, groups under 10 are hidden and counts are rounded to the nearest five. Only verified academic evidence is included in CGPA groups.</p>
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
  // Do not present the first 500 drives as an employer's entire portfolio.
  // This separate aggregate repeats persisted grant/employer/college checks.
  const fullPortfolio=recentJobCapReached?
    await recruiterOwnFullPortfolioTotals(context,selectedId).catch(()=>null):null;
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
  const collegeJobs = jobs.filter(row => row.collegeId === selectedId && row.job.archivedAt === null);
  const dueResults = projectHrTodayResultsDue(calendar.resultsDue, collegeJobs.map(row => row.job.id));
  // Legacy recruiter Today has a conditional live-drive tile; the vNext count
  // must represent only college-shared applicants, never private applications.
  const eligibleLiveDrives=hrTodayLiveDriveRows(jobs,selectedId,recruiter.companyId,jobs.length);
  const liveDriveCounts=await recruiterVisiblePortfolioCounts(
    context,selectedId,eligibleLiveDrives.map(row=>row.job.id),
  ).catch(()=>null);
  const liveDrive=hrTodayLiveDriveRows(jobs,selectedId,recruiter.companyId,1,liveDriveCounts)[0]??null;
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
    // Only counted active, verified college-shared applicants can become review
    // actions. A shared total does not prove anyone updated their resume.
    sharedApplicantCounts:Object.entries(liveDriveCounts??{}).map(([jobId,counts])=>({
      jobId,count:counts.sharedApplicants,
    })),
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
  const collegeName=grants.find(item=>item.collegeId===selectedId)?.collegeName??"this college";
  const dateLabel=new Intl.DateTimeFormat("en-GB",{
    timeZone:"Asia/Kolkata",weekday:"long",day:"numeric",month:"long",
  }).format(now)+" · "+collegeName;
  const tasks=actionQueue.map(task=>({
    key:task.key,tone:task.tone,title:task.label,description:task.description,
    href:task.href,at:task.at instanceof Date?task.at.toISOString():null,
  }));
  const waiting=[
    ...waitingRequests.filter(item=>item.status==="REQUEST").map(item=>({
      id:"request:"+item.id,title:item.title,detail:"Sent for placement-cell review",
    })),
    ...(conversationSignals?.waiting??[]).map(item=>({
      id:"conversation:"+item.id,title:item.label,
      detail:"Last message from you; a reply has not been confirmed.",href:item.href,
    })),
  ];
  return <div className="min-w-0 max-w-full space-y-4">
    <HrUnsentDriveAlert collegeId={selectedId}
      storageKey={hrDriveSessionStorageKey(context.user.id,selectedId,null)}/>
    {grants.length>1?<NeedsDoingChips label="Choose college:" selectedKey={selectedId}
      items={grants.map(item=>({key:item.collegeId,label:item.collegeName,
        href:"/hr/home?collegeId="+encodeURIComponent(item.collegeId)}))}/>:null}
    {recentJobCapReached?<Alert tone="warning">Today uses only the 500 newest drives for its action preview.
      {fullPortfolio?" Your complete authorized portfolio has "+fullPortfolio.total+" drives.": " Full portfolio totals are unavailable."}
      Open Drives to see your entire history.</Alert>:null}
    {(summaryPartiallyUnavailable||otherSignalsUnavailable)?<Alert tone="warning">
      Some recruiter signals are unavailable: {[...unavailableSources,
        ...(!requestsResult.ok?["Drive requests"]:[]),
        ...(changeResult.status==="rejected"?["Change requests"]:[]),
        ...(slotsResult.status==="rejected"?["Interview slots"]:[]),
        ...(offersResult.status==="rejected"?["Offer actions"]:[])].join(", ")}.
      Missing information does not mean there is no work.
      <Link href={"/hr/home?collegeId="+encodeURIComponent(selectedId)}
        className="ml-2 underline">Retry</Link>
    </Alert>:null}
    <RecruiterTodayPrototype greeting={greeting.title} dateLabel={dateLabel}
      collegeName={collegeName}
      storageKey={"recruiter-today-later:"+context.user.id+":"+recruiter.companyId+":"+selectedId}
      hasDriveHistory={recruiterTodayHasDriveHistory({
        verifiedJobCount:collegeJobs.length,requestCount,jobPreviewCapped:recentJobCapReached,
      })}
      firstDriveHref={recruiterDriveDraftHref({collegeId:selectedId})}
      calendarHref={"/hr/calendar?collegeId="+encodeURIComponent(selectedId)}
      tasks={tasks}
      weekEvents={weekEvents.map(item=>({
        id:item.id,kind:item.kind,title:item.title,jobTitle:item.jobTitle,
        href:item.href,when:new Intl.DateTimeFormat("en-IN",{
          timeZone:"Asia/Kolkata",weekday:"short",hour:"numeric",minute:"2-digit",hour12:true,
        }).format(item.startsAt),
      }))}
      waiting={waiting} waitingUnavailable={!requestsResult.ok||conversationResult.status==="rejected"}
      liveDrive={liveDrive?{
        title:liveDrive.job.title,href:"/recruiter/drives/"+encodeURIComponent(liveDrive.job.id),
        deadline:liveDrive.job.applicationDeadline
          ?new Intl.DateTimeFormat("en-IN",{
            timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short",
          }).format(liveDrive.job.applicationDeadline)+" IST":null,
        sharedApplicants:liveDriveCounts?liveDriveCounts[liveDrive.job.id]?.sharedApplicants??0:null,
      }:null}/>
  </div>;
}
