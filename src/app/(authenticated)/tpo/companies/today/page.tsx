import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasMembershipRole} from "@/modules/identity/context";
import {tpoCrmTablesReady} from "@/modules/placements/tpo-crm-storage-readiness";
import {getTpoDueFollowupQueue} from "@/modules/placements/tpo-followup-queue-service";
import {rankTpoCompaniesToday,tpoCompaniesTodayScope} from "@/modules/placements/tpo-companies-today-model";
import {countTpoUnreadRecruiterMessages} from "@/modules/placements/tpo-recruiter-unread-count-service";
import {getTpoMessagesInbox} from "@/modules/placements/tpo-messages-service";
import {TpoCompaniesToday} from "@/components/tpo/tpo-companies-today";
import {Alert} from "@/components/ui/alert";
import Link from "next/link";
export const dynamic="force-dynamic";

/** Real, per-college Companies/Today focus. Email replies and CRM follow-ups
 * are different sources: no fabricated reply bodies or implied email sends. */
export default async function TpoCompaniesTodayPage({searchParams}:{
 searchParams:Promise<{scope?:string|string[]}>
}){
 const context=await getCurrentRequestContext();
 if(!hasMembershipRole(context,"TPO")||!context.membership)redirect("/dashboard");
 const ready=await tpoCrmTablesReady().catch(()=>false);
 if(!ready)return <section aria-label="Companies Today" className="space-y-4">
  <h1 className="text-2xl font-bold">Companies · Today</h1>
  <Alert tone="warning">Recruiter CRM is unavailable until its registered database migration is verified. No follow-ups have been treated as zero.</Alert>
  <Link href="/tpo/recruiters" className="font-semibold text-link underline">Open recruiter contacts</Link>
 </section>;
 const params=await searchParams;
 const scope=tpoCompaniesTodayScope(params.scope);
 if(!scope)return <section className="space-y-4">
  <h1 className="text-2xl font-bold">Companies · Today</h1>
  <Alert tone="error">Invalid Today ownership selection. Nothing was loaded.</Alert>
  <Link href="/tpo/companies/today" className="font-semibold text-link underline">Open My Work</Link>
 </section>;
 const now=new Date();
 const [due,next,unread,replyResult]=await Promise.allSettled([
  getTpoDueFollowupQueue(context,now,{scope,window:"DUE",page:1}),
  getTpoDueFollowupQueue(context,now,{scope,window:"NEXT_7_DAYS",page:1}),
  countTpoUnreadRecruiterMessages(context),
  getTpoMessagesInbox(context,{status:"REPLY",page:1,pageSize:3}),
 ]);
 if(due.status==="rejected"||next.status==="rejected")return <section className="space-y-4">
  <h1 className="text-2xl font-bold">Companies · Today</h1>
  <Alert tone="error">Could not load the follow-up queue. Existing records are unchanged. Refresh to retry.</Alert>
  <Link href="/tpo/follow-ups" className="font-semibold text-link underline">Open the full follow-up queue</Link>
 </section>;
 const rows=rankTpoCompaniesToday(due.value.rows,next.value.rows);
 // This feed is persisted recruiter-to-placement-cell conversation activity.
 // It is not evidence of replies to bulk email campaigns or of email delivery.
 const replies=replyResult.status==="fulfilled"&&replyResult.value.source==="RECRUITER_THREADS"
  ?replyResult.value.items.map(row=>({
   id:row.id,name:row.participantName,company:row.companyName??null,
   subject:row.subject,preview:row.lastPreview??null,
   receivedAt:row.occurredAt.toISOString(),accessEnded:row.accessEnded??false,
  })):[];
 const replyTotal=replyResult.status==="fulfilled"&&replyResult.value.source==="RECRUITER_THREADS"
  ?replyResult.value.total:null;
 return <TpoCompaniesToday scope={scope} rows={rows} nowIso={now.toISOString()}
  unreadMessages={unread.status==="fulfilled"?unread.value:null}
  replies={replies} replyTotal={replyTotal}
  hasMore={due.value.total>due.value.rows.length||next.value.total>next.value.rows.length}/>;
}
