import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { notFound, redirect } from "next/navigation";
import { PlacementsServiceError } from "@/modules/placements/errors";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { placementTableExists } from "@/modules/placements/staged-tables";
import {tpoReportHasAmbiguousFilters} from "@/modules/placements/tpo-report-url-guard";
import {TpoReportInvalidFilters} from "@/components/placements/tpo-report-invalid-filters";
import {
  getTpoCandidateScheduleReadiness,
} from "@/modules/placements/tpo-candidate-schedule-service";

const dateFormat = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata",
});
export default async function TpoCandidateSchedulePage({
  params, searchParams,
}: { params: Promise<{ jobId: string }>; searchParams: Promise<{roundId?:string|string[]}> }) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) redirect("/dashboard");
  const { jobId } = await params;
  const query = await searchParams;
  if(tpoReportHasAmbiguousFilters(query))return <TpoReportInvalidFilters path={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/candidate-schedule"}/>;
  let result: Awaited<ReturnType<typeof getTpoCandidateScheduleReadiness>>;
  try {
    result = await getTpoCandidateScheduleReadiness(context, jobId);
  } catch (error) {
    if (error instanceof PlacementsServiceError &&
      error.code === "PLACEMENT_JOB_NOT_FOUND") notFound();
    throw error;
  }
  const { drive, readiness, warning } = result;
  const slotsReady=await placementTableExists("placement_round_candidate_slots");
  const roundId = typeof query.roundId === "string" ? query.roundId : null;
  const selectedRound = roundId ? drive.rounds.find(round => round.id === roundId) : null;
  const displayed = roundId ? readiness.displayed.filter(row => row.roundId === roundId) : readiness.displayed;
  return <div className="min-w-0 space-y-5">
    <PageHeader title={drive.job.title+" · Candidate round schedule"}
      description="Review shared round schedules and open the interview slots workspace for candidate-specific bookings, room assignment and changes."
      actions={<Link href={"/tpo/placements/jobs/" + encodeURIComponent(drive.job.id)}
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-primary-text md:min-h-9">← Back to drive</Link>} />
    <section role="status" className="text-sm text-body border-b border-border pb-6">
      {slotsReady ? "Candidate-specific slot booking is available from each interview round. Room-time conflicts are checked at assignment." :
      "Candidate-specific interview slots are pending migration registration. Open an interview round to see the setup status."}
      <Link href="/tpo/calendar/rounds" className="ml-2 font-semibold text-link">
        Edit existing shared round schedules →
      </Link>
    </section>
    <section className="border-b border-border pb-6">
      <h2 className="font-semibold text-foreground">Persisted venue collision assessment</h2>
      {warning.state === "UNAVAILABLE" ?
        <p className="mt-2 text-sm text-body">Assessment unavailable; no conflict-free claim is made.</p>
        : <p className="mt-2 text-sm text-body">
          {warning.collisions} overlap warning(s) and {warning.unknown} unassessable
          round(s). {warning.state === "LIMITED" ?
            "The 90-day scan was truncated, so this is incomplete." :
            "Only current persisted on-campus venue/time overlaps are assessed."}
        </p>}
      {warning.warnings.length > 0 ?
        <ul className="mt-3 list-disc space-y-1 pl-6 text-sm text-body">
          {warning.warnings.flatMap(entry => entry.messages.map((message, i) =>
            <li key={entry.roundId + "-" + i}>{message}</li>))}
        </ul> : null}
    </section>
    <div className="flex flex-wrap gap-2">
      {drive.rounds.filter(round=>round.kind==="INTERVIEW").map(round=>
        <Link key={round.id} href={"/tpo/placements/jobs/"+encodeURIComponent(drive.job.id)+"/rounds/"+encodeURIComponent(round.id)+"/slots"}
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-primary px-4 text-sm font-semibold text-[var(--lms-teal-deep)] md:min-h-9">
          Slots and rooms · {round.name}
        </Link>)}
    </div>
    {roundId ? (
      <div className="flex flex-wrap items-center gap-3 text-sm">
        {selectedRound ? <p className="font-semibold text-foreground">Round: {selectedRound.name}</p>
          : <p role="alert" className="font-semibold text-error">That round is not part of this drive.</p>}
        <Link href={"/tpo/placements/jobs/"+encodeURIComponent(drive.job.id)+"/candidate-schedule"}
          className="font-semibold text-link underline">Show all rounds</Link>
      </div>
    ) : null}
    {drive.rounds.length === 0 ?
      <p role="status" className="border-b border-border py-4 text-sm text-body">
        No persisted rounds exist for this drive.
      </p> : roundId && !selectedRound ?
      <p role="status" className="border-b border-border py-4 text-sm text-body">No candidates shown for an unknown round.</p>
      : readiness.total === 0 ?
      <p role="status" className="border-b border-border py-4 text-sm text-body">
        No progression-eligible round participants are currently recorded.
        This does not imply slots were assigned.
      </p> : <>
        <p className="text-sm text-body">
          {roundId ? displayed.length+" candidate entries shown for this round." : readiness.total+" round-candidate combinations found."}
          {readiness.limited ? " Only the first 1,000 combined round entries were loaded; the selected round may be incomplete." : ""}
        </p>
        <DataTable
          caption="Candidate schedule"
          rows={displayed}
          getRowKey={item=>item.roundId+":"+item.applicationId}
          empty={<p role="status">No progression-eligible round participants are currently recorded. This does not imply slots were assigned.</p>}
          columns={[
            {key:"name",header:"Candidate",cell:item=>item.name,mobilePriority:"primary"},
            {key:"round",header:"Round",cell:item=>item.roundName,mobilePriority:"secondary"},
            {key:"when",header:"Shared start (IST)",cell:item=>item.roundStartIso
              ?dateFormat.format(new Date(item.roundStartIso))+" IST":"Not scheduled",mobilePriority:"secondary"},
            {key:"venue",header:"Round venue",cell:item=>item.roundVenue??"Not recorded",mobilePriority:"secondary"},
            {key:"slot",header:"Candidate slot",cell:()=> "Unavailable",mobilePriority:"secondary"},
            {key:"panel",header:"Panel",cell:()=> "Unavailable",mobilePriority:"secondary"},
          ]}
        />
      </>}
    <p className="text-xs leading-5 text-muted-foreground">
      Candidate slot assignments, if registered, are maintained in the dedicated slots workspace. This page shows shared-round planning only.
      Date/time evidence comes from migrated round timestamps and is presented
      explicitly in the Asia/Kolkata timezone.
    </p>
  </div>;
}
