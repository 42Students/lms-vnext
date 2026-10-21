"use client";
import {useEffect,useRef,useState} from "react";
import {Button} from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";

/** TPO-inbox-team-52 / GR-35: named confirmation without a browser-native prompt. */
export function TpoNoticeDeleteConfirm({id,version}:{id:string;version:number}){
 const [open,setOpen]=useState(false);
 const [submitting,setSubmitting]=useState(false);
 const pending=useRef(false);
 const confirmButton=useRef<HTMLButtonElement>(null);
 const trigger=useRef<HTMLButtonElement>(null);
 useEffect(()=>{
  if(!open)return;
  confirmButton.current?.focus();
 },[open]);
 function dismiss(){setOpen(false);trigger.current?.focus();}
 return <div className="min-w-0">
  <Button ref={trigger} variant="danger" type="button" className="min-h-9 px-3 text-xs font-semibold" onClick={()=>setOpen(true)}>
   Delete
  </Button>
  <Dialog open={open} onOpenChange={next=>{if(!pending.current){if(!next)dismiss();else setOpen(true);}}} dismissible={!pending.current}
    role="alertdialog" className="max-w-sm" bodyClassName="!p-0"
    title="Delete this announcement?" description="Students stop seeing it, and its notices are taken back."
    footer={<form method="post" action={"/api/placements/tpo/announcements/"+encodeURIComponent(id)+"/lifecycle"}
      className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end"
      onSubmit={event=>{if(pending.current)event.preventDefault();else {pending.current=true;setSubmitting(true);}}}>
      <input type="hidden" name="expectedVersion" value={version}/>
      <input type="hidden" name="action" value="DELETE"/>
      <Button variant="secondary" type="button" className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={submitting} onClick={dismiss}>Cancel</Button>
      <Button ref={confirmButton} type="submit" variant="danger" className="min-h-11 w-full sm:w-auto md:min-h-9"
       loading={submitting} disabled={submitting}>{submitting?"Deleting…":"Delete announcement"}</Button>
    </form>}>
    <></>
  </Dialog>
 </div>;
}
