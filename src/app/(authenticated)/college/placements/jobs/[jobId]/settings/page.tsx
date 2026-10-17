import Link from "next/link";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasMembershipRole} from "@/modules/identity/context";
import {PageHeader} from "@/components/ui/page-header";
import {getCollegeDriveOverview} from "@/modules/placements/college-drive-overview-service";
import {CollegeLegacyDriveSettings} from "@/components/placements/college-legacy-drive-settings";
import {CollegeDriveArchiveAction} from "@/components/placements/college-drive-archive-action";
import type {CollegeLegacyDriveStatus} from "@/modules/placements/college-legacy-drive-settings-model";

export default async function CollegeDriveSettingsPage({
  params,
}:{params:Promise<{jobId:string}>}) {
  const context=await getCurrentRequestContext();
  if(!context.membership||!hasMembershipRole(context,"COLLEGE_ADMIN")){
    redirect("/dashboard");
  }
  const {jobId}=await params;
  const {drive}=await getCollegeDriveOverview(context,jobId);
  return <div className="space-y-6">
    <PageHeader eyebrow="Drives" title="Settings" description={drive.title}
      actions={<Link className="font-semibold text-primary-text underline"
        href={"/college/placements/jobs/"+encodeURIComponent(jobId)+"/overview"}>Overview</Link>}/>
    <CollegeLegacyDriveSettings jobId={jobId} status={drive.status as CollegeLegacyDriveStatus}/>
    {drive.status!=="ARCHIVED"?<CollegeDriveArchiveAction jobId={jobId}/>:null}
  </div>;
}
