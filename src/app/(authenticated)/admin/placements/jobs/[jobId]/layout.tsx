import Link from "next/link";
import type { ReactNode } from "react";
import { getCurrentRequestContext } from "@/auth/request-context";
import { getPlacementJob } from "@/modules/placements/job-service";
import { redirect } from "next/navigation";
import { AdminPlacementJobTabs } from "./admin-placement-job-tabs";

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
   <Link href="/admin/placements/drives" className="font-semibold text-primary-text inline-flex min-h-11 items-center md:min-h-[var(--lms-control-height)]">Drives</Link>
   <span aria-hidden="true">›</span>
   <span className="min-w-0 flex-1 truncate">{job.title}</span>
  </nav>
  <AdminPlacementJobTabs basePath={base} />
  {children}
 </div>;
}
