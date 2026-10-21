import { Tabs } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { ErrorState } from "@/components/ui/error-state";
import { AuthorizationError } from "@/modules/permissions/policy";
import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import { ThirdPartyLink } from "@/components/ui/third-party-link";
import { Suspense } from "react";
import { getCurrentRequestContext } from "@/auth/request-context";
import { LearnerCareerCalendar } from "@/components/placements/learner-career-calendar";
import { initialCareerCalendarDay,shiftCareerCalendarDay } from "@/modules/placements/learner-career-calendar-model";
import {getLearnerCalendarExtras} from "@/modules/placements/learner-calendar-extras-service";
import {loadLearnerCareerCalendarSupplements} from "@/modules/placements/learner-career-calendar-feed-service";
import { getLearnerPlacementRequestWorkspace } from "@/modules/placements/request-service";
import { partitionLearnerPlacementSchedule,learnerRoundIsDayOnly } from "@/modules/placements/learner-placement-schedule-model";
import {LearnerScheduleReschedule} from "@/components/placements/learner-schedule-reschedule";
import {LearnerRoundConfirmAttendance} from "@/components/placements/learner-round-confirm-attendance";
import {listOwnAppliedPlacementResults} from "@/modules/placements/result-service";

/** Dev legacy combines all learner rounds on one authorized Schedule page. */
export default async function LearnerPlacementSchedulePage({searchParams}:{
  searchParams:Promise<{view?:string|string[]}>;
}) {
  const query=await searchParams;
  const requested=typeof query.view==="string"?query.view:"coming";
  const view=requested==="past"?"past":requested==="calendar"||requested==="month"?"calendar":"coming";
  const context = await getCurrentRequestContext();
  const today = initialCareerCalendarDay();
  const extraStart=shiftCareerCalendarDay(today,"day",-180);
  const extraEnd=shiftCareerCalendarDay(today,"day",180);
  const [workspaceResult,resultsResult,extrasResult]=await Promise.allSettled([
    getLearnerPlacementRequestWorkspace(context),
    listOwnAppliedPlacementResults(context),
    getLearnerCalendarExtras(context,extraStart,extraEnd),
  ]);
  if(workspaceResult.status==="rejected"){
    if(workspaceResult.reason instanceof AuthorizationError)throw workspaceResult.reason;
    return <div className="min-w-0 space-y-4"><PageHeader title="Schedule"/>
     <ErrorState title="Could not load your schedule"
      description="The schedule is unavailable; no empty list has been assumed."
      action={<Link href="/learn/my-placements/schedule" className="inline-flex min-h-11 items-center text-link underline md:min-h-9">Retry schedule</Link>}/>
    </div>;
  }
  const workspace=workspaceResult.value;
  const resultsUnavailable=resultsResult.status==="rejected";
  const extrasUnavailable=extrasResult.status==="rejected";
  const extras=extrasResult.status==="fulfilled"?extrasResult.value:null;
  const deadlineExtras=view==="calendar"
    ? await loadLearnerCareerCalendarSupplements(context).catch(()=>({
      supplements:[],warnings:["Un-applied job deadlines could not be loaded."]
    })) : null;
  const ownResults=resultsResult.status==="fulfilled"?resultsResult.value:[];
  const outcomeByRound=new Map(ownResults.map(row=>[row.applicationId+":"+row.roundId,row]));
  // Newest request wins. A pending move must suppress attendance actions
  // until the placement cell responds, even if the original booking is live.
  const rescheduleByRound=new Map<string,typeof workspace.requests[number]>();
  for(const item of workspace.requests){
    if(item.request.requestType!=="ROUND_RESCHEDULE"||!item.request.roundId)continue;
    const key=item.request.applicationId+":"+item.request.roundId;
    if(!rescheduleByRound.has(key))rescheduleByRound.set(key,item);
  }
  const now = new Date();
  const roundCanBeManaged=(row:typeof workspace.rounds[number])=>{
    const key=row.applicationId+":"+row.roundId;
    const pending=rescheduleByRound.get(key)?.request.status==="PENDING";
    const scheduled=row.exception?.scheduledAt??row.scheduledAt;
    return row.booked&&row.roundKind!=="TALK"&&!pending&&
      !outcomeByRound.has(key)&&
      scheduled!==null&&scheduled.getTime()>now.getTime();
  };
  type WorkspaceRound = typeof workspace.rounds[number];
  const { ahead, past, undated } = partitionLearnerPlacementSchedule(workspace.rounds, now) as {
    ahead: WorkspaceRound[]; past: WorkspaceRound[]; undated: WorkspaceRound[];
  };
  const needsConfirmation=ahead.filter(row=>roundCanBeManaged(row)&&!row.learnerConfirmedAt).length;
  const rounds = workspace.rounds.map(row => ({
    ...row,
    scheduledAt: row.scheduledAt?.toISOString() ?? null,
    learnerConfirmedAt:row.learnerConfirmedAt?.toISOString()??null,
    exception: row.exception ? {
      scheduledAt: row.exception.scheduledAt.toISOString(),
      timezone: row.exception.timezone,
      mode: row.exception.mode,
      venue: row.exception.venue,
      meetingUrl: row.exception.meetingUrl,
    } : null,
  }));
  const dateKey=(date:Date)=>new Intl.DateTimeFormat("en-CA",{
    timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
  }).format(date);
  const todayKey=dateKey(now),tomorrowKey=dateKey(new Date(now.getTime()+86400000)),
    yesterdayKey=dateKey(new Date(now.getTime()-86400000));
  const dayLabel=(date:Date|null)=>{
    if(!date)return "Date to be told";
    const key=dateKey(date);
    const weekday=new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",weekday:"short"}).format(date);
    const day=new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",day:"numeric",month:"short"}).format(date);
    if(key===todayKey)return "Today · "+weekday+" "+day;
    if(key===tomorrowKey)return "Tomorrow · "+weekday+" "+day;
    if(key===yesterdayKey)return "Yesterday · "+weekday+" "+day;
    return new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",weekday:"long",day:"numeric",month:"long"}).format(date);
  };
  const fmt = (date: Date | null) => date
    ? new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium",
        ...(learnerRoundIsDayOnly(date)?{}:{timeStyle:"short" as const}) }).format(date)+
      (learnerRoundIsDayOnly(date)?" · Time to be told":"")
    : "Date to be told";
  const dateTile=(date:Date|null)=>{
   if(!date)return <span aria-hidden="true" className="flex h-20 w-16 shrink-0 items-center justify-center rounded border border-border bg-muted text-xs">TBC</span>;
   return <span aria-hidden="true" className="flex h-20 w-16 shrink-0 flex-col items-center justify-center rounded border border-border bg-primary-subtle text-center">
    <span className="text-[11px] font-semibold uppercase">{new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",month:"short"}).format(date)}</span>
    <strong className="text-2xl tabular-nums">{new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",day:"numeric"}).format(date)}</strong>
    <span className="text-[11px]">{new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",weekday:"short"}).format(date)}</span>
   </span>;
  };
  const aheadByDay=new Map<string,WorkspaceRound[]>();
  for(const row of ahead){const date=row.exception?.scheduledAt??row.scheduledAt; if(!date)continue;
   const key=dateKey(date);aheadByDay.set(key,[...(aheadByDay.get(key)??[]),row]);
  }
  const groupedAhead=[...aheadByDay.entries()];
  const timeRange=(row:WorkspaceRound)=>{
   const start=row.exception?.scheduledAt??row.scheduledAt;
   if(!start)return "Date to be told";
   const duration=row.durationMinutes;
   if(duration===null||duration===undefined||duration<=0||learnerRoundIsDayOnly(start))return fmt(start);
   const end=new Date(start.getTime()+duration*60_000);
   return fmt(start)+" – "+new Intl.DateTimeFormat("en-IN",{
    timeZone:"Asia/Kolkata",hour:"numeric",minute:"2-digit",hour12:true,
   }).format(end)+" IST";
  };
  const details = (row: typeof workspace.rounds[number]) => {
    const outcome=outcomeByRound.get(row.applicationId+":"+row.roundId);
    const move=rescheduleByRound.get(row.applicationId+":"+row.roundId)?.request;
    const outcomeText=outcome?.outcome==="PASS"?"Cleared":
      outcome?.outcome==="FAIL"?"Not cleared":
      outcome?.outcome==="ABSENT"?"Marked absent":
      outcome?.outcome==="HOLD"?"Waitlisted":null;
    const mode=row.exception?.mode??row.mode;
    const venue=row.exception?.venue??row.venue;
    const join=row.exception?.meetingUrl??row.meetingUrl;
    return <div className="min-w-0 mt-2 space-y-2 text-sm text-body">
      <p>{row.roundKind.replaceAll("_"," ")} · {mode==="VIRTUAL"?"Online":mode==="ON_CAMPUS"?"On campus":mode} · {row.durationMinutes!=null?row.durationMinutes+" minutes":"Duration to be told"}</p>
      <p>{venue?"Venue: "+venue:"Venue to be told"}</p>
      <p className="whitespace-pre-wrap break-words">{row.whatToBring?.trim()?"What to bring: "+row.whatToBring:"What to bring: No instructions recorded."}</p>
      <div className="flex flex-wrap gap-3">
        {join&&/^https:\/\//i.test(join)?<ThirdPartyLink href={join} label="Join link" />:null}
        {row.testUrl&&/^https:\/\//i.test(row.testUrl)?<ThirdPartyLink href={row.testUrl} label="Open test" ariaLabel="Open test · Take online assessment" />:null}
        {row.testUrl&&row.assessmentDueAt&&(row.roundKind==="TEST"||row.roundKind==="VENDOR_TEST")?<span className="font-semibold text-body">Take it by {fmt(row.assessmentDueAt)}</span>:null}
      </div>
      {row.exception ? (
        <p role="status" className="text-xs font-semibold text-primary-text">
          Rescheduled · The time, venue and links shown above are the latest recorded booking.
        </p>
      ) : null}
      {move?.status==="PENDING" ? (
        <p role="status" className="text-xs font-semibold text-warning">Reschedule asked · Your original booking remains until the placement cell responds.</p>
      ) : move?.status==="REJECTED" ? (
        <p role="status" className="text-xs font-semibold text-body">Reschedule declined · Your original booking still applies.</p>
      ) : move?.status==="APPROVED" ? (
        <p role="status" className="text-xs font-semibold text-primary-text">Reschedule approved</p>
      ) : null}
      {move?.decisionNote && (move.status==="APPROVED"||move.status==="REJECTED") ? (
        <p className="text-sm text-body">Placement cell reply: {move.decisionNote}</p>
      ) : null}
      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        <StatusBadge tone={row.booked?"success":"neutral"}>{row.booked?"Confirmed":"Expected"}</StatusBadge>
        {!row.learnerConfirmedAt&&roundCanBeManaged(row)?<StatusBadge tone="warning">Please confirm</StatusBadge>:null}
        {move?.status==="PENDING"?<StatusBadge tone="warning">Reschedule asked</StatusBadge>:null}
      </div>
      <p className="text-xs font-semibold text-body">
        {row.booked ? "Booked for this round" : "Round scheduled · Individual booking not yet recorded"}
      </p>
      {roundCanBeManaged(row) ?
         <LearnerRoundConfirmAttendance applicationId={row.applicationId}
           roundId={row.roundId} confirmed={Boolean(row.learnerConfirmedAt)}/> :
         row.learnerConfirmedAt ? <p role="status" className="text-xs font-semibold">Attendance confirmed</p> : null}
      {outcomeText==="Marked absent" ? (
        <p className="border-l-2 border-warning bg-warning-subtle px-4 py-3 text-sm leading-[1.5] text-body">
          Marked absent. If this is wrong, tell the placement cell.
          <Link href="/learn/my-placements/placement#requests"
            className="ml-2 inline-flex min-h-[var(--lms-control-height)] max-[767px]:min-h-11 items-center font-semibold text-primary-text underline">
            Wrong? Tell the placement cell
          </Link>
        </p>
      ) : null}
      {outcomeText?<p role="status" className="font-semibold text-foreground">{outcomeText} · Confirmed round result</p>:
        <p className="text-xs text-muted-foreground">Expected · The round schedule is not an attendance confirmation or final outcome.</p>}
    </div>;
  };
  return (
    <div className="min-w-0 space-y-6">
      <PageHeader title="Schedule" description="Your tests, talks and interviews. When the placement cell books you, it shows here and you get a notice." />
      {resultsUnavailable?<p role="alert" className="border-l-2 border-warning bg-warning-subtle px-4 py-3 text-sm">Official results are unavailable. Scheduled appointments remain visible; retry to check final outcomes. <Link href="/learn/my-placements/schedule" className="font-semibold text-link underline">Retry</Link></p>:null}
      {needsConfirmation>0?<p role="alert" className="border-l-2 border-warning bg-warning-subtle px-4 py-3 text-sm font-semibold">{needsConfirmation===1?"One round needs":String(needsConfirmation)+" rounds need"} your confirmation. Check your booking time, location and application before confirming.</p>:null}
      <Tabs ariaLabel="Schedule view" value={view} renderPanel={false} items={[
        { value: "coming", label: "Coming up"+(ahead.length+undated.length?" ("+(ahead.length+undated.length)+")":""), href: "/learn/my-placements/schedule?view=coming" },
        { value: "past", label: "Past", href: "/learn/my-placements/schedule?view=past" },
        { value: "calendar", label: "Calendar", href: "/learn/my-placements/schedule?view=calendar" },
      ]} />
      {view==="coming"?<section className="space-y-3" aria-label="Coming up">
        <h2 className="text-[var(--lms-font-lg)] font-semibold leading-[26px] text-[var(--lms-heading)] min-[768px]:text-[var(--lms-font-xl)] min-[768px]:leading-7">Coming up ({ahead.length} dated)</h2>
        {ahead.length === 0 && undated.length === 0 ? <p role="status" className="flex min-h-44 items-center justify-center border-y border-border bg-[var(--lms-neutral-50)] px-6 py-12 text-center text-sm leading-[1.5] text-body">Nothing coming up. Dates will appear when the placement cell schedules a company round. <Link href="/learn/my-placements/applications" className="font-semibold text-link underline">View applications</Link></p> : null}
        {ahead.length === 0 && undated.length > 0 ? <p role="status" className="text-sm text-body">
          {undated.length} upcoming round(s) have no confirmed time yet. Check the details below.
        </p> : null}
        {groupedAhead.map(([day,dayRows])=><section key={day} aria-label={dayLabel(dayRows[0]?.exception?.scheduledAt??dayRows[0]?.scheduledAt??null)} className="space-y-2">
         <h3 className="text-sm font-semibold text-foreground">{dayLabel(dayRows[0]?.exception?.scheduledAt??dayRows[0]?.scheduledAt??null)}</h3>
         {dayRows.map(row => <article key={row.roundId+":"+row.applicationId} className="flex min-w-0 items-start gap-3 border-b border-[var(--lms-canvas-border)] py-4 min-[768px]:gap-4 min-[768px]:py-6">
          {dateTile(row.exception?.scheduledAt??row.scheduledAt)}<div className="min-w-0 flex-1">
          <h3 className="font-semibold text-[var(--lms-heading)]">{row.roundName} · {row.companyName}</h3>
          <p className="text-sm text-body">
            <Link href={"/learn/my-placements/applications/"+row.applicationId}
              className="font-semibold text-primary-text underline">{row.roleTitle}</Link>
            {" · "+fmt(row.exception?.scheduledAt ?? row.scheduledAt)}
          </p>
          {details(row)}
          {roundCanBeManaged(row) ? <LearnerScheduleReschedule applicationId={row.applicationId} roundId={row.roundId}
            mode={(row.exception?.mode??row.mode)==="VIRTUAL"?"VIRTUAL":"ON_CAMPUS"} venue={row.exception?.venue??row.venue}
            meetingUrl={row.exception?.meetingUrl??row.meetingUrl}/> : null}
          <Link className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9" href={"/learn/my-placements/applications/"+row.applicationId}>See where your applications stand</Link>
          </div>
        </article>)}</section>)}
        {ahead.length === 0 ? <Link className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9" href="/learn/my-placements/applications">See where your applications stand</Link> : null}
        {undated.map(row => <article key={row.roundId+":"+row.applicationId} className="min-w-0 border-b border-[var(--lms-canvas-border)] py-4 min-[768px]:py-6">
          <h3 className="font-semibold text-[var(--lms-heading)]">{row.roundName} · {row.companyName}</h3>
          <p className="text-sm text-body">Date to be told</p>
          {details(row)}
        </article>)}
      </section>:null}
      {view==="calendar"?<section aria-label="Calendar" className="space-y-3">
        {extrasUnavailable?<p role="alert" className="border-l-2 border-warning bg-warning-subtle px-4 py-3 text-sm">
          Calendar extras could not be loaded. Your confirmed rounds remain visible. Reload this page to retry college talks and exam dates.
        </p>:null}
        {extras?<div className="space-y-1 text-sm text-body" role="status">
          <p>College calendar extras for {extras.startDay} to {extras.endDay} (IST).</p>
          <p>{extras.talksAvailable
            ? extras.talkCount>0?extras.talkCount+" pre-placement talk(s) scheduled."
              :"No pre-placement talks in this period."
            :"Pre-placement talk dates are unavailable."}</p>
          <p>{!extras.blockedDatesAvailable
            ?"College exam/blocked dates are unavailable; no empty calendar is assumed."
            :extras.blockedDateCount>0
              ?extras.blockedDateCount+" college exam/blocked date(s)."
              :"No exam/blocked dates recorded in this period."}</p>
        </div>:null}
        {deadlineExtras?.warnings.length?<p role="alert" className="border-l-2 border-warning bg-warning-subtle px-4 py-3 text-sm">
          {deadlineExtras.warnings.join(" ")}
        </p>:null}
        <Suspense fallback={<p role="status">Calendar</p>}>
          <LearnerCareerCalendar initialAnchor={today} todayAnchor={today}
            rounds={rounds} supplements={[...(extras?.supplements??[]),...(deadlineExtras?.supplements??[])]}
            surface="schedule" />
        </Suspense>
      </section>:null}
      {view==="past"?<section aria-label="Past placement rounds" className="space-y-3">
        <h2 className="text-[var(--lms-font-lg)] font-semibold leading-[26px] text-[var(--lms-heading)] min-[768px]:text-[var(--lms-font-xl)] min-[768px]:leading-7">Past</h2>
        {past.length === 0 ? <p role="status" className="flex min-h-44 items-center justify-center border-y border-border bg-[var(--lms-neutral-50)] px-6 py-12 text-center text-sm leading-[1.5] text-body">No past rounds yet.</p> : past.map(row =>
          <article key={row.roundId+":"+row.applicationId} className="flex min-w-0 items-start gap-3 border-b border-[var(--lms-canvas-border)] bg-muted/30 py-4 min-[768px]:py-6">
            {dateTile(row.exception?.scheduledAt??row.scheduledAt)}<div className="min-w-0 flex-1">
            <h3 className="font-semibold text-[var(--lms-heading)]">{row.roundName} · {row.companyName}</h3>
            <p className="text-sm text-body">{timeRange(row)}</p>
            {details(row)}
            </div>
          </article>)}
      </section>:null}
    </div>
  );
}
