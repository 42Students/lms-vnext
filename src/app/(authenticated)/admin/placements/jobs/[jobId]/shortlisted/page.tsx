import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";

/** Legacy "Manage Shortlisted" entry opens Assessment for the selected drive.
 * Keep the vNext canonical UUID and same scoped applications workspace.
 */
export default async function SuperAdminShortlistedApplicationsPage({params}:{
 params:Promise<{jobId:string}>;
}){
 const context=await getCurrentRequestContext();
 requireSuperAdminSelectedCollege(context,"placements.manage");
 const {jobId}=await params;
 redirect("/admin/placements/jobs/"+encodeURIComponent(jobId)+"/applications?stage=ASSESSMENT");
}
