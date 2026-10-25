import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasMembershipRole} from "@/modules/identity/context";
import {tpoCrmTablesReady} from "@/modules/placements/tpo-crm-storage-readiness";
import {getTpoDueFollowupQueue} from "@/modules/placements/tpo-followup-queue-service";
import {listTpoLeads} from "@/modules/placements/tpo-crm-service";
import {rankTpoCompaniesToday,tpoCompaniesTodayScope,tpoTodayAgendaDay,summarizeTpoTodayNotContacted} from "@/modules/placements/tpo-companies-today-model";
import {countTpoUnreadRecruiterMessages} from "@/modules/placements/tpo-recruiter-unread-count-service";
import {getTpoMessagesInbox} from "@/modules/placements/tpo-messages-service";
import {TpoCompaniesToday} from "@/components/tpo/tpo-companies-today";
import {TpoTodayAlternateViews} from "@/components/tpo/tpo-today-alternate-views";
import {Alert} from "@/components/ui/alert";
import Link from "next/link";
export const dynamic="force-dynamic";

/** Real, per-college Companies/Today focus. Email replies and CRM follow-ups
 * are different sources: no fabricated reply bodies or implied email sends. */
export default async function TpoCompaniesTodayPage({searchParams}:{
 searchParams:Promise<{scope?:string|string[];view?:string|string[];lead?:string|string[];day?:string|string[]}>
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
 const view=params.view??"focus";
 const invalidView=Array.isArray(view)||!["focus","agenda","brief"].includes(view);
 const selectedDay=tpoTodayAgendaDay(params.day);
 const invalidLead=params.lead!==undefined&&
  (typeof params.lead!=="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.lead));
 if(!scope||invalidView||invalidLead||selectedDay===null||
  (params.day!==undefined&&view!=="agenda"))return <section className="space-y-4">
  <h1 className="text-2xl font-bold">Companies · Today</h1>
  <Alert tone="error">Invalid Today view, ownership or follow-up selection. Nothing was loaded.</Alert>
  <Link href="/tpo/companies/today" className="font-semibold text-link underline">Open My Work</Link>
 </section>;
 const now=new Date();
 const [due,next,unread,replyResult,leadsResult]=await Promise.allSettled([
  getTpoDueFollowupQueue(context,now,{scope,window:"DUE",page:1}),
  getTpoDueFollowupQueue(context,now,{scope,window:"NEXT_7_DAYS",page:1}),
  countTpoUnreadRecruiterMessages(context),
  getTpoMessagesInbox(context,{status:"REPLY",page:1,pageSize:3}),
  listTpoLeads(context,context.membership.collegeId),
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
 const notContacted=leadsResult.status==="fulfilled"&&leadsResult.value!==null?
  summarizeTpoTodayNotContacted(leadsResult.value,scope,context.membership.id):null;
 if(view==="agenda"||view==="brief")return <TpoTodayAlternateViews
  view={view} scope={scope} rows={rows} selectedDay={selectedDay!} nowIso={now.toISOString()}
  notContacted={notContacted}
  replies={replies} replyTotal={replyTotal}
  hasMore={due.value.total>due.value.rows.length||next.value.total>next.value.rows.length}/>;
 return <TpoCompaniesToday scope={scope} rows={rows} nowIso={now.toISOString()}
  notContacted={notContacted}
  initialFollowupId={typeof params.lead==="string"?params.lead:undefined}
  unreadMessages={unread.status==="fulfilled"?unread.value:null}
  replies={replies} replyTotal={replyTotal}
  hasMore={due.value.total>due.value.rows.length||next.value.total>next.value.rows.length}/>;
}
