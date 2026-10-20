import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { TpoDriveCancelForm } from "@/components/placements/tpo-drive-cancel-form";
import { hasMembershipRole } from "@/modules/identity/context";
import { PlacementsServiceError } from "@/modules/placements/errors";
import { getTpoDriveCancelPreview } from "@/modules/placements/tpo-drive-cancel-service";

export default async function TpoDriveCancelPreviewPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) redirect("/dashboard");
  const { jobId } = await params;
  let preview: Awaited<ReturnType<typeof getTpoDriveCancelPreview>>;
  try {
    preview = await getTpoDriveCancelPreview(context, jobId);
  } catch (error) {
    if (error instanceof PlacementsServiceError && error.code === "PLACEMENT_JOB_NOT_FOUND") notFound();
    throw error;
  }
  return (
    <div className="min-w-0 space-y-5">
      <Link href={"/tpo/placements/jobs/" + preview.id} className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--lms-link-text)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary)] md:min-h-9">
        ← Drive workspace
      </Link>
      <PageHeader
        eyebrow="TPO · Drive lifecycle"
        title={preview.title + " · Cancel drive"}
        description="Review what cancelling will change before an audited, reason-required cancellation."
      />
      {preview.cancellable ? (
        <TpoDriveCancelForm preview={preview} />
      ) : (
        <Alert tone="warning">
          {preview.pendingPromotions>0
            ? "A waitlisted learner's reserved offer is still pending. Finish the waitlist offer before cancelling this drive."
            : "Cancellation is available for drafts or published drives in an active season."}
        </Alert>
      )}
    </div>
  );
}
