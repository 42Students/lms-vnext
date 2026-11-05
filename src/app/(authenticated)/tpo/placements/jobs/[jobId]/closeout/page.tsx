import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { notFound, redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { PlacementsServiceError } from "@/modules/placements/errors";
import { getTpoDriveCloseout } from "@/modules/placements/tpo-drive-closeout-service";
import { ButtonLink } from "@/components/ui/button-link";
import { Disclosure } from "@/components/ui/disclosure";
import { TextLink } from "@/components/ui/text-link";

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
      actions={<div className="flex w-full flex-col items-stretch gap-2 md:w-auto md:flex-row md:items-center">
        <TextLink className="inline-flex min-h-11 items-center justify-center text-sm md:min-h-9 w-full md:w-auto"
          href={"/tpo/placements/jobs/" + encodeURIComponent(data.job.id)}>← Back to drive</TextLink>
        <ButtonLink variant="secondary" href={"/api/placements/tpo/drives/" + encodeURIComponent(data.job.id) + "/closeout/export"}>Export CSV</ButtonLink>
      </div>} />
    <section aria-label="Close-out metrics" className="grid min-w-0 grid-cols-1 md:grid-cols-2 gap-x-6 border-y border-[var(--lms-canvas-border)] xl:grid-cols-4">
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
    <Disclosure title={<>Selected is unavailable because no canonical final-selection event is <span aria-hidden="true" className="ml-2">⌄</span></>} preserveSummary summaryClassName="inline-flex min-h-11 items-center">
      <p className="mt-2 max-w-prose">stored independently of round PASS and offer issuance. Accepted means
      a currently ACCEPTED offer; joined requires an explicit JOINED outcome.
      The summary excludes externally recorded or unmigrated placement facts.</p>
    </Disclosure>
  </div>;
}
