"use client";
import { Button } from "@/components/ui/button";
import {useState,type ReactNode} from "react";
import {Dialog} from "@/components/ui/dialog";
/** TPO-inbox-team-50: shared modal traps focus, supports Escape and restores the opener. */
export function TpoNoticeComposerDialog({children,mode="NEW"}:{children:ReactNode;mode?:"NEW"|"EDIT"}){
 const [open,setOpen]=useState(false);
 const title=mode==="EDIT"?"Edit announcement":"New announcement";
 return <>
  <Button type="button" onClick={()=>setOpen(true)}
   className="min-h-11 sm:min-h-9">
   {title}
  </Button>
  <Dialog open={open} onOpenChange={setOpen} title={title}>
   {children}
  </Dialog>
 </>;
}
