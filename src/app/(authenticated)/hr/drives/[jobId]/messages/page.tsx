import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import {notFound,redirect} from "next/navigation";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {PlacementsServiceError} from "@/modules/placements/errors";
import {getRecruiterDriveConversations} from "@/modules/placements/hr-drive-conversation-service";
import {TpoMessagingError} from "@/modules/placements/tpo-messaging-service";
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { Disclosure } from "@/components/ui/disclosure";
import { TextLink } from "@/components/ui/text-link";
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
   actions={<TextLink href={"/recruiter/drives/"+jobId+"?tab=overview"} className="inline-flex min-h-11 items-center md:min-h-9">Back to drive overview</TextLink>}/>
  <section aria-label="Drive conversation" className="min-w-0 space-y-3 border-b border-border pb-4">
   <Heading level={2} size="lg" className="leading-[1.4] text-[var(--lms-heading)]">Drive conversation</Heading>
   <p className="max-w-2xl text-sm text-body leading-[22px]">Open or resume the conversation tied to this authorized employer drive.</p>
   {result.threads.length ? <>
    <ol className="divide-y divide-border border-y border-border">
     {result.threads.map(thread=><li key={thread.id} className="flex min-h-11 min-w-0 items-center py-3">
      <TextLink href={"/hr/conversations/"+thread.id}
       className="inline-flex min-h-11 items-center md:min-h-9">Continue discussion</TextLink>
     </li>)}
    </ol>
    <Disclosure title="Open drive discussion" className="min-w-0">
     <form method="post" action="/api/placements/recruiter/conversations/open" className="mt-3">
      <Input type="hidden" name="collegeId" value={result.workspace.college.id}/>
      <Input type="hidden" name="jobId" value={result.workspace.job.id}/>
      <Label stack className="mb-3 min-w-0">
        Message about this drive
        <Textarea name="message" rows={3} minLength={1} maxLength={4000} required
          placeholder="Write your first message to the placement cell..." className="min-w-0"/>
      </Label>
      <Button type="submit" className="min-h-11 w-full md:min-h-9 md:w-auto">Send message</Button>
     </form>
    </Disclosure>
   </> : <EmptyState title="No drive conversation" description="No conversation has been started for this drive."
    action={<form method="post" action="/api/placements/recruiter/conversations/open" className="w-full md:w-auto">
     <Input type="hidden" name="collegeId" value={result.workspace.college.id}/>
     <Input type="hidden" name="jobId" value={result.workspace.job.id}/>
     <Label stack className="mb-3 min-w-0">
       Message about this drive
       <Textarea name="message" rows={3} minLength={1} maxLength={4000} required
         placeholder="Write your first message..." className="min-w-0"/>
     </Label>
     <Button type="submit" className="min-h-11 w-full md:min-h-9 md:w-auto">Send message</Button>
    </form>} />}
  </section>
 </div>;
}
