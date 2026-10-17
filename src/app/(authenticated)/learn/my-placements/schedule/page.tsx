import Link from "next/link";
import { Suspense } from "react";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { LearnerCareerCalendar } from "@/components/placements/learner-career-calendar";
import { initialCareerCalendarDay } from "@/modules/placements/learner-career-calendar-model";
import { getLearnerPlacementRequestWorkspace } from "@/modules/placements/request-service";
import { partitionLearnerPlacementSchedule,learnerRoundIsDayOnly } from "@/modules/placements/learner-placement-schedule-model";
import {LearnerScheduleReschedule} from "@/components/placements/learner-schedule-reschedule";
import {listOwnAppliedPlacementResults} from "@/modules/placements/result-service";

/** Dev legacy combines all learner rounds on one authorized Schedule page. */
export default async function LearnerPlacementSchedulePage({searchParams}:{
  searchParams:Promise<{view?:string|string[]}>;
}) {
  const query=await searchParams;
  const requested=typeof query.view==="string"?query.view:"coming";
  const view=requested==="past"||requested==="calendar"?requested:"coming";
  const context = await getCurrentRequestContext();
  const [workspace,ownResults]=await Promise.all([
    getLearnerPlacementRequestWorkspace(context),listOwnAppliedPlacementResults(context),
  ]);
  const outcomeByRound=new Map(ownResults.map(row=>[row.applicationId+":"+row.roundId,row]));
  const now = new Date();
  type WorkspaceRound = typeof workspace.rounds[number];
  const { ahead, past, undated } = partitionLearnerPlacementSchedule(workspace.rounds, now) as {
    ahead: WorkspaceRound[]; past: WorkspaceRound[]; undated: WorkspaceRound[];
  };
  const today = initialCareerCalendarDay();
  const rounds = workspace.rounds.map(row => ({
    ...row,
    scheduledAt: row.scheduledAt?.toISOString() ?? null,
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
  const todayKey=dateKey(now),tomorrowKey=dateKey(new Date(now.getTime()+86400000));
  const dayLabel=(date:Date|null)=>{
    if(!date)return "Date to be told";
    const key=dateKey(date);
    return (key===todayKey?"Today":key===tomorrowKey?"Tomorrow":
      new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",weekday:"long"}).format(date))+
      " · "+new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",day:"numeric",month:"short"}).format(date);
  };
  const fmt = (date: Date | null) => date
    ? new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium",
        ...(learnerRoundIsDayOnly(date)?{}:{timeStyle:"short" as const}) }).format(date)+
      (learnerRoundIsDayOnly(date)?" · Time to be told":"")
    : "Date to be told";
  const details = (row: typeof workspace.rounds[number]) => {
    const outcome=outcomeByRound.get(row.applicationId+":"+row.roundId);
    const outcomeText=outcome?.outcome==="PASS"?"Cleared":
      outcome?.outcome==="FAIL"?"Not cleared":
      outcome?.outcome==="ABSENT"?"Marked absent":
      outcome?.outcome==="HOLD"?"Waitlisted":null;
    const mode=row.exception?.mode??row.mode;
    const venue=row.exception?.venue??row.venue;
    const join=row.exception?.meetingUrl??row.meetingUrl;
    return <div className="mt-2 space-y-2 text-sm text-body">
      <p>{row.roundKind.replaceAll("_"," ")} · {mode==="VIRTUAL"?"Online":mode==="ON_CAMPUS"?"On campus":mode} · {row.durationMinutes!=null?row.durationMinutes+" minutes":"Duration to be told"}</p>
      <p>{venue?"Venue: "+venue:"Venue to be told"}</p>
      <div className="flex flex-wrap gap-3">
        {join&&/^https:\/\//i.test(join)?<a href={join} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary-text underline">Join online round</a>:null}
        {row.testUrl&&/^https:\/\//i.test(row.testUrl)?<a href={row.testUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary-text underline">Open test</a>:null}
      </div>
      {row.exception ? (
        <p role="status" className="text-xs font-semibold text-primary-text">
          Rescheduled · The time, venue and links shown above are the latest recorded booking.
        </p>
      ) : null}
      <p className="text-xs font-semibold text-body">
        {row.booked ? "Booked for this round" : "Round scheduled · Individual booking not yet recorded"}
      </p>
      {outcomeText?<p role="status" className="font-semibold text-foreground">{outcomeText} · Confirmed round result</p>:
        <p className="text-xs text-muted-foreground">Expected · The round schedule is not an attendance confirmation or final outcome.</p>}
    </div>;
  };
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="My Placements" title="Schedule"
        description="Your tests, talks and interviews. When the placement cell books you, it shows here and you get a notice; review your booking details and ask to reschedule if you cannot attend" />
      <nav aria-label="Schedule view" className="flex flex-wrap gap-2">
        {([
          ["coming","Coming up"],["past","Past"],["calendar","Calendar"],
        ] as const).map(([key,label])=><Link key={key}
          href={"/learn/my-placements/schedule?view="+key} aria-current={view===key?"page":undefined}
          className={"inline-flex min-h-11 items-center rounded-md border px-4 text-sm font-semibold "+
            (view===key?"border-primary bg-primary-subtle text-primary-text":"border-border text-foreground")}>
          {label}
        </Link>)}
      </nav>
      {view==="coming"?<section className="space-y-3" aria-label="Coming up">
        <h2 className="text-lg font-semibold text-foreground">Coming up ({ahead.length} dated)</h2>
        {ahead.length === 0 && undated.length === 0 ? <p className="text-body">Nothing coming up. When a company&apos;s round is planned, it shows here.</p> : null}
        {ahead.length === 0 && undated.length > 0 ? <p role="status" className="text-sm text-body">
          {undated.length} upcoming round(s) have no confirmed time yet. Check the details below.
        </p> : null}
        {ahead.map(row => <article key={row.roundId+":"+row.applicationId} className="rounded-xl border border-border bg-surface p-4">
          <p className="mb-1 text-xs font-semibold uppercase text-primary-text">{dayLabel(row.exception?.scheduledAt??row.scheduledAt)}</p>
          <h3 className="font-semibold text-foreground">{row.roundName} · {row.companyName}</h3>
          <p className="text-sm text-body">{row.roleTitle} · {fmt(row.exception?.scheduledAt ?? row.scheduledAt)}</p>
          {details(row)}
          <LearnerScheduleReschedule applicationId={row.applicationId} roundId={row.roundId}
            mode={(row.exception?.mode??row.mode)==="VIRTUAL"?"VIRTUAL":"ON_CAMPUS"} venue={row.exception?.venue??row.venue}
            meetingUrl={row.exception?.meetingUrl??row.meetingUrl}/>
          <Link className="text-sm font-semibold text-primary-text underline" href={"/learn/my-placements/applications/"+row.applicationId}>See where your applications stand</Link>
        </article>)}
        {ahead.length === 0 ? <Link className="text-sm font-semibold text-primary-text underline" href="/learn/my-placements/applications">See where your applications stand</Link> : null}
        {undated.map(row => <article key={row.roundId+":"+row.applicationId} className="rounded-xl border border-border bg-surface p-4">
          <h3 className="font-semibold text-foreground">{row.roundName} · {row.companyName}</h3>
          <p className="text-sm text-body">Date to be told</p>
          {details(row)}
        </article>)}
      </section>:null}
      {view==="calendar"?<section aria-label="Calendar" className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Calendar</h2>
        <Suspense fallback={<p role="status">Calendar</p>}>
          <LearnerCareerCalendar initialAnchor={today} todayAnchor={today} rounds={rounds} surface="schedule" />
        </Suspense>
      </section>:null}
      {view==="past"?<section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Past</h2>
        {past.length === 0 ? <p className="text-body">No past rounds yet.</p> : past.map(row =>
          <article key={row.roundId+":"+row.applicationId} className="rounded-xl border border-border bg-surface p-4">
            <h3 className="font-semibold text-foreground">{row.roundName} · {row.companyName}</h3>
            <p className="text-sm text-body">{fmt(row.exception?.scheduledAt ?? row.scheduledAt)}</p>
            {details(row)}
          </article>)}
      </section>:null}
    </div>
  );
}
