import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {PlacementsServiceError} from "@/modules/placements/errors";
import {getRecruiterDriveConversations} from "@/modules/placements/hr-drive-conversation-service";
import {TpoMessagingError} from "@/modules/placements/tpo-messaging-service";
export default async function DriveConversationsPage({params}:{params:Promise<{jobId:string}>}){
 const context=await getCurrentRequestContext();
 if(!hasActiveRecruiter(context) || context.recruiter?.userId !== context.user.id)redirect("/dashboard");
 const {jobId}=await params;
 if(!z.string().uuid().safeParse(jobId).success)notFound();
 let result:Awaited<ReturnType<typeof getRecruiterDriveConversations>>;
 try{
  result=await getRecruiterDriveConversations(context,jobId);
 }catch(error){
  if(error instanceof TpoMessagingError || error instanceof PlacementsServiceError)notFound();
  throw error;
 }
 return <div className="min-w-0 max-w-full space-y-4">
  <PageHeader title="Messages"
   description={result.workspace.job.title+" · "+result.workspace.college.name+". Private recruiter and placement cell discussion."}
   actions={<Link href={"/recruiter/drives/"+jobId+"?tab=overview"} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 hover:text-[var(--lms-primary-text)] md:min-h-9 active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Back to drive overview</Link>}/>
  <section aria-label="Drive conversation" className="min-w-0 space-y-3 border-b border-border pb-4">
   <h2 className="font-semibold text-[18px] leading-[1.4] text-[var(--lms-heading)]">Drive conversation</h2>
   <p className="max-w-2xl text-sm text-body leading-[22px]">Open or resume the conversation tied to this authorized employer drive.</p>
   {result.threads.length ? <>
    <ol className="divide-y divide-border border-y border-border">
     {result.threads.map(thread=><li key={thread.id} className="flex min-h-11 min-w-0 items-center py-3">
      <Link href={"/hr/conversations/"+thread.id}
       className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 hover:text-[var(--lms-primary-text)] md:min-h-9 active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Continue discussion</Link>
     </li>)}
    </ol>
    <details className="min-w-0">
     <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Open drive discussion</summary>
     <form method="post" action="/api/placements/recruiter/conversations/open" className="mt-3">
      <Input type="hidden" name="collegeId" value={result.workspace.college.id}/>
      <Input type="hidden" name="jobId" value={result.workspace.job.id}/>
      <label className="mb-3 grid min-w-0 gap-1 text-sm font-semibold text-foreground">
        Message about this drive
        <Textarea name="message" rows={3} minLength={1} maxLength={4000} required
          placeholder="Write your first message to the placement cell..." className="min-w-0"/>
      </label>
      <Button type="submit" className="min-h-11 w-full md:min-h-9 md:w-auto">Send message</Button>
     </form>
    </details>
   </> : <EmptyState title="No drive conversation" description="No conversation has been started for this drive."
    action={<form method="post" action="/api/placements/recruiter/conversations/open" className="w-full md:w-auto">
     <Input type="hidden" name="collegeId" value={result.workspace.college.id}/>
     <Input type="hidden" name="jobId" value={result.workspace.job.id}/>
     <label className="mb-3 grid min-w-0 gap-1 text-sm font-semibold text-foreground">
       Message about this drive
       <Textarea name="message" rows={3} minLength={1} maxLength={4000} required
         placeholder="Write your first message..." className="min-w-0"/>
     </label>
     <Button type="submit" className="min-h-11 w-full md:min-h-9 md:w-auto">Send message</Button>
    </form>} />}
  </section>
 </div>;
}
