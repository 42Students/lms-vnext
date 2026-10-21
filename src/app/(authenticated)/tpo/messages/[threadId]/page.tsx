import Link from "next/link";
import {PageHeader} from "@/components/ui/page-header";
import {PageBackLink} from "@/components/ui/page-back-link";
import {ErrorState} from "@/components/ui/error-state";
import {EmptyState} from "@/components/ui/empty-state";
import bubbleStyles from "@/components/tpo/tpo-conversation-bubble.module.css";
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
 if(!threadsReady||!messagesReady)return <div className="min-w-0 space-y-4">
  <PageHeader title="Recruiter conversations unavailable" actions={<PageBackLink href="/tpo/messages" label="Back to messages"/>}/>
  <ErrorState title="Messages unavailable" description="Recruiter messaging tables are not registered. No messages were loaded."/>
 </div>;
 const {threadId}=await params;
 let data: Awaited<ReturnType<typeof getTpoRecruiterThreadDetail>>;
 try { data = await getTpoRecruiterThreadDetail(context,threadId); }
 catch {
   // Keep the route and scope, so refresh retries the same thread.
   return <div className="min-w-0 space-y-4">
     <PageHeader title="Recruiter conversation" actions={<PageBackLink href="/tpo/messages" label="All conversations"/>}/>
     <ErrorState title="Could not load this conversation" description="The conversation is still available to retry. No messages have been marked read."
       action={<Link href={"/tpo/messages/"+encodeURIComponent(threadId)}
         className="inline-flex min-h-11 items-center font-semibold text-link underline">Retry conversation</Link>} />
   </div>;
 }
 if(!data)notFound();
 return <div className="min-w-0 space-y-4">
  <PageHeader title="Recruiter conversation" description={data.total+" messages · Showing the latest 100"} actions={<PageBackLink href="/tpo/messages" label="All conversations"/>}/>
  <section role="log" aria-live="polite" aria-busy={false} aria-label="Conversation messages" className="min-w-0 space-y-3 border-b border-border pb-4">
   {data.messages.length===0?<EmptyState title="No messages yet."/>:data.messages.map((item,index)=>
    <div key={item.id} className="space-y-2">
     {index===0||new Intl.DateTimeFormat("en-IN",{dateStyle:"full",timeZone:"Asia/Kolkata"})
       .format(data.messages[index-1].createdAt)!==
      new Intl.DateTimeFormat("en-IN",{dateStyle:"full",timeZone:"Asia/Kolkata"}).format(item.createdAt)?
      <p className="py-2 text-center text-xs font-semibold text-muted-foreground leading-5">
       {new Intl.DateTimeFormat("en-IN",{dateStyle:"full",timeZone:"Asia/Kolkata"}).format(item.createdAt)}
      </p>:null}
    <article className={bubbleStyles.bubble+" "+(item.senderType==="TPO"?bubbleStyles.mine:"")}>
     <p className="text-xs font-semibold text-muted-foreground leading-5">
      {item.senderType==="RECRUITER"?"Recruiter":"You"} ·
      {" "}{new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(item.createdAt)} IST
     </p>
     <p className="mt-2 whitespace-pre-wrap break-words text-sm text-foreground leading-[22px]">{item.body}</p>
     {item.senderType==="TPO"&&item.readAt?<p className="mt-2 text-right text-xs text-muted-foreground leading-5">Seen</p>:null}
    </article></div>)}
  </section>
  <TpoRecruiterMessageReply threadId={threadId} actorUserId={context.user.id} unread={data.messages.some(item=>item.senderType==="RECRUITER"&&!item.readAt)} />
  <p className="border-t border-border pt-3 text-xs leading-5 text-muted-foreground">Reading and sending require explicit confirmation.</p>
 </div>;
}
