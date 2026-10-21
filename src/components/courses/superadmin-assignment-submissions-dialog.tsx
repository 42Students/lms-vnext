"use client";
import {useState,type ReactNode} from "react";
import {Dialog} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";

/** Legacy submissions overlay, with escape/focus restoration from shared Dialog. */
export function SuperAdminAssignmentSubmissionsDialog({
 title,count,children,
}:{title:string;count:number;children:ReactNode}){
 const [open,setOpen]=useState(false);
 return <>
  <Button type="button" variant="secondary" className="min-h-9"
   aria-label={"Submissions for "+title} onClick={()=>setOpen(true)}>
   Submissions ({count})
  </Button>
  <Dialog open={open} onOpenChange={setOpen}
   title={"Submissions — "+title}
   description="Review submitted work and publish graded results only after verification."
   className="max-w-[760px]">
   {children}
  </Dialog>
 </>;
}
