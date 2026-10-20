import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import {PageBackLink} from "@/components/ui/page-back-link";
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
  <PageHeader title="Messages"
   description={result.workspace.job.title+" · "+result.workspace.college.name+". Private recruiter and placement cell discussion."}/>
  <PageBackLink href={"/recruiter/drives/"+jobId+"?tab=overview"} label="Back to drive overview"/>
  <section className="border-b border-border pb-5">
   <h2 className="font-semibold text-foreground">Drive conversation</h2>
   <p className="mt-2 text-sm text-body">Open or resume the conversation tied to this authorized employer drive.</p>
   <form method="post" action="/api/placements/recruiter/conversations/open" className="mt-3">
    <Input type="hidden" name="collegeId" value={result.workspace.college.id}/>
    <Input type="hidden" name="jobId" value={result.workspace.job.id}/>
    <Button type="submit">Open drive discussion</Button>
   </form>
  </section>
  {result.threads.length?<ol className="divide-y divide-border border-y border-border">
   {result.threads.map(thread=><li key={thread.id} className="py-4 first:pt-0 last:pb-0">
    <Link href={"/hr/conversations/"+thread.id} className="font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Continue discussion</Link>
   </li>)}
  </ol>:<EmptyState title="No drive conversation" description="No conversation has been started for this drive."/>}
 </div>;
}
