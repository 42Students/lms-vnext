import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import type { listOwnRecruiterPlacementJobs } from "@/modules/placements/recruiter-service";

type RecruiterJobs = Awaited<
  ReturnType<typeof listOwnRecruiterPlacementJobs>
>;

export function RecruiterPlacementPortfolio({
  jobs,
}: {
  jobs: RecruiterJobs;
}) {
  if (jobs.length === 0) {
    return (
      <EmptyState
        title="No employer opportunities yet"
        description="Published or closed opportunities appear here only after a college grants your employer account access to that exact relationship."
      />
    );
  }

  return (
    <div className="grid gap-4">
      {jobs.map((item) => (
        <article
          key={item.job.id}
          className="rounded-xl border border-border bg-surface p-5"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  tone={
                    item.job.status ===
                    "PUBLISHED"
                      ? "success"
                      : "neutral"
                  }
                >
                  {item.job.status}
                </StatusBadge>
                <span className="text-xs font-semibold text-muted-foreground">
                  {item.collegeName}
                </span>
              </div>
              <h2 className="mt-3 text-lg font-semibold text-foreground">
                {item.job.title}
              </h2>
              <p className="mt-1 text-sm text-body">
                {item.companyName} ·{" "}
                {item.job.employmentType
                  .toLowerCase()
                  .split("_")
                  .join(" ")}{" "}
                ·{" "}
                {item.job.workMode
                  .toLowerCase()}
              </p>
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-body">
                {item.job.description}
              </p>
            </div>
            <Link
              href={
                "/hr/placements/jobs/" +
                item.job.id
              }
              className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary-subtle hover:text-primary-text"
            >
              Open hiring flow
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
