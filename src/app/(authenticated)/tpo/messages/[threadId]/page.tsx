import {PageHeader} from "@/components/ui/page-header";
import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {TpoRecruiterMessageReply} from "@/components/tpo/tpo-recruiter-message-reply";
import {hasMembershipRole} from "@/modules/identity/context";
import {placementTableExists} from "@/modules/placements/staged-tables";
import {getTpoRecruiterThreadDetail} from "@/modules/placements/tpo-recruiter-thread-detail-service";

export default async function TpoRecruiterConversationPage({params}:{
 params:Promise<{threadId:string}>,
}){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const [threadsReady,messagesReady]=await Promise.all([
  placementTableExists("placement_tpo_message_threads"),
  placementTableExists("placement_tpo_messages"),
 ]);
 if(!threadsReady||!messagesReady)return <div className="space-y-3">
  <PageHeader eyebrow="TPO · Messages" title="Recruiter conversations unavailable"/>
  <p role="alert" className="text-sm text-body">
   Recruiter messaging tables are not registered. No messages were loaded.
  </p>
  <Link href="/tpo/messages" className="text-[var(--lms-teal-deep)] underline">Back to messages</Link>
 </div>;
 const {threadId}=await params;
 const data=await getTpoRecruiterThreadDetail(context,threadId);
 if(!data)notFound();
 return <div className="space-y-5">
  <Link href="/tpo/messages" className="text-sm font-semibold text-[var(--lms-teal-deep)]">
   ← All conversations
  </Link>
  <PageHeader eyebrow="TPO · Messages" title="Recruiter conversation"/>
  <p className="text-sm text-body">{data.total} messages · Showing the latest 100</p>
  <section role="log" aria-live="polite" aria-busy={false} aria-label="Conversation messages" className="space-y-3">
   {data.messages.length===0?<p role="status">No messages yet.</p>:data.messages.map((item,index)=>
    <div key={item.id} className="space-y-2">
     {index===0||new Intl.DateTimeFormat("en-IN",{dateStyle:"full",timeZone:"Asia/Kolkata"})
       .format(data.messages[index-1].createdAt)!==
      new Intl.DateTimeFormat("en-IN",{dateStyle:"full",timeZone:"Asia/Kolkata"}).format(item.createdAt)?
      <p className="py-2 text-center text-xs font-semibold text-muted-foreground">
       {new Intl.DateTimeFormat("en-IN",{dateStyle:"full",timeZone:"Asia/Kolkata"}).format(item.createdAt)}
      </p>:null}
    <article className={"max-w-3xl rounded-[var(--lms-canvas-radius,12px)] border border-border bg-surface p-4 "+(item.senderType==="TPO"?"ml-auto":"mr-auto")}>
     <p className="text-xs text-muted-foreground">{item.senderType==="TPO"?"You":"Recruiter"}</p>
     <p className="text-xs font-semibold text-muted-foreground">
      {item.senderType==="RECRUITER"?"Recruiter":"Placement cell"} ·
      {" "}{new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(item.createdAt)} IST
     </p>
     <p className="mt-2 whitespace-pre-wrap break-words text-sm text-foreground">{item.body}</p>
     {item.senderType==="TPO"&&item.readAt?<p className="mt-2 text-right text-xs text-muted-foreground">Seen</p>:null}
    </article></div>)}
  </section>
  <TpoRecruiterMessageReply threadId={threadId} actorUserId={context.user.id} unread={data.messages.some(item=>item.senderType==="RECRUITER"&&!item.readAt)} />
  <p className="text-xs text-muted-foreground">Reading and sending require explicit confirmation.</p>
 </div>;
}
