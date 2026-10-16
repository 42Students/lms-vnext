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
 if(!threadsReady||!messagesReady)return <main className="space-y-3">
  <h1 className="text-xl font-semibold">Recruiter conversations unavailable</h1>
  <p role="alert" className="text-sm text-body">
   Recruiter messaging tables are not registered. No messages were loaded.
  </p>
  <Link href="/tpo/messages" className="text-primary-text underline">Back to messages</Link>
 </main>;
 const {threadId}=await params;
 const data=await getTpoRecruiterThreadDetail(context,threadId);
 if(!data)notFound();
 return <main className="space-y-5">
  <Link href="/tpo/messages" className="text-sm font-semibold text-primary-text">
   ← Messages
  </Link>
  <h1 className="text-xl font-semibold text-foreground">Recruiter conversation</h1>
  <p className="text-sm text-body">{data.total} messages · Showing the latest 100</p>
  <section role="log" aria-live="polite" aria-label="Conversation messages" className="space-y-3">
   {data.messages.length===0?<p role="status">No messages yet.</p>:data.messages.map(item=>
    <article key={item.id} className={"max-w-3xl rounded-xl border border-border bg-surface p-4 "+(item.senderType==="TPO"?"ml-auto":"mr-auto")}>
     <p className="text-xs text-muted-foreground">{item.senderType==="TPO"?"You":"Recruiter"}</p>
     <p className="text-xs font-semibold text-muted-foreground">
      {item.senderType==="RECRUITER"?"Recruiter":"Placement cell"} ·
      {" "}{new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(item.createdAt)} IST
     </p>
     <p className="mt-2 whitespace-pre-wrap break-words text-sm text-foreground">{item.body}</p>
    </article>)}
  </section>
  <TpoRecruiterMessageReply threadId={threadId} actorUserId={context.user.id} unread={data.messages.some(item=>item.senderType==="RECRUITER"&&!item.readAt)} />
  <p className="text-xs text-muted-foreground">Reading and sending require explicit confirmation.</p>
 </main>;
}
