import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ZodError } from "zod";
import { getPlacementJob } from "@/modules/placements/job-service";
import { PlacementsServiceError } from "@/modules/placements/errors";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PlacementDriveWorkspace } from "@/components/placements/placement-drive-workspace";
import { can } from "@/modules/permissions/policy";
import {tpoDriveTabHref} from "@/modules/placements/tpo-drive-tab-model";

export default async function TpoPlacementDrivePage({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<{ publish?: string | string[]; tab?: string | string[] }>;
}) {
  const context = await getCurrentRequestContext();
  if (
    !context.membership ||
    !can(context, "placements.manage", { collegeId: context.membership.collegeId })
  ) {
    redirect("/dashboard");
  }
  const [{ jobId }, query] = await Promise.all([params, searchParams]);
  const openPublish = (Array.isArray(query.publish) ? query.publish[0] : query.publish) === "1";
  // Unknown ids, other colleges' drives and malformed ids all render the same Not Found page.
  try {
    await getPlacementJob(context, jobId);
  } catch (error) {
    if (
      error instanceof ZodError ||
      error instanceof AuthorizationError ||
      (error instanceof PlacementsServiceError && error.code === "PLACEMENT_JOB_NOT_FOUND")
    ) notFound();
    throw error;
  }
  const tab=Array.isArray(query.tab)?query.tab[0]:query.tab;
  if(tab&&["applicants","rounds","offers","drive-day","discussion","about"].includes(tab)){
    redirect(tpoDriveTabHref(jobId,tab));
  }
  return (
    <div className="min-w-0 space-y-4">
      <Link href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/discussion"}
        className="inline-flex min-h-10 items-center rounded-md border border-border px-3 text-sm font-semibold text-primary-text">Discuss →</Link>
      <Link href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/interview-slots"}
        className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-primary-text">
        Employer interview slot proposals →
      </Link>
      <PlacementDriveWorkspace context={context} jobId={jobId} eyebrow="TPO" openPublish={openPublish}/>
    </div>
  );
}
