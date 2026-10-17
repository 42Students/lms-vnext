"use client";

import {useMemo,useState} from "react";

type Cell=string|number|null;
const stringValue=(value:Cell)=>value===null?"":String(value);
function safeCsvCell(value:Cell){
 let text=stringValue(value);
 if(/^[\s]*[=+\-@\t\r]/.test(text))text="'"+text;
 return '"'+text.replaceAll('"','""')+'"';
}
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
 const exportRows=[displayedColumns.map(row=>row.heading),...showing.map(row=>displayedColumns.map(col=>row[col.index]??null))];
 const textRows=exportRows.map(row=>row.map(safeCsvCell).join(",")).join("\r\n")+"\r\n";
 async function copy(){
  try{
   const lines=exportRows.map(row=>row.map(value=>stringValue(value)).join("\t")).join("\n");
   await navigator.clipboard.writeText(lines);
   setMessage("Copied "+showing.length+" shown rows.");
  }catch{setMessage("Could not copy rows. Use CSV export instead.");}
 }
 function saveCsv(){
  const blob=new Blob(["\uFEFF"+textRows],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");link.href=url;
  link.download="report-"+title.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")+".csv";
  link.click();URL.revokeObjectURL(url);setMessage("Exported "+showing.length+" shown rows.");
 }
 return <section className="space-y-3" aria-label={title}>
  <h2 className="text-lg font-semibold text-foreground">{title}</h2>
  {rows.length===0?<p role="status" className="rounded-xl border border-border p-4 text-sm">{emptyDescription}</p>:<>
   <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-3">
    <label className="grid min-w-48 flex-1 gap-1 text-xs font-semibold">Search table
     <input type="search" value={search} onChange={e=>{setSearch(e.target.value);setLimit(100);}}
      className="min-h-10 rounded-md border border-border px-3 text-sm" placeholder="Search shown report rows"/>
    </label>
    <label className="grid gap-1 text-xs font-semibold">Rows shown
     <select value={limit} onChange={e=>setLimit(Number(e.target.value))}
      className="min-h-10 rounded-md border border-border px-3 text-sm">
      {[25,50,100,500,1000].map(n=><option key={n} value={n}>{n}</option>)}
     </select>
    </label>
    <details className="relative self-end rounded-md border border-border p-2 text-sm">
     <summary className="cursor-pointer">Columns</summary>
     <fieldset className="absolute right-0 top-full z-10 mt-2 max-h-72 min-w-48 space-y-2 overflow-y-auto rounded-md border border-border bg-surface p-3 shadow-lg">
      <legend className="sr-only">Choose report columns</legend>
      {headings.map((heading,index)=><label key={index} className="flex items-center gap-2 text-xs">
       <input type="checkbox" checked={!hidden.includes(index)}
        disabled={!hidden.includes(index)&&hidden.length===headings.length-1}
        onChange={e=>setHidden(current=>e.target.checked?current.filter(n=>n!==index):[...current,index])}/>
       {heading}</label>)}
     </fieldset>
    </details>
    <button type="button" onClick={()=>void copy()} className="min-h-10 rounded border border-border px-3 text-xs font-semibold">Copy shown</button>
    <button type="button" onClick={saveCsv} className="min-h-10 rounded border border-border px-3 text-xs font-semibold">Export shown CSV</button>
    <button type="button" onClick={()=>{setSearch("");setColumnFilters({});setHidden([]);setSort(null);setDescending(false);setLimit(100);}}
     className="min-h-10 rounded border border-border px-3 text-xs font-semibold">Reset view</button>
   </div>
   <p role="status" className="text-xs text-muted-foreground">
    {showing.length} shown of {ordered.length} matching rows ({rows.length} total). Click a column heading to sort.
   </p>
   <div className="overflow-x-auto rounded-xl border border-border bg-surface">
    <table className="w-full min-w-max border-collapse text-left text-sm">
     <thead className="bg-surface-subtle"><tr>{displayedColumns.map(col=><th key={col.index} scope="col"
      className="border-b border-border px-4 py-3 font-semibold">
      <button type="button" onClick={()=>{if(sort===col.index)setDescending(!descending);else{setSort(col.index);setDescending(false);}}}
       aria-sort={sort===col.index?(descending?"descending":"ascending"):"none"}
       className="min-h-10 text-left text-foreground underline-offset-4 hover:underline">{col.heading} {sort===col.index?(descending?"↓":"↑"):""}</button>
     </th>)}</tr></thead>
     <tbody>{showing.map((row,rowIndex)=><tr key={rowIndex} className="border-b border-border last:border-0">
      {displayedColumns.map(col=><td key={col.index} className="px-4 py-3 text-body">
       {row[col.index]===null||row[col.index]===""?"—":row[col.index]}
      </td>)}</tr>)}</tbody>
    </table>
   </div>
   {ordered.length>limit?<button type="button" onClick={()=>setLimit(n=>n+500)}
    className="min-h-10 rounded border border-border px-3 text-sm font-semibold">Show 500 more</button>:null}
   {message?<p role="status" className="text-xs">{message}</p>:null}
  </>}
 </section>;
}
