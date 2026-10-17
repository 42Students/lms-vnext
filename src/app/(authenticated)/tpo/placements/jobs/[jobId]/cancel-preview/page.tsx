import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
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
    <div className="space-y-5">
      <Link href={"/tpo/placements/jobs/" + preview.id} className="text-sm font-semibold text-primary-text hover:underline">
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
        <p role="status" className="rounded-xl border border-border bg-surface p-5 text-sm text-body">
          Cancellation is available for drafts or published drives in an active season.
        </p>
      )}
    </div>
  );
}
