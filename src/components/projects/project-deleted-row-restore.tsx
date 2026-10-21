"use client";

import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
import {useToast} from "@/components/ui/toast";
import {projectMutation} from "./project-api";

/** Each deleted-workspace row owns its own confirmation and in-flight guard.
 * The collection page is server-driven; refresh after the transaction and
 * step back when restoring the last row of a non-first page.
 */
export function ProjectDeletedRowRestore({projectId,title,expectedUpdatedAt,
 mentorName,page,pageSize,total}:{projectId:string;title:string;
 expectedUpdatedAt:string;mentorName:string|null;page:number;pageSize:number;total:number}){
 const router=useRouter();
 const {showToast}=useToast();
 const [open,setOpen]=useState(false);
 const [pending,setPending]=useState(false);
 const inFlight=useRef(false);
 const missingMentor=!mentorName||mentorName==="—";
 const previousPageHref="/college/projects/deleted?"+new URLSearchParams({
  page:String(page-1),pageSize:String(pageSize),
 }).toString();
 async function restore(){
  if(inFlight.current)return;
  inFlight.current=true;
  setPending(true);
  try{
   await projectMutation("/api/projects/"+encodeURIComponent(projectId)+"/undelete",
    "POST",{expectedUpdatedAt});
   setOpen(false);
   showToast({tone:"success",title:"Workspace restored",
    description:missingMentor?
     "The workspace is archived for review. Assign a mentor before reopening work.":
     "The workspace is available under Archived workspaces. Restore it there to resume work."});
   if(page>1&&total-1<=(page-1)*pageSize){
    router.replace(previousPageHref);
   }else{
    router.refresh();
   }
  }catch(error){
   showToast({tone:"error",title:"Could not restore workspace",
    description:error instanceof Error?error.message:
     "The workspace may have changed. Refresh and retry."});
  }finally{
   inFlight.current=false;
   setPending(false);
  }
 }
 return <>
  <Button type="button" size="sm" variant="primary" loading={pending}
   disabled={pending} className="min-h-11 gap-2 md:min-h-9"
   onClick={()=>setOpen(true)} aria-label={"Restore deleted workspace "+title}>
   <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 11a9 9 0 1 1 2.8 6.5M3 5v6h6"/>
   </svg>
   {pending?"Restoring…":"Restore"}
  </Button>
  <Dialog open={open} onOpenChange={value=>{if(!inFlight.current)setOpen(value);}}
   dismissible={!pending} role="alertdialog" title="Restore this workspace?"
   description="Deleted workspaces return to the archived list first. No content or memberships will be recreated automatically."
   footer={<div className="flex w-full flex-wrap justify-end gap-2">
    <Button type="button" variant="secondary" disabled={pending}
     onClick={()=>setOpen(false)}>Cancel</Button>
    <Button type="button" variant="primary" loading={pending} disabled={pending}
     onClick={()=>void restore()}>Restore workspace</Button>
   </div>}>
   <div className="space-y-3 text-sm text-body">
    <strong className="block break-words text-[var(--lms-heading)]">{title}</strong>
    <p>Restore this workspace to the archived list for the selected college?</p>
    {missingMentor?<p className="rounded-[8px] border border-[var(--lms-warning-border)] bg-[var(--lms-warning-subtle)] p-3 text-[var(--lms-warning-text)]">
     This workspace has no recorded primary mentor. After restoring, assign an active mentor before resuming work.
    </p>:null}
   </div>
  </Dialog>
 </>;
}
