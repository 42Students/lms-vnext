import Link from "next/link";
import {RecruiterConversationReplyForm} from "@/components/hr/recruiter-conversation-reply-form";
import {RecruiterConversationReadControl} from "@/components/hr/recruiter-conversation-read-control";
import {RecruiterConversationLiveRefresh} from "@/components/hr/recruiter-conversation-live-refresh";
import {notFound,redirect} from "next/navigation";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {ErrorState} from "@/components/ui/error-state";
import {hrConversationDetailHref} from "@/modules/placements/hr-conversation-detail-links-model";
import {recruiterProposalMessageMarker} from "@/modules/placements/hr-proposal-message-marker-model";
import {hrSentProposalsHref} from "@/modules/placements/hr-drive-proposal-links-model";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {readRecruiterThreadMessages,TpoMessagingError} from "@/modules/placements/tpo-messaging-service";
import {listOwnRecruiterPlacementJobs} from "@/modules/placements/recruiter-service";
import {getDriveChangeRequests} from "@/modules/placements/tpo-drive-change-request-service";
type Props={params:Promise<{threadId:string}>;searchParams:Promise<{page?:string|string[]}>};
const idSchema=z.string().uuid();
const pageSchema=z.coerce.number().int().min(1).max(10000);
const dateTime=(value:Date)=>new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",day:"numeric",month:"short",hour:"numeric",minute:"2-digit",hour12:true}).format(value);
export default async function RecruiterConversationDetail({params,searchParams}:Props){
 const context=await getCurrentRequestContext();
 if(!hasActiveRecruiter(context))redirect("/dashboard");
 const {threadId}=await params;
 const query=await searchParams;
 const raw=Array.isArray(query.page)?query.page[0]:query.page;
 const parsedId=idSchema.safeParse(threadId),parsedPage=pageSchema.safeParse(raw??1);
 if(!parsedId.success||!parsedPage.success)notFound();
 let result:Awaited<ReturnType<typeof readRecruiterThreadMessages>>;
 try{
  result=await readRecruiterThreadMessages(context,parsedId.data,parsedPage.data);
 }catch(error){
  if(error instanceof TpoMessagingError && error.code==="TPO_MESSAGE_FORBIDDEN"){
   return <main className="space-y-5"><PageHeader eyebrow="Recruiter" title="Messages"/>
    <ErrorState title="No access to this college"
     description="Your access to this college has ended or was removed. Ask the placement cell to give it again."
     action={<Link href="/hr/home" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">Return to Today</Link>}/>
   </main>;
  }
  if(error instanceof TpoMessagingError)notFound();
  throw error;
 }
 const ownDrives=result.thread.jobId ? await listOwnRecruiterPlacementJobs(context,result.thread.collegeId) : [];
 const matchingDrive=result.thread.jobId
  ? ownDrives.find(item=>item.job.id===result.thread.jobId&&item.collegeId===result.thread.collegeId)
  : null;
 const conversationSubject=result.thread.jobId ? matchingDrive?.job.title??"Drive unavailable" : "General";
 const changeRequests=matchingDrive?
  await getDriveChangeRequests(context,matchingDrive.job.id):null;
 const messages=[...result.messages].reverse().map(message=>({
  ...message,proposal:recruiterProposalMessageMarker(message.senderType,message.body),
 }));
 return <main className="space-y-5">
  <RecruiterConversationLiveRefresh/>
  <PageHeader eyebrow="Recruiter · Conversations" title={conversationSubject}
   description={"Placement cell discussion · "+(result.thread.jobId?"Hiring drive":"General")}/>
  {matchingDrive?<Link href={"/recruiter/drives/"+encodeURIComponent(matchingDrive.job.id)+"?tab=overview"}
   className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">
   Open drive: {matchingDrive.job.title}
  </Link>:null}
  <Link href={"/hr/conversations?collegeId="+result.thread.collegeId}
   className="inline-flex min-h-11 items-center text-primary-text">Back to conversations</Link>
  <p className="text-sm text-body">{result.total} messages · {result.unread} unread placement cell messages · Page {result.page} of {result.pages}</p>
  <p className="text-xs text-muted-foreground">Messages on this page are shown oldest to newest. Use Older and Newer to browse the rest of the conversation.</p>
  {result.unread>0?<RecruiterConversationReadControl threadId={result.thread.id}/>:null}
  {changeRequests?.party==="COMPANY" && changeRequests.requests.length>0?
    <section aria-label="Drive change request updates" className="rounded-xl border border-border bg-surface p-4">
      <h2 className="text-sm font-semibold text-foreground">Change requests · {changeRequests.requests.length}</h2>
      <p className="mt-1 text-xs text-muted-foreground">Recorded change requests for this hiring drive. Decisions are controlled by the placement cell.</p>
      <ol className="mt-3 max-h-56 space-y-2 overflow-y-auto">
        {changeRequests.requests.slice(0,8).map(request=><li key={request.id}
          className="rounded-md border border-border bg-surface-subtle p-3 text-sm">
          <span className="font-semibold text-foreground">
            {request.proposerParty==="COMPANY"?"You asked":"Placement cell asked"} · {request.field.replaceAll("_"," ")}
          </span>
          <span className="ml-2 rounded border border-border px-2 py-0.5 text-xs">{request.status}</span>
          <p className="mt-1 break-words text-body">{request.reason}</p>
          {request.decisionNote?<p className="mt-2 break-words text-body">
            <strong>Placement-cell response:</strong> {request.decisionNote}
          </p>:null}
          <p className="mt-1 text-xs text-muted-foreground">Discussion replies: {request.messages.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium"}).format(new Date(request.createdAt))}
          </p>
        </li>)}
      </ol>
      <Link href={"/recruiter/drives/"+encodeURIComponent(result.thread.jobId!)+"?tab=requests"}
        className="mt-2 inline-flex min-h-10 items-center text-sm font-semibold text-primary-text underline">
        Review requests, answers and decisions
      </Link>
    </section>:null}
  <ol aria-label="Employer and placement cell messages" className="space-y-3">
   {messages.map(message=><li key={message.id}
    className="rounded-xl border border-border bg-surface p-4">
    <p className="text-xs font-semibold text-muted-foreground">{message.senderType==="RECRUITER"?"You":message.senderDisplayName?"Placement cell · "+message.senderDisplayName:"Placement cell"} · {dateTime(message.createdAt)} IST</p>
    {message.proposal?<div className="mt-2 rounded-md border border-border bg-surface-secondary p-3 text-xs text-body">
      <p className="font-semibold text-foreground">Drive proposal · sent as discussion message</p>
      <p>Role: {message.proposal.title}</p>
      <p>Proposal reference: {message.proposal.referenceId}</p>
      <p>Not a submitted approval request or a published drive.</p>
      <Link href={hrSentProposalsHref(result.thread.collegeId)}
       className="mt-2 inline-flex min-h-11 items-center font-semibold text-primary-text">
       View sent proposal history
      </Link>
     </div>:null}
    <p className="mt-2 whitespace-pre-wrap break-words text-sm text-body">{message.body}</p>
   </li>)}
  </ol>
  {!result.messages.length?<p role="status" className="rounded-xl border border-border p-5 text-body">No messages on this page.</p>:null}
  <RecruiterConversationReplyForm threadId={result.thread.id}/>
  <nav aria-label="Conversation history" className="flex flex-wrap gap-3">
   {result.page>1?<Link href={hrConversationDetailHref(threadId,1)}
    className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-primary-text">Newest messages</Link>:null}
   {result.page<result.pages&&result.pages>2?<Link href={hrConversationDetailHref(threadId,result.pages)}
    className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-primary-text">Oldest messages</Link>:null}
   {result.page<result.pages?<Link href={hrConversationDetailHref(threadId,result.page+1)}
    className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-primary-text">Older</Link>:null}
   {result.page>1?<Link href={hrConversationDetailHref(threadId,result.page-1)}
    className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-primary-text">Newer</Link>:null}
  </nav>
 </main>;
}
