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
 return <div className="min-w-0 max-w-full space-y-5">
  <PageHeader eyebrow="Recruiter · Drive" title="Messages"
   description={result.workspace.job.title+" · "+result.workspace.college.name+". Private recruiter and placement cell discussion."}/>
  <Link href={"/recruiter/drives/"+jobId+"?tab=overview"} className="inline-flex min-h-11 items-center text-[var(--lms-teal-deep)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">Back to drive overview</Link>
  <section className="rounded-xl border border-border bg-surface p-5">
   <h2 className="font-semibold text-foreground">Drive conversation</h2>
   <p className="mt-2 text-sm text-body">Open or resume the conversation tied to this authorized employer drive.</p>
   <form method="post" action="/api/placements/recruiter/conversations/open" className="mt-3">
    <input type="hidden" name="collegeId" value={result.workspace.college.id}/>
    <input type="hidden" name="jobId" value={result.workspace.job.id}/>
    <button type="submit" className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">Open drive discussion</button>
   </form>
  </section>
  {result.threads.length?<ol className="space-y-3">
   {result.threads.map(thread=><li key={thread.id} className="rounded-xl border border-border p-4">
    <Link href={"/hr/conversations/"+thread.id} className="font-semibold text-[var(--lms-teal-deep)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">Continue discussion</Link>
   </li>)}
  </ol>:<p role="status" className="text-sm text-body">No conversation has been started for this drive.</p>}
 </div>;
}
