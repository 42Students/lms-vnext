"use client";
import {useState,type KeyboardEvent} from "react";
import {tpoBatchShortcut,tpoBatchVisibleSelection,tpoBatchSelectedClipboard}
 from "@/modules/placements/tpo-batch-keyboard-actions-model";
type Row={id:string;name:string;rollNumber?:string|null};
export function TpoBatchStudentKeyboardActions({rows,downloadHref}:{rows:readonly Row[];downloadHref:string}){
 const [selected,setSelected]=useState<string[]>([]);
 const [expanded,setExpanded]=useState(false);
 const [message,setMessage]=useState("");
 const valid=tpoBatchVisibleSelection(rows,selected);
 function selectVisible(){setSelected(rows.slice(0,25).map(row=>row.id));setMessage("");}
 async function copy(){
  const contents=tpoBatchSelectedClipboard(rows,valid);
  if(!contents){setMessage("Select at least one visible learner first.");return;}
  try{
   await navigator.clipboard.writeText(contents);
   setMessage(valid.length+" selected learner rows copied.");
  }catch{setMessage("Could not copy. Check clipboard permission and try again.");}
 }
 function keydown(event:KeyboardEvent<HTMLElement>){
  const target=event.target;
  const insideEditable=target instanceof HTMLElement &&
   Boolean(target.closest("input,textarea,select,[contenteditable=true]"));
  const command=tpoBatchShortcut({key:event.key,ctrlKey:event.ctrlKey,
   metaKey:event.metaKey,altKey:event.altKey,shiftKey:event.shiftKey,insideEditable});
  if(command===null)return;
  if(command==="COPY_SELECTED"&&!valid.length)return;
  event.preventDefault();
  if(command==="SELECT_VISIBLE")selectVisible();
  else void copy();
 }
 return <section tabIndex={0} onKeyDown={keydown}
  aria-label="Batch student keyboard and mobile actions"
  className="space-y-2 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-3">
  <div className="flex flex-wrap items-center justify-between gap-2">
   <strong className="text-sm">Student actions · {valid.length} selected on this page</strong>
   <button type="button" aria-expanded={expanded} onClick={()=>setExpanded(v=>!v)}
    className="min-h-11 rounded-[var(--lms-control-radius)] border border-border px-3 text-sm md:hidden">Actions</button>
  </div>
  <p className="text-xs text-body">Focus this area: Ctrl/Cmd+A selects visible rows, Ctrl/Cmd+C copies selected names and roll numbers. Shortcuts never intercept an input field.</p>
  <div className={expanded?"flex flex-wrap gap-2":"hidden flex-wrap gap-2 md:flex"}>
   <button type="button" onClick={selectVisible} className="min-h-9 rounded-[var(--lms-control-radius)] border border-border px-3 text-sm">Select visible</button>
   <button type="button" onClick={()=>{setSelected([]);setMessage("");}}
    className="min-h-9 rounded-[var(--lms-control-radius)] border border-border px-3 text-sm">Clear selection</button>
   <button type="button" disabled={!valid.length} onClick={()=>void copy()}
    className="min-h-9 rounded-[var(--lms-control-radius)] border border-border px-3 text-sm">Copy selected</button>
   <a href={downloadHref} className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm">Export filtered page CSV</a>
  </div>
  <label className="flex min-h-10 items-center gap-2 text-sm">
   <input type="checkbox" checked={rows.length>0&&valid.length===rows.length}
    onChange={event=>event.target.checked?selectVisible():setSelected([])}/>
   Select all learners on this page
  </label>
  <div className="grid max-h-44 gap-1 overflow-y-auto sm:grid-cols-2" aria-label="Visible batch learners">
   {rows.map(row=><label key={row.id} className="flex min-h-9 items-center gap-2 text-sm">
    <input type="checkbox" checked={valid.includes(row.id)}
     onChange={event=>setSelected(ids=>event.target.checked?
      tpoBatchVisibleSelection(rows,[...ids,row.id]):ids.filter(id=>id!==row.id))}/>
    {row.name}{row.rollNumber?" · "+row.rollNumber:""}
   </label>)}
  </div>
  {message?<p role="status" className="text-xs">{message}</p>:null}
 </section>;
}
