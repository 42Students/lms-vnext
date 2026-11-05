import type { ReactNode } from "react";
import { getCurrentRequestContext } from "@/auth/request-context";
import { getPlacementJob } from "@/modules/placements/job-service";
import { redirect } from "next/navigation";
import { AdminPlacementJobTabs } from "./admin-placement-job-tabs";
import { TextLink } from "@/components/ui/text-link";

export default async function SuperAdminDriveLayout({children,params}:{
 children:ReactNode; params:Promise<{jobId:string}>;
}) {
 const {jobId}=await params;
 const context=await getCurrentRequestContext();
 if(!context.adminScope?.collegeId)redirect("/admin/placements");
 const job=await getPlacementJob(context,jobId);
 const base="/admin/placements/jobs/"+encodeURIComponent(jobId);
 return <div className="min-w-0 space-y-[var(--lms-space-4)]">
  <nav aria-label="Drive breadcrumb" className="flex min-w-0 flex-wrap items-center gap-[var(--lms-space-2)] text-[var(--lms-font-sm)] leading-5 text-[var(--lms-body-text)]">
   <TextLink href="/admin/placements/drives" className="inline-flex min-h-11 items-center md:min-h-[var(--lms-control-height)]">Drives</TextLink>
   <span aria-hidden="true">›</span>
   <span className="min-w-0 flex-1 truncate">{job.title}</span>
  </nav>
  <AdminPlacementJobTabs basePath={base} />
  {children}
 </div>;
}
