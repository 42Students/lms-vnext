import {notFound,redirect} from "next/navigation";
import {PageHeader} from "@/components/ui/page-header";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasMembershipRole} from "@/modules/identity/context";
import {TpoWaitlistPromotionControl} from "@/components/placements/tpo-waitlist-promotion-control";
import {getTpoWaitlistPreview} from "@/modules/placements/tpo-waitlist-promotion-service";
import {PlacementsServiceError} from "@/modules/placements/errors";
import { ButtonLink } from "@/components/ui/button-link";
import { TextLink } from "@/components/ui/text-link";
import { ROLE } from "@/modules/identity/roles";
export const dynamic="force-dynamic";
export default async function TpoWaitlistPage({params}:{params:Promise<{jobId:string}>}){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,ROLE.TPO))redirect("/dashboard");
 const {jobId}=await params;let data:Awaited<ReturnType<typeof getTpoWaitlistPreview>>;
 try{data=await getTpoWaitlistPreview(context,jobId);}
 catch(e){if(e instanceof PlacementsServiceError&&e.code==="PLACEMENT_JOB_NOT_FOUND")notFound();throw e;}
 return <div className="min-w-0 space-y-4">
  <PageHeader eyebrow="TPO · Offers" title={data.job.title+" · Waitlist"} description="Review ranked applied waitlist results and release the next available offer seat exactly once."
    actions={<ButtonLink variant="secondary" href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/offers"}
      className="w-full sm:w-auto">Offer register</ButtonLink>}/>
  <nav aria-label="Waitlist related pages" className="flex min-w-0 flex-wrap items-center gap-3 text-sm">
   <TextLink href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/rounds"}
    className="inline-flex min-h-11 items-center md:min-h-9">Round results</TextLink>
   <TextLink href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/selections"}
    className="inline-flex min-h-11 items-center md:min-h-9">Selections</TextLink>
   <TextLink href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/offers"}
    className="inline-flex min-h-11 items-center md:min-h-9">Offers</TextLink>
  </nav>
  <TpoWaitlistPromotionControl jobId={jobId} preview={data}/>
 </div>;
}
