import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import { getCurrentRequestContext } from "@/auth/request-context";
import { HrDriveDraftForm } from "@/components/hr/hr-drive-draft-form";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import { NeedsDoingChips } from "@/components/ui/needs-doing-chips";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { hasActiveRecruiter } from "@/modules/identity/context";
import { PlacementsServiceError } from "@/modules/placements/errors";
import {
  emptyHrDriveDraft,
  hrDriveDraftSchema,
  hrDriveDraftQuerySchema,
  hrDraftFromAuthorizedJob,
} from "@/modules/placements/hr-drive-draft-model";
import { getRecruiterPlacementWorkspace } from "@/modules/placements/recruiter-workspace-service";
import { hrDriveSessionStorageKey,hrDriveDraftFormStateKey } from "@/modules/placements/hr-unsent-draft-storage-model";
import {listOwnRecruiterDriveRequests} from "@/modules/placements/recruiter-drive-request-service";
import {hrSentProposalsHref} from "@/modules/placements/hr-drive-proposal-links-model";
import {listRecruiterCollegeBranches} from "@/modules/placements/recruiter-college-branch-service";

export default async function RecruiterRequestDrivePage({
  searchParams,
}: {
  searchParams: Promise<{
    collegeId?: string | string[];
    from?: string | string[];
    fix?: string | string[];
    edit?: string | string[];
    copy?: string | string[];
  }>;
}) {
  const context = await getCurrentRequestContext();
  if (!hasActiveRecruiter(context) || !context.recruiter || context.recruiter.userId !== context.user.id) redirect("/dashboard");
  const raw = await searchParams;
  // Never silently select one of multiple conflicting college/job links.
  const parsed = hrDriveDraftQuerySchema.safeParse({
    collegeId: raw.collegeId,
    from: raw.from,
    fix: raw.fix,
    edit: raw.edit,
    copy: raw.copy,
  });
  if (!parsed.success) notFound();
  const query = parsed.data;
  const grants = context.recruiter.grants;

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
    return <div className="min-w-0 max-w-full space-y-6">
      <PageHeader title="Request a drive"
        description="Choose an authorized college before drafting a hiring request." />
      {grants.length === 0 ? (
        <EmptyState title="No active college access"
          description="Ask the placement cell to grant recruiter access before preparing a drive." />
      ) : (
        <NeedsDoingChips label="Authorized colleges:" items={grants.map(grant=>({
          key:grant.collegeId,label:grant.collegeName,
          href:"/hr/drives/new?collegeId="+encodeURIComponent(grant.collegeId),
        }))}/>
      )}
    </div>;
  }
  const grant = grants.find((item) => item.collegeId === collegeId)!;
  const branchSuggestions=await listRecruiterCollegeBranches(context,collegeId);
  const requestId=query.fix??query.edit??query.copy;
  const request=requestId
    ? (await listOwnRecruiterDriveRequests(context,collegeId)).find(item=>item.id===requestId)
    : null;
  if(requestId && (!request ||
    (query.fix?request.status!=="SENT_BACK":
     query.edit?request.status!=="REQUEST":
      !["REJECTED","CANCELLED"].includes(request.status))))notFound();
  const originalDraft=request?hrDriveDraftSchema.safeParse(request.draft):null;
  if(originalDraft&&!originalDraft.success)notFound();
  const initial = originalDraft?.success?originalDraft.data:fromJob
    ? hrDraftFromAuthorizedJob(fromJob.job, fromJob.rounds)
    : emptyHrDriveDraft();

  return <div className="min-w-0 max-w-full space-y-6">
    <PageHeader title={query.fix ? "Fix and Resend" : query.edit ? "Edit your request" : query.copy ? "Hire again with changes" : fromJob ? "Hire again" : "Request a drive"}
      description={context.recruiter.companyName + " · " + grant.collegeName + ". Your request will be saved for placement-cell review."} />
    <nav className="flex flex-wrap items-center gap-3" aria-label="Recruiter drive links">
      <PageBackLink href={"/hr/drives?collegeId=" + encodeURIComponent(collegeId)} label="Back to drives"/>
    <Link href={hrSentProposalsHref(collegeId)}
      className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">
      View previously sent discussion proposals
    </Link>
    <Link href={"/hr/drives/recorded-outside?collegeId="+encodeURIComponent(collegeId)}
      className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">
      Record an outside-platform drive
    </Link>
    </nav>
    <HrDriveDraftForm
      key={hrDriveDraftFormStateKey(context.user.id,collegeId,
        query.fix?"FIX":query.edit?"EDIT":query.copy?"COPY":query.from?"FROM":"NEW",
        requestId??query.from??null)}
      initial={initial} branchSuggestions={branchSuggestions} sourceJobTitle={fromJob?.job.title ?? null}
      storageKey={hrDriveSessionStorageKey(context.user.id,collegeId,query.copy??fromJob?.job.id)}
      feedbackKey={hrDriveSessionStorageKey(context.user.id,collegeId,null)+":feedback"}
      collegeId={collegeId} sourceJobId={fromJob?.job.id??null}
      fixRequestId={query.copy?null:request?.id??null} fixUpdatedAt={query.copy?null:request?.updatedAt.toISOString()??null}
      editMode={query.edit?"EDIT":"RESUBMIT"} />
  </div>;
}
