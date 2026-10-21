"use client";
import {useState,type ReactNode} from "react";
import {Button} from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
/** Legacy Create Job dialog with focus restoration, Escape and draft guard.
 * The authorized server-rendered job editor is reused unchanged. */
export function CollegeDriveCreateDialog({children}:{children:ReactNode}){
 const [open,setOpen]=useState(false),[dirty,setDirty]=useState(false);
 const change=(next:boolean)=>{
  if(!next&&dirty&&!window.confirm("Discard your unsaved job changes?"))return;
  setOpen(next);
  if(!next)setDirty(false);
 };
 return <>
  <Button type="button" className="min-h-11 md:min-h-9" onClick={()=>setOpen(true)}>Create Job</Button>
  <Dialog title="Create Job" open={open} onOpenChange={change}
   className="max-w-[800px]"
   bodyClassName="!min-w-0 !overflow-x-hidden !p-4 md:!p-6">
   <div onInput={()=>setDirty(true)} onChange={()=>setDirty(true)} className="min-w-0">
    {children}
   </div>
  </Dialog>
 </>;
}
