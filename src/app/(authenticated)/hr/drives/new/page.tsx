import Link from "next/link";
import { redirect } from "next/navigation";
import { and, countDistinct, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { collegeMemberships, learnerProgramEnrollments } from "@/db/schema";
import { z } from "zod";

import { getCurrentRequestContext } from "@/auth/request-context";
import { HrDriveDraftForm } from "@/components/hr/hr-drive-draft-form";
import { PageHeader } from "@/components/ui/page-header";
import { NeedsDoingChips } from "@/components/ui/needs-doing-chips";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/status-badge";
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

function DriveSourceUnavailable({ collegeId }: { collegeId?: string | null }) {
  const backHref=collegeId
    ? "/hr/drives?collegeId="+encodeURIComponent(collegeId) : "/hr/drives";
  return <div className="min-w-0 space-y-4">
    <PageHeader title="Request a drive" />
    <ErrorState title="We couldn't load that drive"
      description="The original request or job may have been removed, changed, or is no longer available to this recruiter. No draft was modified."
      action={<Link href={backHref} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text">All drives</Link>} />
  </div>;
}

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
  const account=await getCurrentRequestContext().then(value=>({ok:true as const,value}))
    .catch(()=>({ok:false as const}));
  if(!account.ok)return <div className="min-w-0 space-y-4">
   <PageHeader title="Request a drive"/>
   <ErrorState title="We couldn't load your account"
    description="Your recruiter session could not be loaded. Try again without losing a saved draft on this device."
    action={<Link href="/hr/drives/new" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Retry</Link>}/>
  </div>;
  const context=account.value;
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
  if (!parsed.success) return <DriveSourceUnavailable />;
  const query = parsed.data;
  const grants = context.recruiter.grants;

  let fromJob: Awaited<ReturnType<typeof getRecruiterPlacementWorkspace>> | null = null;
  if (query.from) {
    try {
      fromJob = await getRecruiterPlacementWorkspace(context, query.from);
    } catch(error) {
      if(error instanceof PlacementsServiceError||error instanceof z.ZodError)
       return <DriveSourceUnavailable collegeId={typeof raw.collegeId==="string"?raw.collegeId:null}/>;
      return <div className="min-w-0 space-y-4">
       <PageHeader title="Request a drive"/>
       <ErrorState title="We couldn't load that drive"
        description="The source drive could not be loaded. Your unsent draft was not changed."
        action={<Link href={"/hr/drives/new?from="+encodeURIComponent(query.from)}
         className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Retry</Link>}/>
      </div>;
    }
    if (query.collegeId && fromJob.college.id !== query.collegeId)
      return <DriveSourceUnavailable collegeId={query.collegeId} />;
  }

  const collegeId = query.collegeId ?? fromJob?.college.id ??
    (grants.length === 1 ? grants[0]!.collegeId : null);
  if (collegeId && !grants.some((grant) => grant.collegeId === collegeId))
    return <DriveSourceUnavailable />;

  if (!collegeId) {
    return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
      <PageHeader title="Request a drive"
        description="Choose an authorized college before drafting a hiring request." />
      <Alert tone="info" title="Choose a college">Select an authorized college before requesting a drive.</Alert>
      {grants.length === 0 ? (
        <EmptyState title="No college selected"
          description="Ask the placement cell to grant recruiter access before preparing a drive."
          action={<Link href="/hr/drives" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">All drives</Link>}/>
      ) : (
        <NeedsDoingChips label="Authorized colleges:" items={grants.map(grant=>({
          key:grant.collegeId,label:grant.collegeName,
          href:"/hr/drives/new?collegeId="+encodeURIComponent(grant.collegeId),
        }))}/>
      )}
    </div>;
  }
  const grant = grants.find((item) => item.collegeId === collegeId)!;
  // Suggestions are optional. A service outage must not block manual entry.
  let branchSuggestions: string[] = [];
  let suggestionsUnavailable = false;
  try { branchSuggestions = await listRecruiterCollegeBranches(context,collegeId); }
  catch { suggestionsUnavailable = true; }
  let approximateStudents: number | null = null;
  try {
    const [population] = await getDb().select({
      total: countDistinct(learnerProgramEnrollments.membershipId),
    }).from(learnerProgramEnrollments)
      .innerJoin(collegeMemberships,
        eq(collegeMemberships.id, learnerProgramEnrollments.membershipId))
      .where(and(eq(collegeMemberships.collegeId,collegeId),
        eq(collegeMemberships.status,"ACTIVE"),
        eq(learnerProgramEnrollments.status,"ACTIVE")));
    approximateStudents = Math.max(0, Math.round((population?.total ?? 0) / 10) * 10);
  } catch { /* Read-only preview is optional; never block a draft. */ }
  const requestId=query.fix??query.edit??query.copy;
  const requestResult=requestId?await listOwnRecruiterDriveRequests(context,collegeId)
   .then(value=>({ok:true as const,value})).catch(()=>({ok:false as const})):null;
  if(requestResult&&!requestResult.ok)return <div className="min-w-0 space-y-4">
    <PageHeader title="Request a drive" actions={<Link href="/hr/drives" className="font-semibold text-primary-text underline">All drives</Link>}/>
    <ErrorState title="Couldn't load your requests"
     description="Your existing request is temporarily unavailable. Your unsent draft has not changed."
     action={<Link href={"/hr/drives/new?collegeId="+encodeURIComponent(collegeId)+"&"+(query.fix?"fix":query.edit?"edit":"copy")+"="+encodeURIComponent(requestId!)}
      className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Retry</Link>}/>
  </div>;
  const request=requestResult?.ok?requestResult.value.find(item=>item.id===requestId):null;
  if(requestId && (!request ||
    (query.fix?request.status!=="SENT_BACK":
     query.edit?request.status!=="REQUEST":
      !["REJECTED","CANCELLED"].includes(request.status))))
    return <DriveSourceUnavailable collegeId={collegeId} />;
  const originalDraft=request?hrDriveDraftSchema.safeParse(request.draft):null;
  if(originalDraft&&!originalDraft.success)
    return <DriveSourceUnavailable collegeId={collegeId} />;
  const initial = originalDraft?.success?originalDraft.data:fromJob
    ? hrDraftFromAuthorizedJob(fromJob.job, fromJob.rounds)
    : emptyHrDriveDraft();

  return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
    <PageHeader title={query.fix ? "Fix and Resend" : query.edit ? "Edit your request" : query.copy ? "Hire again with changes" : fromJob ? "Hire again" : "Request a drive"}
      description={context.recruiter.companyName + " · " + grant.collegeName}
      actions={<Link href={"/hr/drives?collegeId="+encodeURIComponent(collegeId)}
       className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">All drives</Link>} />
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
      <StatusBadge tone={request?.status==="DRAFT"?"success":request?.status==="SENT_BACK"?"warning":"info"}>
       {request?.status==="DRAFT"?"Approved awaiting publication":
        request?.status==="SENT_BACK"?"Returned for changes":
        request?.status==="REQUEST"?"Sent for review":
        query.copy?"New request from previous drive":"Draft · not yet sent"}
      </StatusBadge>
      <span>Request is scoped to {grant.collegeName}. Dates and publication stay with the placement cell.</span>
    </div>
    <nav className="min-w-0 space-y-2" aria-label="Recruiter drive links">
    <details className="min-w-0 border-t border-border pt-2">
      <summary className="inline-flex min-h-11 w-full cursor-pointer items-center text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] min-[768px]:min-h-9 min-[768px]:w-auto">More drive destinations</summary>
      <div className="flex min-w-0 flex-col items-start gap-2 pb-2 min-[768px]:flex-row min-[768px]:flex-wrap">
    <Link href={hrSentProposalsHref(collegeId)}
      className="inline-flex min-h-11 w-full items-center text-sm font-semibold text-primary-text underline underline-offset-4 hover:text-[var(--lms-primary-text)] md:min-h-9 md:w-auto active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
      View previously sent discussion proposals
    </Link>
    <Link href={"/hr/drives/recorded-outside?collegeId="+encodeURIComponent(collegeId)}
      className="inline-flex min-h-11 w-full items-center text-sm font-semibold text-primary-text underline underline-offset-4 md:min-h-9 md:w-auto focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
      Record an outside-platform drive
    </Link>

      </div>
    </details>
    </nav>
    {approximateStudents!==null?<div role="status" className="rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] p-3 text-sm text-body">
      <strong>College overview</strong>
      <p>About {approximateStudents.toLocaleString("en-IN")} learners currently enrolled at {grant.collegeName}.</p>
      <p className="text-xs text-muted-foreground">Rounded college-wide estimate. No student identities are shown, and this is not the eligible audience for your request.</p>
    </div>:<Alert tone="warning">College enrollment preview is unavailable. You can still prepare a request; no estimated eligibility is implied.</Alert>}
    {suggestionsUnavailable ? <ErrorState title="College suggestions unavailable"
      description="You can enter eligible branches manually. Try again to reload suggested branches."
      retryHref={"/hr/drives/new?collegeId="+encodeURIComponent(collegeId)}
      retryLabel="Retry suggestions" /> : null}
    {grants.length>1?<p className="text-xs text-muted-foreground">Each request targets one authorized college. Adding another college to an existing drive group is paused; create a separate request for the other college instead.</p>:null}
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
