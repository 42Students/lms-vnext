import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasMembershipRole} from "@/modules/identity/context";
import {tpoCrmTablesReady} from "@/modules/placements/tpo-crm-storage-readiness";
import {getTpoDueFollowupQueue} from "@/modules/placements/tpo-followup-queue-service";
import {listTpoLeads} from "@/modules/placements/tpo-crm-service";
import {getTpoTodayCompanyVerificationAttention} from "@/modules/placements/tpo-today-company-attention-service";
import {rankTpoCompaniesToday,tpoCompaniesTodayScope,tpoTodayAgendaDay,summarizeTpoTodayNotContacted,summarizeTpoTodayOutsideWeek} from "@/modules/placements/tpo-companies-today-model";
import {countTpoUnreadRecruiterMessages} from "@/modules/placements/tpo-recruiter-unread-count-service";
import {getTpoMessagesInbox} from "@/modules/placements/tpo-messages-service";
import {TpoCompaniesToday} from "@/components/tpo/tpo-companies-today";
import {TpoTodayAlternateViews} from "@/components/tpo/tpo-today-alternate-views";
import {Alert} from "@/components/ui/alert";
import {PageHeader} from "@/components/ui/page-header";
import {ErrorState} from "@/components/ui/error-state";
import { TextLink } from "@/components/ui/text-link";
export const dynamic="force-dynamic";

/** Real, per-college Companies/Today focus. Email replies and CRM follow-ups
 * are different sources: no fabricated reply bodies or implied email sends. */
export default async function TpoCompaniesTodayPage({searchParams}:{
 searchParams:Promise<{scope?:string|string[];view?:string|string[];lead?:string|string[];day?:string|string[]}>
}){
 const context=await getCurrentRequestContext();
 if(!hasMembershipRole(context,"TPO")||!context.membership)redirect("/dashboard");
 const ready=await tpoCrmTablesReady().catch(()=>false);
 if(!ready)return <div className="min-w-0 space-y-[var(--lms-space-4)]">
  <PageHeader title="Companies · Today"/>
  <Alert tone="warning">Recruiter CRM is unavailable until its registered database migration is verified. No follow-ups have been treated as zero.</Alert>
  <TextLink href="/tpo/recruiters" className="inline-flex min-h-11 items-center md:min-h-9">Open recruiter contacts</TextLink>
 </div>;
 const params=await searchParams;
 const scope=tpoCompaniesTodayScope(params.scope);
 const view=params.view??"focus";
 const invalidView=Array.isArray(view)||!["focus","agenda","brief"].includes(view);
 const selectedDay=tpoTodayAgendaDay(params.day);
 const invalidLead=params.lead!==undefined&&
  (typeof params.lead!=="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.lead));
 if(!scope||invalidView||invalidLead||selectedDay===null||
  (params.day!==undefined&&view!=="agenda")||
  (params.lead!==undefined&&view!=="focus"))return <div className="min-w-0 space-y-[var(--lms-space-4)]">
  <PageHeader title="Companies · Today"/>
  <ErrorState title="Invalid view parameters" description="Invalid Today view, ownership or follow-up selection. Nothing was loaded."
   action={<TextLink href="/tpo/companies/today">Open My Work</TextLink>}/>
 </div>;
 const now=new Date();
 const [due,next,unread,replyResult,leadsResult,verificationResult]=await Promise.allSettled([
  getTpoDueFollowupQueue(context,now,{scope,window:"DUE",page:1}),
  getTpoDueFollowupQueue(context,now,{scope,window:"NEXT_7_DAYS",page:1}),
  countTpoUnreadRecruiterMessages(context),
  getTpoMessagesInbox(context,{status:"REPLY",page:1,pageSize:3}),
  listTpoLeads(context,context.membership.collegeId),
  getTpoTodayCompanyVerificationAttention(context,scope),
 ]);
 if(due.status==="rejected"||next.status==="rejected")return <div className="min-w-0 space-y-[var(--lms-space-4)]">
  <PageHeader title="Companies · Today"/>
  <ErrorState title="Could not load follow-up queue" description="Could not load the follow-up queue. Existing records are unchanged. Refresh to retry."
   retryHref="/tpo/companies/today"
   action={<TextLink href="/tpo/follow-ups">Open the full follow-up queue</TextLink>}/>
 </div>;
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
 // A valid UUID is not evidence that the task belongs to the visible
 // authorized page. Never silently substitute its first recruiter.
 if(view==="focus"&&typeof params.lead==="string"&&
  !rows.some(row=>row.id===params.lead))return <div className="min-w-0 space-y-[var(--lms-space-4)]">
   <PageHeader title="Companies · Today"/>
   <ErrorState title="Follow-up not available" description="That follow-up is not available in the current Today preview. It may have changed or be outside the loaded queue. No other recruiter was selected."
    action={<div className="flex flex-wrap gap-3">
     <TextLink href="/tpo/follow-ups" className="inline-flex min-h-11 items-center md:min-h-9">Open all follow-ups</TextLink>
     <TextLink href="/tpo/companies/today" className="inline-flex min-h-11 items-center md:min-h-9">Return to Today</TextLink>
    </div>}/>
  </div>;
 const notContacted=leadsResult.status==="fulfilled"&&leadsResult.value!==null?
  summarizeTpoTodayNotContacted(leadsResult.value,scope,context.membership.id):null;
 const outsideWeek=leadsResult.status==="fulfilled"&&leadsResult.value!==null?
  summarizeTpoTodayOutsideWeek(leadsResult.value,scope,context.membership.id,now):null;
 if(view==="agenda"||view==="brief")return <TpoTodayAlternateViews
  view={view} scope={scope} rows={rows} selectedDay={selectedDay!} nowIso={now.toISOString()}
  notContacted={notContacted} outsideWeek={outsideWeek}
  replies={replies} replyTotal={replyTotal}
  hasMore={due.value.total>due.value.rows.length||next.value.total>next.value.rows.length}/>;
 const companyAttention=verificationResult.status==="fulfilled"?verificationResult.value:null;
 const leadContexts=leadsResult.status==="fulfilled"&&leadsResult.value!==null?
  leadsResult.value.map(lead=>({
   id:lead.id,stage:lead.stage,designation:lead.designation,
   emailNorm:lead.emailNorm,ownerName:lead.ownerName,
  })):[];
 return <TpoCompaniesToday scope={scope} rows={rows} nowIso={now.toISOString()}
  notContacted={notContacted} leadContexts={leadContexts} companyAttention={companyAttention}
  outsideWeek={outsideWeek}
  initialFollowupId={typeof params.lead==="string"?params.lead:undefined}
  unreadMessages={unread.status==="fulfilled"?unread.value:null}
  replies={replies} replyTotal={replyTotal}
  hasMore={due.value.total>due.value.rows.length||next.value.total>next.value.rows.length}/>;
}
