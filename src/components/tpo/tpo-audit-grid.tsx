"use client";
import Link from "next/link";
import {useState} from "react";
import {StatusBadge} from "@/components/ui/status-badge";
import {TPO_AUDIT_KIND_LABELS,formatTpoAuditEventType} from "@/modules/placements/tpo-audit-model";
import type {TpoAuditRow} from "@/modules/placements/tpo-audit-service";
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
    .map(field=>field.replaceAll(/[\r\n\t]/g," ")).join("\t")).join("\n");
  try{await navigator.clipboard.writeText(text);setNotice("Rows copied");}
  catch{setNotice("Could not copy rows. Select the table text instead.");}
 }
 return <section aria-label="Audit history grid" className="min-w-0 space-y-3">
  <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-3">
   <label className="text-sm">What happened
    <input value={what} onChange={event=>setWhat(event.target.value)} type="search"
     maxLength={120} className="mt-1 block min-h-10 rounded border border-border px-2" />
   </label>
   <label className="text-sm">Who
    <input value={who} onChange={event=>setWho(event.target.value)} type="search"
     maxLength={120} className="mt-1 block min-h-10 rounded border border-border px-2" />
   </label>
   <label className="text-sm">When
    <select value={oldestFirst?"oldest":"newest"}
     onChange={e=>setOldestFirst(e.target.value==="oldest")}
     className="mt-1 block min-h-10 rounded border border-border px-2">
     <option value="newest">Newest first</option><option value="oldest">Oldest first</option>
    </select>
   </label>
   <label className="flex min-h-10 items-center gap-2 text-sm">
    <input type="checkbox" checked={showAbout} onChange={e=>setShowAbout(e.target.checked)} />About
   </label>
   <label className="flex min-h-10 items-center gap-2 text-sm">
    <input type="checkbox" checked={showDetail} onChange={e=>setShowDetail(e.target.checked)} />Detail
   </label>
   <button type="button" onClick={()=>void copy()}
    className="min-h-10 rounded border border-border px-3 text-sm text-primary-text">Copy rows</button>
   <button type="button" onClick={()=>{setWho("");setWhat("");setOldestFirst(false);setSelected([]);setShowAbout(true);setShowDetail(true);}}
    className="min-h-10 rounded border border-border px-3 text-sm">Reset grid</button>
  </div>
  <p role="status" className="text-xs text-muted-foreground">Showing {visible.length} of {rows.length} rows on this page. Copy selected rows or, with nothing selected, all visible rows.</p>
  <div className="overflow-x-auto rounded-xl border border-border bg-surface" tabIndex={0}
   onKeyDown={event=>{
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="c" &&
      !(event.target instanceof HTMLInputElement) && !window.getSelection()?.toString()){
     event.preventDefault();void copy();
    }
   }}>
   <table className="w-full min-w-[42rem] text-left text-sm">
    <thead className="bg-muted text-body"><tr>
     <th scope="col" className="px-3 py-3"><input type="checkbox" aria-label="Select all visible rows"
      checked={visible.length>0&&visible.every(row=>selected.includes(row.kind+":"+row.id))}
      onChange={event=>setSelected(event.target.checked?visible.map(row=>row.kind+":"+row.id):[])}/></th>
     <th scope="col" className="px-3 py-3">When</th>
     <th scope="col" className="px-3 py-3">Event</th>
     {showAbout?<th scope="col" className="px-3 py-3">About</th>:null}
     {showDetail?<th scope="col" className="px-3 py-3">Detail</th>:null}
     <th scope="col" className="px-3 py-3">Who</th>
     <th scope="col" className="px-3 py-3">Open</th>
    </tr></thead>
    <tbody>{visible.map(row=><tr key={row.kind+":"+row.id} className="border-t border-border align-top">
     <td className="px-3 py-3"><input type="checkbox" aria-label={"Select "+row.title}
      checked={selected.includes(row.kind+":"+row.id)}
      onChange={e=>setSelected(ids=>e.target.checked?[...ids,row.kind+":"+row.id]:ids.filter(id=>id!==row.kind+":"+row.id))}/></td>
     <td className="whitespace-nowrap px-3 py-3"><time dateTime={row.occurredAt}>{when(row.occurredAt)}</time></td>
     <td className="px-3 py-3"><StatusBadge tone="neutral">{formatTpoAuditEventType(row.eventType)}</StatusBadge></td>
     {showAbout?<td className="px-3 py-3"><span className="text-xs text-muted-foreground">{TPO_AUDIT_KIND_LABELS[row.kind]}</span><p>{row.title}</p></td>:null}
     {showDetail?<td className="px-3 py-3">{row.detail}</td>:null}
     <td className="px-3 py-3">{row.actorName}</td>
     <td className="px-3 py-3">{row.jobId?<Link href={"/tpo/placements/jobs/"+encodeURIComponent(row.jobId)}
      className="font-semibold text-primary-text">Open job →</Link>:"—"}</td>
    </tr>)}</tbody>
   </table>
   {visible.length===0?<p role="status" className="p-4 text-sm">No matching audit records on this page.</p>:null}
  </div>
  {notice?<p role="status" className="text-xs text-muted-foreground">{notice}</p>:null}
 </section>;
}
