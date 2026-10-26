import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { getPlacementDriveDay } from "@/modules/placements/drive-day-service";
import {getTpoInterviewSlotWorkspace} from "@/modules/placements/tpo-interview-slot-service";
import {AuthorizationError} from "@/modules/permissions/policy";
import {TpoDriveRoundsPrototypeReview} from "@/components/tpo/tpo-drive-rounds-prototype-review";
import {z} from "zod";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { ThirdPartyLink } from "@/components/ui/third-party-link";
import {getDb} from "@/db/client";
import {and,eq,inArray,sql} from "drizzle-orm";
import {placementLearnerRequests} from "@/db/schema";
import {hrInterviewSlots} from "@/db/schema/placement-hr-interview-slots";
import {placementRoundCandidateSlots} from "@/db/schema/placement-round-candidate-slots";

export default async function TpoDriveRoundsPage({
  params,searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams?:Promise<{roundId?:string|string[]}>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) redirect("/dashboard");
  const { jobId } = await params;
  const requested=searchParams?(await searchParams).roundId:undefined;
  const valid=typeof requested!=="string"||z.string().uuid().safeParse(requested).success;
  if(Array.isArray(requested)||!valid)return <div className="space-y-3">
   <PageHeader title="Rounds and schedule"/>
   <p role="alert" className="rounded-lg border border-border p-4 text-sm">Invalid round selection. No candidate schedule was loaded.</p>
   <Link href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/rounds"} className="font-semibold text-link underline">Reset selection</Link>
  </div>;
  const drive = await getPlacementDriveDay(context, jobId);
  const ids=drive.rounds.filter(r=>r.kind==="INTERVIEW").map(r=>r.id);
  const [requests,proposals,bookings]=ids.length?await Promise.all([
   getDb().select({roundId:placementLearnerRequests.roundId,n:sql<number>`count(*)::int`})
    .from(placementLearnerRequests).where(and(inArray(placementLearnerRequests.roundId,ids),
     eq(placementLearnerRequests.requestType,"ROUND_RESCHEDULE"),
     eq(placementLearnerRequests.status,"PENDING")))
    .groupBy(placementLearnerRequests.roundId),
   getDb().select({roundId:hrInterviewSlots.roundId,n:sql<number>`count(*)::int`})
    .from(hrInterviewSlots).where(and(inArray(hrInterviewSlots.roundId,ids),
     eq(hrInterviewSlots.status,"PROPOSED"))).groupBy(hrInterviewSlots.roundId),
   getDb().select({roundId:placementRoundCandidateSlots.roundId,n:sql<number>`count(*)::int`})
    .from(placementRoundCandidateSlots).where(and(inArray(placementRoundCandidateSlots.roundId,ids),
     eq(placementRoundCandidateSlots.status,"BOOKED"))).groupBy(placementRoundCandidateSlots.roundId),
  ]):[[],[],[]];
  const countFor=(rows:readonly {roundId:string|null;n:number}[],id:string)=>
    rows.find(r=>r.roundId===id)?.n??0;
  // The original workspace shows what the placement cell must do next,
  // before the round-by-round drilldown. Compute from the same scoped reads.
  const stagedTotal=drive.rounds.reduce((sum,round)=>
    sum+round.participants.filter(p=>p.result?.status==="STAGED").length,0);
  const pendingProposals=proposals.reduce((sum,row)=>sum+row.n,0);
  const pendingChanges=requests.reduce((sum,row)=>sum+row.n,0);
  const nextRound=drive.rounds.find(round=>
    round.status!=="COMPLETED"&&round.status!=="CANCELLED");
  const root = "/tpo/placements/jobs/" + encodeURIComponent(jobId);
  const chosen=typeof requested==="string"?drive.rounds.find(row=>row.id===requested)??null:drive.rounds[0]??null;
  const selectedSlots=chosen?.kind==="INTERVIEW"?await getTpoInterviewSlotWorkspace(context,jobId,chosen.id)
   .catch(error=>{if(error instanceof AuthorizationError)throw error;return null;}):null;
  const date = (value: Date | null) =>
    value ? new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short",
    }).format(value) + " IST" : "To be scheduled";
  return <div className="min-w-0 space-y-[var(--lms-space-4)]">
    <PageHeader eyebrow="TPO · Drive workspace" title="Rounds and schedule"
      description="Plan the drive rounds, check bookings and record company results."
      actions={<Link href={root + "#drive-round-actions"} className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] sm:w-auto md:min-h-9">Manage and reorder rounds</Link>} />

    <TpoDriveRoundsPrototypeReview jobId={jobId} rounds={drive.rounds}
       selectedId={typeof requested==="string"?requested:null} now={new Date()}
       slots={selectedSlots?{
        slots:selectedSlots.slots.map(item=>({
         id:item.id,startsAt:item.startsAt,room:item.room,panel:item.panel,
         status:item.status,applicationId:item.applicationId,
        })),
        roster:selectedSlots.roster.map(row=>({applicationId:row.applicationId,name:row.name})),
        reschedules:selectedSlots.reschedules.map(row=>({id:row.id,name:row.name,reason:row.reason})),
        pendingProposals:selectedSlots.recruiterProposals.length,
       }:null}/>
    <section aria-labelledby="round-next-action" className="min-w-0 space-y-3 border-b border-border pb-4">
      <h2 id="round-next-action" className="text-base font-semibold text-foreground">
        Next action for this drive
      </h2>
      {stagedTotal>0?<p className="text-sm text-body">
        <strong>{stagedTotal} results waiting to apply.</strong> Review the staged results
        with the company before moving students to the next round.
      </p>:pendingProposals+pendingChanges>0?<p className="text-sm text-body">
        <strong>{pendingProposals} recruiter slot proposals</strong> and
        <strong> {pendingChanges} reschedule requests</strong> need review.
        Confirm the interview schedule with the college and candidates.
      </p>:nextRound?<p className="text-sm text-body">
        <strong>{nextRound.name}</strong> is the next round to check.
        Confirm the schedule and record the company results when ready.
      </p>:<p className="text-sm text-body">
        No open round action is recorded. Review completion and audit history.
      </p>}
      <div className="flex flex-wrap gap-3 text-sm">
        {nextRound?<Link href={root+"/rounds/"+encodeURIComponent(nextRound.id)+"/results"}
          className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">
          Review next round results
        </Link>:null}
        {pendingProposals+pendingChanges>0?<Link href={root+"/candidate-schedule"}
          className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">
          Review schedule requests
        </Link>:null}
      </div>
    </section>
    {drive.rounds.length === 0
      ? <EmptyState title="No rounds planned" description="Add an evaluation round in the drive workspace before scheduling students." />
      : <div className="min-w-0 divide-y divide-border border-y border-border">
        {drive.rounds.map((round) => {
          const staged = round.participants.filter(p => p.result?.status === "STAGED").length;
          const applied = round.participants.filter(p => p.result?.status === "APPLIED").length;
          return <article key={round.id} id={"round-"+round.id} tabIndex={-1}
            className="min-w-0 scroll-mt-24 py-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold text-body">Round {round.sequence} · {round.kind}</p>
                <h2 className="mt-1 break-words text-base font-semibold leading-6 text-foreground">{round.name}</h2>
                <p className="mt-1 flex min-w-0 flex-wrap items-center gap-2 text-sm text-body"><StatusBadge tone={round.status==="COMPLETED"?"success":round.status==="CANCELLED"?"error":round.status==="SCHEDULED"?"info":"warning"}>{round.status}</StatusBadge><span>{round.mode} · {date(round.scheduledAt)}</span></p>
              </div>
              <Link href={root + "/rounds/" + encodeURIComponent(round.id) + "/results"}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] sm:w-auto border border-[var(--lms-field-hover-border)] bg-surface px-4 text-sm font-semibold text-link hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
                See who / record results
              </Link>
            </div>
            <dl className="mt-3 grid min-w-0 grid-cols-2 gap-3 border-t border-border pt-3 text-sm md:grid-cols-3">
              <div><dt className="text-xs text-muted-foreground">Students in round</dt><dd className="font-semibold">{round.participants.length}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Results</dt><dd className="font-semibold">{applied} applied · {staged} waiting to apply</dd></div>
              <div><dt className="text-body">Results expected</dt><dd>{date(round.resultsDueAt)}</dd></div>
              {round.kind==="INTERVIEW"?<>
               <div><dt className="text-xs text-muted-foreground">Booked interview slots</dt>
                <dd className="font-semibold">{countFor(bookings,round.id)}</dd></div>
               <div><dt className="text-body">Recruiter slot proposals</dt>
                <dd className="font-semibold">{countFor(proposals,round.id)} pending</dd></div>
               <div><dt className="text-body">Reschedule requests</dt>
                <dd className="font-semibold">{countFor(requests,round.id)} waiting for TPO</dd></div>
              </>:null}
              <div><dt className="text-body">Venue</dt><dd>{round.venue || "Venue to be told"}</dd></div>
              <div><dt className="text-body">Platform</dt><dd>{round.platform || "Not specified"}</dd></div>
              <div><dt className="text-body">Duration</dt><dd>{round.durationMinutes ? round.durationMinutes + " minutes" : "Not specified"}</dd></div>
            </dl>
            {round.kind==="INTERVIEW"?<Link href={root+"/rounds/"+encodeURIComponent(round.id)+"/slots"}
              className="mt-3 inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-4 text-sm font-semibold text-link hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
              Slots and rooms · {countFor(proposals,round.id)+countFor(requests,round.id)} need review
            </Link>:null}
            <details className="group mt-3 min-w-0 border-t border-border pt-2">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-[var(--lms-link-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] [&::-webkit-details-marker]:hidden">Round instructions and links <span aria-hidden="true" className="text-muted-foreground group-open:rotate-180">⌄</span></summary>
              <div className="flex min-w-0 flex-col gap-2 pb-2 sm:flex-row sm:flex-wrap">
            {round.whatToBring ? <p className="mt-3 text-sm text-body">Bring: {round.whatToBring}</p> : null}
            {round.meetingUrl ? <ThirdPartyLink href={round.meetingUrl} label="Meeting link"/> : null}
            {round.testUrl ? <ThirdPartyLink href={round.testUrl} label="Test link"/> : null}
              </div>
            </details>
          </article>;
        })}
      </div>}
  </div>;
}
