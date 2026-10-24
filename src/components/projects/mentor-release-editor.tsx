"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {useEffect,useId,useRef,useState} from "react";
import {useToast} from "@/components/ui/toast";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {useRouter} from "next/navigation";
import {projectMutation} from "./project-api";
type Release={id:string;title:string;description:string|null;targetDate?:string|null;status:string;updatedAt:Date};
type Readiness={readyToShip:boolean;completedSprintCount:number;
 committedPoints:number;completedPoints:number};
export function MentorReleaseEditor({
 projectId,release,linkedSprints=0,readiness,existingReleaseCount=0,hideShippingControl=false,
 releasesLoading=false,releasesError=null,onRetryReleases,
}:{
 projectId:string;release?:Release;linkedSprints?:number;readiness?:Readiness;
 existingReleaseCount?:number;hideShippingControl?:boolean;
 releasesLoading?:boolean;releasesError?:string|null;onRetryReleases?:()=>void;
}){
 const router=useRouter(),[open,setOpen]=useState(false),[pending,setPending]=useState(false);
 const editorId=useId();
 const inFlight=useRef(false);
 const {showToast}=useToast();
 const [title,setTitle]=useState(release?.title??"");
 const [description,setDescription]=useState(release?.description??"");
 const [targetDate,setTargetDate]=useState(release?.targetDate??"");
 const [error,setError]=useState(""),[message,setMessage]=useState("");
 const [confirmDiscard,setConfirmDiscard]=useState(false);
 const [confirmDelete,setConfirmDelete]=useState(false);
 const [confirmShip,setConfirmShip]=useState(false);
 const dirty=title!==(release?.title??"")||description!==(release?.description??"")||targetDate!==(release?.targetDate??"");
 useEffect(()=>{
   if(!open||!dirty)return;
   const warn=(event:BeforeUnloadEvent)=>{
     event.preventDefault();
     event.returnValue="You have unsaved project changes. Leave this page and discard them?";
   };
   window.addEventListener("beforeunload",warn);
   return ()=>window.removeEventListener("beforeunload",warn);
 },[open,dirty]);
 useEffect(()=>{
   if(!open){setTitle(release?.title??"");setDescription(release?.description??"");setTargetDate(release?.targetDate??"");}
 },[open,release?.title,release?.description,release?.targetDate]);
 function requestClose(){
   if(pending)return;
   if(dirty)setConfirmDiscard(true);else setOpen(false);
 }
 const canRemove=Boolean(release&&release.status!=="SHIPPED"&&linkedSprints===0);
 const canShip=Boolean(release&&release.status!=="SHIPPED"&&linkedSprints>0&&
  readiness?.readyToShip===true&&readiness.completedSprintCount===linkedSprints);
 const url="/api/projects/"+encodeURIComponent(projectId)+"/releases"+
  (release?"/"+encodeURIComponent(release.id):"");
 async function save(){
  if(pending||inFlight.current||!title.trim())return;
  inFlight.current=true;
  setPending(true);setError("");setMessage("");
  try{
   await projectMutation(url,release?"PATCH":"POST",{
    title:title.trim(),description:description.trim()||null,targetDate:targetDate||null,
    ...(release?{expectedUpdatedAt:new Date(release.updatedAt).toISOString()}:{}),
   });
   setOpen(false);setMessage(release?"Release updated.":"Release added.");
   showToast({tone:"success",title:release?"Release updated.":"Release added."});router.refresh();
  }catch{setError("Could not save the release. Review its latest details and try again.");}
  finally{inFlight.current=false;setPending(false);}
 }
 async function remove(){
  if(!release||!canRemove||pending||inFlight.current)return;
  inFlight.current=true;
  setPending(true);setError("");
  try{
   await projectMutation(url,"DELETE",{expectedUpdatedAt:new Date(release.updatedAt).toISOString()});
   setConfirmDelete(false);setOpen(false);
   showToast({tone:"success",title:"Release deleted."});router.refresh();
  }catch{setError("Could not delete the release. Reload its current status and retry.");}
  finally{inFlight.current=false;setPending(false);}
 }
 async function ship(){
  if(!release||!canShip||pending||inFlight.current)return;
  inFlight.current=true;setPending(true);setError("");
  try{
   await projectMutation(url+"/ship","POST",{
    expectedUpdatedAt:new Date(release.updatedAt).toISOString(),
   });
   setConfirmShip(false);showToast({tone:"success",title:"Release shipped."});
   router.refresh();
  }catch{setError("Could not ship the release. Refresh sprint progress and retry.");}
  finally{inFlight.current=false;setPending(false);}
 }
 return <div className="space-y-3">
  {releasesLoading?<div role="status" aria-busy="true"
    className="border-b border-[var(--lms-canvas-border)] pb-3 text-sm text-body">
    <strong className="block">Loading project releases…</strong>
    <span>Release choices will appear as soon as the project release list is available.</span>
   </div>:null}
  {releasesError?<div role="alert" className="space-y-2 border-b border-[var(--lms-error)] pb-3 text-sm">
    <strong className="block text-error">Project releases could not be loaded</strong>
    <p>{releasesError}</p>
    <Button size="sm" variant="secondary" type="button"
      onClick={()=>{onRetryReleases?.();router.refresh();}}>Retry</Button>
   </div>:null}
  {!release&&existingReleaseCount===0&&!releasesLoading&&!releasesError?<div className="border-b border-[var(--lms-canvas-border)] pb-3 text-sm">
    <strong className="block text-foreground">No releases on this project yet</strong>
    <p className="text-body">A sprint must belong to a release. Create or seed a project release before adding a new sprint.</p>
   </div>:null}
  {release?<div className="space-y-2 border-b border-border pb-3 text-sm">
   <p>{readiness
    ? `${readiness.completedSprintCount} of ${linkedSprints} sprints complete · ${readiness.completedPoints} of ${readiness.committedPoints} points completed`
    : "Release readiness is not loaded. Refresh the linked sprint summary."}</p>
   {!hideShippingControl&&release.status!=="SHIPPED"?<Button type="button" disabled={!canShip||pending} onClick={()=>setConfirmShip(true)}>
    Ship release</Button>:null}
   {!hideShippingControl&&release.status!=="SHIPPED"&&!canShip?<p className="text-xs text-muted-foreground">
    A release needs at least one linked sprint and all linked sprints completed before shipping.</p>:null}
  </div>:null}
  {(!release||release.status!=="SHIPPED")?<Button variant={release?"secondary":"primary"} type="button" aria-expanded={open} aria-controls={editorId}
   className="min-h-11 px-3 md:min-h-9"
   onClick={()=>{if(open)requestClose();else setOpen(true);}}>{release?"Edit release":"Add release"}</Button>:null}
  {open?<form id={editorId} aria-labelledby={editorId+"-heading"}
    onSubmit={event=>{event.preventDefault();void save();}} className="space-y-3 border-t border-border pt-3">
   <h3 id={editorId+"-heading"} className="text-sm font-semibold leading-[22px]">{release?"Edit release":"New release"}</h3>
   <label className="block text-[13px] font-semibold">Title
    <Input className="mt-1 min-h-11 w-full md:min-h-9" maxLength={200}
     required value={title} onChange={e=>setTitle(e.target.value)}/></label>
   <label className="block text-[13px] font-semibold">What ships in this release?
    <Textarea className="mt-1 min-h-20 w-full"
     value={description} onChange={e=>setDescription(e.target.value)}/></label>
   <label className="block text-[13px] font-semibold">Target date (optional)
    <Input type="date" className="mt-1 min-h-11 w-full md:min-h-9"
     value={targetDate} onChange={e=>setTargetDate(e.target.value)}/>
   </label>
   <div className="sticky bottom-0 z-10 flex flex-wrap gap-2 border-t border-[var(--lms-canvas-border)] bg-white py-3">
    <Button variant="primary" type="submit" disabled={pending||!title.trim()}
     className="min-h-11 w-auto px-3 py-2 md:min-h-9">
     {pending?"Saving…":"Save release"}</Button>
    <Button variant="secondary" type="button" disabled={pending} onClick={requestClose}
     className="min-h-11 w-auto px-3 py-2 md:min-h-9">Cancel</Button>
   </div>
   {canRemove?<div className="border-t border-[var(--lms-canvas-border)] pt-3"><Button variant="link" type="button" disabled={pending} onClick={()=>{setError("");setConfirmDelete(true);}}
     className="min-h-11 w-full !justify-start !text-[var(--lms-error)] sm:w-auto md:min-h-9">Delete release</Button></div>:null}
   {release&&linkedSprints>0?<p className="text-xs text-muted-foreground leading-[20px]">
    Release cannot be deleted until its {linkedSprints} linked sprint(s) are removed.
   </p>:null}
  </form>:null}
  {error&&!confirmDelete?<p role="alert" className="text-xs text-error leading-[20px]">{error}</p>:null}
  {message?<p role="status" className="text-xs text-success leading-[20px]">{message}</p>:null}
  <ConfirmDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}
    title="Discard unsaved project changes?"
    description="You have unsaved project changes. Leave this page and discard them?"
    confirmLabel="Discard changes" pending={pending}
    onConfirm={()=>{setConfirmDiscard(false);setOpen(false);
      setTitle(release?.title??"");setDescription(release?.description??"");setTargetDate(release?.targetDate??"");}}/>
  <ConfirmDialog open={confirmShip} onOpenChange={next=>{if(!pending)setConfirmShip(next);}}
    title="Ship this release?" description="All linked sprints must be complete. This operation updates the release status."
    confirmLabel="Ship release" pending={pending} onConfirm={()=>void ship()}>
    {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  </ConfirmDialog>
  <ConfirmDialog open={confirmDelete} onOpenChange={next=>{if(!pending)setConfirmDelete(next);}}
    title="Delete this release?" description="This cannot be undone."
    confirmLabel="Delete release" pending={pending} onConfirm={()=>void remove()}>
    {error?<p role="alert" className="break-words text-sm text-error leading-[22px]">{error}</p>:null}
  </ConfirmDialog>
 </div>;
}
