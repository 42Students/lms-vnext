"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {useState} from "react";
import dynamic from "next/dynamic";
import type {TpoGridColumn} from "@/modules/placements/tpo-grid-model";
import {safeGridClipboardCell} from "./grid/grid-export";
import type {TpoSpreadsheetGridProps} from "./tpo-spreadsheet-grid";
import {TPO_AUDIT_KIND_LABELS,formatTpoAuditEventType} from "@/modules/placements/tpo-audit-model";
import type {TpoAuditRow} from "@/modules/placements/tpo-audit-service";
/** Quartz receives only scoped audit rows already supplied to this view. */
const TpoAuditQuartz=dynamic<TpoSpreadsheetGridProps<TpoAuditRow>>(
 ()=>import("./grid/tpo-grid").then(module=>module.TpoGrid<TpoAuditRow>),
 {ssr:false,loading:()=> <p role="status" className="py-4 text-sm text-muted-foreground">Loading audit sheet…</p>},
);
function when(value:string){
 const instant=Date.parse(value);
 return Number.isFinite(instant)?new Intl.DateTimeFormat("en-IN",{
  dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
 }).format(new Date(instant))+" IST":"Not recorded";
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
 const [showAbout,setShowAbout]=useState(true),[showDetail,setShowDetail]=useState(true);
 const [who,setWho]=useState(""),[what,setWhat]=useState("");
 const [oldestFirst,setOldestFirst]=useState(false),[selected,setSelected]=useState<string[]>([]);
 const [notice,setNotice]=useState("");
 const visible=rows.filter(row=>
  row.actorName.toLocaleLowerCase("en-IN").includes(who.trim().toLocaleLowerCase("en-IN")) &&
  [row.title,row.detail,row.eventType].some(field=>field.toLocaleLowerCase("en-IN").includes(what.trim().toLocaleLowerCase("en-IN")))
 ).sort((a,b)=>oldestFirst?a.occurredAt.localeCompare(b.occurredAt):b.occurredAt.localeCompare(a.occurredAt));
 async function copy(){
  const wanted=selected.length?visible.filter(row=>selected.includes(row.kind+":"+row.id)):visible;
  const text=wanted.map(row=>[formatTpoAuditEventType(row.eventType),
   TPO_AUDIT_KIND_LABELS[row.kind],row.title,row.detail,row.actorName,when(row.occurredAt)]
    .map(safeGridClipboardCell).join("\t")).join("\n");
  try{await navigator.clipboard.writeText(text);setNotice("Rows copied");}
  catch{setNotice("Could not copy rows. Select the table text instead.");}
 }
 const columns:readonly TpoGridColumn<TpoAuditRow>[]=[
  {key:"when",label:"When",sortKind:"date",
   sortValue:row=>{const instant=Date.parse(row.occurredAt);return Number.isFinite(instant)?instant:null;},
   read:row=>when(row.occurredAt)},
  {key:"event",label:"Event",read:row=>formatTpoAuditEventType(row.eventType)},
  ...(showAbout?[{key:"about",label:"About",read:(row:TpoAuditRow)=>TPO_AUDIT_KIND_LABELS[row.kind]+": "+row.title}]:[]),
  ...(showDetail?[{key:"detail",label:"Detail",read:(row:TpoAuditRow)=>row.detail}]:[]),
  {key:"who",label:"Who",read:row=>row.actorName},
 ];
 return <section aria-label="Audit history grid" className="min-w-0 space-y-3">
  <div className="grid min-w-0 grid-cols-1 gap-3 border-y border-[var(--lms-canvas-border)] py-3 sm:grid-cols-2 lg:grid-cols-3">
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
   <label className="flex min-h-11 items-center gap-2 text-sm">
    <Checkbox checked={showAbout} onChange={e=>setShowAbout(e.target.checked)} />About
   </label>
   <label className="flex min-h-11 items-center gap-2 text-sm">
    <Checkbox checked={showDetail} onChange={e=>setShowDetail(e.target.checked)} />Detail
   </label>
   <Button variant="secondary" type="button" onClick={()=>void copy()}
    className="min-h-11">Copy rows</Button>
   <Button variant="secondary" type="button" onClick={()=>{setWho("");setWhat("");setOldestFirst(false);setSelected([]);setShowAbout(true);setShowDetail(true);}}
    className="min-h-11">Reset grid</Button>
  </div>

  <p role="status" className="text-xs text-muted-foreground">Showing {visible.length} of {rows.length} rows on this page. Copy selected rows or, with nothing selected, all visible rows.</p>
  <TpoAuditQuartz rows={visible} columns={columns} rowKey={row=>row.kind+":"+row.id}
   storageKey="tpo-audit-history-grid-v1" integratedWorkspace mobileActionsCollapsible
   mobilePrimaryKeys={["event","when","about"]}
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
