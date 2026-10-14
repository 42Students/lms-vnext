import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import { getCurrentRequestContext } from "@/auth/request-context";
import { HrDriveDraftForm } from "@/components/hr/hr-drive-draft-form";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { hasActiveRecruiter } from "@/modules/identity/context";
import { PlacementsServiceError } from "@/modules/placements/errors";
import {
  emptyHrDriveDraft,
  hrDriveDraftQuerySchema,
  hrDraftFromAuthorizedJob,
} from "@/modules/placements/hr-drive-draft-model";
import { getRecruiterPlacementWorkspace } from "@/modules/placements/recruiter-workspace-service";
import { hrDriveSessionStorageKey } from "@/modules/placements/hr-unsent-draft-storage-model";

export default async function RecruiterRequestDrivePage({
  searchParams,
}: {
  searchParams: Promise<{
    collegeId?: string | string[];
    from?: string | string[];
    fix?: string | string[];
  }>;
}) {
  const context = await getCurrentRequestContext();
  if (!hasActiveRecruiter(context) || !context.recruiter) redirect("/dashboard");
  const raw = await searchParams;
  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;
  const parsed = hrDriveDraftQuerySchema.safeParse({
    collegeId: first(raw.collegeId) || undefined,
    from: first(raw.from) || undefined,
    fix: first(raw.fix) || undefined,
  });
  if (!parsed.success) notFound();
  const query = parsed.data;
  const grants = context.recruiter.grants;
  if (query.fix) {
    return <div className="space-y-6">
      <PageHeader eyebrow="Employer Recruiter" title="Fix and Resend"
        description="The request approval and requested-changes persistence is not registered." />
      <ErrorState title="Cannot safely reopen this request"
        description="The original requested changes cannot be verified or saved yet. No request has been modified." />
      <Link href="/hr/drives" className="text-sm font-semibold text-primary-text">Back to drives</Link>
    </div>;
  }

  let fromJob: Awaited<ReturnType<typeof getRecruiterPlacementWorkspace>> | null = null;
  if (query.from) {
    try {
      fromJob = await getRecruiterPlacementWorkspace(context, query.from);
    } catch (error) {
      if (error instanceof PlacementsServiceError && error.code === "PLACEMENT_JOB_NOT_FOUND") notFound();
      if (error instanceof z.ZodError) notFound();
      throw error;
    }
    if (query.collegeId && fromJob.college.id !== query.collegeId) notFound();
  }

  const collegeId = query.collegeId ?? fromJob?.college.id ??
    (grants.length === 1 ? grants[0]!.collegeId : null);
  if (collegeId && !grants.some((grant) => grant.collegeId === collegeId)) notFound();

  if (!collegeId) {
    return <div className="space-y-6">
      <PageHeader eyebrow="Employer Recruiter" title="Request a Drive"
        description="Choose an authorized college before drafting a hiring request." />
      {grants.length === 0 ? (
        <EmptyState title="No active college access"
          description="Ask the placement cell to grant recruiter access before preparing a drive." />
      ) : (
        <section className="grid gap-3 sm:grid-cols-2">
          {grants.map((grant) => (
            <Link key={grant.id} href={"/hr/drives/new?collegeId=" + encodeURIComponent(grant.collegeId)}
              className="rounded-xl border border-border bg-surface p-4 font-semibold text-primary-text">
              {grant.collegeName}
            </Link>
          ))}
        </section>
      )}
    </div>;
  }
  const grant = grants.find((item) => item.collegeId === collegeId)!;
  const initial = fromJob
    ? hrDraftFromAuthorizedJob(fromJob.job, fromJob.rounds)
    : emptyHrDriveDraft();

  return <div className="space-y-6">
    <PageHeader eyebrow="Employer Recruiter" title={fromJob ? "Hire Again · draft preview" : "Request a Drive · draft preview"}
      description={context.recruiter.companyName + " · " + grant.collegeName + ". A local-only preview until employer request persistence is available."} />
    <Link href={"/hr/drives?collegeId=" + encodeURIComponent(collegeId)}
      className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text">
      ← Back to drives
    </Link>
    <HrDriveDraftForm initial={initial} sourceJobTitle={fromJob?.job.title ?? null}
      storageKey={hrDriveSessionStorageKey(context.user.id,collegeId,fromJob?.job.id)} />
  </div>;
}
