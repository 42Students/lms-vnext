"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {useEffect,useMemo,useRef,useState} from "react";
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
/** Legacy audit entities are untrusted metadata, not navigation grants.
 * Only allow app-internal paths; each destination rechecks its college scope.
 * Old numeric IDs cannot be inferred as modern tenant-scoped UUIDs. */
function scopedAuditHref(href:string):string{
 if(!href.startsWith("/")||href.startsWith("//")||href.includes("\\")||
   /[\x00-\x1f\x7f]/.test(href))return "/tpo/audit";
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
 const segment=(prefix:string)=>{
  if(!href.startsWith(prefix))return null;
  const id=href.slice(prefix.length).split(/[?#/]/,1)[0];
  return id !== undefined && uuid.test(id)?encodeURIComponent(id):"";
 };
 const job=segment("/tpo/drives/");
 if(job!==null)return job?"/tpo/placements/jobs/"+job:"/tpo/placements";
 const recruiter=segment("/tpo/recruiters/");
 if(recruiter!==null)return recruiter?"/tpo/recruiters/"+recruiter:"/tpo/recruiters";
 if(href.startsWith("/tpo/students?")){
  const params=new URLSearchParams(href.slice("/tpo/students?".length));
  const id=params.get("student")??"";
  return uuid.test(id)?"/tpo/students/"+encodeURIComponent(id)+"/history":"/tpo/students";
 }
 if(href.startsWith("/tpo/students/")){
  const student=segment("/tpo/students/");
  return student?"/tpo/students/"+student+"/history":"/tpo/students";
 }
 if(href.startsWith("/tpo/placements/jobs/")){
  const modern=segment("/tpo/placements/jobs/");
  return modern?"/tpo/placements/jobs/"+modern:"/tpo/placements";
 }
 if(["/tpo/audit","/tpo/students","/tpo/recruiters","/tpo/placements"].includes(href))return href;
 return "/tpo/audit";
}
/** A partial refresh must never replace a known-good, college-scoped snapshot. */
function isAuditRow(item: unknown): item is TpoAuditRow {
  if (!item || typeof item !== "object" || Array.isArray(item)) return false;
  const row = item as Record<string, unknown>;
  return typeof row["id"] === "string" &&
    typeof row["kind"] === "string" &&
    Object.prototype.hasOwnProperty.call(TPO_AUDIT_KIND_LABELS, row["kind"]) &&
    typeof row["sourceKind"] === "string" &&
    Object.prototype.hasOwnProperty.call(TPO_AUDIT_KIND_LABELS, row["sourceKind"]) &&
    typeof row["eventType"] === "string" &&
    typeof row["title"] === "string" &&
    typeof row["detail"] === "string" &&
    typeof row["actorName"] === "string" &&
    (row["actorType"] === "SYSTEM" || row["actorType"] === "USER") &&
    row["actorId"] === null &&
    typeof row["action"] === "string" &&
    typeof row["entityType"] === "string" &&
    typeof row["sourceId"] === "string" &&
    typeof row["createdAt"] === "string" &&
    typeof row["occurredAt"] === "string" &&
    Number.isFinite(Date.parse(row["occurredAt"])) &&
    (row["jobId"] === null || typeof row["jobId"] === "string") &&
    (row["entityHref"] === undefined || row["entityHref"] === null || typeof row["entityHref"] === "string") &&
    (row["entityId"] === null || typeof row["entityId"] === "string");
}

export function TpoAuditGrid({rows,refreshHref}:{rows:readonly TpoAuditRow[];refreshHref?:string}){
 // Retain only this mounted, membership+filters-keyed page's data in memory.
 // No localStorage/sessionStorage copies of college audit records, and the
 // authenticated API rechecks persisted actor and college on every refresh.
 const [snapshotRows,setSnapshotRows]=useState<readonly TpoAuditRow[]>(rows);
 const [refreshing,setRefreshing]=useState(false);
 const [stale,setStale]=useState(false);
 const [staleDismissed,setStaleDismissed]=useState(false);
 const [accessDenied,setAccessDenied]=useState(false);
 const [lastRefreshAt,setLastRefreshAt]=useState<string|null>(null);
 const refreshInFlight=useRef(false);
 useEffect(()=>{setSnapshotRows(rows);setStale(false);setStaleDismissed(false);setAccessDenied(false);},[rows]);
 async function refreshGrid(){
  if(!refreshHref||refreshInFlight.current)return;
  refreshInFlight.current=true;setRefreshing(true);
  try{
   const response=await fetch(refreshHref,{
    method:"GET",credentials:"same-origin",cache:"no-store",
    headers:{Accept:"application/json"},
   });
   if(response.status===401||response.status===403){
    // A revoked persisted TPO grant is not a transient network failure:
    // retaining previously private rows here would disclose stale scoped data.
    setSnapshotRows([]);setSelected([]);setStale(false);
    setStaleDismissed(false);setAccessDenied(true);
    return;
   }
   if(!response.ok)throw new Error("Audit revalidation failed");
   const payload:unknown=await response.json();
   if(!payload||typeof payload!=="object"||!("items" in payload)||
      !Array.isArray(payload.items)||payload.items.length>100||
      payload.items.some(row=>!isAuditRow(row)))
    throw new Error("Invalid audit refresh");
   setSnapshotRows(payload.items as TpoAuditRow[]);
   setStale(false);
   setStaleDismissed(false);
   setAccessDenied(false);
   setSelected([]);
   setLastRefreshAt(new Date().toISOString());
  }catch{
   // Keep the original trusted rows; never replace an outage with a false
   // empty list or display an unverified cross-tenant cached snapshot.
   setStale(true);
   setStaleDismissed(false);
  }finally{refreshInFlight.current=false;setRefreshing(false);}
 }
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
 const visible=useMemo(()=>snapshotRows.filter(row=>
  row.actorName.toLocaleLowerCase("en-IN").includes(who.trim().toLocaleLowerCase("en-IN")) &&
  [row.title,row.detail,row.eventType,row.actorName,TPO_AUDIT_KIND_LABELS[row.kind]]
   .some(field=>field.toLocaleLowerCase("en-IN").includes(what.trim().toLocaleLowerCase("en-IN")))
 ).sort((a,b)=>oldestFirst?a.occurredAt.localeCompare(b.occurredAt):b.occurredAt.localeCompare(a.occurredAt)),
 [snapshotRows,who,what,oldestFirst]);
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
  <div className="flex flex-wrap items-center justify-between gap-2">
   <span className="text-xs text-muted-foreground">
    {lastRefreshAt?"Grid checked at "+new Intl.DateTimeFormat("en-IN",{
     timeZone:"Asia/Kolkata",timeStyle:"short"
    }).format(new Date(lastRefreshAt))+" IST":"Loaded scoped audit snapshot"}
   </span>
   {refreshHref?<Button type="button" size="sm" variant="secondary"
    loading={refreshing} disabled={refreshing}
    onClick={()=>void refreshGrid()}>{stale?"Retry audit refresh":"Refresh audit rows"}</Button>:null}
  </div>
  {accessDenied?<p role="alert" className="border-l-2 border-error px-3 py-2 text-sm text-body">
    Access to the audit log was denied. Previously loaded audit rows were cleared.
    Return to your dashboard and reopen this page after your permissions are restored.
   </p>:null}
  {stale && !staleDismissed?<div role="alert" className="flex flex-wrap items-center justify-between gap-3 border-l-2 border-warning bg-warning-subtle px-3 py-2 text-sm text-body">
   <p>This refresh failed. Showing the last successfully loaded audit rows on this page.
     Changes and totals cannot be verified until Retry succeeds.</p>
   <Button type="button" size="sm" variant="secondary" className="min-h-11 md:min-h-9"
     aria-label="Dismiss stale audit warning" onClick={()=>setStaleDismissed(true)}>Dismiss</Button>
  </div>:null}
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

  <p role="status" className="text-xs text-muted-foreground">Showing {visible.length} of {snapshotRows.length} rows on this page. Copy selected rows or, with nothing selected, all visible rows.</p>
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
