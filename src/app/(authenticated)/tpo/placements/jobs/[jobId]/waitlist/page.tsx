import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {PageHeader} from "@/components/ui/page-header";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasMembershipRole} from "@/modules/identity/context";
import {TpoWaitlistPromotionControl} from "@/components/placements/tpo-waitlist-promotion-control";
import {getTpoWaitlistPreview} from "@/modules/placements/tpo-waitlist-promotion-service";
import {PlacementsServiceError} from "@/modules/placements/errors";
export const dynamic="force-dynamic";
export default async function TpoWaitlistPage({params}:{params:Promise<{jobId:string}>}){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const {jobId}=await params;let data:Awaited<ReturnType<typeof getTpoWaitlistPreview>>;
 try{data=await getTpoWaitlistPreview(context,jobId);}
 catch(e){if(e instanceof PlacementsServiceError&&e.code==="PLACEMENT_JOB_NOT_FOUND")notFound();throw e;}
 return <div className="min-w-0 space-y-5">
  <PageHeader eyebrow="TPO · Offers" title={data.job.title+" · Waitlist"} description="Review ranked applied waitlist results and release the next available offer seat exactly once."/>
  <nav aria-label="Waitlist related pages" className="flex min-w-0 flex-wrap items-center gap-3 text-[13px]"><Link href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/offers"}
   className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-teal-deep)] underline md:min-h-9">Offer register</Link>
   <Link href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/rounds"}
    className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-teal-deep)] underline md:min-h-9">Round results</Link></nav>
  <TpoWaitlistPromotionControl jobId={jobId} preview={data}/>
 </div>;
}
