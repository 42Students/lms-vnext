import { PageHeader } from "@/components/ui/page-header";
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
  return <div className="min-w-0 space-y-5">
    <Link className="text-sm font-semibold text-[var(--lms-teal-deep)]"
      href={"/tpo/placements/jobs/" + encodeURIComponent(data.job.id)}>← Back to drive</Link>
    <PageHeader title={data.job.title+" · Close-out summary"}
      description={"Current persisted facts for a "+data.job.status.toLowerCase()+" drive. These numbers are not a finalized, immutable historical snapshot."} />
    <a href={"/api/placements/tpo/drives/" + encodeURIComponent(data.job.id) + "/closeout/export"}
      className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-[var(--lms-teal-deep)] md:min-h-9">
      Export CSV
    </a>
    <section aria-label="Close-out metrics" className="grid overflow-hidden rounded-[var(--lms-canvas-radius)] border border-border sm:grid-cols-2 xl:grid-cols-4">
      {cells.map(([label, value]) => <div key={label}
        className="border-b border-border p-4 last:border-b-0 sm:border-r sm:last:border-r-0 xl:border-b-0">
        <p className="text-sm font-medium text-body">{label}</p>
        <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
          {value === null ? "Unavailable" : value}
        </p>
      </div>)}
    </section>
    {counts.applied === 0 ? <p role="status"
      className="text-sm text-body rounded-[var(--lms-control-radius)] border border-border bg-muted p-3">
      No applications are persisted for this drive. Other zero counts reflect that
      source, not an assumption about off-platform recruiting.
    </p> : null}
    <p className="text-sm leading-6 text-body">
      Selected is unavailable because no canonical final-selection event is
      stored independently of round PASS and offer issuance. Accepted means
      a currently ACCEPTED offer; joined requires an explicit JOINED outcome.
      The summary excludes externally recorded or unmigrated placement facts.
    </p>
  </div>;
}
