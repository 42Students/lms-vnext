import Link from "next/link";
import {notFound} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {ErrorState} from "@/components/ui/error-state";
import {can} from "@/modules/permissions/policy";
import {SuperAdminPlacementDetailView} from "@/components/admin/super-admin-placement-detail-view";
import {getSuperAdminShortlistedDetail} from "@/modules/admin-ui/super-admin-shortlisted-detail-service";
import {readSuperAdminPlacementId} from "@/modules/admin-ui/super-admin-placement-detail-model";

export default async function SuperAdminShortlistedDetail({params}:{params:Promise<{applicationId:string}>}){
 const context=await getCurrentRequestContext();
 const {applicationId}=await params;
 const id=readSuperAdminPlacementId(applicationId);
 if(!id)notFound();
 const selected=context?.adminScope;
 if(!selected?.collegeId||!can(context,"placements.read",{
   collegeId:selected.collegeId,organizationId:selected.organizationId,
 })){
  return <div className="min-w-0 space-y-5">
   <PageHeader eyebrow="Super Admin · Placements" title="Shortlisted applicant"/>
   <ErrorState title="Select a college to continue"
    description="An active Super Admin with a selected college is required to view shortlisted applicant details."
    action={<Link href="/admin/placements/shortlisted" className="font-semibold text-[var(--lms-teal-deep)]">Back to shortlisted applicants</Link>}/>
  </div>;
 }
 let detail:Awaited<ReturnType<typeof getSuperAdminShortlistedDetail>>;
 try{
  detail=await getSuperAdminShortlistedDetail(context,id);
 }catch{
  return <div className="min-w-0 space-y-5">
   <PageHeader eyebrow="Super Admin · Placements" title="Shortlisted applicant"/>
   <ErrorState title="Shortlisted applicant unavailable"
    description="This applicant detail could not be loaded. Your selected college has not changed."
    action={<Link href="/admin/placements/shortlisted" className="font-semibold text-[var(--lms-teal-deep)]">Back to shortlisted applicants</Link>}/>
  </div>;
 }
 if(!detail)notFound();
 return <SuperAdminPlacementDetailView data={detail}/>;
}
