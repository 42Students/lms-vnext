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
 return <div className="min-w-0 space-y-5">
  <nav aria-label="Drive breadcrumb" className="flex flex-wrap items-center gap-2 text-sm">
   <Link href="/admin/placements/drives" className="font-semibold text-primary-text">Drives</Link>
   <span aria-hidden="true">›</span>
   <span className="max-w-72 truncate">{job.title}</span>
  </nav>
  <AdminPlacementJobTabs basePath={base} />
  {children}
 </div>;
}
