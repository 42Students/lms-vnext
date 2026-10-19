"use client";
import {useEffect,useRef,useState} from "react";
import {Button} from "@/components/ui/button";

/** TPO-inbox-team-52 / GR-35: named confirmation without a browser-native prompt. */
export function TpoNoticeDeleteConfirm({id,version}:{id:string;version:number}){
 const [open,setOpen]=useState(false);
 const pending=useRef(false);
 const confirmButton=useRef<HTMLButtonElement>(null);
 const trigger=useRef<HTMLButtonElement>(null);
 useEffect(()=>{
  if(!open)return;
  confirmButton.current?.focus();
 },[open]);
 function dismiss(){setOpen(false);trigger.current?.focus();}
 return <div className="mt-4">
  <Button ref={trigger} variant="secondary" type="button" onClick={()=>setOpen(true)}>
   Delete
  </Button>
  {open?<div role="presentation" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
   <section role="alertdialog" aria-modal="true" aria-labelledby={"delete-title-"+id}
    aria-describedby={"delete-desc-"+id}
    onKeyDown={event=>{if(event.key==="Escape")dismiss();}}
    className="w-full max-w-md rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-6 shadow-[var(--lms-popover-shadow,0_12px_32px_rgba(25,35,55,.12))]">
    <h2 id={"delete-title-"+id} className="font-semibold text-foreground">Delete this announcement?</h2>
    <p id={"delete-desc-"+id} className="mt-3 text-sm text-body">
     Students stop seeing it, and its notices are taken back.
    </p>
    <form method="post" action={"/api/placements/tpo/announcements/"+encodeURIComponent(id)+"/lifecycle"}
     className="mt-5 flex flex-wrap gap-3"
     onSubmit={event=>{if(pending.current)event.preventDefault();else pending.current=true;}}>
     <input type="hidden" name="expectedVersion" value={version}/>
     <input type="hidden" name="action" value="DELETE"/>
     <button ref={confirmButton} type="submit"
      className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-[650] text-on-primary">
      Delete announcement
     </button>
     <button type="button" onClick={dismiss}
      className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-foreground">
      Cancel
     </button>
    </form>
   </section>
  </div>:null}
 </div>;
}
