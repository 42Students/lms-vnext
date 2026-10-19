import { Checkbox } from "@/components/ui/checkbox";
"use client";
import {useState} from "react";
import {TpoStudentNoteEditor} from "./tpo-student-note-editor";

export function TpoBatchStudentBulkNotes({rows}:{rows:readonly {id:string;label:string}[]}){
 const [selected,setSelected]=useState<string[]>([]);
 const eligible=new Set(rows.map(row=>row.id));
 const valid=selected.filter(id=>eligible.has(id)).slice(0,100);
 if(rows.length===0)return null;
 return <section aria-label="Add a note to batch learners" className="space-y-3 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
  <h3 className="font-semibold">Add a note</h3>
  <p className="text-xs text-body">Select up to 100 learners on this current batch page. Notes remain private to authorized placement staff.</p>
  <label className="flex min-h-10 items-center gap-2 text-sm">
   <Checkbox checked={rows.length<=100&&valid.length===rows.length}
    onChange={e=>setSelected(e.target.checked?rows.slice(0,100).map(row=>row.id):[])}/>
   Select visible page
  </label>
  <div className="max-h-44 space-y-1 overflow-auto">{rows.map(row=>
   <label key={row.id} className="flex min-h-9 items-center gap-2 text-sm">
    <Checkbox checked={valid.includes(row.id)}
     disabled={!valid.includes(row.id)&&valid.length>=100}
     onChange={e=>setSelected(ids=>e.target.checked?[...ids,row.id]:ids.filter(id=>id!==row.id))}/>
    {row.label}
   </label>)}</div>
  <p role="status" className="text-xs">{valid.length} selected</p>
  <TpoStudentNoteEditor membershipIds={valid} afterSave={()=>setSelected([])}/>
 </section>;
}
