import { EmptyState } from "@/components/ui/empty-state";
import { ScrollCue } from "@/components/ui/scroll-cue";
import {RecruiterConversationReplyForm} from "@/components/hr/recruiter-conversation-reply-form";
import {RecruiterConversationReadControl} from "@/components/hr/recruiter-conversation-read-control";
import {RecruiterConversationLiveRefresh} from "@/components/hr/recruiter-conversation-live-refresh";
import {notFound,redirect} from "next/navigation";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {ErrorState} from "@/components/ui/error-state";
import {Alert} from "@/components/ui/alert";
import {StatusBadge} from "@/components/ui/status-badge";
import {hrConversationDetailHref} from "@/modules/placements/hr-conversation-detail-links-model";
import {recruiterProposalMessageMarker} from "@/modules/placements/hr-proposal-message-marker-model";
import {hrSentProposalsHref} from "@/modules/placements/hr-drive-proposal-links-model";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {readRecruiterThreadMessages,TpoMessagingError} from "@/modules/placements/tpo-messaging-service";
import {listOwnRecruiterPlacementJobs} from "@/modules/placements/recruiter-service";
import {getDriveChangeRequests} from "@/modules/placements/tpo-drive-change-request-service";
import { Disclosure } from "@/components/ui/disclosure";
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";
import { formatNumberIN } from "@/lib/safe-format";
import { istDateFormatter } from "@/lib/format-date";
import { createDateFormatter } from "@/lib/format-date";
type Props={params:Promise<{threadId:string}>;searchParams:Promise<{page?:string|string[]}>};
const idSchema=z.string().uuid();
const pageSchema=z.coerce.number().int().min(1).max(10000);
// Always display IST (the product time zone), including across UTC-midnight
// and year boundaries. Read receipts are explicit, never a GET side-effect.
const dateTime=(value:Date)=>createDateFormatter("en-IN", {timeZone:"Asia/Kolkata",year:"numeric",day:"numeric",month:"short",hour:"numeric",minute:"2-digit",hour12:true}).format(value);
export default async function RecruiterConversationDetail({params,searchParams}:Props){
 const context=await getCurrentRequestContext();
 if(!hasActiveRecruiter(context) || context.recruiter?.userId !== context.user.id)redirect("/dashboard");
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
   return <div className="min-w-0 max-w-full space-y-4 md:space-y-6"><PageHeader title="Messages"/>
    <ErrorState title="No access to this college"
     description="Your access to this college has ended or was removed. Ask the placement cell to give it again."
     action={<TextLink href="/hr/home" className="inline-flex min-h-11 md:min-h-9 items-center">Return to Today</TextLink>}/>
   </div>;
  }
  if(error instanceof TpoMessagingError&&error.code==="TPO_MESSAGE_THREAD_NOT_FOUND")notFound();
  return <div className="min-w-0 max-w-full space-y-4">
   <PageHeader title="Messages"/>
   <ErrorState title="Could not load this conversation"
    description="The conversation history could not be verified. Your messages were not assumed deleted."
    action={<TextLink href={"/hr/conversations/"+encodeURIComponent(threadId)}
     className="inline-flex min-h-11 items-center md:min-h-9">Retry conversation</TextLink>}/>
  </div>;
 }
 // A drive-directory outage is ancillary to a thread already authorized by
 // readRecruiterThreadMessages. Never trust cached titles or crash its reply UI.
 const driveLookupResult=result.thread.jobId
  ?await listOwnRecruiterPlacementJobs(context,result.thread.collegeId)
    .then(value=>({ok:true as const,value}))
    .catch(()=>({ok:false as const}))
  :null;
 const ownDrives=driveLookupResult?.ok?driveLookupResult.value:[];
 const matchingDrive=result.thread.jobId
  ? ownDrives.find(item=>item.job.id===result.thread.jobId&&item.collegeId===result.thread.collegeId&&
     item.companyId===context.recruiter?.companyId)
  : null;
 const conversationSubject=result.thread.jobId ? matchingDrive?.job.title??"Drive unavailable" : "General";
 // Change-request summaries are optional. An outage must not hide an already
 // authorized conversation or discard its pending recruiter reply.
 const changeRequestResult=matchingDrive
  ?await getDriveChangeRequests(context,matchingDrive.job.id)
    .then(value=>({ok:true as const,value}))
    .catch(()=>({ok:false as const}))
  :null;
 const changeRequests=changeRequestResult?.ok?changeRequestResult.value:null;
 const messages=[...result.messages].reverse().map(message=>({
  ...message,proposal:recruiterProposalMessageMarker(message.senderType,message.body),
 }));
 return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
  <RecruiterConversationLiveRefresh collegeId={result.thread.collegeId} threadId={threadId}/>
  <PageHeader title={conversationSubject}
   description={"Placement cell discussion · "+(result.thread.jobId?"Hiring drive":"General")}/>
  {driveLookupResult && !driveLookupResult.ok?
    <Alert tone="warning">Hiring drive details are temporarily unavailable. You can still read and reply to this authorized conversation.</Alert>:null}
  <div className="flex min-w-0 flex-wrap items-center gap-3">
  {matchingDrive?<TextLink href={"/recruiter/drives/"+encodeURIComponent(matchingDrive.job.id)+"?tab=overview"}
   className="inline-flex min-h-11 md:min-h-9 items-center">
   Open drive: {matchingDrive.job.title}
  </TextLink>:null}
  <TextLink href={"/hr/conversations?collegeId="+result.thread.collegeId}
   className="inline-flex min-h-11 md:min-h-9 items-center">Back to conversations</TextLink>
  </div>
  <p className="text-sm text-body">{formatNumberIN(result.total)} messages · {formatNumberIN(result.unread)} unread placement cell messages · Page {result.page} of {result.pages}</p>
  <p className="text-xs text-muted-foreground">Messages on this page are shown oldest to newest. Use Older and Newer to browse the rest of the conversation.</p>
  {result.unread>0?<RecruiterConversationReadControl threadId={result.thread.id}/>:null}
  {changeRequestResult && !changeRequestResult.ok?
    <Alert tone="warning">Change request updates are temporarily unavailable. Messages remain available; refresh to try again.</Alert>:null}
  {changeRequests?.party==="COMPANY" && changeRequests.requests.length>0?
    <Disclosure title={<>Change requests · {changeRequests.requests.length}</>} className="min-w-0">
      <p className="mt-1 text-xs text-muted-foreground">Recorded change requests for this hiring drive. Decisions are controlled by the placement cell.</p>
      <ScrollCue axis="y" label="Drive change request updates" className="mt-3" viewportClassName="max-h-56"><ol className="divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">
        {changeRequests.requests.slice(0,8).map(request=><li key={request.id}
          className="min-w-0 py-3 text-sm">
          <span className="font-semibold text-foreground">
            {request.proposerParty==="COMPANY"?"You asked":"Placement cell asked"} · {request.field.replaceAll("_"," ")}
          </span>
          <StatusBadge className="ml-2" tone={request.status==="REJECTED"?"error":request.status==="SENT_BACK"?"warning":request.status==="APPROVED"?"success":"neutral"}>{request.status}</StatusBadge>
          <p className="mt-1 break-words text-body">{request.reason}</p>
          {request.decisionNote?<p className="mt-2 break-words text-body">
            <strong>Placement-cell response:</strong> {request.decisionNote}
          </p>:null}
          <p className="mt-1 text-xs text-muted-foreground">Discussion replies: {request.messages.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {istDateFormatter.format(new Date(request.createdAt))}
          </p>
        </li>)}
      </ol></ScrollCue>
      <TextLink href={"/recruiter/drives/"+encodeURIComponent(result.thread.jobId!)+"?tab=requests"}
        className="mt-2 inline-flex min-h-11 md:min-h-9 items-center text-sm">
        Review requests, answers and decisions
      </TextLink>
    </Disclosure>:null}
  <ol aria-label="Employer and placement cell messages" className="min-w-0 max-w-3xl divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">
   {messages.map(message=><li key={message.id}
    className="min-w-0 py-4 transition-colors duration-[var(--lms-motion-fast)] hover:bg-[var(--lms-table-hover)] motion-reduce:transition-none">
    <p className="text-xs font-semibold text-muted-foreground">{message.senderType==="RECRUITER"?"You":message.senderDisplayName?"Placement cell · "+message.senderDisplayName:"Placement cell"} · {dateTime(message.createdAt)} IST</p>
    {message.proposal?<div className="mt-2 rounded-[var(--lms-control-radius)] border border-border bg-muted p-3 text-xs text-body">
      <p className="font-semibold text-foreground">Drive proposal · sent as discussion message</p>
      <p>Role: {message.proposal.title}</p>
      <p>Proposal reference: {message.proposal.referenceId}</p>
      <p>Not a submitted approval request or a published drive.</p>
      <TextLink href={hrSentProposalsHref(result.thread.collegeId)}
       className="mt-2 inline-flex min-h-11 md:min-h-9 items-center">
       View sent proposal history
      </TextLink>
     </div>:null}
    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-body">{message.body}</p>
   </li>)}
  </ol>
  {!result.messages.length?<EmptyState title="No messages on this page" action={<TextLink href={"/hr/conversations?collegeId="+encodeURIComponent(result.thread.collegeId)} className="inline-flex min-h-11 items-center md:min-h-9">Back to conversations</TextLink>}/>:null}
  <nav aria-label="Conversation history" className="flex min-w-0 flex-wrap items-center gap-3">
   {result.page>1?<ButtonLink variant="secondary" href={hrConversationDetailHref(threadId,1)}>Newest messages</ButtonLink>:null}
   {result.page<result.pages&&result.pages>2?<ButtonLink variant="secondary" href={hrConversationDetailHref(threadId,result.pages)}>Oldest messages</ButtonLink>:null}
   {result.page<result.pages?<ButtonLink variant="secondary" href={hrConversationDetailHref(threadId,result.page+1)}>Older</ButtonLink>:null}
   {result.page>1?<ButtonLink variant="secondary" href={hrConversationDetailHref(threadId,result.page-1)}>Newer</ButtonLink>:null}
  </nav>
  <div className="min-w-0 max-w-3xl">
   <RecruiterConversationReplyForm threadId={result.thread.id}/>
  </div>
 </div>;
}
