import Link from "next/link";
import {notFound} from "next/navigation";
import {PageHeader} from "@/components/ui/page-header";
import {Alert} from "@/components/ui/alert";
import {EmptyState} from "@/components/ui/empty-state";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getTpoDriveDiscussion} from "@/modules/placements/tpo-drive-discussion-service";
import {PlacementsServiceError} from "@/modules/placements/errors";

export default async function TpoDriveDiscussion({params}:{
 params:Promise<{jobId:string}>
}){
 const {jobId}=await params;
 let data:Awaited<ReturnType<typeof getTpoDriveDiscussion>>;
 try{data=await getTpoDriveDiscussion(await getCurrentRequestContext(),jobId)}
 catch(error){if(error instanceof PlacementsServiceError&&error.code==="PLACEMENT_JOB_NOT_FOUND")notFound();throw error}
 const root="/tpo/placements/jobs/"+encodeURIComponent(jobId);
 return <div className="min-w-0 space-y-4">
  <PageHeader title={data.job.title+" · Discussion"}
    description="Conversations with recruiters attached to this drive. Private team notes are not shared with recruiters."/>
  <Link href={root} className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-link-text)] underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary)] md:min-h-9">← Back to drive</Link>
  {!data.available?<Alert tone="warning">
    Recruiter conversation records are unavailable right now. Other drive work is still available. Try again later.
   </Alert>:data.threads.length===0?<EmptyState title="No recruiter conversation is attached to this drive yet."
    description="Use Recruiter Messages to begin or find a recruiter conversation."
    action={<Link href="/tpo/messages" className="inline-flex min-h-11 items-center text-link underline md:min-h-9">Open Recruiter Messages</Link>}/>:<section aria-label="Recruiter conversations" className="space-y-3">
   <p role="status" className="text-sm text-body">{data.threads.length} recruiter conversation(s) attached to this drive.</p>
   <ul className="divide-y divide-border">{data.threads.map(thread=><li key={thread.id} className="min-w-0 py-4">
    <h2 className="break-words font-semibold">{thread.recruiterName?.trim()||"Recruiter"}</h2>
    {thread.lastPreview?<p className="mt-1 break-words text-sm text-body">{thread.lastPreview}</p>:null}
    <p className="text-sm text-body">{thread.count} recorded message(s) · {thread.unread} unread recruiter message(s)</p>
    <p className="text-xs text-muted-foreground">{thread.latestAt?
     new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(thread.latestAt)+" IST":
     "No messages yet"}</p>
    <Link href={"/tpo/messages/"+encodeURIComponent(thread.id)}
      className="mt-2 inline-flex min-h-11 items-center font-semibold text-[var(--lms-link-text)] underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary)] md:min-h-9">Open conversation</Link>
   </li>)}</ul>
   </section>}
  <p className="text-xs text-muted-foreground">Recruiter messages and internal team notes are separate. Only recorded messages appear here.</p>
 </div>;
}
