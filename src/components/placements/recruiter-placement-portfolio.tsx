import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import type { listOwnRecruiterPlacementJobs } from "@/modules/placements/recruiter-service";

type RecruiterJobs = Awaited<
  ReturnType<typeof listOwnRecruiterPlacementJobs>
>;

export function RecruiterPlacementPortfolio({
  jobs, returnTo, counts,
}: {
  jobs: RecruiterJobs;
  returnTo?: string;
  counts?:Record<string,{sharedApplicants:number;offers:number}>;
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
                  {item.job.status==="PUBLISHED"?"Live":item.job.status==="CLOSED"?"Completed":item.job.status}
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
              <p className="mt-2 text-sm font-medium text-foreground">
                {item.job.minimumAnnualCtcInr!=null||item.job.maximumAnnualCtcInr!=null
                  ? "CTC: "+[item.job.minimumAnnualCtcInr,item.job.maximumAnnualCtcInr]
                    .filter(value=>value!=null).map(value=>"₹"+new Intl.NumberFormat("en-IN").format(value!)).join("–")
                  : "CTC not specified"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.job.applicationDeadline
                  ? "Applications close "+new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium"}).format(item.job.applicationDeadline)+" IST"
                  : "Application deadline not recorded"}
              </p>
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-body">
                {item.job.description}
              </p>
              <nav aria-label={"Drive metrics for "+item.job.title}
                className="mt-2 flex flex-wrap gap-3 text-sm">
                <Link
                  className="font-semibold text-primary-text underline"
                  href={"/recruiter/drives/"+item.job.id+"?tab=applicants"+(returnTo?"&returnTo="+encodeURIComponent(returnTo):"")}>
                  {counts?.[item.job.id]?.sharedApplicants??0} shared applicants
                </Link>
                <Link
                  className="font-semibold text-primary-text underline"
                  href={"/recruiter/drives/"+item.job.id+"?tab=offers"+(returnTo?"&returnTo="+encodeURIComponent(returnTo):"")}>
                  {counts?.[item.job.id]?.offers??0} offers
                </Link>
              </nav>
              <p className="mt-2 text-sm text-body">
                Next: {item.job.status==="CLOSED"
                  ? "Hire again with a new request."
                  : "Review the shared applicant list and follow up with the placement cell."}
              </p>
            </div>
            <Link
              href={"/recruiter/drives/" + item.job.id +
                (returnTo ? "?returnTo=" + encodeURIComponent(returnTo) : "")}
              className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary-subtle hover:text-primary-text"
            >
              Open hiring flow
            </Link>
          </div>
          {item.job.status === "CLOSED" ? <div className="mt-4 border-t border-border pt-3">
            <Link href={"/hr/drives/new?collegeId="+encodeURIComponent(item.collegeId)+"&from="+encodeURIComponent(item.job.id)}
              className="inline-flex min-h-10 items-center rounded-md border border-border px-3 text-sm font-semibold text-primary-text">
              Hire again
            </Link>
          </div> : null}
        </article>
      ))}
    </div>
  );
}
