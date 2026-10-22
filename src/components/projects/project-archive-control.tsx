"use client";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {PopoverPanel} from "@/components/ui/popover";
import {useToast} from "@/components/ui/toast";
import {projectMutation} from "./project-api";
import {ProjectSoftDeleteControl} from "./project-soft-delete-control";

function ArchiveIcon(){return <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16"
 fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
  <path d="M4 5h16v4H4zM6 9v11h12V9M10 13h4"/>
 </svg>;}
function RestoreIcon(){return <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16"
 fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
  <path d="M3 7v5h5M3 12a9 9 0 1 1 3 7M12 7v5l3 2"/>
 </svg>;}

export function ProjectArchiveControl({projectId,projectTitle,status,expectedUpdatedAt,deleted=false}:{
 projectId:string;projectTitle:string;status:string;expectedUpdatedAt:string;deleted?:boolean;
}){
 const router=useRouter(),{showToast}=useToast();
 const [open,setOpen]=useState(false),[pending,setPending]=useState(false);
 const flight=useRef(false),triggerRef=useRef<HTMLButtonElement|null>(null);
 const cancelRef=useRef<HTMLButtonElement|null>(null);
 const archived=status==="ARCHIVED";
 useEffect(()=>{if(open&&!pending)cancelRef.current?.focus();},[open,pending]);
 function dismiss(){
  if(flight.current)return;
  setOpen(false);
  triggerRef.current?.focus();
 }
 async function apply(){
  if(flight.current||deleted)return;
  flight.current=true;setPending(true);
  try{
   await projectMutation("/api/projects/"+encodeURIComponent(projectId)+
     (archived?"/restore":"/archive"),"POST",{expectedUpdatedAt});
   setOpen(false);
   showToast({tone:"success",title:archived?"Workspace restored":"Workspace archived",
    description:archived?
     "The archived workspace is accessible again with its saved task, sprint, resource and meeting data.":
     "The workspace remains available for authorized review. It has not been deleted."});
   router.refresh();
  }catch(error){
   const reason=error instanceof Error?error.message:
     archived?"Failed to restore workspace":"Failed to archive workspace";
   showToast({tone:"error",title:archived?"Failed to restore workspace":
     "Failed to archive workspace",description:reason+
       " Refresh the workspace if it changed before retrying."});
  }finally{flight.current=false;setPending(false);}
 }
 if(deleted)return <ProjectSoftDeleteControl projectId={projectId}
  projectTitle={projectTitle} expectedUpdatedAt={expectedUpdatedAt} deleted/>;
 return <div className="flex min-w-0 flex-wrap items-center gap-2">
  <div className="relative">
   <Button ref={triggerRef} type="button" size="sm"
    variant={archived?"primary":"danger"} aria-expanded={open}
    aria-haspopup="dialog" disabled={pending}
    onClick={()=>open?dismiss():setOpen(true)}>
    {archived?<RestoreIcon/>:<ArchiveIcon/>}
    {archived?"Restore":"Archive"}
   </Button>
   {open?<PopoverPanel label={archived?"Restore this workspace?":"Archive this workspace?"}
    onDismiss={dismiss}
    className="absolute left-0 top-full z-40 mt-2 w-[340px] space-y-3 max-[767px]:w-[min(340px,calc(100vw_-_2rem))]">
    <p className="text-sm font-semibold text-foreground">
     {archived?"Restore this workspace?":"Archive this workspace?"}
    </p>
    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-body">
     {archived?
      "Restore "+projectTitle+"? Archived members, meetings and workspace content become accessible again.":
      projectTitle+" will be archived. You can still review the workspace, but execution changes stop until restored."}
    </p>
    <p className="text-xs leading-5 text-body">
     {archived?
      "Unlike the old LMS snapshot restoration, vNext preserves previously saved task, sprint and resource edits; it does not regenerate them from the template.":
      "Archive is not Delete. The separate Deleted workspaces control starts the recoverable-delete workflow."}
    </p>
    <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
     <Button ref={cancelRef} type="button" size="sm" variant="secondary"
      disabled={pending} onClick={dismiss}>Cancel</Button>
     <Button type="button" size="sm" variant={archived?"primary":"danger"}
      disabled={pending} loading={pending} onClick={()=>void apply()}>
      {pending?(archived?"Restoring…":"Archiving…"):
        archived?"Restore workspace":"Archive workspace"}
     </Button>
    </div>
   </PopoverPanel>:null}
  </div>
  <ProjectSoftDeleteControl projectId={projectId} projectTitle={projectTitle}
   expectedUpdatedAt={expectedUpdatedAt} deleted={false}/>
 </div>;
}
