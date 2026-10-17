"use client";
import {useState} from "react";
type Preview={title:string;course:string;lesson:string;type:string;status:string;scope:string;visible:boolean;details:string};
export function CollegeContentPreview({data}:{data:Preview}){
 const [open,setOpen]=useState(false);
 return <>
  <button type="button" onClick={()=>setOpen(true)}
   className="min-h-10 rounded border border-border px-3 text-xs font-semibold text-primary-text">Preview</button>
  {open?<div role="dialog" aria-modal="true" aria-label="Content preview"
   className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
   <section className="max-h-[85dvh] w-full max-w-lg space-y-3 overflow-y-auto rounded-xl bg-background p-5">
    <h2 className="break-words text-lg font-semibold">{data.title}</h2>
    <dl className="space-y-1 text-sm text-body">
     <div>Course: {data.course}</div><div>Lesson: {data.lesson}</div>
     <div>Content type: {data.type}</div><div>Status: {data.status}</div>
     <div>Audience: {data.scope}</div>
     <div>Students: {data.visible?"Visible when published":"Hidden"}</div>
     <div>Details: {data.details}</div>
    </dl>
    <p className="text-xs text-muted-foreground">Scoped metadata preview only. Private files, meeting links and signed playback addresses are not exposed here.</p>
    <button type="button" onClick={()=>setOpen(false)}
     className="min-h-10 rounded border border-border px-4 text-sm font-semibold">Close preview</button>
   </section>
  </div>:null}
 </>;
}
