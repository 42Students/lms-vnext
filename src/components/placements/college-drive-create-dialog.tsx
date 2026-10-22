"use client";
import {useState,type ReactNode} from "react";
import {Button} from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
/** Legacy Create Job dialog with focus restoration, Escape and draft guard.
 * The authorized server-rendered job editor is reused unchanged. */
export function CollegeDriveCreateDialog({children}:{children:ReactNode}){
 const [open,setOpen]=useState(false),[dirty,setDirty]=useState(false);
 const [confirmDiscard,setConfirmDiscard]=useState(false);
 const change=(next:boolean)=>{
  if(!next&&dirty){setConfirmDiscard(true);return;}
  setOpen(next);
  if(!next){setDirty(false);setConfirmDiscard(false);}
 };
 return <>
  <Button type="button" className="min-h-11 md:min-h-9" onClick={()=>setOpen(true)}>
    <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" d="M12 5v14M5 12h14"/>
    </svg>
    Create Job
  </Button>
  <Dialog title="Create Job" open={open} onOpenChange={change}
   className="max-w-[800px]"
   bodyClassName="!min-w-0 !overflow-x-hidden !p-4 md:!p-6">
   <div onInput={()=>setDirty(true)} onChange={()=>setDirty(true)} className="min-w-0">
    {children}
   </div>
  </Dialog>
  <Dialog open={confirmDiscard} onOpenChange={setConfirmDiscard}
    role="alertdialog" title="Discard unsaved changes?"
    description="Discard your unsaved job changes?"
    footer={<>
      <Button type="button" variant="secondary" onClick={()=>setConfirmDiscard(false)}>Keep editing</Button>
      <Button type="button" variant="danger" onClick={()=>{setConfirmDiscard(false);setDirty(false);setOpen(false);}}>Discard changes</Button>
    </>}>
    <p className="text-sm text-[var(--lms-body-text)]">Your unsaved job changes will be lost.</p>
  </Dialog>
 </>;
}
