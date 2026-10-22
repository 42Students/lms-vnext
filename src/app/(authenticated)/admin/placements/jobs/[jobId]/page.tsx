import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import { Banner } from "@/components/ui/banner";
import { ErrorState } from "@/components/ui/error-state";
import { AuthorizationError } from "@/modules/permissions/policy";
import { z } from "zod";
import { getPlacementJob } from "@/modules/placements/job-service";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { PageBackLink } from "@/components/ui/page-back-link";
import { getCurrentRequestContext } from "@/auth/request-context";
import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
import { PlacementDriveWorkspace } from "@/components/placements/placement-drive-workspace";
import { getSuperAdminDrivePipeline } from "@/modules/placements/super-admin-drive-pipeline-service";
import { SuperAdminDrivePipeline } from "@/components/placements/super-admin-drive-pipeline";
import {getSuperAdminDriveAttention} from "@/modules/placements/super-admin-drive-attention-service";

export default async function AdminPlacementDrivePage({
  params, searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams?: Promise<{returnTo?:string|string[]}>;
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
  const requestedReturn=(await searchParams)?.returnTo;
  const requested=typeof requestedReturn==="string"?requestedReturn:"";
  const backHref=requested.startsWith("/admin/placements") &&
    !requested.startsWith("//") && !requested.includes("\\") &&
    requested.length<512?requested:"/admin/placements/drives";
  const preserved=backHref==="/admin/placements/drives"?"":"?returnTo="+encodeURIComponent(backHref);
  const root="/admin/placements/jobs/"+encodeURIComponent(jobId);
  const withReturn=(path:string)=>path+preserved;
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
  const job=jobRead.value;
  let workspace: Awaited<ReturnType<typeof PlacementDriveWorkspace>>;
  try {
    workspace = await PlacementDriveWorkspace({
      context,
      jobId,
      applicationsHref: withReturn(root+"/applications"),
      overview: <SuperAdminDrivePipeline rows={pipeline} attention={attention} jobId={jobId}/>,
    });
  } catch (error) {
    if (error instanceof AuthorizationError) throw error;
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Placement Drives" actions={<PageBackLink href={backHref} label="Drives"/>}/>
      <ErrorState title="Could not load this drive."
        description="Drive details could not be refreshed. No changes were made."
        action={<Link href={root+preserved} prefetch={false}
          className="font-semibold text-link underline">Retry drive</Link>}/>
    </div>;
  }
  const navItems=[
    {label:"Overview",href:withReturn(root)},
    {label:"Applications",href:withReturn(root+"/applications")},
    {label:"Schedule",href:withReturn(root+"/schedule")},
    {label:"Settings",href:withReturn(root+"/settings")},
  ];
  return (
   <div className="min-w-0 space-y-[var(--lms-space-4)] md:space-y-[var(--lms-space-6)]">
    <nav aria-label="Drive breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      <Link href={backHref} className="font-semibold text-primary-text hover:underline">Drives</Link>
      <span aria-hidden="true">›</span><span className="truncate">{job.title}</span>
    </nav>
    <Tabs ariaLabel="Drive workspace" value="Overview" renderPanel={false}
      items={navItems.map(item=>({value:item.label,label:item.label,href:item.href}))}/>
    {workspace}
   </div>
  );
}
