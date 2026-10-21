"use client";

import { useId, useState, type ReactNode } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";

// A deep-linked item may be opened automatically only until the learner
// closes it. RSC progress refresh must not resurrect a dismissed dialog.
const dismissedFocusKeys=new Set<string>();

/** Accessible lesson item with explicit locked and completed row states. */
export function LearnerRoadmapItemDialog({
  children,title,kind,progress,caption,dueText,initiallyOpen=false,
  highlighted=false,focusKey,locked=false,availability,
}:{
 children:ReactNode;
 title:string;
 kind:"Content"|"Assignment"|"Quiz";
 progress:string;
 caption?:string;
 dueText?:string;
 initiallyOpen?:boolean;
 highlighted?:boolean;
 focusKey?:string;
 locked?:boolean;
 availability?:"SCHEDULED"|"ENDED"|"AVAILABLE";
}){
 const router=useRouter();
 const navigationId=useId();
 const [open,setOpen]=useState(()=>initiallyOpen&&
  (!focusKey||!dismissedFocusKeys.has(focusKey)));
 const [lockedNotice,setLockedNotice]=useState(false);
 function change(openNow:boolean){
  if(!openNow&&open){
   if(focusKey)dismissedFocusKeys.add(focusKey);
   router.refresh();
  }
  setOpen(openNow);
 }
 return <section aria-label={title} className={highlighted?"rounded-[var(--lms-control-radius)] ring-2 ring-[var(--lms-focus-ring)]":""}>
  <nav aria-label={"Lesson item: "+title} id={navigationId}>
  <Button type="button" variant="secondary" aria-haspopup="dialog"
   aria-expanded={open} aria-disabled={locked}
   onClick={()=>{
    if(locked){setLockedNotice(true);return;}
    setLockedNotice(false);setOpen(true);
   }}
   className="min-h-14 w-full min-w-0 flex-col items-stretch gap-2 px-4 py-3 text-left sm:flex-row sm:items-center sm:justify-between focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
   <span className="min-w-0 break-words [overflow-wrap:anywhere]">
    <span className="block text-xs font-semibold uppercase text-muted-foreground">
     {caption??kind} · {progress.replaceAll("_"," ").toLowerCase()}
     {availability==="SCHEDULED"?" · Scheduled":availability==="ENDED"?" · Ended":""}
     {dueText?" · Due "+dueText:""}
    </span>
    <span className="block break-words text-sm font-semibold text-foreground">{title}</span>
   </span>
   <span className="self-end shrink-0 text-sm font-semibold text-primary-text sm:self-auto">{locked?"Content locked":"Open ›"}</span>
  </Button>
  </nav>
  {lockedNotice?<Alert tone="warning" role="status" className="mt-2">
   Content locked. This item is not available yet.
  </Alert>:null}
  <Dialog open={open} onOpenChange={change} title={title}
   description={(caption??kind)+" · "+progress.replaceAll("_"," ")}
   className="!max-w-[760px]"
   footer={<Button type="button" variant="secondary" onClick={()=>change(false)}>Got it</Button>}>
   {open?<div className="min-w-0 break-words [overflow-wrap:anywhere]">{children}</div>:null}
  </Dialog>
 </section>;
}
