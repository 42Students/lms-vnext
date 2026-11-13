import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {Alert} from "@/components/ui/alert";
import {TpoDriveClosePreviewForm} from "@/components/placements/tpo-drive-close-preview-form";
import {hasMembershipRole} from "@/modules/identity/context";
import {PlacementsServiceError} from "@/modules/placements/errors";
import {getTpoDriveClosePreview} from "@/modules/placements/tpo-drive-close-preview-service";
import { TextLink } from "@/components/ui/text-link";
import { ROLE } from "@/modules/identity/roles";
export default async function TpoDriveClosePreviewPage({params}:{params:Promise<{jobId:string}>}){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,ROLE.TPO))redirect("/dashboard");
 const {jobId}=await params;
 let preview:Awaited<ReturnType<typeof getTpoDriveClosePreview>>;
 try{preview=await getTpoDriveClosePreview(context,jobId);}catch(error){
  if(error instanceof PlacementsServiceError&&error.code==="PLACEMENT_JOB_NOT_FOUND")notFound();
  throw error;
 }
 return <div className="min-w-0 space-y-6">
  <PageHeader eyebrow="TPO · Drive lifecycle" title={preview.title+" · Close preview"}
   description="Review persisted application, round and offer counts before an audited closure."
   actions={<TextLink href={"/tpo/placements/jobs/"+preview.id} className="inline-flex min-h-11 items-center w-full justify-center text-sm md:min-h-9 md:w-auto">← Drive workspace</TextLink>}/>
  {preview.canClose?<TpoDriveClosePreviewForm preview={preview}/>:
   <Alert tone="warning">
    {preview.pendingPromotions>0?
      "A waitlisted learner's reserved offer is still pending. Finish the waitlist offer before closing this drive.":
     preview.pendingSelections>0?
      "Verify and release, or withdraw, all pending company selections before closing this drive.":
     preview.issuedOffers>0?
      "Release or withdraw outstanding offers before closing this drive.":
      "Closure is available only for published drives with a recorded season. To cancel instead, use the Cancel drive preview."}
   </Alert>}
 </div>;
}
