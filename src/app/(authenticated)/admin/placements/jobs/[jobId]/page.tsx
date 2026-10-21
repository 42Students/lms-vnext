import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import { Banner } from "@/components/ui/banner";
import { ErrorState } from "@/components/ui/error-state";
import { AuthorizationError } from "@/modules/permissions/policy";
import { z } from "zod";
import { getPlacementJob } from "@/modules/placements/job-service";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import { getCurrentRequestContext } from "@/auth/request-context";
import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
import { PlacementDriveWorkspace } from "@/components/placements/placement-drive-workspace";
import { getSuperAdminDrivePipeline } from "@/modules/placements/super-admin-drive-pipeline-service";
import { SuperAdminDrivePipeline } from "@/components/placements/super-admin-drive-pipeline";
import {getSuperAdminDriveAttention} from "@/modules/placements/super-admin-drive-attention-service";

export default async function AdminPlacementDrivePage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.adminScope?.collegeId) return <div className="min-w-0 space-y-4">
    <PageHeader title="Placement Drives" description="Placement administration requires a college safety scope."
      actions={<PageBackLink href="/admin/placements" label="Placement overview" />} />
    <Banner tone="warning" role="status">Select a college to continue. Choose a college in the Super Admin scope selector before accessing a placement drive.</Banner>
    <EmptyState title="Choose a college" description="Only the currently selected college's placement drives can be managed."/>
  </div>;
  requireSuperAdminSelectedCollege(context,"placements.manage");
  const { jobId } = await params;
  const backHref="/admin/placements";
  if(!z.uuid().safeParse(jobId).success)return <div className="min-w-0 space-y-4">
    <PageHeader title="Placement Drives" actions={<PageBackLink href={backHref} label="Drives"/>}/>
    <ErrorState title="Could not load this drive."
      description="The drive ID is invalid. Return to the placement list and select a drive."
      action={<Link href={backHref} className="font-semibold text-primary-text underline">Back to Drives</Link>}/>
  </div>;
  // Attention is informational: its failure never hides the drive, actions
  // or pipeline, and no counts are invented when that read is unavailable.
  const [jobRead,pipelineRead,attentionRead]=await Promise.allSettled([
    getPlacementJob(context,jobId),
    getSuperAdminDrivePipeline(context,jobId),
    getSuperAdminDriveAttention(context,jobId),
  ]);
  if(jobRead.status==="rejected"){
    if(jobRead.reason instanceof AuthorizationError)throw jobRead.reason;
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Placement Drives" actions={<PageBackLink href={backHref} label="Drives"/>}/>
      <ErrorState title="Could not load this drive."
        description="The selected drive could not be loaded. No changes were made."
        action={<Link href={"/admin/placements/jobs/"+encodeURIComponent(jobId)}
          className="font-semibold text-primary-text underline">Retry drive</Link>}/>
      <PageBackLink href={backHref} label="Back to Drives"/>
    </div>;
  }
  if(pipelineRead.status==="rejected"&&pipelineRead.reason instanceof AuthorizationError)
    throw pipelineRead.reason;
  if(attentionRead.status==="rejected"&&attentionRead.reason instanceof AuthorizationError)
    throw attentionRead.reason;
  const pipeline=pipelineRead.status==="fulfilled"?pipelineRead.value:null;
  const attention=attentionRead.status==="fulfilled"?attentionRead.value:[];
  return (
   <div className="min-w-0 space-y-[var(--lms-space-4)] md:space-y-[var(--lms-space-6)]">
    {attention.length>0?<Banner tone="warning" role="status">
      <section aria-label="Needs attention" className="space-y-2">
        <h2 className="text-sm font-semibold">Needs attention ({attention.reduce((sum,item)=>sum+item.count,0)})</h2>
        <ul className="space-y-2">
          {attention.map(item=><li key={item.label} className="flex min-w-0 flex-wrap items-baseline gap-2 text-sm">
            <strong>{item.label} ({item.count})</strong>
            <span>{item.details}</span>
            <Link href={"/admin/placements/jobs/"+encodeURIComponent(jobId)+
              "/applications"+(item.stage?"?stage="+encodeURIComponent(item.stage):"")}
              className="inline-flex min-h-9 items-center font-semibold text-primary-text underline">
              Review applications →
            </Link>
          </li>)}
        </ul>
      </section>
    </Banner>:null}
    <PlacementDriveWorkspace
      context={context}
      jobId={jobId}
      applicationsHref={"/admin/placements/jobs/" + encodeURIComponent(jobId) + "/applications"}
      overview={pipeline ? <SuperAdminDrivePipeline rows={pipeline}/> :
        <Banner tone="warning" role="status"
          action={<Link href={"/admin/placements/jobs/"+encodeURIComponent(jobId)}
            className="font-semibold text-primary-text underline">Retry metrics</Link>}>
          Could not load pipeline metrics. The drive details and actions remain available.
        </Banner>}
    />
   </div>
  );
}
