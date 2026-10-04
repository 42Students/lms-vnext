import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";

export type LearnerPlacementJourneyItem = {
  applicationId: string;
  jobTitle: string;
  companyName: string;
  applicationStatus: string;
  channel: string;
  submittedAt: Date;
  withdrawnAt: Date | null;
  screening: {
    status: string;
    candidateMessage: string | null;
    decidedAt: Date | null;
  };
  results: Array<{
    resultId: string;
    roundSequence: number;
    roundName: string;
    outcome: string;
    scorePercent: number | null;
    candidateMessage: string | null;
    appliedAt: Date | null;
  }>;
};

function humanize(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(" ");
}

function statusTone(
  value: string,
): "neutral" | "info" | "success" | "warning" | "error" {
  if (
    value === "SHORTLISTED" ||
    value === "PASS" ||
    value === "SUBMITTED"
  ) {
    return "success";
  }
  if (
    value === "REJECTED" ||
    value === "FAIL" ||
    value === "ABSENT"
  ) {
    return "error";
  }
  if (
    value === "UNDER_REVIEW" ||
    value === "HOLD"
  ) {
    return "warning";
  }
  return "neutral";
}

function formatWhen(value: Date | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(value);
}

export function LearnerPlacementJourney({
  items,
}: {
  items: readonly LearnerPlacementJourneyItem[];
}) {
  if (items.length === 0) {
    return (
      <section className="space-y-3">
        <div>
          <h2 className="m-0 text-base font-semibold text-foreground">
            My placement journey
          </h2>
          <p className="mt-1 text-sm text-body">
            Applications, screening decisions and applied round results will appear here.
          </p>
        </div>
        <EmptyState
          title="No applications yet"
          description="When you apply to a placement opportunity, this becomes your single journey timeline."
        />
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="m-0 text-base font-semibold text-foreground">
          My placement journey
        </h2>
        <p className="mt-1 text-sm text-body">
          One view of your applications, screening state and confirmed round outcomes.
        </p>
      </div>
      <div className="grid gap-4">
        {items.map((item) => (
          <article
            key={item.applicationId}
            className="rounded-xl border border-border bg-surface p-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-primary-text">
                  {item.companyName}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-foreground">
                  {item.jobTitle}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Applied{" "}
                  {formatWhen(
                    item.submittedAt,
                  )}{" "}
                  · {humanize(item.channel)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge
                  tone={statusTone(
                    item.applicationStatus,
                  )}
                >
                  {humanize(
                    item.applicationStatus,
                  )}
                </StatusBadge>
                <StatusBadge
                  tone={statusTone(
                    item.screening.status,
                  )}
                >
                  {humanize(
                    item.screening.status,
                  )}
                </StatusBadge>
              </div>
            </div>

            {item.screening
              .candidateMessage ? (
              <div className="mt-4 rounded-lg border border-border bg-muted px-4 py-3">
                <p className="m-0 text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  Placement team
                </p>
                <p className="mt-1 text-sm leading-6 text-body">
                  {
                    item.screening
                      .candidateMessage
                  }
                </p>
              </div>
            ) : null}

            {item.results.length > 0 ? (
              <div className="mt-4 grid gap-2">
                {item.results
                  .slice()
                  .sort(
                    (left, right) =>
                      left.roundSequence -
                      right.roundSequence,
                  )
                  .map((result) => (
                    <div
                      key={result.resultId}
                      className="flex flex-col gap-2 rounded-lg border border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="m-0 text-sm font-semibold text-foreground">
                          Round{" "}
                          {
                            result.roundSequence
                          }{" "}
                          · {result.roundName}
                        </p>
                        {result.candidateMessage ? (
                          <p className="mt-1 text-xs leading-5 text-body">
                            {
                              result.candidateMessage
                            }
                          </p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        {result.scorePercent !==
                        null ? (
                          <span className="text-xs font-semibold text-muted-foreground">
                            {
                              result.scorePercent
                            }
                            %
                          </span>
                        ) : null}
                        <StatusBadge
                          tone={statusTone(
                            result.outcome,
                          )}
                        >
                          {humanize(
                            result.outcome,
                          )}
                        </StatusBadge>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                No applied round results yet.
              </p>
            )}

            {item.withdrawnAt ? (
              <p className="mt-4 text-xs font-semibold text-muted-foreground">
                Withdrawn{" "}
                {formatWhen(
                  item.withdrawnAt,
                )}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
