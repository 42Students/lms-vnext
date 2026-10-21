import Link from "next/link";
import {notFound} from "next/navigation";
import {PageHeader} from "@/components/ui/page-header";
import {Alert} from "@/components/ui/alert";
import {EmptyState} from "@/components/ui/empty-state";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getTpoDriveDiscussion} from "@/modules/placements/tpo-drive-discussion-service";
import {TpoRecruiterMessageReply} from "@/components/tpo/tpo-recruiter-message-reply";
import {PlacementsServiceError} from "@/modules/placements/errors";

export default async function TpoDriveDiscussion({params}:{
 params:Promise<{jobId:string}>
}){
 const {jobId}=await params;
 const context=await getCurrentRequestContext();
 let data:Awaited<ReturnType<typeof getTpoDriveDiscussion>>;
 try{data=await getTpoDriveDiscussion(context,jobId)}
 catch(error){if(error instanceof PlacementsServiceError&&error.code==="PLACEMENT_JOB_NOT_FOUND")notFound();throw error}
 const root="/tpo/placements/jobs/"+encodeURIComponent(jobId);
 return <div className="min-w-0 space-y-4">
  <PageHeader title={data.job.title+" · Discussion"}
    description="Conversations with recruiters attached to this drive. Private team notes are not shared with recruiters."
    actions={<Link href={root} className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-[var(--lms-link-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">← Back to drive</Link>}/>
  {!data.available?<Alert tone="warning">
    Recruiter conversation records are unavailable right now. Other drive work is still available. Try again later.
   </Alert>:data.threads.length===0?<EmptyState title="No recruiter conversation is attached to this drive yet."
    description="Use Recruiter Messages to begin or find a recruiter conversation."
    action={<Link href="/tpo/messages" className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Open Recruiter Messages</Link>}/>:<section aria-label="Recruiter conversations" className="min-w-0">
   <p role="status" className="mb-2 text-sm text-body leading-[1.6]">{data.threads.length} recruiter conversation(s) attached to this drive.</p>
   <ul className="min-w-0 divide-y divide-border border-y border-border">{data.threads.map(thread=><li key={thread.id} className="flex min-w-0 flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
    <div className="min-w-0 flex-1 space-y-1">
     <h2 className="break-words text-base font-semibold leading-6 text-[var(--lms-heading)]">{thread.recruiterName?.trim()||"Recruiter"}</h2>
     {thread.lastPreview?<p className="break-words text-sm leading-[22px] text-body">{thread.lastPreview}</p>:null}
     <p className="break-words text-sm leading-[22px] text-body">{thread.count} recorded message(s) · {thread.unread} unread recruiter message(s)</p>
     <p className="break-words text-xs leading-5 text-muted-foreground">{thread.latestAt?
      new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(thread.latestAt)+" IST":
      "No messages yet"}</p>
    </div>
    <Link href={"/tpo/messages/"+encodeURIComponent(thread.id)}
      className="inline-flex min-h-11 w-full shrink-0 items-center justify-center self-start rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-[var(--lms-link-text)] underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] sm:w-auto md:min-h-9">Open conversation</Link>
    <div className="w-full sm:basis-full">
      <details className="border-t border-border pt-2">
        <summary className="cursor-pointer text-sm font-semibold text-link">Reply in this drive discussion</summary>
        <TpoRecruiterMessageReply threadId={thread.id} actorUserId={context.user.id} unread={thread.unread>0}/>
        <p className="mt-1 text-xs text-muted-foreground">For earlier messages and quotes, open the full conversation.</p>
      </details>
    </div>
   </li>)}</ul>
   </section>}
  <p className="text-xs text-muted-foreground leading-5">Recruiter messages and internal team notes are separate. Only recorded messages appear here.</p>
 </div>;
}
