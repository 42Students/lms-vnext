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
  <AdminPlacementJobTabs basePath={base} title={job.title} />
  {children}
 </div>;
}
