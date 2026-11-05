import { Table } from "@/components/ui/table";
import { Heading } from "@/components/ui/heading";
import { Disclosure } from "@/components/ui/disclosure";
import { TextLink } from "@/components/ui/text-link";
import { istDayMonthYearFormatter } from "@/lib/format-date";

type CampaignReceipt={leadId:string;name:string;status:string};
type CampaignStory={
 status:string;subject:string;body:string;senderName:string;
 createdAt:Date|string;totalRecipients:number;providerAccepted:number;
 failed:number;skipped:number;
};
function campaignDay(input:Date|string){
 const date=new Date(input);
 return Number.isFinite(date.getTime())?istDayMonthYearFormatter.format(date):"Date unavailable";
}
function receiptText(code:string){
 const labels:Record<string,string>={
  SENT:"Provider accepted",FAILED:"Failed",QUEUED:"Queued · not confirmed",
  PENDING:"Not sent",SKIPPED_NO_EMAIL:"Skipped · missing email",
  SKIPPED_UNSUBSCRIBED:"Skipped · opted out",
  UNSUBSCRIBED:"Unsubscribed",
 };
 return labels[code]??(code.startsWith("SKIPPED_")?"Skipped":"Status unavailable");
}
function receiptTone(code:string){
 return code==="SENT"?"text-[color:var(--lms-success)] bg-[color:var(--lms-success-surface)]":
  code==="FAILED"?"text-[color:var(--lms-error-strong)] bg-[color:var(--lms-error-surface)]":
  code==="QUEUED"?"text-[color:var(--lms-info-text)] bg-[color:var(--lms-primary-subtle)]":"text-[color:var(--lms-text-body)] bg-[color:var(--lms-neutral-100)]";
}

/** Email screenshots 06–07 show a campaign as a progression rather than a
 * receipt dump. These steps only use persisted campaign and provider receipt
 * facts. There is no instrumentation for delivery, opens, clicks or campaign
 * replies here; those metrics must never be manufactured. */
export function TpoCampaignSentStory({campaign,recipients,recipientsReady,hasMoreRecipients}:{
 campaign:CampaignStory;
 recipients:readonly CampaignReceipt[];
 recipientsReady:boolean;
 hasMoreRecipients:boolean;
}){
 const active=campaign.status==="SENT"||campaign.status==="SENDING";
 if(!active)return null;
 const settled=campaign.providerAccepted+campaign.failed+campaign.skipped;
 const unconfirmed=Math.max(0,campaign.totalRecipients-settled);
 const rejected=recipients.filter(row=>row.status==="FAILED").slice(0,5);
 return <section aria-label="Campaign activity story" data-testid="tpo.campaigns.sent-story"
   className="min-w-0 rounded-xl border border-border bg-surface px-4 py-5 sm:px-6">
   <header className="flex flex-wrap items-center gap-2">
    <Heading level={2} size="xl" className="text-foreground">{campaign.subject}</Heading>
    <span className="rounded-full bg-primary-subtle px-2 py-1 text-xs font-bold text-primary-text">
     {campaign.status==="SENT"?"Send recorded":"Sending in progress"}
    </span>
   </header>
   <p className="mt-2 text-sm text-body">
    Authored by {campaign.senderName} · draft recorded {campaignDay(campaign.createdAt)}.
    The draft timestamp is not evidence of a send time.
   </p>
   <div className="mt-5 space-y-6 border-l-2 border-[color:var(--lms-border)] pl-5">
    <section aria-label="What you sent">
     <Heading level={3} size="xs" className="uppercase tracking-wide text-[color:var(--lms-text-muted)]">What you sent</Heading>
     <p className="mt-2 text-sm text-body">Subject: <strong>{campaign.subject}</strong></p>
     <Disclosure title="See the email" className="mt-2">
      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-body">{campaign.body}</p>
     </Disclosure>
    </section>
    <section aria-label="What happened">
     <Heading level={3} size="xs" className="uppercase tracking-wide text-[color:var(--lms-text-muted)]">What happened</Heading>
     <p className="mt-2 text-sm text-foreground">
      {campaign.providerAccepted} of {campaign.totalRecipients} intended recipients
      have a persisted provider-acceptance receipt.
     </p>
     <div className="mt-3 grid gap-3 sm:grid-cols-3">
      {([
       ["Provider accepted",campaign.providerAccepted,"bg-[color:var(--lms-button-primary)]"],
       ["Failed",campaign.failed,"bg-[color:var(--lms-error)]"],
       ["Skipped",campaign.skipped,"bg-[color:var(--lms-text-muted)]"],
      ] as const).map(([label,count,tone])=>
       <div key={label} className="min-w-0">
        <p className="text-lg font-bold text-foreground">{count}</p>
        <div aria-hidden="true" className="mt-1 h-1.5 overflow-hidden rounded-full bg-[color:var(--lms-border)]">
         <div className={"h-full rounded-full "+tone}
          style={{width:(campaign.totalRecipients?Math.min(100,100*count/campaign.totalRecipients):0)+"%"}}/>
        </div>
        <p className="mt-1 text-xs text-body">{label}</p>
       </div>)}
     </div>
     {unconfirmed>0?<p role="status" className="mt-3 text-sm text-[color:var(--lms-warning-strong)]">
      {unconfirmed} intended recipient {unconfirmed===1?"receipt is":"receipts are"} not settled.
      Refresh the saved campaign to check updated results.
     </p>:null}
     <p className="mt-3 text-xs leading-5 text-muted-foreground">
      Provider acceptance does not confirm inbox delivery, opening, clicking,
      replying or hiring. Those outcomes are not tracked by this campaign summary.
     </p>
    </section>
    <section aria-label="What to do now">
     <Heading level={3} size="xs" className="uppercase tracking-wide text-[color:var(--lms-text-muted)]">What to do now</Heading>
     {campaign.failed>0?<p className="mt-2 text-sm text-body">
      {campaign.failed} recorded failed {campaign.failed===1?"attempt needs":"attempts need"}
      investigation. Review recipient status before preparing any new outreach.
     </p>:<p className="mt-2 text-sm text-body">
      Review recruiter responses in Messages and keep recorded follow-ups in Today.
      Neither implies a response to this particular campaign.
     </p>}
     {recipientsReady&&rejected.length?<ul className="mt-3 divide-y divide-border rounded-lg border border-border">
      {rejected.map(row=><li key={row.leadId} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
       <span className="text-sm font-semibold text-foreground">{row.name}</span>
       <TextLink href={"/tpo/recruiters/"+encodeURIComponent(row.leadId)}
        className="inline-flex min-h-9 items-center text-sm">Review recruiter</TextLink>
      </li>)}
     </ul>:null}
     <div className="mt-3 flex flex-wrap gap-4 text-sm">
      <TextLink href="/tpo/companies/today">Open Today</TextLink>
      <TextLink href="/tpo/messages?tab=recruiters">Check recruiter messages</TextLink>
     </div>
    </section>
    <section aria-label="Everyone it went to">
     <Heading level={3} size="xs" className="uppercase tracking-wide text-[color:var(--lms-text-muted)]">
      Everyone it went to · {campaign.totalRecipients} intended
     </Heading>
     {!recipientsReady?<p role="status" className="mt-2 text-sm text-body">
      Individual recipient statuses are unavailable. No one is assumed delivered or skipped.
     </p>:<div className="mt-2 overflow-x-auto">
      <Table className="min-w-[420px]">
       <thead className="border-y border-border bg-surface-secondary text-xs text-body">
        <tr><th className="p-2">Recruiter</th><th className="p-2">Recorded receipt</th><th className="p-2">Next step</th></tr>
       </thead>
       <tbody className="divide-y divide-border">
        {recipients.slice(0,25).map(row=><tr key={row.leadId}>
         <td className="p-2 break-words font-semibold text-foreground">{row.name}</td>
         <td className="p-2"><span className={"inline-flex rounded-full px-2 py-1 text-xs font-semibold "+receiptTone(row.status)}>{receiptText(row.status)}</span></td>
         <td className="p-2"><TextLink href={"/tpo/recruiters/"+encodeURIComponent(row.leadId)}>Open recruiter</TextLink></td>
        </tr>)}
       </tbody>
      </Table>
      {recipients.length>25||hasMoreRecipients?<p className="py-2 text-xs text-body">
       Showing the first 25 receipt rows in this preview. Use the detailed recipient ledger below for the rest.
      </p>:null}
      {!recipients.length?<p className="py-3 text-sm text-body">No persisted recipient receipts are available.</p>:null}
     </div>}
    </section>
   </div>
  </section>;
}
