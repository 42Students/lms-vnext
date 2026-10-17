"use client";
import {useState} from "react";
export type TpoRequestClipboardRow={id:string;student:string;number:string|null;
 kind:string;company:string;asked:string;status:string;decided:string|null};
export function requestRowsTsv(rows:readonly TpoRequestClipboardRow[]):string{
 const neutral=(v:string|null)=>{const value=(v??"").replace(/[\t\r\n]+/g," ").trim();
  return /^[=+@-]/.test(value)?"'"+value:value;};
 return [["Student","Student number","Request","Company","Asked","Status","Decided"],...rows.map(row=>
  [row.student,row.number,row.kind,row.company,row.asked,row.status,row.decided])]
 .map(cells=>cells.map(neutral).join("\t")).join("\n");
}
export function TpoRequestPageClipboard({rows}:{rows:readonly TpoRequestClipboardRow[]}){
 const [selected,setSelected]=useState<string[]>([]);
 const [notice,setNotice]=useState("");
 const [sort,setSort]=useState<"ASKED_NEW"|"ASKED_OLD"|"DECIDED_NEW"|"DECIDED_OLD">("ASKED_NEW");
 const [visible,setVisible]=useState<readonly string[]>(["student","number","kind","company","asked","status","decided"]);
 const options=[{key:"student",label:"Student"},{key:"number",label:"Student number"},
  {key:"kind",label:"Request"},{key:"company",label:"Company"},{key:"asked",label:"Asked"},
  {key:"status",label:"Status"},{key:"decided",label:"Decided on"}] as const;
 const columns=options.filter(x=>visible.includes(x.key));
 const sorted=[...rows].sort((a,b)=>{
  const key=sort.startsWith("ASKED")?"asked":"decided";
  const left=a[key],right=b[key];
  if(left===null&&right!==null)return 1;
  if(right===null&&left!==null)return -1;
  const direction=sort.endsWith("OLD")?1:-1;
  return direction*(left??"").localeCompare(right??"")||a.id.localeCompare(b.id);
 });
 const selectedRows=rows.filter(row=>selected.includes(row.id));
 async function copy(){
  try{
   await navigator.clipboard.writeText(requestRowsTsv(selectedRows));
   setNotice("Copied "+selectedRows.length+" selected requests.");
  }catch{setNotice("Could not copy. Check your browser clipboard permissions.");}
 }
 return <section aria-label="Request row tools" className="space-y-2 rounded-lg border border-border p-3">
  <p className="text-sm font-semibold">Select and copy request rows</p>
  <p role="status" aria-live="polite" className="text-xs">{selectedRows.length} selected of {rows.length} on this page.</p>
  <div className="flex flex-wrap gap-3">
   <label className="text-sm">Sort request rows
    <select className="ml-2 min-h-10 rounded border border-border p-2" value={sort}
     onChange={e=>setSort(e.target.value as typeof sort)}>
     <option value="ASKED_NEW">Asked · newest</option><option value="ASKED_OLD">Asked · oldest</option>
     <option value="DECIDED_NEW">Decided on · newest</option><option value="DECIDED_OLD">Decided on · oldest</option>
    </select>
   </label>
   <details className="rounded border border-border p-2 text-sm">
    <summary className="cursor-pointer font-semibold">Choose columns</summary>
    <div className="mt-2 flex flex-wrap gap-3">{options.map(option=><label key={option.key} className="flex items-center gap-1">
      <input type="checkbox" checked={visible.includes(option.key)}
       disabled={visible.length===1&&visible.includes(option.key)}
       onChange={e=>setVisible(keys=>e.target.checked?[...keys,option.key]:keys.filter(key=>key!==option.key))}/>
      {option.label}
    </label>)}</div>
    <button type="button" className="mt-2 rounded border px-2 py-1" onClick={()=>setVisible(options.map(option=>option.key))}>Reset columns</button>
   </details>
  </div>
  <div className="hidden max-h-[540px] overflow-auto rounded border border-border md:block" role="region" aria-label="Request spreadsheet">
   <table className="w-full text-left text-sm">
    <thead className="sticky top-0 z-10 bg-surface"><tr>
     <th className="sticky left-0 z-20 bg-surface px-3 py-2"><input type="checkbox" aria-label="Select all request rows" checked={rows.length>0&&selectedRows.length===rows.length}
      onChange={e=>setSelected(e.target.checked?rows.map(row=>row.id):[])}/></th>
     {columns.map((column,index)=><th key={column.key} className={"px-3 py-2 "+(index===0?"sticky left-10 z-10 bg-surface":"")}>
      {column.label}
     </th>)}
    </tr></thead>
    <tbody>{sorted.map(row=><tr key={row.id} className="border-t border-border">
     <td className="sticky left-0 z-10 bg-surface px-3 py-2"><input type="checkbox" checked={selected.includes(row.id)}
      aria-label={"Select request from "+row.student} onChange={e=>setSelected(ids=>e.target.checked?[...new Set([...ids,row.id])]:ids.filter(id=>id!==row.id))}/></td>
     {columns.map((column,index)=><td key={column.key} className={"max-w-72 break-words px-3 py-2 "+(index===0?"sticky left-10 bg-surface":"")}>
      {row[column.key]??"—"}
     </td>)}
    </tr>)}</tbody>
   </table>
  </div>
  <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={rows.length>0&&selectedRows.length===rows.length}
   onChange={event=>setSelected(event.target.checked?rows.map(row=>row.id):[])}/>Select visible page</label>
  <div className="grid max-h-44 gap-1 overflow-y-auto sm:grid-cols-2 md:hidden">
   {rows.map(row=><label key={row.id} className="flex min-h-10 items-center gap-2 text-sm">
    <input type="checkbox" checked={selected.includes(row.id)}
     onChange={event=>setSelected(old=>event.target.checked?[...old,row.id]:old.filter(id=>id!==row.id))}/>
    <span className="min-w-0 truncate" title={row.student}>{row.student} · {row.company}</span>
   </label>)}
  </div>
  <button type="button" disabled={selectedRows.length===0} onClick={()=>void copy()}
   className="min-h-11 rounded border border-border px-4 text-sm font-semibold disabled:opacity-50">Copy selected rows</button>
  {notice?<p role="status" className="text-sm">{notice}</p>:null}
 </section>;
}
