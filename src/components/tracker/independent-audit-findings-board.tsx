"use client";

import {useEffect,useState} from "react";
import Link from "next/link";
import type {db10AuditFindings} from "@/db/schema/db10-audit-findings.draft";
import {DataTable,type DataTableColumn} from "@/components/ui/data-table";
import {Drawer} from "@/components/ui/drawer";
import {Button} from "@/components/ui/button";
import {StatusBadge} from "@/components/ui/status-badge";
import {EmptyState} from "@/components/ui/empty-state";
import {Banner} from "@/components/ui/banner";
import {IndependentFindingActions} from "@/components/tracker/independent-finding-actions";
import {IndependentFindingCopyAction} from "@/components/tracker/independent-finding-copy-action";

type Finding=typeof db10AuditFindings.$inferSelect;
type FindingEvent={id:string;action:string;note:string|null;createdAt:string;fromStatus:string|null;toStatus:string|null};
type Similar={id:string;externalId:string;title:string;status:string;score:number};
type Detail={finding:Finding;events:FindingEvent[];similar:Similar[]};
function istDate(value:Date|string|null|undefined){
 if(!value)return "Not given";
 const date=new Date(value);
 return Number.isNaN(date.getTime())?"Not given":
  new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(date)+" IST";
}
const statuses:Record<string,string>={
 NEW:"New",CONFIRMED:"Confirmed",IN_PROGRESS:"In progress",FIXED_DEV:"Fixed (dev)",
 RELEASED_PROD:"Released (prod)",VERIFIED:"Verified",DUPLICATE:"Duplicate",
 WONT_FIX:"Won't fix",NEEDS_INFO:"Needs info",CANT_REPRODUCE:"Can't reproduce",
};
function statusTone(status:string):"success"|"warning"|"info"|"neutral"{
 return status==="VERIFIED"||status==="RELEASED_PROD"?"success":
  status==="NEW"||status==="NEEDS_INFO"?"warning":"info";
}
export function IndependentAuditFindingsBoard({rows,view}:{
 rows:Finding[];view:"OPEN"|"RELEASE"|"ALL";
}){
 const [selected,setSelected]=useState<string|null>(null);
 const [detail,setDetail]=useState<Detail|null>(null);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const [retry,setRetry]=useState(0);
 useEffect(()=>{
  const form=document.querySelector<HTMLFormElement>("form[data-audit-findings-filters]");
  if(!form)return;
  const onChange=(event:Event)=>{
   const control=event.target;
   if(control instanceof HTMLSelectElement ||
      (control instanceof HTMLInputElement&&control.name==="area")) form.requestSubmit();
  };
  form.addEventListener("change",onChange);
  return ()=>form.removeEventListener("change",onChange);
 },[]);
 useEffect(()=>{
  if(!selected){setDetail(null);setError(null);setLoading(false);return;}
  const controller=new AbortController();
  setDetail(null);setError(null);setLoading(true);
  fetch("/api/tracker/audit-findings/"+encodeURIComponent(selected),{
   credentials:"same-origin",cache:"no-store",signal:controller.signal,
  }).then(async result=>{
   if(!result.ok)throw new Error(result.status===401||result.status===403?
    "Your session no longer permits this finding. Sign in again.":"Couldn't load this finding.");
   return result.json() as Promise<Detail>;
  }).then(data=>{if(!controller.signal.aborted)setDetail(data);})
   .catch(reason=>{if(!controller.signal.aborted)setError(reason instanceof Error?reason.message:"Couldn't load this finding.");})
   .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return ()=>controller.abort();
 },[selected,retry]);
 const columns:DataTableColumn<Finding>[]=[
  {key:"severity",header:"Severity",mobilePriority:"secondary",className:"md:w-[100px]",cell:f=>
   <StatusBadge tone={f.severity==="CRITICAL"?"error":f.severity==="HIGH"?"warning":"neutral"}>
    {f.severity[0]+f.severity.slice(1).toLowerCase()}
   </StatusBadge>},
  {key:"finding",header:"Finding",mobilePriority:"primary",cell:f=><div className="min-w-0">
   <Button type="button" variant="ghost" className="h-auto min-h-9 justify-start whitespace-normal p-0 text-left font-semibold text-[var(--lms-heading)]"
    onClick={()=>setSelected(f.externalId)} aria-label={"Open finding "+f.externalId+" in drawer"}>{f.title}</Button>
   <p className="mt-1 break-words text-xs text-muted-foreground">
    {f.externalId} · {f.area} · {f.kind} · {f.environment??"Not given"}
   </p></div>},
  {key:"status",header:"Status",mobilePriority:"secondary",className:"md:w-[150px]",cell:f=>
   <StatusBadge tone={statusTone(f.status)}>{statuses[f.status]??f.status}</StatusBadge>},
  {key:"assigned",header:"Assigned",mobilePriority:"secondary",className:"md:w-[130px]",cell:f=>f.assignee||"Nobody"},
  {key:"reported",header:"Reported",mobilePriority:"secondary",className:"md:w-[170px]",cell:f=>
   <div><span className="block">{istDate(f.foundAt)}</span>
   <span className="text-xs text-muted-foreground">{f.foundBy??"Not given"}</span></div>},
 ];
 const current=detail?.finding;
 const renderText=(value:string|null|undefined)=><span className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{value?.trim()||"Not given"}</span>;
 const fields=current?[
  ["Summary",current.summary],["Steps",current.steps],["Expected",current.expected],
  ["Actual",current.actual],["Evidence",current.evidence],["Suggested fix",current.suggestedFix],
  ["Where",["Repo: "+current.sourceRepo,...current.paths.map(p=>"File: "+p),
   ...current.pages.map(p=>"Page: "+p),...current.endpoints.map(p=>"Endpoint: "+p)].join("\n")],
  ["Affects",current.roles.join(", ")],["Seen on",current.environment],
  ["Reported",(current.foundBy??"Not given")+" · "+istDate(current.foundAt)],
  ["Fix commits",current.fixCommits.length?current.fixCommits.map(c=>c.repo+" "+c.sha).join("\n"):"None yet"],
 ]:[];
 return <>
  <DataTable columns={columns} rows={rows} getRowKey={f=>f.id} caption="Independent audit findings"
   empty={<EmptyState title={view==="RELEASE"?"No open critical or high findings":"No findings match"}
    description="Try changing the current filters."/>}/>
  <Drawer open={Boolean(selected)} title={current?.title??"Finding"}
   description={selected??undefined} className="md:!w-[min(720px,100vw)]"
   onOpenChange={open=>{if(!open)setSelected(null);}}>
   {loading?<div role="status" aria-live="polite" className="space-y-3">
    <p className="text-sm text-muted-foreground">Loading finding…</p>
    {[1,2,3,4].map(n=><div key={n} className="h-8 animate-pulse rounded-md bg-[var(--lms-neutral-100)]"/>)}
   </div>:null}
   {error?<div className="space-y-3"><Banner tone="error">{error}</Banner>
    <Button type="button" variant="secondary" onClick={()=>setRetry(x=>x+1)}>Retry</Button>
    <Button type="button" variant="ghost" onClick={()=>setSelected(null)}>Close</Button></div>:null}
   {current&&!loading?<div className="space-y-5">
    <div className="flex flex-wrap items-center gap-2">
     <StatusBadge tone={statusTone(current.status)}>{statuses[current.status]??current.status}</StatusBadge>
     <StatusBadge tone={current.severity==="CRITICAL"?"error":current.severity==="HIGH"?"warning":"neutral"}>{current.severity}</StatusBadge>
     <StatusBadge>{current.area}</StatusBadge><StatusBadge>{current.kind}</StatusBadge>
     <Link href={"/tracker/audit-findings/"+encodeURIComponent(current.externalId)}
      className="text-sm font-semibold text-link underline">Open full page</Link>
    </div>
    <dl className="divide-y divide-[var(--lms-canvas-border)] rounded-lg border border-[var(--lms-canvas-border)] text-sm">
     {fields.map(([label,value])=><div key={label} className="grid min-w-0 gap-2 p-3 sm:grid-cols-[135px_minmax(0,1fr)]">
      <dt className="font-semibold text-[var(--lms-heading)]">{label}</dt>
      <dd className="min-w-0 text-body">{renderText(value)}</dd>
     </div>)}
    </dl>
    {detail?.similar.length?<Banner tone="warning"><strong>Looks similar</strong>
     <ul className="mt-2 space-y-1">{detail.similar.map(item=><li key={item.id}>
      <Button type="button" variant="ghost" className="h-auto p-0 text-left text-sm underline"
       onClick={()=>setSelected(item.externalId)}>
       {item.externalId} · {item.title} ({statuses[item.status]??item.status})
      </Button></li>)}</ul>
    </Banner>:null}
    <IndependentFindingCopyAction finding={{
     id:current.externalId,title:current.title,summary:current.summary,
     steps:current.steps,expected:current.expected,actual:current.actual,
     sourceRepo:current.sourceRepo,sourcePath:current.sourcePath,
     severity:current.severity,status:current.status,
    }}/>
    <IndependentFindingActions key={current.id+"-"+current.version}
     externalId={current.externalId} version={current.version} status={current.status}
     severity={current.severity} currentAssignee={current.assignee}
     candidates={detail?.similar.map(s=>({id:s.id,externalId:s.externalId,title:s.title}))??[]}/>
    <section className="space-y-2"><h3 className="font-semibold">History</h3>
     {detail?.events.length?<ol className="divide-y divide-[var(--lms-canvas-border)]">
      {detail.events.map(event=><li key={event.id} className="py-2 text-sm">
       <strong>{event.action}</strong> · {istDate(event.createdAt)}
       {event.note?<p className="whitespace-pre-wrap break-words">{event.note}</p>:null}
      </li>)}</ol>:<p className="text-sm text-muted-foreground">No history</p>}
    </section>
   </div>:null}
  </Drawer>
 </>;
}
