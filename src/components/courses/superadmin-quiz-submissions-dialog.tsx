"use client";
import {useState,type ReactNode} from "react";
import {Button} from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";

/** The quiz review opens in a 640px legacy-style overlay, with focus
 * restoration and escape handling delegated to the shared Dialog. */
export function SuperAdminQuizSubmissionsDialog({
 title,count,children,
}:{title:string;count:number;children:ReactNode}){
 const [open,setOpen]=useState(false);
 return <>
  <Button type="button" size="sm" variant="secondary"
   aria-label={"Submissions for "+title}
   onClick={()=>setOpen(true)}>Submissions ({count})</Button>
  <Dialog open={open} onOpenChange={setOpen}
   title={"Submissions — "+title}
   description="Choose an authorized Section and load learner attempts. Never disclose unreleased results to learners."
   className="max-w-[640px]">
   {open?children:null}
  </Dialog>
 </>;
}
