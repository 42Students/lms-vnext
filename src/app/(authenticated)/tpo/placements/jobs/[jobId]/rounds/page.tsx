import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { getPlacementDriveDay } from "@/modules/placements/drive-day-service";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import {getDb} from "@/db/client";
import {and,eq,inArray,sql} from "drizzle-orm";
import {placementLearnerRequests} from "@/db/schema";
import {hrInterviewSlots} from "@/db/schema/placement-hr-interview-slots";
import {placementRoundCandidateSlots} from "@/db/schema/placement-round-candidate-slots";

export default async function TpoDriveRoundsPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) redirect("/dashboard");
  const { jobId } = await params;
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
  const root = "/tpo/placements/jobs/" + encodeURIComponent(jobId);
  const date = (value: Date | null) =>
    value ? new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short",
    }).format(value) + " IST" : "To be scheduled";
  return <div className="min-w-0 space-y-[var(--lms-space-6)]">
    <PageHeader eyebrow="TPO · Drive workspace" title="Rounds and schedule"
      description="Plan the drive rounds, check bookings and record company results." />
    <Link href={root + "#drive-round-actions"} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-primary px-4 text-sm font-semibold text-[var(--lms-teal-deep)] md:min-h-9">
      Manage and reorder rounds
    </Link>
    {drive.rounds.length === 0
      ? <EmptyState title="No rounds planned" description="Add an evaluation round in the drive workspace before scheduling students." />
      : <div className="grid min-w-0 gap-[var(--lms-space-4)]">
        {drive.rounds.map((round) => {
          const staged = round.participants.filter(p => p.result?.status === "STAGED").length;
          const applied = round.participants.filter(p => p.result?.status === "APPLIED").length;
          return <article key={round.id} className="min-w-0 border-b border-[var(--lms-canvas-border)] py-[var(--lms-space-5)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-body">Round {round.sequence} · {round.kind}</p>
                <h2 className="mt-1 text-lg font-semibold text-foreground">{round.name}</h2>
                <p className="mt-1 flex min-w-0 flex-wrap items-center gap-2 text-sm text-body"><StatusBadge tone={round.status==="COMPLETED"?"success":round.status==="CANCELLED"?"error":round.status==="SCHEDULED"?"info":"warning"}>{round.status}</StatusBadge><span>{round.mode} · {date(round.scheduledAt)}</span></p>
              </div>
              <Link href={root + "/rounds/" + encodeURIComponent(round.id) + "/results"}
                className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-primary px-4 text-sm font-semibold text-[var(--lms-teal-deep)] md:min-h-9">
                See who / record results
              </Link>
            </div>
            <dl className="mt-4 grid min-w-0 gap-[var(--lms-space-3)] text-sm min-[768px]:grid-cols-3">
              <div><dt className="text-body">Students in round</dt><dd className="font-semibold">{round.participants.length}</dd></div>
              <div><dt className="text-body">Results</dt><dd className="font-semibold">{applied} applied · {staged} waiting to apply</dd></div>
              <div><dt className="text-body">Results expected</dt><dd>{date(round.resultsDueAt)}</dd></div>
              {round.kind==="INTERVIEW"?<>
               <div><dt className="text-body">Booked interview slots</dt>
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
              className="mt-3 inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-primary px-4 text-sm font-semibold text-[var(--lms-teal-deep)] md:min-h-9">
              Slots and rooms · {countFor(proposals,round.id)+countFor(requests,round.id)} need review
            </Link>:null}
            {round.whatToBring ? <p className="mt-3 text-sm text-body">Bring: {round.whatToBring}</p> : null}
            {round.meetingUrl ? <a href={round.meetingUrl}
              className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--lms-link-text)] underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary)] md:min-h-9">Meeting link</a> : null}
            {round.testUrl ? <a href={round.testUrl}
              className="ml-0 mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--lms-link-text)] underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary)] min-[768px]:ml-4 md:min-h-9">Test link</a> : null}
          </article>;
        })}
      </div>}
  </div>;
}
