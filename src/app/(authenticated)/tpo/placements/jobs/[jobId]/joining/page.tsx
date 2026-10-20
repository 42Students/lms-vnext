import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
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
    <div className="min-w-0 space-y-6">
      <Link href={"/tpo/placements/jobs/" + encodeURIComponent(tracker.job.id)}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--lms-teal-deep)] hover:underline md:min-h-9">
        ← Back to drive workspace
      </Link>
      <PageHeader
        eyebrow="TPO · Drive offers"
        title={tracker.job.title + " · Joining outcomes"}
        description="Record joining outcomes only for persisted accepted offers. All edits reuse the audited joining-history API."
      />
      <section aria-label="Joining summary" className="grid overflow-hidden rounded-[var(--lms-canvas-radius)] border border-border bg-surface sm:grid-cols-2 xl:grid-cols-5">
        {labels.map(([name, value]) => (
          <div key={name} className="min-w-0 border-b border-border p-4 last:border-b-0 sm:border-r sm:last:border-r-0 xl:border-b-0">
            <p className="text-xs font-semibold uppercase text-muted-foreground">{name}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{value}</p>
          </div>
        ))}
      </section>
      {tracker.items.length === 0 ? (
        <Alert tone="info">
          No currently accepted offers are recorded for this drive. Issued,
          declined and withdrawn offers cannot be assigned a joining outcome.
        </Alert>
      ) : (
        <div className="space-y-4">
          {tracker.items.map((item) => (
            <section key={item.offerId}
              className="border-b border-border pb-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-foreground">{item.displayName}</h2>
                  <p className="mt-1 text-sm text-body">{item.roleTitle}</p>
                  <Link
                    href={"/tpo/students/" + encodeURIComponent(item.membershipId) + "/history"}
                    className="mt-1 inline-flex min-h-11 items-center text-sm font-semibold text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">
                    Learner placement history →
                  </Link>
                </div>
                <span className="rounded-[var(--lms-control-radius)] border border-border px-3 py-1 text-sm font-semibold text-foreground">
                  {item.joiningStatus.replaceAll("_", " ")}
                </span>
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
