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
    <div className="min-w-0 space-y-[var(--lms-space-4)]">
      <nav aria-label="Drive quick links" className="flex min-w-0 flex-wrap items-center gap-[var(--lms-space-2)]">
      <Link href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/discussion"}
        className="inline-flex min-h-11 max-w-full items-center rounded-[var(--lms-radius-control)] border border-[var(--lms-canvas-border)] bg-surface px-[var(--lms-space-3)] text-sm font-semibold text-[var(--lms-link-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary)] md:min-h-9">Discuss →</Link>
      <Link href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/interview-slots"}
        className="inline-flex min-h-11 max-w-full items-center rounded-[var(--lms-radius-control)] border border-[var(--lms-canvas-border)] bg-surface px-[var(--lms-space-3)] text-sm font-semibold text-[var(--lms-link-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary)] md:min-h-9">
        Employer interview slot proposals →
      </Link>
      </nav>
      <PlacementDriveWorkspace context={context} jobId={jobId} eyebrow="TPO" openPublish={openPublish}/>
    </div>
  );
}
