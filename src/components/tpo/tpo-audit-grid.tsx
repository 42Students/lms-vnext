"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {useRouter,useSearchParams} from "next/navigation";
import dynamic from "next/dynamic";
import type {TpoGridColumn} from "@/modules/placements/tpo-grid-model";
import {safeGridClipboardCell} from "./grid/grid-export";
import type {TpoSpreadsheetGridProps} from "./tpo-spreadsheet-grid";
import {TPO_AUDIT_KIND_LABELS,formatTpoAuditEventType} from "@/modules/placements/tpo-audit-model";
import type {TpoAuditRow} from "@/modules/placements/tpo-audit-service";
/** Quartz receives only scoped audit rows already supplied to this view. */
const TpoAuditQuartz=dynamic<TpoSpreadsheetGridProps<TpoAuditRow>>(
 ()=>import("./grid/tpo-grid").then(module=>module.TpoGrid<TpoAuditRow>),
 {ssr:false,loading:()=> <div aria-busy="true" role="status" className="space-y-2 py-4">
   <p className="text-sm text-muted-foreground">Loading audit sheet…</p>
   <div aria-hidden="true" className="space-y-2">{[1,2,3,4,5,6,7,8].map(row=>
     <div key={row} className="grid grid-cols-3 gap-3 border-b border-border px-3 py-3">
       {[1,2,3].map(cell=><span key={cell} className="h-5 animate-pulse rounded bg-muted"/>)}
     </div>)}</div>
  </div>},
);
function when(value:string){
 const instant=Date.parse(value);
 if(!Number.isFinite(instant))return "Not recorded";
 const date=new Date(instant);
 const day=new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",year:"numeric",timeZone:"Asia/Kolkata"}).format(date);
 const hour=new Intl.DateTimeFormat("en-US",{hour:"numeric",minute:"2-digit",hour12:true,timeZone:"Asia/Kolkata"}).format(date);
 return day+" · "+hour+" IST";
}
function eventText(row:TpoAuditRow){
 const action=formatTpoAuditEventType(row.eventType);
 const subject=TPO_AUDIT_KIND_LABELS[row.kind]||"General";
 const detail=row.detail.trim();
 return [action,detail,subject+": "+row.title].filter(Boolean).join(" · ");
}
/** Route known legacy drive URLs to their scoped vNext job detail.
 * The destination rechecks college access and returns 404 when unauthorized.
 */
function scopedAuditHref(href:string):string{
 if(!href.startsWith("/tpo/drives/"))return href;
 const id=href.slice("/tpo/drives/".length);
 return /^[a-f0-9-]{36}$/i.test(id)?"/tpo/placements/jobs/"+id:"/tpo/audit";
}
export function TpoAuditGrid({rows}:{rows:readonly TpoAuditRow[]}){
 const [showAbout,setShowAbout]=useState(false),[showDetail,setShowDetail]=useState(false);
 const router=useRouter(),searchParams=useSearchParams();
 const [who,setWho]=useState(""),[what,setWhat]=useState(searchParams.get("q")??"");
 useEffect(()=>{
  const timer=window.setTimeout(()=>{
   const wanted=what.trim();
   if((searchParams.get("q")??"")===wanted)return;
   const url=new URLSearchParams(searchParams.toString());
   if(wanted)url.set("q",wanted);else url.delete("q");
   url.delete("page");
   router.replace("/tpo/audit"+(url.size?"?"+url.toString():""),{scroll:false});
  },200);
  return ()=>window.clearTimeout(timer);
 },[what,router,searchParams]);
 const [oldestFirst,setOldestFirst]=useState(false),[selected,setSelected]=useState<string[]>([]);
 const [notice,setNotice]=useState("");
 const visible=useMemo(()=>rows.filter(row=>
  row.actorName.toLocaleLowerCase("en-IN").includes(who.trim().toLocaleLowerCase("en-IN")) &&
  [row.title,row.detail,row.eventType,row.actorName,TPO_AUDIT_KIND_LABELS[row.kind]]
   .some(field=>field.toLocaleLowerCase("en-IN").includes(what.trim().toLocaleLowerCase("en-IN")))
 ).sort((a,b)=>oldestFirst?a.occurredAt.localeCompare(b.occurredAt):b.occurredAt.localeCompare(a.occurredAt)),
 [rows,who,what,oldestFirst]);
 async function copy(){
  const wanted=selected.length?visible.filter(row=>selected.includes(row.kind+":"+row.id)):visible;
  const text=wanted.map(row=>[formatTpoAuditEventType(row.eventType),
   TPO_AUDIT_KIND_LABELS[row.kind],row.title,row.detail,row.actorName,when(row.occurredAt)]
    .map(safeGridClipboardCell).join("\t")).join("\n");
  try{await navigator.clipboard.writeText(text);setNotice("Rows copied");}
  catch{setNotice("Could not copy rows. Select the table text instead.");}
 }
 const columns:readonly TpoGridColumn<TpoAuditRow>[]=[
  {key:"event",label:"Event",read:eventText,tooltip:row=>row.detail},
  {key:"actor",label:"Actor",read:row=>row.actorName},
  {key:"when",label:"When",sortKind:"date",
   sortValue:row=>{const instant=Date.parse(row.occurredAt);return Number.isFinite(instant)?instant:null;},
   read:row=>when(row.occurredAt)},
  {key:"about",label:"About",exportAlways:true,exportOnly:!showAbout,
   read:row=>TPO_AUDIT_KIND_LABELS[row.kind]+": "+row.title},
  {key:"detail",label:"Detail",exportAlways:true,exportOnly:!showDetail,read:row=>row.detail},
 ];
 return <section aria-label="Audit history grid" className="min-w-0 space-y-3">
  <div className="grid min-w-0 grid-cols-1 gap-3 border-y border-[var(--lms-canvas-border)] px-3 py-[13px] sm:grid-cols-2 lg:grid-cols-3">
   <label className="min-w-0 flex-1 text-[13px] md:flex-none">What happened
    <Input value={what} onChange={event=>setWhat(event.target.value)} type="search"
     maxLength={120} className="mt-1 block w-full min-w-0" />
   </label>
   <label className="min-w-0 flex-1 text-[13px] md:flex-none">Who
    <Input value={who} onChange={event=>setWho(event.target.value)} type="search"
     maxLength={120} className="mt-1 block w-full min-w-0" />
   </label>
   <label className="min-w-0 flex-1 text-[13px] md:flex-none">When
    <Select value={oldestFirst?"oldest":"newest"}
     onChange={e=>setOldestFirst(e.target.value==="oldest")}
     className="mt-1 block w-full min-w-0">
     <option value="newest">Newest first</option><option value="oldest">Oldest first</option>
    </Select>
   </label>
   <label className="flex min-h-11 items-center gap-2 text-sm" title="Show extra audit columns">
    <Checkbox checked={showAbout} onChange={e=>setShowAbout(e.target.checked)} />About
   </label>
   <label className="flex min-h-11 items-center gap-2 text-sm">
    <Checkbox checked={showDetail} onChange={e=>setShowDetail(e.target.checked)} />Detail
   </label>
   <Button variant="secondary" type="button" onClick={()=>void copy()}
    className="min-h-11">Copy rows</Button>
   <Button variant="secondary" type="button" onClick={()=>{setWho("");setWhat("");setOldestFirst(false);setSelected([]);setShowAbout(false);setShowDetail(false);}}
    className="min-h-11">Reset grid</Button>
  </div>

  <p role="status" className="text-xs text-muted-foreground">Showing {visible.length} of {rows.length} rows on this page. Copy selected rows or, with nothing selected, all visible rows.</p>
  <TpoAuditQuartz rows={visible} columns={columns} rowKey={row=>row.kind+":"+row.id}
   storageKey="tpo-audit-history-grid-v1" integratedWorkspace mobileActionsCollapsible
   mobilePrimaryKeys={["event","when"]}
   selection={{selected,onChange:setSelected,allIds:visible.map(row=>row.kind+":"+row.id)}}
   rowActions={row=>row.entityHref?
    <Link href={scopedAuditHref(row.entityHref)}
      className="lms-inline-link inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Open item →</Link>:
    row.jobId?<Link href={"/tpo/placements/jobs/"+encodeURIComponent(row.jobId)}
      className="lms-inline-link inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Open job →</Link>:
     <span aria-label="No linked item" className="text-xs text-muted-foreground">—</span>}
  />
  {notice?<p role="status" className="text-xs text-muted-foreground">{notice}</p>:null}
 </section>;
}
