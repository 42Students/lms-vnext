"use client";
import {Textarea} from "@/components/ui/textarea";
import {Button} from "@/components/ui/button";
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
 return <section className="space-y-2 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
  <div className="flex flex-wrap items-center gap-2">
   <Button variant="secondary" type="button" onClick={()=>void copy()} >
    Copy {selected.length?"selected":"visible"} rows
   </Button>
   <Button variant="secondary" type="button" aria-expanded={open} onClick={()=>setOpen(v=>!v)}
    >
    Paste roll numbers
   </Button>
  </div>
  {open?<div className="space-y-2">
   <label className="grid gap-2 text-sm font-semibold">Roll numbers (one per line, space or comma separated)
    <Textarea rows={3} maxLength={15000} value={text} onChange={e=>setText(e.target.value)}
     /></label>
   <Button variant="primary" type="button" disabled={!text.trim()} onClick={paste}
    >
    Select matching students on this page
   </Button>
   {missing.length?<p role="alert" className="text-sm text-warning">Not on this page: {missing.slice(0,30).join(", ")}{missing.length>30?" and "+(missing.length-30)+" more":""}.</p>:null}
  </div>:null}
  {message?<p role="status" className="text-xs text-muted-foreground">{message}</p>:null}
 </section>;
}
