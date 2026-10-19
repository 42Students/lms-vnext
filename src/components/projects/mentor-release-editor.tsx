"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {useEffect,useState} from "react";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {useRouter} from "next/navigation";
import {projectMutation} from "./project-api";
type Release={id:string;title:string;description:string|null;status:string;updatedAt:Date};
export function MentorReleaseEditor({projectId,release,linkedSprints=0}:{
 projectId:string;release?:Release;linkedSprints?:number;
}){
 const router=useRouter(),[open,setOpen]=useState(false),[pending,setPending]=useState(false);
 const [title,setTitle]=useState(release?.title??"");
 const [description,setDescription]=useState(release?.description??"");
 const [error,setError]=useState(""),[message,setMessage]=useState("");
 const [confirmDiscard,setConfirmDiscard]=useState(false);
 const [confirmDelete,setConfirmDelete]=useState(false);
 const dirty=title!==(release?.title??"")||description!==(release?.description??"");
 useEffect(()=>{
   if(!open||!dirty)return;
   const warn=(event:BeforeUnloadEvent)=>{
     event.preventDefault();
     event.returnValue="You have unsaved project changes. Leave this page and discard them?";
   };
   window.addEventListener("beforeunload",warn);
   return ()=>window.removeEventListener("beforeunload",warn);
 },[open,dirty]);
 function requestClose(){
   if(pending)return;
   if(dirty)setConfirmDiscard(true);else setOpen(false);
 }
 const canRemove=Boolean(release&&release.status!=="SHIPPED"&&linkedSprints===0);
 const url="/api/projects/"+encodeURIComponent(projectId)+"/releases"+
  (release?"/"+encodeURIComponent(release.id):"");
 async function save(){
  if(pending||!title.trim())return;
  setPending(true);setError("");setMessage("");
  try{
   await projectMutation(url,release?"PATCH":"POST",{
    title:title.trim(),description:description.trim()||null,
    ...(release?{expectedUpdatedAt:new Date(release.updatedAt).toISOString()}:{}),
   });
   setOpen(false);setMessage(release?"Release updated.":"Release added.");router.refresh();
  }catch{setError("Could not save the release. Review its latest details and try again.");}
  finally{setPending(false);}
 }
 async function remove(){
  if(!release||!canRemove)return;
  setPending(true);setError("");
  try{
   await projectMutation(url,"DELETE",{expectedUpdatedAt:new Date(release.updatedAt).toISOString()});
   setOpen(false);router.refresh();
  }catch{setError("Could not delete the release. Reload its current status and retry.");}
  finally{setPending(false);}
 }
 return <div className="space-y-2">
  {(!release||release.status!=="SHIPPED")?<Button variant="secondary" type="button"
   className="min-h-10 px-3"
   onClick={()=>{if(open)requestClose();else setOpen(true);}}>{release?"Edit release":"Add release"}</Button>:null}
  {open?<div className="space-y-3 border-t border-border pt-3">
   <p className="text-sm font-semibold">{release?"Edit release":"New release"}</p>
   <label className="block text-sm font-semibold">Title
    <Input className="mt-1 min-h-9 w-full rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3 py-2 text-[14px]" maxLength={200}
     required value={title} onChange={e=>setTitle(e.target.value)}/></label>
   <label className="block text-sm font-semibold">What ships in this release?
    <Textarea className="mt-1 min-h-20 w-full rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3 py-2 text-[14px]"
     maxLength={4000} value={description} onChange={e=>setDescription(e.target.value)}/></label>
   <div className="flex flex-wrap gap-2">
    <Button variant="primary" type="button" disabled={pending||!title.trim()} onClick={()=>void save()}
     className="min-h-9 px-3 py-2">
     {pending?"Saving…":"Save release"}</Button>
    <Button variant="secondary" type="button" disabled={pending} onClick={requestClose}
     className="px-3 py-2">Cancel</Button>
    {canRemove?<Button variant="danger" type="button" disabled={pending} onClick={()=>setConfirmDelete(true)}
     className="px-3 py-2">Delete release</Button>:null}
   </div>
   {release&&linkedSprints>0?<p className="text-xs text-muted-foreground">
    Release cannot be deleted until its {linkedSprints} linked sprint(s) are removed.
   </p>:null}
  </div>:null}
  {error?<p role="alert" className="text-xs text-error">{error}</p>:null}
  {message?<p role="status" className="text-xs text-success">{message}</p>:null}
  <ConfirmDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}
    title="Discard unsaved project changes?"
    description="You have unsaved project changes. Leave this page and discard them?"
    confirmLabel="Discard changes" pending={pending}
    onConfirm={()=>{setConfirmDiscard(false);setOpen(false);
      setTitle(release?.title??"");setDescription(release?.description??"");}}/>
  <ConfirmDialog open={confirmDelete} onOpenChange={setConfirmDelete}
    title="Delete this release?" description="This cannot be undone."
    confirmLabel="Delete release" pending={pending} onConfirm={()=>{setConfirmDelete(false);void remove();}}/>
 </div>;
}
