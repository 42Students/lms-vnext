"use client";

import {useMemo,useState} from "react";
import {DataTable} from "@/components/ui/data-table";
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
  {rows.length===0?<p role="status" className="border-y border-border py-4 text-sm">{emptyDescription}</p>:<>
   <div data-report-toolbar className="flex flex-wrap items-end gap-3 border-b border-border pb-4">
    <label className="grid min-w-48 flex-1 gap-1 text-[var(--lms-font-sm)] font-semibold">Search table
     <Input type="search" maxLength={100} value={search} onChange={e=>{setSearch(e.target.value);setLimit(100);}}
      className="min-h-11 md:min-h-9" placeholder="Search shown report rows"/>
    </label>
    <label className="grid gap-1 text-[var(--lms-font-sm)] font-semibold">Rows shown
     <Select value={limit} onChange={e=>setLimit(Number(e.target.value))}
      className="min-h-11 md:min-h-9">
      {[25,50,100,500,1000].map(n=><option key={n} value={n}>{n}</option>)}
      {![25,50,100,500,1000].includes(limit)?<option value={limit}>{limit}</option>:null}
     </Select>
    </label>
    <Dropdown mobileSheet align="end" label="Report column filters" trigger={"Column filters ("+Object.values(columnFilters).filter(v=>v.trim()).length+")"}>
     <div role="region" aria-label="Report column filters, scroll for more" tabIndex={0} className="min-h-0 space-y-2">
      <Button variant="secondary" type="button" onClick={event=>{
        const disclosure=event.currentTarget.closest("details");
        disclosure?.removeAttribute("open");
        disclosure?.querySelector("summary")?.focus();
      }} size="sm" className="min-h-11 md:min-h-9 print:hidden">
       Close filters
      </Button>
      {headings.map((heading,index)=><label key={index} className="grid gap-1 text-[var(--lms-font-sm)] font-semibold">
       {heading}
       <Input type="search" maxLength={100} value={columnFilters[index]??""}
        onChange={event=>{setColumnFilters(current=>({...current,[index]:event.target.value}));setLimit(100);}}
        className="min-h-11 md:min-h-9" />
      </label>)}
     </div>
    </Dropdown>
    <Dropdown mobileSheet align="end" label="Report visible columns" trigger={"Columns ("+(headings.length-hidden.length)+"/"+headings.length+")"}>
     <fieldset aria-label="Report columns, scroll for more" tabIndex={0} className="min-h-0 space-y-2">
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
   </div>
   <p role="status" aria-live="polite" className="text-xs text-muted-foreground">
    {showing.length} shown of {ordered.length} matching rows ({rows.length} total). Sort with a column heading or the mobile sort control.
   </p>
   <div data-report-toolbar className="flex flex-wrap items-center gap-2 min-[768px]:hidden">
    <label className="grid flex-1 gap-1 text-sm font-semibold text-body">Sort rows by
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
    caption={title}
    rows={visibleRows}
    getRowKey={row=>String(row.key)}
    empty={<p role="status" className="text-sm text-body">No matching report rows. Clear filters to view other records.</p>}
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
   {message?<p role="status" aria-live="polite" className="text-xs text-body">{message}</p>:null}
  </>}
 </section>;
}
