import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {Alert} from "@/components/ui/alert";
import {TpoDriveClosePreviewForm} from "@/components/placements/tpo-drive-close-preview-form";
import {hasMembershipRole} from "@/modules/identity/context";
import {PlacementsServiceError} from "@/modules/placements/errors";
import {getTpoDriveClosePreview} from "@/modules/placements/tpo-drive-close-preview-service";
export default async function TpoDriveClosePreviewPage({params}:{params:Promise<{jobId:string}>}){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const {jobId}=await params;
 let preview:Awaited<ReturnType<typeof getTpoDriveClosePreview>>;
 try{preview=await getTpoDriveClosePreview(context,jobId);}catch(error){
  if(error instanceof PlacementsServiceError&&error.code==="PLACEMENT_JOB_NOT_FOUND")notFound();
  throw error;
 }
 return <div className="min-w-0 space-y-5">
  <Link href={"/tpo/placements/jobs/"+preview.id} className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--lms-link-text)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">← Drive workspace</Link>
  <PageHeader eyebrow="TPO · Drive lifecycle" title={preview.title+" · Close preview"}
   description="Review persisted application, round and offer counts before an audited closure."/>
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
