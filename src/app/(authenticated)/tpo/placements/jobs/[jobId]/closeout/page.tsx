import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { PlacementsServiceError } from "@/modules/placements/errors";
import { getTpoDriveCloseout } from "@/modules/placements/tpo-drive-closeout-service";

export default async function TpoDriveCloseoutPage({
  params,
}: { params: Promise<{ jobId: string }> }) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) redirect("/dashboard");
  const { jobId } = await params;
  let data: Awaited<ReturnType<typeof getTpoDriveCloseout>>;
  try { data = await getTpoDriveCloseout(context, jobId); }
  catch (error) {
    if (error instanceof PlacementsServiceError &&
      error.code === "PLACEMENT_JOB_NOT_FOUND") notFound();
    throw error;
  }
  const counts = data.counts;
  const cells = [
    ["Applied learners (all application statuses)", counts.applied],
    ["Currently submitted", counts.currentlySubmitted],
    ["Shortlisted, currently submitted", counts.shortlisted],
    ["Selected", counts.selected],
    ["Offered learners (any offer version)", counts.offered],
    ["Offer versions", counts.offerVersions],
    ["Currently accepted learners", counts.accepted],
    ["Confirmed joined learners", counts.joined],
  ] as const;
  return <div className="min-w-0 space-y-6">
    <PageHeader title={data.job.title+" · Close-out summary"}
      description={"Current persisted facts for a "+data.job.status.toLowerCase()+" drive. These numbers are not a finalized, immutable historical snapshot."}
      actions={<div className="flex w-full flex-col items-stretch gap-2 min-[768px]:w-auto min-[768px]:flex-row min-[768px]:items-center">
        <Link className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-[var(--lms-link-text)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)] min-[768px]:min-h-9"
          href={"/tpo/placements/jobs/" + encodeURIComponent(data.job.id)}>← Back to drive</Link>
        <a href={"/api/placements/tpo/drives/" + encodeURIComponent(data.job.id) + "/closeout/export"}
          className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-[var(--lms-teal-deep)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary min-[768px]:min-h-9">Export CSV</a>
      </div>} />
    <section aria-label="Close-out metrics" className="grid min-w-0 grid-cols-2 gap-x-6 border-y border-[var(--lms-canvas-border)] min-[1280px]:grid-cols-4">
      {cells.map(([label, value]) => <div key={label}
        className="min-w-0 border-b border-[var(--lms-canvas-border)] px-1 py-4">
        <p className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">{label}</p>
        <p className="mt-2 break-words text-[24px] font-semibold leading-[1.3] tabular-nums text-[var(--lms-heading)]">
          {value === null ? "Unavailable" : value}
        </p>
      </div>)}
    </section>
    {counts.applied === 0 ? <Alert tone="info">
      No applications are persisted for this drive. Other zero counts reflect that
      source, not an assumption about off-platform recruiting.
    </Alert> : null}
    <details className="text-sm text-body leading-[1.6]">
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">Selected is unavailable because no canonical final-selection event is <span aria-hidden="true" className="ml-2">⌄</span></summary>
      <p className="mt-2 max-w-prose">stored independently of round PASS and offer issuance. Accepted means
      a currently ACCEPTED offer; joined requires an explicit JOINED outcome.
      The summary excludes externally recorded or unmigrated placement facts.</p>
    </details>
  </div>;
}
