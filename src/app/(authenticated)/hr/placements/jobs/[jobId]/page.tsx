import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { RecruiterResultControls } from "@/components/placements/recruiter-result-controls";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { hasActiveRecruiter } from "@/modules/identity/context";
import { getRecruiterPlacementWorkspace } from "@/modules/placements/recruiter-workspace-service";

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
}: {
  params: Promise<{ jobId: string }>;
}) {
  const context =
    await getCurrentRequestContext();
  if (!hasActiveRecruiter(context)) {
    redirect("/dashboard");
  }

  const { jobId } = await params;
  const workspace =
    await getRecruiterPlacementWorkspace(
      context,
      jobId,
    );

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

      <section>
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
      </section>
    </div>
  );
}
