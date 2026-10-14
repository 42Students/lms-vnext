import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  learnerAssessmentResultsViewSchema,
  type LearnerAssessmentResultsView,
} from "@/modules/placements/learner-assessment-results-model";
import { getOwnLearnerAssessmentResults } from "@/modules/placements/learner-assessment-results-service";

const views: readonly { id: LearnerAssessmentResultsView; label: string }[] = [
  { id: "all", label: "All results" },
  { id: "passed", label: "Passed" },
  { id: "failed", label: "Not passed" },
  { id: "other", label: "Other outcomes" },
];

function formatIst(value: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(value) + " IST";
}

export default async function LearnerAssessmentResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string | string[] }>;
}) {
  const query = await searchParams;
  const parsedView = learnerAssessmentResultsViewSchema.safeParse(query.view);
  const view = parsedView.success ? parsedView.data : "all";
  const context = await getCurrentRequestContext();
  const results = await getOwnLearnerAssessmentResults(context, view);

  return (
    <div className="space-y-6">
      <Link href="/learn/my-placements/assessments"
        className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline">
        ← Assessment schedule
      </Link>
      <PageHeader
        eyebrow="My Placements · Assessments"
        title="Official assessment results"
        description="Only placement-team-applied test outcomes from your own applications. A scheduled or submitted assessment is not a published result."
      />
      <nav aria-label="Filter published assessment results" className="flex flex-wrap gap-2">
        {views.map((option) => (
          <Link
            key={option.id}
            href={option.id === "all"
              ? "/learn/my-placements/assessments/results"
              : "/learn/my-placements/assessments/results?view=" + option.id}
            aria-current={view === option.id ? "page" : undefined}
            className={view === option.id
              ? "inline-flex min-h-11 items-center rounded-full bg-primary px-4 text-sm font-semibold text-on-primary"
              : "inline-flex min-h-11 items-center rounded-full border border-border bg-surface px-4 text-sm font-semibold text-body hover:bg-primary-subtle"}
          >
            {option.label} ({results.counts[option.id]})
          </Link>
        ))}
      </nav>
      {results.items.length === 0 ? (
        <section role="status" className="rounded-xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="text-base font-semibold text-foreground">
            {results.counts.all === 0 ? "No official assessment results yet" : "No results in this category"}
          </h2>
          <p className="mt-2 text-sm text-body">
            {results.counts.all === 0
              ? "No applied test outcomes are recorded for your placement applications. Check the schedule for upcoming assessments; submitting on a provider platform does not publish a result here."
              : "Your published test outcomes do not match the selected category."}
          </p>
          {results.counts.all > 0 ? (
            <Link href="/learn/my-placements/assessments/results"
              className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline">
              View all official results →
            </Link>
          ) : null}
        </section>
      ) : (
        <section aria-label="Official assessment outcomes" className="grid gap-3">
          {results.items.map((item) => (
            <article key={item.resultId} className="rounded-xl border border-border bg-surface p-4 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary-text">
                    {item.companyName}
                  </p>
                  <h2 className="mt-1 text-base font-semibold text-foreground">{item.roundName}</h2>
                  <p className="mt-1 text-sm text-body">
                    {item.roleTitle} · Round {item.roundSequence}
                  </p>
                </div>
                <StatusBadge tone={item.outcome === "PASS" ? "success" :
                  item.outcome === "FAIL" ? "error" : "neutral"}>
                  {item.outcome.replaceAll("_", " ")}
                </StatusBadge>
              </div>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-semibold text-muted-foreground">Applied on</dt>
                  <dd className="mt-1 text-foreground">
                    <time dateTime={item.appliedAt.toISOString()}>{formatIst(item.appliedAt)}</time>
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-muted-foreground">Published score</dt>
                  <dd className="mt-1 text-foreground">
                    {item.scorePercent === null ? "Not provided" : item.scorePercent + "%"}
                  </dd>
                </div>
              </dl>
              {item.candidateMessage ? (
                <section className="mt-4 rounded-lg border border-border bg-surface-subtle p-3">
                  <h3 className="text-xs font-semibold text-foreground">Shared feedback</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-body">{item.candidateMessage}</p>
                </section>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-4">
                <Link href={"/learn/my-placements/applications?applicationId=" +
                  encodeURIComponent(item.applicationId)}
                  className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text hover:underline">
                  View application →
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}
      <p className="text-xs text-muted-foreground">
        Only applied placement round results appear here. Provider submission
        status, internal reviews and unpublished grades are not inferred.
      </p>
    </div>
  );
}
