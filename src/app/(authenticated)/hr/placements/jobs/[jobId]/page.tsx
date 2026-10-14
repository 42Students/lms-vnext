import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { PlacementsServiceError } from "@/modules/placements/errors";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { RecruiterResultControls } from "@/components/placements/recruiter-result-controls";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { hasActiveRecruiter } from "@/modules/identity/context";
import { getHrJobRead } from "@/modules/placements/hr-job-read-service";
import { buildHrOfferOverview, hrSelectionReadyApplicationIds } from "@/modules/placements/hr-offer-selection-read-model";
import { buildHrDriveOverview } from "@/modules/placements/hr-drive-overview-model";
import { projectRecruiterRoundResults } from "@/modules/placements/recruiter-round-results-read-model";
import { hrInlineRoundResultsHref, hrInlineRoundResultFilters } from "@/modules/placements/hr-inline-round-results-model";
import { buildHrApplicantDrawer } from "@/modules/placements/hr-applicant-drawer-model";

function formatCtc(
  value: number | null,
) {
  if (value == null) return null;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function HrPlacementJobPage({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<{ tab?: string; stage?: string; applicant?: string;
    roundId?:string; outcome?:string }>;
}) {
  const context =
    await getCurrentRequestContext();
  if (!hasActiveRecruiter(context)) {
    redirect("/dashboard");
  }

  const { jobId } = await params;
  const query = await searchParams;
  let hiring: Awaited<ReturnType<typeof getHrJobRead>>;
  try {
    hiring = await getHrJobRead(context, jobId, query);
  } catch (error) {
    if ((error instanceof PlacementsServiceError && error.code === "PLACEMENT_JOB_NOT_FOUND") ||
        (error instanceof z.ZodError && !z.string().uuid().safeParse(jobId).success)) {
      notFound();
    }
    throw error;
  }
  const { workspace, filters, applicants, applicantsTruncated, offers, offersTruncated } = hiring;
  const selectedApplicant = buildHrApplicantDrawer(applicants.rows, filters.applicant);
  // eslint-disable-next-line react-hooks/purity -- current server request time is needed for offer expiry display.
  const now = new Date();
  const offerSummary = buildHrOfferOverview(offers, now);
  const selectionReadyIds = new Set(hrSelectionReadyApplicationIds(workspace.rounds));
  const driveOverview = buildHrDriveOverview({job:workspace.job,applicants:applicants.counts,offers,rounds:workspace.rounds},now);
  if (filters.applicant && !selectedApplicant) notFound();
  const selectedRound = workspace.rounds.find(round => round.id === filters.roundId) ??
    (filters.roundId ? null : workspace.rounds[0] ?? null);
  if (filters.roundId && !selectedRound) notFound();
  const inlineResults = selectedRound
    ? projectRecruiterRoundResults(workspace.rounds, selectedRound.id, filters.outcome)
    : null;
  const outcomeOptions = hrInlineRoundResultFilters(inlineResults?.counts);

  const ctc =
    workspace.job.minimumAnnualCtcInr !=
      null ||
    workspace.job.maximumAnnualCtcInr !=
      null
      ? [
          formatCtc(
            workspace.job
              .minimumAnnualCtcInr,
          ),
          formatCtc(
            workspace.job
              .maximumAnnualCtcInr,
          ),
        ]
          .filter(Boolean)
          .join(" – ")
      : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Employer Recruiter"
        title={workspace.job.title}
        description={
          workspace.company.name +
          " · " +
          workspace.college.name
        }
      />

      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge
            tone={
              workspace.job.status ===
              "PUBLISHED"
                ? "success"
                : "neutral"
            }
          >
            {workspace.job.status}
          </StatusBadge>
          <StatusBadge>
            {workspace.job.employmentType
              .toLowerCase()
              .split("_")
              .join(" ")}
          </StatusBadge>
          <StatusBadge>
            {workspace.job.workMode.toLowerCase()}
          </StatusBadge>
        </div>
        <p className="mt-4 text-sm leading-6 text-body">
          {workspace.job.description}
        </p>
        <div className="mt-4 grid gap-3 text-sm text-body sm:grid-cols-2 xl:grid-cols-4">
          <p className="m-0">
            <span className="font-semibold text-foreground">
              Locations:
            </span>{" "}
            {workspace.job.locations.length
              ? workspace.job.locations.join(
                  ", ",
                )
              : "Not specified"}
          </p>
          <p className="m-0">
            <span className="font-semibold text-foreground">
              Openings:
            </span>{" "}
            {workspace.job.openings ??
              "Not specified"}
          </p>
          <p className="m-0">
            <span className="font-semibold text-foreground">
              CTC:
            </span>{" "}
            {ctc ?? "Not specified"}
          </p>
          <p className="m-0">
            <span className="font-semibold text-foreground">
              Employer access:
            </span>{" "}
            Exact college grant
          </p>
        </div>
      </section>

      {filters.tab === "overview" ? (
        <section className="space-y-4 rounded-xl border border-border bg-surface p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h2 className="text-lg font-semibold text-foreground">Drive overview</h2>
              <p className="mt-1 text-sm text-body">Persisted employer-visible pipeline. Applicant and offer counts cover the newest 200 shared rows at most, not the full drive.</p></div>
            {driveOverview.readOnly ? <StatusBadge tone="neutral">Read-only closed drive</StatusBadge> :
              <StatusBadge tone={driveOverview.deadlineState === "DUE_SOON" ? "warning":"info"}>
                {driveOverview.deadlineState.replaceAll("_"," ")}
              </StatusBadge>}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {label:"Shared applications (capped)",value:driveOverview.shared},
              {label:"Active shortlist",value:driveOverview.active},
              {label:"Withdrawn",value:driveOverview.withdrawn},
              {label:"Evaluative rounds completed",value:driveOverview.completedRounds+" / "+driveOverview.totalRounds},
              {label:"Issued offers (capped)",value:driveOverview.issuedOffers},
              {label:"Accepted offers (capped)",value:driveOverview.acceptedOffers},
            ].map(card=><div key={card.label} className="rounded-md border border-border bg-surface-secondary p-3">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-foreground">{card.value}</p>
            </div>)}
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href={"/hr/placements/jobs/"+workspace.job.id+"?tab=applicants"} className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-primary-text">Review applicants</Link>
            <Link href={"/hr/placements/jobs/"+workspace.job.id+"?tab=rounds"} className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-primary-text">Rounds & results</Link>
            <Link href={"/hr/placements/jobs/"+workspace.job.id+"?tab=offers"} className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-primary-text">View offers</Link>
          </div>
        </section>
      ) : null}
      <nav aria-label="Hiring workspace tabs" className="flex flex-wrap gap-2">
        {(["overview", "applicants", "offers", "rounds"] as const).map(tab => (
          <Link key={tab} href={`/hr/placements/jobs/${workspace.job.id}?tab=${tab}`}
            aria-current={filters.tab === tab ? "page" : undefined}
            className={`inline-flex min-h-10 items-center rounded-md border px-4 text-sm font-semibold capitalize ${filters.tab === tab ? "border-primary bg-primary-subtle text-primary-text" : "border-border text-body"}`}>
            {tab}
          </Link>
        ))}
      </nav>
      {filters.tab === "applicants" ? (
        <section className="space-y-4 rounded-xl border border-border bg-surface p-4 sm:p-5">
          <h2 className="m-0 text-lg font-semibold text-foreground">Shared applicants</h2>
          <p className="text-sm text-body">Only placement-cell-shortlisted applicants are visible to this employer. Private pending, held and rejected candidates are excluded.</p>
          <nav aria-label="Applicant stage" className="flex flex-wrap gap-2">
            {([["ALL", "All shared", applicants.counts.all], ["SHORTLISTED", "Active shortlist", applicants.counts.shortlisted],
              ["WITHDRAWN", "Withdrawn", applicants.counts.withdrawn]] as const).map(([stage, label, count]) => (
              <Link key={stage} href={`/hr/placements/jobs/${workspace.job.id}?tab=applicants&stage=${stage}`}
                aria-current={filters.stage === stage ? "page" : undefined}
                className={`inline-flex min-h-10 items-center rounded-md border px-3 text-sm ${filters.stage === stage ? "border-primary bg-primary-subtle text-primary-text" : "border-border text-body"}`}>
                {label} ({count})
              </Link>
            ))}
          </nav>
          {applicants.rows.length ? <div className="grid gap-3 md:grid-cols-2">
            {applicants.rows.map(applicant => (
              <article key={applicant.id} className="min-w-0 rounded-lg border border-border bg-surface-subtle p-4">
                <p className="m-0 break-words font-semibold text-foreground">{applicant.name || "Unnamed applicant"}</p>
                <p className="mt-1 break-words text-sm text-body">{applicant.role}</p>
                <div className="mt-2 flex flex-wrap gap-2"><StatusBadge>{applicant.status}</StatusBadge><StatusBadge>{applicant.screening}</StatusBadge></div>
                <p className="mt-2 text-xs text-muted-foreground">Applied {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(applicant.submittedAt)}</p>
                <Link href={"/hr/placements/jobs/"+workspace.job.id+"?tab=applicants&stage="+filters.stage+"&applicant="+applicant.id}
                  className="mt-3 inline-flex min-h-10 items-center rounded-md border border-border px-3 text-sm font-semibold text-primary-text">Review applicant</Link>
              </article>
            ))}
          </div> : <p className="text-sm text-muted-foreground">No shared applicants match this stage.</p>}
          {selectedApplicant ? (
            <section role="dialog" aria-modal="false" aria-labelledby="hr-applicant-drawer-title"
              className="fixed inset-x-0 bottom-0 z-30 max-h-[85vh] overflow-y-auto rounded-t-2xl border border-border bg-surface p-5 shadow-xl sm:inset-x-auto sm:right-0 sm:top-0 sm:h-screen sm:max-h-screen sm:w-full sm:max-w-lg sm:rounded-none"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 id="hr-applicant-drawer-title" className="text-lg font-semibold text-foreground">Applicant review</h3>
                <Link href={"/hr/placements/jobs/"+workspace.job.id+"?tab=applicants&stage="+filters.stage}
                  className="rounded-md border border-border px-3 py-2 text-sm text-foreground">Close</Link>
              </div>
              <dl className="mt-5 grid gap-4 text-sm">
                <div><dt className="text-muted-foreground">Applicant</dt><dd className="font-semibold text-foreground">{selectedApplicant.name}</dd></div>
                <div><dt className="text-muted-foreground">Role</dt><dd className="text-foreground">{selectedApplicant.role}</dd></div>
                <div><dt className="text-muted-foreground">Shared email</dt><dd className="break-all text-foreground">{selectedApplicant.email ?? "Not provided"}</dd></div>
                <div><dt className="text-muted-foreground">Application</dt><dd className="text-foreground">{selectedApplicant.status}</dd></div>
                <div><dt className="text-muted-foreground">Placement-cell screening</dt><dd className="text-foreground">{selectedApplicant.screening}</dd></div>
                <div><dt className="text-muted-foreground">Applied (IST)</dt><dd className="text-foreground">{new Intl.DateTimeFormat("en-IN", {dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(selectedApplicant.submittedAt)}</dd></div>
              </dl>
              <p className="mt-5 text-sm text-muted-foreground">Recruiter notes and round-specific review decisions are not yet persisted by this read-only drawer. The placement team controls official screening.</p>
              <Link href={"/hr/placements/jobs/"+workspace.job.id+"?tab=rounds"}
                className="mt-4 inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">Review rounds</Link>
            </section>
          ) : null}
          {applicantsTruncated ? <p className="text-xs text-muted-foreground">Showing the newest 200 shared applications only.</p> : null}
        </section>
      ) : null}
      {filters.tab === "offers" ? (
        <section className="space-y-4 rounded-xl border border-border bg-surface p-4 sm:p-5">
          <h2 className="m-0 text-lg font-semibold text-foreground">Job offers · read only</h2>
          <p className="text-sm text-body">Only offers associated with candidates already shared with your company appear here. Offer records represent persisted versions; LOI is not stored in the registered schema and is not represented as an offer.</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {label:"Recorded offers",value:offerSummary.recorded},
              {label:"Awaiting learner reply",value:offerSummary.awaitingReply},
              {label:"Reply overdue",value:offerSummary.overdue},
              {label:"Accepted",value:offerSummary.accepted},
              {label:"Declined",value:offerSummary.declined},
              {label:"Confirmed joined",value:offerSummary.joined},
            ].map(item=><div key={item.label} className="rounded-md border border-border bg-surface-secondary p-3">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-xl font-bold text-foreground">{item.value}</p>
            </div>)}
          </div>
          <section className="space-y-2 rounded-lg border border-border bg-surface-secondary p-4">
            <h3 className="font-semibold text-foreground">Selection readiness across all rounds · read only</h3>
            <p className="text-sm text-body">{selectionReadyIds.size} shared applicants have APPLIED PASS results in every completed evaluative round. No selection list is sent; formal selection, LOI and offer issue workflows remain with the placement team.</p>
            {selectionReadyIds.size ? <div className="flex flex-wrap gap-2">{applicants.rows.filter(applicant=>selectionReadyIds.has(applicant.id)).map(applicant=>
              <span key={applicant.id} className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-foreground">{applicant.name || "Candidate"}</span>)}</div> : null}
          </section>
          {offers.length ? <div className="grid gap-3 md:grid-cols-2">{offers.map(offer => (
            <article key={offer.id} className="min-w-0 rounded-lg border border-border bg-surface-subtle p-4">
              <p className="m-0 font-semibold text-foreground">{offer.name || "Unnamed applicant"}</p>
              <p className="mt-1 text-sm text-body">{offer.role}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2"><StatusBadge>{offer.status}</StatusBadge>
                {offer.annualCtcInr != null ? <span className="text-sm text-body">{formatCtc(offer.annualCtcInr)}</span> : null}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Issued {new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium"}).format(offer.issuedAt)} · Joining {offer.joiningDate ?? "Not set"}</p>
              <p className="mt-1 text-xs text-muted-foreground">Reply by {offer.expiresAt ? new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(offer.expiresAt) : "Not set"} · Joining outcome {offer.joiningStatus ?? "Not recorded"}</p>
            </article>
          ))}</div> : <p className="text-sm text-muted-foreground">No offers recorded for shared applicants.</p>}
          {offersTruncated ? <p className="text-xs text-muted-foreground">Showing the newest 200 offers only.</p> : null}
        </section>
      ) : null}
      {filters.tab === "rounds" || filters.tab === "overview" ? <section>
        <div className="mb-3">
          <h2 className="m-0 text-base font-semibold text-foreground">
            Hiring rounds
          </h2>
          <p className="mt-1 text-sm text-body">
            Stage employer outcomes here. The college placement team retains final apply authority.
          </p>
        </div>
        <RecruiterResultControls
          rounds={workspace.rounds.map(
            (round) => ({
              id: round.id,
              sequence: round.sequence,
              kind: round.kind,
              name: round.name,
              status: round.status,
              scheduledAt:
                round.scheduledAt?.toISOString() ??
                null,
              timezone: round.timezone,
              mode: round.mode,
              venue: round.venue,
              meetingUrl: round.meetingUrl,
              resultsDueAt:
                round.resultsDueAt?.toISOString() ??
                null,
              participants:
                round.participants.map(
                  (participant) => ({
                    applicationId:
                      participant.applicationId,
                    displayName:
                      participant.displayName,
                    email:
                      participant.email,
                    result:
                      participant.result
                        ? {
                            id:
                              participant
                                .result.id,
                            status:
                              participant
                                .result.status,
                            outcome:
                              participant
                                .result.outcome as
                                | "PASS"
                                | "FAIL"
                                | "HOLD"
                                | "ABSENT",
                            waitlistRank:
                              participant
                                .result.waitlistRank,
                            scorePercent:
                              participant
                                .result.scorePercent,
                            reasonCategory:
                              participant
                                .result.reasonCategory as
                                | "APTITUDE"
                                | "TECHNICAL"
                                | "COMMUNICATION"
                                | "OTHER"
                                | null,
                            candidateMessage:
                              participant
                                .result.candidateMessage,
                          }
                        : null,
                  }),
                ),
            }),
          )}
        />
        {filters.tab === "rounds" ? <section className="mt-6 space-y-4 rounded-xl border border-border bg-surface p-4 sm:p-5">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Results from table</h3>
            <p className="mt-1 text-sm text-body">Authorized, placement-cell-shortlisted candidates only. STAGED means awaiting college review; APPLIED means official college-applied outcome.</p>
          </div>
          {workspace.rounds.length ? <>
            <nav aria-label="Choose results round" className="flex flex-wrap gap-2">
              {workspace.rounds.map(round => (
                <Link key={round.id} href={hrInlineRoundResultsHref(workspace.job.id,round.id,"ALL")}
                  aria-current={selectedRound?.id === round.id ? "page" : undefined}
                  className={selectedRound?.id === round.id
                    ? "inline-flex min-h-10 items-center rounded-md bg-primary px-3 py-2 text-sm text-on-primary"
                    : "inline-flex min-h-10 items-center rounded-md border border-border px-3 py-2 text-sm text-body"}>
                  {round.sequence}. {round.name}
                </Link>
              ))}
            </nav>
            {inlineResults ? inlineResults.round.kind === "TALK"
              ? <p className="text-sm text-muted-foreground">Informational rounds do not record candidate outcomes.</p>
              : <>
                <nav aria-label="Filter results" className="flex flex-wrap gap-2">
                  {outcomeOptions.map(option => (
                    <Link key={option.value} href={hrInlineRoundResultsHref(workspace.job.id,inlineResults.round.id,option.value)}
                      aria-current={filters.outcome === option.value ? "page" : undefined}
                      className={filters.outcome === option.value
                        ? "rounded-full bg-primary px-3 py-2 text-xs font-semibold text-on-primary"
                        : "rounded-full border border-border px-3 py-2 text-xs text-body"}>
                      {option.label} ({option.count})
                    </Link>
                  ))}
                </nav>
                {inlineResults.rows.length
                  ? <div className="grid gap-3 md:grid-cols-2">
                      {inlineResults.rows.map(candidate => (
                        <article key={candidate.key} className="min-w-0 rounded-lg border border-border bg-surface-secondary p-4">
                          <p className="break-words font-semibold text-foreground">{candidate.name}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <StatusBadge>{candidate.outcome ?? "UNRECORDED"}</StatusBadge>
                            <StatusBadge>{candidate.status}</StatusBadge>
                          </div>
                          {candidate.scorePercent != null
                            ? <p className="mt-2 text-sm text-body">Score: {candidate.scorePercent}%</p> : null}
                          {candidate.waitlistRank != null
                            ? <p className="mt-1 text-sm text-body">Waitlist rank: {candidate.waitlistRank}</p> : null}
                        </article>
                      ))}
                    </div>
                  : <p className="text-sm text-muted-foreground">No shared candidates match this result filter.</p>}
              </> : null}
          </> : <p className="text-sm text-muted-foreground">No active hiring rounds are configured for this drive.</p>}
          <p className="text-xs text-muted-foreground">This table does not apply results or send candidate messages. Use the existing staging controls above for permitted employer submissions.</p>
        </section> : null}
      </section> : null}
    </div>
  );
}
