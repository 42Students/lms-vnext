import Link from "next/link";
import {notFound} from "next/navigation";
import {PageHeader} from "@/components/ui/page-header";
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
 return <main className="space-y-4">
  <PageHeader eyebrow="TPO · Drive" title={data.job.title+" · Discussion"}
    description="Conversations with recruiters attached to this drive. Private team notes are not shared with recruiters."/>
  <Link href={root} className="inline-flex min-h-10 items-center font-semibold text-primary-text underline">← Back to drive</Link>
  {!data.available?<p role="status" className="rounded-md border border-border p-4 text-sm">
    Recruiter conversation records are unavailable right now. Other drive work is still available. Try again later.
   </p>:data.threads.length===0?<section role="status" className="rounded-md border border-border p-4 text-sm">
    No recruiter conversation is attached to this drive yet.
    <p className="mt-2">Use Recruiter Messages to begin or find a recruiter conversation.</p>
    <Link href="/tpo/messages" className="mt-2 inline-flex min-h-10 items-center text-primary-text underline">Open Recruiter Messages</Link>
   </section>:<section aria-label="Recruiter conversations" className="space-y-3">
   <p role="status" className="text-sm text-body">{data.threads.length} recruiter conversation(s) attached to this drive.</p>
   <ul className="space-y-3">{data.threads.map(thread=><li key={thread.id} className="min-w-0 rounded-lg border border-border bg-surface p-4">
    <h2 className="break-words font-semibold">{thread.recruiterName?.trim()||"Recruiter"}</h2>
    {thread.lastPreview?<p className="mt-1 break-words text-sm text-body">{thread.lastPreview}</p>:null}
    <p className="text-sm text-body">{thread.count} recorded message(s) · {thread.unread} unread recruiter message(s)</p>
    <p className="text-xs text-muted-foreground">{thread.latestAt?
     new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(thread.latestAt)+" IST":
     "No messages yet"}</p>
    <Link href={"/tpo/messages/"+encodeURIComponent(thread.id)}
      className="mt-2 inline-flex min-h-10 items-center font-semibold text-primary-text underline">Open conversation</Link>
   </li>)}</ul>
   </section>}
  <p className="text-xs text-muted-foreground">Recruiter messages and internal team notes are separate. Only recorded messages appear here.</p>
 </main>;
}
