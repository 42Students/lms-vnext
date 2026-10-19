import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
"use client";
import Link from "next/link";
import {useState} from "react";
import {StatusBadge} from "@/components/ui/status-badge";
import {DataTable,type DataTableColumn} from "@/components/ui/data-table";
import {TPO_AUDIT_KIND_LABELS,formatTpoAuditEventType} from "@/modules/placements/tpo-audit-model";
import type {TpoAuditRow} from "@/modules/placements/tpo-audit-service";
function safeClipboardCell(field:string){
 const oneLine=field.replaceAll(/[\r\n\t]/g," ");
 return /^[\s\uFEFF]*[=+\-@]/u.test(oneLine)?"'"+oneLine:oneLine;
}
function when(value:string){
 return new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"})
  .format(new Date(value));
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
   TPO_AUDIT_KIND_LABELS[row.kind],row.title,row.detail,row.actorName,when(row.occurredAt)+" IST"]
    .map(safeClipboardCell).join("\t")).join("\n");
  try{await navigator.clipboard.writeText(text);setNotice("Rows copied");}
  catch{setNotice("Could not copy rows. Select the table text instead.");}
 }
 const columns:DataTableColumn<TpoAuditRow>[]=[
  {key:"selected",header:"Select",mobileLabel:"Select row",mobilePriority:"action",
   cell:row=><label className="inline-flex min-h-11 items-center gap-2 text-sm">
    <Checkbox aria-label={"Select "+row.title}
     checked={selected.includes(row.kind+":"+row.id)}
     onChange={e=>setSelected(ids=>e.target.checked?[...ids,row.kind+":"+row.id]:ids.filter(id=>id!==row.kind+":"+row.id))}/>
    <span className="sm:sr-only">Select</span></label>},
  {key:"when",header:"When",mobilePriority:"secondary",
   cell:row=><time dateTime={row.occurredAt}>{when(row.occurredAt)}</time>},
  {key:"event",header:"Event",mobilePriority:"primary",
   cell:row=><StatusBadge tone="neutral">{formatTpoAuditEventType(row.eventType)}</StatusBadge>},
  ...(showAbout?[{key:"about",header:"About",mobilePriority:"secondary" as const,
   cell:(row:TpoAuditRow)=><><span className="text-xs text-muted-foreground">{TPO_AUDIT_KIND_LABELS[row.kind]}</span>
    <p className="break-words">{row.title}</p></>}]:[]),
  ...(showDetail?[{key:"detail",header:"Detail",mobilePriority:"secondary" as const,
   cell:(row:TpoAuditRow)=><span className="break-words">{row.detail}</span>}]:[]),
  {key:"who",header:"Who",mobilePriority:"secondary",cell:row=>row.actorName},
  {key:"open",header:"Open",mobilePriority:"action",cell:row=>row.entityHref?
    <Link href={row.entityHref} className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-teal-deep)] underline">Open item →</Link>:
    row.jobId?<Link href={"/tpo/placements/jobs/"+encodeURIComponent(row.jobId)}
     className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-teal-deep)] underline">Open job →</Link>:"—"},
 ];
 return <section aria-label="Audit history grid" className="min-w-0 space-y-3">
  <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-3">
   <label className="text-sm">What happened
    <input value={what} onChange={event=>setWhat(event.target.value)} type="search"
     maxLength={120} className="mt-1 block min-h-11 w-full min-w-0 rounded border border-border px-2 text-base sm:text-sm" />
   </label>
   <label className="text-sm">Who
    <input value={who} onChange={event=>setWho(event.target.value)} type="search"
     maxLength={120} className="mt-1 block min-h-11 w-full min-w-0 rounded border border-border px-2 text-base sm:text-sm" />
   </label>
   <label className="text-sm">When
    <Select value={oldestFirst?"oldest":"newest"}
     onChange={e=>setOldestFirst(e.target.value==="oldest")}
     className="mt-1 block min-h-11 w-full min-w-0 rounded border border-border px-2 text-base sm:text-sm">
     <option value="newest">Newest first</option><option value="oldest">Oldest first</option>
    </Select>
   </label>
   <label className="flex min-h-11 items-center gap-2 text-sm">
    <Checkbox checked={showAbout} onChange={e=>setShowAbout(e.target.checked)} />About
   </label>
   <label className="flex min-h-11 items-center gap-2 text-sm">
    <Checkbox checked={showDetail} onChange={e=>setShowDetail(e.target.checked)} />Detail
   </label>
   <button type="button" onClick={()=>void copy()}
    className="min-h-11 rounded border border-border px-3 text-sm text-[var(--lms-teal-deep)]">Copy rows</button>
   <button type="button" onClick={()=>{setWho("");setWhat("");setOldestFirst(false);setSelected([]);setShowAbout(true);setShowDetail(true);}}
    className="min-h-11 rounded border border-border px-3 text-sm">Reset grid</button>
  </div>
  <label className="inline-flex min-h-11 items-center gap-2 text-sm"><Checkbox aria-label="Select all visible rows"
   checked={visible.length>0&&visible.every(row=>selected.includes(row.kind+":"+row.id))}
   onChange={event=>setSelected(event.target.checked?visible.map(row=>row.kind+":"+row.id):[])}/>
   Select all visible rows</label>
  <p role="status" className="text-xs text-muted-foreground">Showing {visible.length} of {rows.length} rows on this page. Copy selected rows or, with nothing selected, all visible rows.</p>
  <div className="min-w-0" tabIndex={0} aria-label="Audit history table"
   onKeyDown={event=>{
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="c" &&
      !(event.target instanceof HTMLInputElement) && !window.getSelection()?.toString()){
     event.preventDefault();void copy();
    }
   }}>
   <DataTable caption="Audit history" columns={columns} rows={visible}
     getRowKey={row=>row.kind+":"+row.id}
     empty={<p role="status" className="text-sm">No matching audit records on this page.</p>}/>
  </div>
  {notice?<p role="status" className="text-xs text-muted-foreground">{notice}</p>:null}
 </section>;
}
