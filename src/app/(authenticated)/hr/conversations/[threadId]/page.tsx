import Link from "next/link";
import {RecruiterConversationReplyForm} from "@/components/hr/recruiter-conversation-reply-form";
import {RecruiterConversationReadControl} from "@/components/hr/recruiter-conversation-read-control";
import {notFound,redirect} from "next/navigation";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {hrConversationDetailHref} from "@/modules/placements/hr-conversation-detail-links-model";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {readRecruiterThreadMessages,TpoMessagingError} from "@/modules/placements/tpo-messaging-service";
type Props={params:Promise<{threadId:string}>;searchParams:Promise<{page?:string|string[]}>};
const idSchema=z.string().uuid();
const pageSchema=z.coerce.number().int().min(1).max(10000);
const dateTime=(value:Date)=>new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(value);
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
  if(error instanceof TpoMessagingError)notFound();
  throw error;
 }
 return <main className="space-y-5">
  <PageHeader eyebrow="Recruiter · Conversations" title="Placement cell discussion"
   description="Only messages shared with your currently authorized recruiter account and college are visible."/>
  <Link href={"/hr/conversations?collegeId="+result.thread.collegeId}
   className="inline-flex min-h-11 items-center text-primary-text">Back to conversations</Link>
  <p className="text-sm text-body">{result.total} messages · {result.unread} unread placement cell messages · Page {result.page} of {result.pages}</p>
  {result.unread>0?<RecruiterConversationReadControl threadId={result.thread.id}/>:null}
  <ol aria-label="Employer and placement cell messages" className="space-y-3">
   {result.messages.map(message=><li key={message.id}
    className="rounded-xl border border-border bg-surface p-4">
    <p className="text-xs font-semibold text-muted-foreground">{message.senderType==="RECRUITER"?"Recruiter":"Placement cell"} · {dateTime(message.createdAt)} IST</p>
    <p className="mt-2 whitespace-pre-wrap break-words text-sm text-body">{message.body}</p>
   </li>)}
  </ol>
  {!result.messages.length?<p role="status" className="rounded-xl border border-border p-5 text-body">No messages on this page.</p>:null}
  <RecruiterConversationReplyForm threadId={result.thread.id}/>
  <nav aria-label="Conversation history" className="flex flex-wrap gap-3">
   {result.page>1?<Link href={hrConversationDetailHref(threadId,1)}
    className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-primary-text">Newest messages</Link>:null}
   {result.page<result.pages?<Link href={hrConversationDetailHref(threadId,result.page+1)}
    className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-primary-text">Older</Link>:null}
   {result.page>1?<Link href={hrConversationDetailHref(threadId,result.page-1)}
    className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-primary-text">Newer</Link>:null}
  </nav>
 </main>;
}
