import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Banner } from "@/components/ui/banner";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
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
import { Disclosure } from "@/components/ui/disclosure";
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";
import { istDateTimeFormatter } from "@/lib/format-date";

const dateFormat = istDateTimeFormatter;
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
  return <div className="min-w-0 space-y-6">
    <PageHeader title={drive.job.title+" · Candidate round schedule"}
      description="Review shared round schedules and open the interview slots workspace for candidate-specific bookings, room assignment and changes."
      actions={<TextLink href={"/tpo/placements/jobs/" + encodeURIComponent(drive.job.id)}
        className="inline-flex min-h-11 w-full items-center justify-center text-sm md:min-h-9 md:w-auto">← Back to drive</TextLink>} />
    <Banner tone={slotsReady ? "info" : "warning"} action={<ButtonLink variant="secondary" href="/tpo/calendar/rounds">Edit existing shared round schedules →</ButtonLink>}>
      {slotsReady ? "Candidate-specific slot booking is available from each interview round. Room-time conflicts are checked at assignment." :
      "Candidate-specific interview slots are pending migration registration. Open an interview round to see the setup status."}
    </Banner>
    <Disclosure title="Persisted venue collision assessment" defaultOpen={warning.state === "UNAVAILABLE" || warning.collisions > 0 || warning.unknown > 0 || warning.warnings.length > 0}>
      {warning.state === "UNAVAILABLE" ?
        <Alert tone="warning">Assessment unavailable; no conflict-free claim is made.</Alert>
        : <p className="mt-2 text-sm text-body leading-[22px]">
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
    </Disclosure>
    <div className="flex min-w-0 gap-2 overflow-x-auto pb-2 md:flex-wrap md:overflow-visible md:pb-0">
      {drive.rounds.filter(round=>round.kind==="INTERVIEW").map(round=>
        <ButtonLink variant="secondary" key={round.id} href={"/tpo/placements/jobs/"+encodeURIComponent(drive.job.id)+"/rounds/"+encodeURIComponent(round.id)+"/slots"}
          className="shrink-0">
          Slots and rooms · {round.name}
        </ButtonLink>)}
    </div>
    {roundId ? (
      <div className="flex flex-wrap items-center gap-3 text-sm">
        {selectedRound ? <p className="font-semibold text-foreground">Round: {selectedRound.name}</p>
          : <Alert tone="error">That round is not part of this drive.</Alert>}
        <TextLink href={"/tpo/placements/jobs/"+encodeURIComponent(drive.job.id)+"/candidate-schedule"}
          className="inline-flex min-h-11 items-center">Show all rounds</TextLink>
      </div>
    ) : null}
    {drive.rounds.length === 0 ?
      <EmptyState title="No persisted rounds exist for this drive." /> : roundId && !selectedRound ?
      <EmptyState title="No candidates shown for an unknown round." />
      : readiness.total === 0 ?
      <EmptyState title="No progression-eligible round participants are currently recorded. This does not imply slots were assigned." /> : <>
        <p className="text-sm text-body leading-[22px]">
          {roundId ? displayed.length+" candidate entries shown for this round." : readiness.total+" round-candidate combinations found."}
          {readiness.limited ? " Only the first 1,000 combined round entries were loaded; the selected round may be incomplete." : ""}
        </p>
        <DataTable
          caption="Candidate schedule"
          rows={displayed}
          getRowKey={item=>item.roundId+":"+item.applicationId}
          empty={<EmptyState title="No progression-eligible round participants are currently recorded. This does not imply slots were assigned." />}
          columns={[
            {key:"name",header:"Candidate",cell:item=>item.name,mobilePriority:"primary"},
            {key:"round",header:"Round",cell:item=>item.roundName,mobilePriority:"secondary"},
            {key:"when",header:"Shared start (IST)",cell:item=>item.roundStartIso
              ?dateFormat.format(new Date(item.roundStartIso))+" IST":"Not scheduled",mobilePriority:"secondary"},
            {key:"venue",header:"Round venue",cell:item=>item.roundVenue??"Not recorded",mobilePriority:"secondary"},
            {key:"slot",header:"Candidate slot",cell:item=>item.candidateSlot??"Not recorded in this round view",mobilePriority:"secondary"},
            {key:"panel",header:"Panel",cell:item=>item.panelAssignment??"Not recorded in this round view",mobilePriority:"secondary"},
          ]}
        />
      </>}
    <p className="max-w-prose text-xs text-muted-foreground leading-[1.6]">
      Candidate slot assignments, if registered, are maintained in the dedicated slots workspace. This page shows shared-round planning only.
      Date/time evidence comes from migrated round timestamps and is presented
      explicitly in the Asia/Kolkata timezone.
    </p>
  </div>;
}
