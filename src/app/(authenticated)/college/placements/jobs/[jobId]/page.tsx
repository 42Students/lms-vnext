import { redirect } from "next/navigation";
import { z } from "zod";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PlacementDriveWorkspace } from "@/components/placements/placement-drive-workspace";
import { hasMembershipRole } from "@/modules/identity/context";
import { TextLink } from "@/components/ui/text-link";

import { zUuid } from "@/lib/schema-primitives";
export default async function CollegePlacementDrivePage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const context = await getCurrentRequestContext();
  if (
    !context.membership ||
    !hasMembershipRole(
      context,
      "COLLEGE_ADMIN",
    )
  ) {
    redirect("/dashboard");
  }
  const { jobId } = await params;
  if (!zUuid.safeParse(jobId).success) {
    return <div className="min-w-0 space-y-[var(--lms-space-4)]">
      <PageHeader title="Placement Drives" />
      <ErrorState title="Could not load this drive."
        description="The drive ID is invalid. No changes were made."
        action={<TextLink href="/college/placements/drives">Back to Drives</TextLink>}/>
    </div>;
  }
  try {
    const workspace = await PlacementDriveWorkspace({ context, jobId });
    return <div className="min-w-0 space-y-[var(--lms-space-4)]">{workspace}</div>;
  } catch (error) {
    if (error instanceof AuthorizationError) throw error;
    return <div className="min-w-0 space-y-[var(--lms-space-4)]">
      <PageHeader title="Placement Drives" />
      <ErrorState title="Could not load this drive."
        description="Drive details could not be refreshed. No changes were made."
        action={<div className="flex flex-wrap gap-3">
          <TextLink href={"/college/placements/jobs/"+encodeURIComponent(jobId)} prefetch={false}>Retry drive</TextLink>
          <TextLink href="/college/placements/drives">Back to Drives</TextLink>
        </div>}/>
    </div>;
  }
}
