"use client";
import {useEffect,useRef,useState} from "react";
import {Button} from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";

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
  {<Dialog open={open} onOpenChange={next=>{if(!next)dismiss();else setOpen(true);}} role="alertdialog" className="max-w-md"
   title="Delete this announcement?" description="Students stop seeing it, and its notices are taken back.">
    <form method="post" action={"/api/placements/tpo/announcements/"+encodeURIComponent(id)+"/lifecycle"}
     className="mt-5 flex flex-wrap gap-3"
     onSubmit={event=>{if(pending.current)event.preventDefault();else pending.current=true;}}>
     <input type="hidden" name="expectedVersion" value={version}/>
     <input type="hidden" name="action" value="DELETE"/>
     <Button ref={confirmButton} type="submit" variant="danger"
      className="min-h-11 sm:min-h-9">
      Delete announcement
     </Button>
     <Button type="button" variant="secondary" onClick={dismiss}
      className="min-h-11 sm:min-h-9">
      Cancel
     </Button>
    </form>
  </Dialog>}
 </div>;
}
