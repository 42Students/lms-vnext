"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
export type TpoCampaignSidebarRow={
 campaign_id:string;title:string;subject:string;status:string;
 created_at:Date|string;createdByUserId:string;
 sender_name:string;total_recipients:number;sent:number;failed:number;skipped:number;
};
function statusLabel(status:string){
 if(status==="SENT")return "Sent";
 if(status==="DRAFT")return "Draft";
 if(status==="SENDING")return "Sending";
 return status.replaceAll("_"," ").toLowerCase();
}
function calendarLabel(date:Date|string){
 const when=new Date(date);
 return Number.isFinite(when.getTime())?new Intl.DateTimeFormat("en-IN",{
  timeZone:"Asia/Kolkata",day:"numeric",month:"short",
 }).format(when):"Date unavailable";
}
/** The campaign sidebar is one authorized college's persisted campaign list.
 * "Mine" filters by immutable author ID, never a display name. Provider
 * acceptance is a receipt, not proof of email delivery/open/reply. */
export function TpoCampaignPrototypeSidebar({
 rows,actorUserId,ready,activeId
}:{
 rows:readonly TpoCampaignSidebarRow[];actorUserId:string;
 ready:boolean;activeId?:string;
}){
 const [mine,setMine]=useState(false);
 const [search,setSearch]=useState("");
 const visible=useMemo(()=>rows.filter(row=>(!mine||row.createdByUserId===actorUserId)&&
  (!search.trim()||[row.title,row.subject,row.sender_name].some(value=>
   value.toLocaleLowerCase("en").includes(search.trim().toLocaleLowerCase("en"))))),[rows,mine,actorUserId,search]);
 const sent=visible.filter(row=>row.status==="SENT");
 const drafts=visible.filter(row=>row.status!=="SENT");
 return <aside aria-label="Email campaign list" data-testid="tpo.campaigns.prototype-sidebar"
  className="min-w-0 overflow-hidden rounded-xl border border-border bg-surface">
  <div className="space-y-2 border-b border-border p-4">
   <Link href="/tpo/recruiters/campaigns/new" className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary">
    New email
   </Link>
   <label className="sr-only" htmlFor="tpo-campaign-search">Search emails</label>
   <input id="tpo-campaign-search" type="search" placeholder="Search emails"
    value={search} onChange={event=>setSearch(event.target.value)}
    className="min-h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground"/>
   <div className="flex flex-wrap gap-2" role="group" aria-label="Campaign author filter">
    <button type="button" aria-pressed={!mine} onClick={()=>setMine(false)}
     className={"min-h-11 rounded-full border px-3 text-sm font-semibold "+(!mine?
      "border-primary bg-primary-subtle text-primary-text":"border-border text-body")}>Everyone's</button>
    <button type="button" aria-pressed={mine} onClick={()=>setMine(true)}
     className={"min-h-11 rounded-full border px-3 text-sm font-semibold "+(mine?
      "border-primary bg-primary-subtle text-primary-text":"border-border text-body")}>Mine</button>
   </div>
  </div>
  {!ready?<p role="alert" className="p-4 text-sm text-body">Saved email history is temporarily unavailable. No missing campaigns are assumed.</p>:null}
  {ready&&!visible.length?<p role="status" className="p-4 text-sm text-muted-foreground">
   {search.trim()||mine?"No campaigns match this filter.":"No email campaigns yet."}
  </p>:null}
  {([["SENT","Sent",sent],["DRAFTS","Drafts and sending",drafts]] as const).map(([key,heading,items])=>
   <section key={key} className="min-w-0 border-b border-border last:border-b-0" aria-label={heading}>
    <h2 className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">{heading}</h2>
    <ul className="divide-y divide-border">{items.map(item=>
     <li key={item.campaign_id}>
      <Link href={"/tpo/recruiters/campaigns/drafts/"+encodeURIComponent(item.campaign_id)}
       aria-current={activeId===item.campaign_id?"page":undefined}
       className={"block min-h-11 px-4 py-3 hover:bg-primary-subtle "+(activeId===item.campaign_id?
        "border-l-[3px] border-primary bg-primary-subtle":"")}>
       <span className="flex items-start justify-between gap-2">
        <strong className="min-w-0 break-words text-sm text-foreground">{item.title}</strong>
        <span className="shrink-0 text-xs text-muted-foreground">{calendarLabel(item.created_at)}</span>
       </span>
       <span className="mt-1 block break-words text-xs text-body">{statusLabel(item.status)} · {item.total_recipients} eligible at draft time</span>
       {item.status==="SENT"?<span className="mt-1 block text-xs text-muted-foreground">
        {item.sent} provider accepted{item.failed?" · "+item.failed+" failed":""}{item.skipped?" · "+item.skipped+" skipped":""}
       </span>:null}
      </Link>
     </li>)}</ul>
   </section>)}
  <p className="px-4 py-3 text-xs leading-5 text-muted-foreground">
   Saved campaigns only. Drafts are not sent, and provider acceptance does not confirm delivery or an open.
  </p>
 </aside>;
}
