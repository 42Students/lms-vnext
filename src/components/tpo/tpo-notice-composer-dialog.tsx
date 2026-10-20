"use client";
import { Button } from "@/components/ui/button";
import {useEffect,useState,type ReactNode} from "react";
import {Dialog} from "@/components/ui/dialog";
/** TPO-inbox-team-50: shared modal traps focus, supports Escape and restores the opener. */
export function TpoNoticeComposerDialog({children,mode="NEW",initialOpen=false}:{children:ReactNode;mode?:"NEW"|"EDIT";initialOpen?:boolean}){
 const [open,setOpen]=useState(initialOpen);
 useEffect(()=>{if(initialOpen)setOpen(true);},[initialOpen]);
 const title=mode==="EDIT"?"Edit announcement":"New announcement";
 return <>
  <Button type="button" variant={mode==="EDIT"?"secondary":"primary"} onClick={()=>setOpen(true)}
   className="min-h-11 w-full min-w-0 sm:w-auto md:min-h-9">
   {title}
  </Button>
  <Dialog open={open} onOpenChange={setOpen} title={title}
   className="max-w-[42rem]"
   bodyClassName="!min-w-0 !overflow-x-hidden !p-4 md:!p-[var(--lms-canvas-padding)] [&_form]:min-w-0 [&_input]:max-w-full [&_textarea]:max-w-full">
   {children}
  </Dialog>
 </>;
}
