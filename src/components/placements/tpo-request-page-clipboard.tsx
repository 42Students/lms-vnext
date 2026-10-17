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
  <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={rows.length>0&&selectedRows.length===rows.length}
   onChange={event=>setSelected(event.target.checked?rows.map(row=>row.id):[])}/>Select visible page</label>
  <div className="grid max-h-44 gap-1 overflow-y-auto sm:grid-cols-2">
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
