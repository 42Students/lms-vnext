"use client";

import {useId,useMemo,useState} from "react";
import {DataTable} from "@/components/ui/data-table";
import {Disclosure} from "@/components/ui/disclosure";
import {EmptyState} from "@/components/ui/empty-state";
import {InlineNotice} from "@/components/ui/inline-notice";
import { Dropdown } from "@/components/ui/dropdown";
import {Button} from "@/components/ui/button";
import {FilterChip} from "@/components/ui/filter-chip";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Checkbox} from "@/components/ui/checkbox";
import {trySaveReportCsv} from "./report-interactive-table-download-model";
import {reportTableCsv,reportTableTsv,type ReportCell} from "./report-interactive-table-export-model";

type Cell=ReportCell;
const stringValue=(value:Cell)=>value===null?"":String(value);
export function ReportInteractiveTable({title,headings,rows,emptyDescription,compactControls=false}:{
 title:string;headings:readonly string[];rows:readonly (readonly Cell[])[];emptyDescription:string;compactControls?:boolean;
}){
 const headingId=useId();
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
    stringValue(left??null).localeCompare(stringValue(right??null),"en-IN",{numeric:true,sensitivity:"base"});
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
 const advancedControls = (<>
    <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Rows shown
     <Select value={limit} onChange={e=>setLimit(Number(e.target.value))}
      className="min-h-11 md:min-h-9">
      {[25,50,100,500,1000].map(n=><option key={n} value={n}>{n}</option>)}
      {![25,50,100,500,1000].includes(limit)?<option value={limit}>{limit}</option>:null}
     </Select>
    </label>
    <Dropdown mobileSheet align="end" label="Report column filters" trigger={"Column filters ("+Object.values(columnFilters).filter(v=>v.trim()).length+")"}>
     <div role="region" aria-label="Report column filters, scroll for more" tabIndex={0} className="max-h-[min(70dvh,480px)] min-h-0 space-y-2 overflow-y-auto overscroll-contain pb-[max(0.5rem,env(safe-area-inset-bottom))] [mask-image:linear-gradient(to_bottom,black_0%,black_90%,transparent_100%)]">
      <Button variant="secondary" type="button" onClick={event=>{
        const disclosure=event.currentTarget.closest("details");
        disclosure?.removeAttribute("open");
        disclosure?.querySelector("summary")?.focus();
      }} size="sm" className="min-h-11 md:min-h-9 print:hidden">
       Close filters
      </Button>
      {headings.map((heading,index)=><label key={index} className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
       {heading}
       <Input type="search" maxLength={100} value={columnFilters[index]??""}
        onChange={event=>{setColumnFilters(current=>({...current,[index]:event.target.value}));setLimit(100);}}
        className="min-h-11 md:min-h-9" />
      </label>)}
     </div>
    </Dropdown>
    <Dropdown mobileSheet align="end" label="Report visible columns" trigger={"Columns ("+(headings.length-hidden.length)+"/"+headings.length+")"}>
     <fieldset aria-label="Report columns, scroll for more" tabIndex={0} className="max-h-[min(70dvh,480px)] min-h-0 space-y-2 overflow-y-auto overscroll-contain pb-[max(0.5rem,env(safe-area-inset-bottom))] [mask-image:linear-gradient(to_bottom,black_0%,black_90%,transparent_100%)]">
      <legend className="sr-only">Choose report columns</legend>
      <Button variant="secondary" type="button" onClick={event=>{
        const disclosure=event.currentTarget.closest("details");
        disclosure?.removeAttribute("open");
        disclosure?.querySelector("summary")?.focus();
      }} size="sm" className="min-h-11 md:min-h-9 print:hidden">
       Close columns
      </Button>
      {headings.map((heading,index)=><label key={index}
       className={"flex min-h-11 items-center gap-2 rounded-lg px-2 py-1 text-xs transition-[background-color] duration-[200ms] ease-[ease] motion-reduce:transition-none "+
        (!hidden.includes(index)&&hidden.length===headings.length-1
          ? "cursor-not-allowed opacity-50" : "hover:bg-primary-subtle active:bg-primary-subtle")}>
       <Checkbox checked={!hidden.includes(index)}
        disabled={!hidden.includes(index)&&hidden.length===headings.length-1}
        onChange={e=>{setHidden(current=>e.target.checked?current.filter(n=>n!==index):[...current,index]);if(!e.target.checked&&sort===index){setSort(null);setDescending(false);}}}/>
       {heading}</label>)}
     </fieldset>
    </Dropdown>
    <Button variant="secondary" type="button" className="min-h-11 md:min-h-9 print:hidden" onClick={()=>void copy()} disabled={showing.length===0} aria-label={"Copy "+showing.length+" shown report rows"} size="sm">Copy shown</Button>
    <Button variant="secondary" type="button" className="min-h-11 md:min-h-9 print:hidden" onClick={saveCsv} disabled={showing.length===0} aria-label={"Export "+showing.length+" shown report rows as CSV"} size="sm">Export shown CSV</Button>
    <Button variant="secondary" type="button" onClick={()=>{setSearch("");setColumnFilters({});setHidden([]);setSort(null);setDescending(false);setLimit(100);setMessage("");}}
     size="sm" className="min-h-11 md:min-h-9 print:hidden">Reset view</Button>
 </>);
 return <section className="space-y-3" aria-labelledby={headingId}>
  <h2 id={headingId} className="font-semibold text-[var(--lms-heading)] text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-7 min-[992px]:text-[20px] min-[992px]:leading-[30px]">{title}</h2>
  {rows.length===0?<EmptyState title="No report rows" description={emptyDescription}/>:<>
   <div data-report-toolbar className="grid min-w-0 grid-cols-1 gap-3 border-b border-border pb-3">
    <label className="grid min-w-0 w-full max-w-xl gap-[6px] text-[var(--lms-font-sm)] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Search table
     <Input type="search" maxLength={100} value={search} onChange={e=>{setSearch(e.target.value);setLimit(100);}}
      className="min-h-11 md:min-h-9" placeholder="Search shown report rows"/>
    </label>
    <Disclosure title="Table tools" defaultOpen={!compactControls && headings.length<=3} className="min-w-0 print:hidden" contentClassName="min-w-0 pt-2">
      <div className="grid min-w-0 grid-cols-1 items-end gap-3 sm:grid-cols-2 xl:grid-cols-4">{advancedControls}</div>
    </Disclosure>
   </div>
   <p role="status" aria-live="polite" className="text-xs text-muted-foreground leading-5">
    {showing.length} shown of {ordered.length} matching rows ({rows.length} total). Sort with a column heading or the mobile sort control.
   </p>
   <div data-report-toolbar className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-end gap-2 min-[768px]:hidden">
    <label className="grid flex-1 gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Sort rows by
     <Select value={sort??""} onChange={event=>{
       setSort(event.target.value===""?null:Number(event.target.value));
       setDescending(false);
     }} className="min-h-11 min-w-0 md:min-h-9">
      <option value="">Original order</option>
      {displayedColumns.map(col=><option key={col.index} value={col.index}>{col.heading}</option>)}
     </Select>
    </label>
    <FilterChip type="button" disabled={sort===null} aria-label="Descending order" aria-pressed={descending}
     onClick={()=>setDescending(value=>!value)} className="min-h-11 md:min-h-9 print:hidden">
     {descending?"Descending":"Ascending"}
    </FilterChip>
   </div>
   <DataTable
    mobileMode="cards"
    caption={title}
    rows={visibleRows}
    getRowKey={row=>String(row.key)}
    empty={<EmptyState title="No matching report rows." description="Clear filters to view other records." action={<Button className="min-h-11 md:min-h-9" variant="secondary" type="button" onClick={()=>{setSearch("");setColumnFilters({});setHidden([]);setSort(null);setDescending(false);setLimit(100);setMessage("");}}>Reset view</Button>}/>} 
    columns={displayedColumns.map((col,position)=>({
      key:String(col.index),
      sortDirection:sort===col.index?(descending?"descending" as const:"ascending" as const):"none" as const,
      mobilePriority:position===0?"primary" as const:"secondary" as const,
      mobileLabel:col.heading,
      header:<><span className="hidden print:inline">{col.heading}</span><Button variant="ghost" type="button"
       onClick={()=>{if(sort===col.index)setDescending(!descending);else{setSort(col.index);setDescending(false);}}}
       aria-pressed={sort===col.index}
       aria-label={"Sort "+col.heading+(sort===col.index?(descending?" descending":" ascending"):"")}
       className={"justify-start text-left underline-offset-4 hover:underline print:hidden "+(sort===col.index?"text-[var(--lms-primary-text)] underline":"text-foreground")}>
       {col.heading} {sort===col.index?(descending?"↓":"↑"):""}
      </Button></>,
      cell:(row:(typeof visibleRows)[number])=>{
        const value=row.cells[col.index];
        return value===null||value===undefined||value===""?"—":value;
      },
    }))}
   />
   {ordered.length>limit?<Button variant="secondary" type="button" onClick={()=>setLimit(n=>Math.min(ordered.length,n+500))}
    size="sm" className="min-h-11 md:min-h-9 print:hidden">Show 500 more</Button>:null}
   {message?<InlineNotice tone={message.startsWith("Could not")?"error":"success"} message={message}/>:null}
  </>}
 </section>;
}
