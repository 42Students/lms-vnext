import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { TpoJoiningUpdateForm } from "@/components/placements/tpo-joining-update-form";
import { hasMembershipRole } from "@/modules/identity/context";
import { PlacementsServiceError } from "@/modules/placements/errors";
import { getTpoJoiningTracker } from "@/modules/placements/tpo-joining-tracker-service";
import { tpoJoiningTrackerQuerySchema } from "@/modules/placements/tpo-joining-tracker-model";

export default async function TpoDriveJoiningPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    redirect("/dashboard");
  }
  const { jobId } = await params;
  const parsed = tpoJoiningTrackerQuerySchema.safeParse({ jobId });
  if (!parsed.success) notFound();

  let tracker: Awaited<ReturnType<typeof getTpoJoiningTracker>>;
  try {
    tracker = await getTpoJoiningTracker(context, parsed.data);
  } catch (error) {
    if (error instanceof PlacementsServiceError &&
        error.code === "PLACEMENT_JOB_NOT_FOUND") notFound();
    throw error;
  }
  const labels = [
    ["Accepted offers", tracker.counts.accepted],
    ["Pending / unrecorded", tracker.counts.pending],
    ["Joined", tracker.counts.joined],
    ["Deferred", tracker.counts.deferred],
    ["Did not join", tracker.counts.didNotJoin],
  ] as const;

  return (
    <div className="min-w-0 space-y-4">

      <PageHeader
        eyebrow="TPO · Drive offers"
        title={tracker.job.title + " · Joining outcomes"}
        description="Record joining outcomes only for persisted accepted offers. All edits reuse the audited joining-history API."
        actions={<Link href={"/tpo/placements/jobs/" + encodeURIComponent(tracker.job.id)}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-[var(--lms-link-text)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)] md:w-auto md:min-h-9">
          ← Back to drive workspace
        </Link>}
      />
      <section aria-label="Joining summary" className="grid min-w-0 max-w-full overflow-hidden rounded-[var(--lms-canvas-radius)] border border-border bg-surface grid-cols-2 xl:grid-cols-5">
        {labels.map(([name, value]) => (
          <div key={name} className="min-w-0 border-b border-r border-border p-3 even:border-r-0 last:border-b-0 xl:border-b-0 xl:border-r xl:p-4 xl:last:border-r-0">
            <p className="text-xs font-semibold uppercase text-muted-foreground">{name}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{value}</p>
          </div>
        ))}
      </section>
      {tracker.items.length === 0 ? (
        <EmptyState title="No currently accepted offers are recorded for this drive." description="Issued, declined and withdrawn offers cannot be assigned a joining outcome."/>
      ) : (
        <div className="space-y-4">
          {tracker.items.map((item) => (
            <section key={item.offerId}
              className="min-w-0 border-b border-border pb-4">
              <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="break-words text-base font-semibold leading-6 text-[var(--lms-heading)]">{item.displayName}</h2>
                  <p className="mt-1 text-sm text-body">{item.roleTitle}</p>
                  <Link
                    href={"/tpo/students/" + encodeURIComponent(item.membershipId) + "/history"}
                    className="mt-1 inline-flex min-h-11 items-center text-sm font-semibold text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
                    Learner placement history →
                  </Link>
                </div>
                <StatusBadge tone={item.joiningStatus==="JOINED"?"success":item.joiningStatus==="DID_NOT_JOIN"?"error":item.joiningStatus==="DEFERRED"?"warning":"info"}>
                  {item.joiningStatus.replaceAll("_", " ")}
                </StatusBadge>
              </div>
              <p className="mt-3 text-sm text-body">
                Current joining date: {item.joiningDate ?? "Not recorded"}
                {item.reason ? " · Reason: " + item.reason : ""}
              </p>
              <TpoJoiningUpdateForm
                offerId={item.offerId}
                initialStatus={item.joiningStatus}
                initialJoiningDate={item.joiningDate}
              />
            </section>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Counts are current accepted-offer records, not unique placed learners.
        No joining is inferred from the planned joining date alone. Corrections
        to recorded outcomes require an explicit reason and are retained in history.
      </p>
    </div>
  );
}
