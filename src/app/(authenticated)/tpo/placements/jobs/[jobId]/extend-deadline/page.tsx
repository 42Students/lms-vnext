import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {Alert} from "@/components/ui/alert";
import {TpoDriveDeadlineForm} from "@/components/placements/tpo-drive-deadline-form";
import {hasMembershipRole} from "@/modules/identity/context";
import {PlacementsServiceError} from "@/modules/placements/errors";
import {getTpoDriveDeadlineState} from "@/modules/placements/tpo-drive-deadline-service";
export default async function TpoExtendDeadlinePage({params}:{params:Promise<{jobId:string}>}){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const {jobId}=await params;
 let job:Awaited<ReturnType<typeof getTpoDriveDeadlineState>>;
 try{job=await getTpoDriveDeadlineState(context,jobId);}catch(error){
  if(error instanceof PlacementsServiceError&&error.code==="PLACEMENT_JOB_NOT_FOUND")notFound();
  throw error;
 }
 return <div className="min-w-0 space-y-5">
  <Link href={"/tpo/placements/jobs/"+job.id} className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--lms-link-text)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary)]">← Drive workspace</Link>
  <PageHeader eyebrow="TPO · Drive deadline" title={job.title}
   description={job.applicationDeadline?"Extend a published application deadline with a validated IST date and immutable audit.":"Set the first application deadline on this published drive, with a validated IST date and immutable audit."}/>
  {job.extendable?<TpoDriveDeadlineForm job={job}/>:<Alert tone="warning">
   Only published active-season drives can set or extend their application deadline.</Alert>}
 </div>;
}
