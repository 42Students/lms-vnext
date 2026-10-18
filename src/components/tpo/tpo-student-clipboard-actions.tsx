"use client";
import {useState} from "react";
import type {TpoStudentRow} from "@/modules/placements/tpo-students-model";
import {matchTpoStudentRolls,tpoStudentClipboardTsv} from "@/modules/placements/tpo-student-clipboard-model";

export function TpoStudentClipboardActions({rows,selected,onSelect}:{
 rows:readonly TpoStudentRow[];selected:readonly string[];onSelect:(ids:string[])=>void;
}){
 const [open,setOpen]=useState(false),[text,setText]=useState("");
 const [message,setMessage]=useState(""),[missing,setMissing]=useState<string[]>([]);
 async function copy(){
  const matching=rows.filter(row=>!selected.length||selected.includes(row.membershipId));
  try{
   await navigator.clipboard.writeText(tpoStudentClipboardTsv(matching));
   setMessage("Copied "+matching.length+" student(s) to the clipboard as tab-separated rows.");
  }catch{setMessage("Clipboard access is blocked by your browser. Use the roster CSV export instead.");}
 }
 function paste(){
  const result=matchTpoStudentRolls(rows,text);
  onSelect(result.found);
  setMissing(result.missing);
  setMessage("Matched "+result.found.length+" of "+result.requested+" roll number(s) on this page.");
 }
 return <section className="space-y-2 rounded-xl border border-border bg-surface p-4">
  <div className="flex flex-wrap items-center gap-2">
   <button type="button" onClick={()=>void copy()} className="min-h-10 rounded border border-border px-3 text-sm font-semibold text-primary-text">
    Copy {selected.length?"selected":"visible"} rows
   </button>
   <button type="button" aria-expanded={open} onClick={()=>setOpen(v=>!v)}
    className="min-h-10 rounded border border-border px-3 text-sm font-semibold text-primary-text">
    Paste roll numbers
   </button>
  </div>
  {open?<div className="space-y-2">
   <label className="grid gap-2 text-sm font-semibold">Roll numbers (one per line, space or comma separated)
    <textarea rows={3} maxLength={15000} value={text} onChange={e=>setText(e.target.value)}
     className="rounded border border-border bg-surface p-3"/></label>
   <button type="button" disabled={!text.trim()} onClick={paste}
    className="min-h-10 rounded-[9px] bg-primary px-4 text-sm font-[650] text-on-primary disabled:opacity-50">
    Select matching students on this page
   </button>
   {missing.length?<p role="alert" className="text-sm text-warning">Not on this page: {missing.slice(0,30).join(", ")}{missing.length>30?" and "+(missing.length-30)+" more":""}.</p>:null}
  </div>:null}
  {message?<p role="status" className="text-xs text-muted-foreground">{message}</p>:null}
 </section>;
}
