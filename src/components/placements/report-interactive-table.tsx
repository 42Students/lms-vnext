"use client";

import {useMemo,useState} from "react";
import {DataTable} from "@/components/ui/data-table";
import {trySaveReportCsv} from "./report-interactive-table-download-model";
import {reportTableCsv,reportTableTsv,safeReportDownloadName,type ReportCell} from "./report-interactive-table-export-model";

type Cell=ReportCell;
const stringValue=(value:Cell)=>value===null?"":String(value);
export function ReportInteractiveTable({title,headings,rows,emptyDescription}:{
 title:string;headings:readonly string[];rows:readonly (readonly Cell[])[];emptyDescription:string;
}){
 const [search,setSearch]=useState("");
 const [sort,setSort]=useState<number|null>(null);
 const [columnFilters,setColumnFilters]=useState<Record<number,string>>({});
 const [descending,setDescending]=useState(false);
 const [hidden,setHidden]=useState<number[]>([]);
 const [message,setMessage]=useState("");
 const [limit,setLimit]=useState(100);
 const displayedColumns=headings.map((heading,index)=>({heading,index})).filter(row=>!hidden.includes(row.index));
 const ordered=useMemo(()=>{
  const q=search.trim().toLocaleLowerCase("en-IN");
  const matched=rows.filter(row=>(!q||row.some(value=>stringValue(value).toLocaleLowerCase("en-IN").includes(q)))&&
   Object.entries(columnFilters).every(([index,term])=>!term.trim()||stringValue(row[Number(index)]??null)
    .toLocaleLowerCase("en-IN").includes(term.trim().toLocaleLowerCase("en-IN"))));
  if(sort!==null)matched.sort((a,b)=>{
   const left=a[sort],right=b[sort];
   const comp=typeof left==="number"&&typeof right==="number"?left-right:
    stringValue(left).localeCompare(stringValue(right),"en-IN",{numeric:true,sensitivity:"base"});
   return descending?-comp:comp;
  });
  return matched;
 },[rows,search,sort,descending,columnFilters]);
 const showing=ordered.slice(0,limit);
 const exportHeaders=displayedColumns.map(row=>row.heading);
 const exportRows=showing.map(row=>displayedColumns.map(col=>row[col.index]??null));
 const textRows=reportTableCsv(exportHeaders,exportRows);
 const visibleRows=showing.map((cells,index)=>({key:index,cells}));
 async function copy(){
  try{
   const lines=reportTableTsv(exportHeaders,exportRows);
   await navigator.clipboard.writeText(lines);
   setMessage("Copied "+showing.length+" shown rows.");
  }catch{setMessage("Could not copy rows. Use CSV export instead.");}
 }
 function saveCsv(){
  const saved=trySaveReportCsv(textRows,title,{
   createUrl:text=>URL.createObjectURL(new Blob([text],{type:"text/csv;charset=utf-8"})),
   createAnchor:()=>document.createElement("a"),
   appendAnchor:anchor=>{document.body.appendChild(anchor as HTMLAnchorElement);},
   defer:task=>{window.setTimeout(task,0);},
   revokeUrl:url=>URL.revokeObjectURL(url),
  });
  setMessage(saved
   ?"Started CSV download for "+showing.length+" shown rows."
   :"Could not export shown rows. Try copying the report or refresh and try again.");
 }
 return <section className="space-y-3" aria-label={title}>
  <h2 className="text-lg font-semibold text-foreground">{title}</h2>
  {rows.length===0?<p role="status" className="rounded-xl border border-border p-4 text-sm">{emptyDescription}</p>:<>
   <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-3">
    <label className="grid min-w-48 flex-1 gap-1 text-xs font-semibold">Search table
     <input type="search" value={search} onChange={e=>{setSearch(e.target.value);setLimit(100);}}
      className="min-h-11 rounded-md border border-border px-3 text-sm" placeholder="Search shown report rows"/>
    </label>
    <label className="grid gap-1 text-xs font-semibold">Rows shown
     <select value={limit} onChange={e=>setLimit(Number(e.target.value))}
      className="min-h-11 rounded-md border border-border px-3 text-sm">
      {[25,50,100,500,1000].map(n=><option key={n} value={n}>{n}</option>)}
     </select>
    </label>
    <details className="relative self-end rounded-md border border-border p-2 text-sm">
     <summary className="inline-flex min-h-11 cursor-pointer items-center rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">Column filters ({Object.values(columnFilters).filter(v=>v.trim()).length})</summary>
     <div role="region" aria-label="Report column filters, scroll for more" tabIndex={0} className="fixed inset-x-0 bottom-0 z-30 max-h-[70dvh] min-h-0 space-y-2 overflow-y-auto overscroll-contain [mask-image:linear-gradient(to_bottom,black_0%,black_88%,transparent_100%)] rounded-t-xl border border-border bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lg sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-full sm:mt-2 sm:max-h-72 sm:w-72 sm:rounded-md sm:p-3">
      <button type="button" onClick={event=>{
        const disclosure=event.currentTarget.closest("details");
        disclosure?.removeAttribute("open");
        disclosure?.querySelector("summary")?.focus();
      }} className="min-h-11 rounded border border-border px-3 text-sm font-semibold sm:hidden">
       Close filters
      </button>
      {displayedColumns.map(col=><label key={col.index} className="grid gap-1 text-xs font-semibold">
       {col.heading}
       <input type="search" maxLength={100} value={columnFilters[col.index]??""}
        onChange={event=>{setColumnFilters(current=>({...current,[col.index]:event.target.value}));setLimit(100);}}
        className="min-h-9 rounded border border-border bg-background px-2 text-sm"/>
      </label>)}
     </div>
    </details>
    <details className="relative self-end rounded-md border border-border p-2 text-sm">
     <summary className="inline-flex min-h-11 cursor-pointer items-center rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">Columns</summary>
     <fieldset aria-label="Report columns, scroll for more" tabIndex={0} className="fixed inset-x-0 bottom-0 z-30 max-h-[70dvh] min-h-0 space-y-2 overflow-y-auto overscroll-contain [mask-image:linear-gradient(to_bottom,black_0%,black_88%,transparent_100%)] rounded-t-xl border border-border bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lg sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-full sm:mt-2 sm:max-h-72 sm:w-72 sm:rounded-md sm:p-3">
      <legend className="sr-only">Choose report columns</legend>
      <button type="button" onClick={event=>{
        const disclosure=event.currentTarget.closest("details");
        disclosure?.removeAttribute("open");
        disclosure?.querySelector("summary")?.focus();
      }} className="min-h-11 rounded border border-border px-3 text-sm font-semibold sm:hidden">
       Close columns
      </button>
      {headings.map((heading,index)=><label key={index} className="flex items-center gap-2 text-xs">
       <input type="checkbox" checked={!hidden.includes(index)}
        disabled={!hidden.includes(index)&&hidden.length===headings.length-1}
        onChange={e=>setHidden(current=>e.target.checked?current.filter(n=>n!==index):[...current,index])}/>
       {heading}</label>)}
     </fieldset>
    </details>
    <button type="button" onClick={()=>void copy()} className="min-h-11 rounded border border-border px-3 text-xs font-semibold">Copy shown</button>
    <button type="button" onClick={saveCsv} className="min-h-11 rounded border border-border px-3 text-xs font-semibold">Export shown CSV</button>
    <button type="button" onClick={()=>{setSearch("");setColumnFilters({});setHidden([]);setSort(null);setDescending(false);setLimit(100);}}
     className="min-h-11 rounded border border-border px-3 text-xs font-semibold">Reset view</button>
   </div>
   <p role="status" className="text-xs text-muted-foreground">
    {showing.length} shown of {ordered.length} matching rows ({rows.length} total). Click a column heading to sort.
   </p>
   <div className="flex flex-wrap items-center gap-2 sm:hidden">
    <label className="grid flex-1 gap-1 text-sm font-semibold text-body">Sort rows by
     <select value={sort??""} onChange={event=>{
       setSort(event.target.value===""?null:Number(event.target.value));
       setDescending(false);
     }} className="min-h-11 min-w-0 rounded-md border border-border bg-surface px-3">
      <option value="">Original order</option>
      {displayedColumns.map(col=><option key={col.index} value={col.index}>{col.heading}</option>)}
     </select>
    </label>
    <button type="button" disabled={sort===null} aria-label="Reverse sort direction"
     onClick={()=>setDescending(value=>!value)} className="min-h-11 rounded-md border border-border px-3 text-sm font-semibold disabled:opacity-50">
     {descending?"Descending":"Ascending"}
    </button>
   </div>
   <DataTable
    caption={title}
    rows={visibleRows}
    getRowKey={row=>String(row.key)}
    empty={<p role="status" className="text-sm text-body">No matching report rows. Clear filters to view other records.</p>}
    columns={displayedColumns.map((col,position)=>({
      key:String(col.index),
      mobilePriority:position===0?"primary" as const:"secondary" as const,
      mobileLabel:col.heading,
      header:<button type="button"
       onClick={()=>{if(sort===col.index)setDescending(!descending);else{setSort(col.index);setDescending(false);}}}
       aria-pressed={sort===col.index}
       aria-label={"Sort "+col.heading+(sort===col.index?(descending?" descending":" ascending"):"")}
       className="min-h-11 text-left text-foreground underline-offset-4 hover:underline">
       {col.heading} {sort===col.index?(descending?"↓":"↑"):""}
      </button>,
      cell:(row:(typeof visibleRows)[number])=>{
        const value=row.cells[col.index];
        return value===null||value===undefined||value===""?"—":value;
      },
    }))}
   />
   {ordered.length>limit?<button type="button" onClick={()=>setLimit(n=>n+500)}
    className="min-h-11 rounded border border-border px-3 text-sm font-semibold">Show 500 more</button>:null}
   {message?<p role="status" className="text-xs">{message}</p>:null}
  </>}
 </section>;
}
