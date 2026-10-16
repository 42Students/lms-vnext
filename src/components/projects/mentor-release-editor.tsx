"use client";
import {useState} from "react";
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
  }catch(e){setError(e instanceof Error?e.message:"Could not save release");}
  finally{setPending(false);}
 }
 async function remove(){
  if(!release||!canRemove||!window.confirm("Delete this release? This cannot be undone."))return;
  setPending(true);setError("");
  try{
   await projectMutation(url,"DELETE");
   setOpen(false);router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Could not delete release");}
  finally{setPending(false);}
 }
 return <div className="space-y-2">
  {(!release||release.status!=="SHIPPED")?<button type="button"
   className="min-h-10 rounded-md border border-border px-3 text-sm font-semibold text-primary-text"
   onClick={()=>setOpen(v=>!v)}>{release?"Edit release":"Add release"}</button>:null}
  {open?<div className="space-y-3 rounded-lg border border-border bg-surface-subtle p-3">
   <p className="text-sm font-semibold">{release?"Edit release":"New release"}</p>
   <label className="block text-sm font-semibold">Title
    <input className="mt-1 w-full rounded-md border border-border bg-background p-2" maxLength={200}
     required value={title} onChange={e=>setTitle(e.target.value)}/></label>
   <label className="block text-sm font-semibold">What ships in this release?
    <textarea className="mt-1 min-h-20 w-full rounded-md border border-border bg-background p-2"
     maxLength={4000} value={description} onChange={e=>setDescription(e.target.value)}/></label>
   <div className="flex flex-wrap gap-2">
    <button type="button" disabled={pending||!title.trim()} onClick={()=>void save()}
     className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
     {pending?"Saving…":"Save release"}</button>
    <button type="button" disabled={pending} onClick={()=>setOpen(false)}
     className="rounded-md border border-border px-3 py-2 text-sm">Cancel</button>
    {canRemove?<button type="button" disabled={pending} onClick={()=>void remove()}
     className="rounded-md border border-error px-3 py-2 text-sm font-semibold text-error">Delete release</button>:null}
   </div>
   {release&&linkedSprints>0?<p className="text-xs text-muted-foreground">
    Release cannot be deleted until its {linkedSprints} linked sprint(s) are removed.
   </p>:null}
  </div>:null}
  {error?<p role="alert" className="text-xs text-error">{error}</p>:null}
  {message?<p role="status" className="text-xs text-success">{message}</p>:null}
 </div>;
}
