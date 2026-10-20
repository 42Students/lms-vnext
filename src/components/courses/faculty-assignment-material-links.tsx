"use client";
import { Alert } from "@/components/ui/alert";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LoadingState } from "@/components/ui/loading-state";
import { Input } from "@/components/ui/input";
import {useEffect,useRef,useState} from "react";
import {apiFetch} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
import {facultyAssignmentMaterialLinkSchema} from "@/modules/courses/learner-assignment-materials-model";
type Material={id:string;title:string;href:string};
export function FacultyAssignmentMaterialLinks({deliveryId,assignmentId,disabled=false}:{
 deliveryId:string;assignmentId:string;disabled?:boolean;
}){
 const [links,setLinks]=useState<Material[]>([]);
 const [title,setTitle]=useState("");
 const [externalUrl,setExternalUrl]=useState("");
 const [loading,setLoading]=useState(true);
 const [pending,setPending]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const [removeId,setRemoveId]=useState<string|null>(null);
 const lock=useRef(false);
 const endpoint="/api/courses/deliveries/"+encodeURIComponent(deliveryId)+
  "/assignments/"+encodeURIComponent(assignmentId)+"/materials";
 useEffect(()=>{
  const controller=new AbortController();
  fetch(endpoint,{cache:"no-store",signal:controller.signal}).then(async response=>{
   if(!response.ok)throw new Error("Could not load instructor resources.");
   return response.json() as Promise<{available:boolean;links:Material[]}>;
  }).then(payload=>{
   if(controller.signal.aborted)return;
   if(!payload.available)throw new Error("Instructor resources are unavailable until setup is completed.");
   setLinks(payload.links);setLoading(false);
  }).catch(()=>{
   if(controller.signal.aborted)return;
   setError("Could not load instructor resources. Reload the assignment and try again.");
   setLoading(false);
  });
  return ()=>controller.abort();
 },[endpoint]);
 async function act(input:{action:"ADD";link:{title:string;externalUrl:string}}|
  {action:"REMOVE";materialId:string}){
  if(lock.current||disabled)return;
  lock.current=true;setPending(true);setError(null);
  try{
   await apiFetch(endpoint,{method:input.action==="REMOVE"?"DELETE":"POST",
    headers:{"Content-Type":"application/json"},body:JSON.stringify(input)});
   const payload=await apiFetch<{available:boolean;links:Material[]}>(endpoint,{method:"GET"});
   if(!payload.available)throw new Error("Instructor resources are unavailable.");
   setLinks(payload.links);
   if(input.action==="ADD"){setTitle("");setExternalUrl("");}
  }catch(error){setError(error instanceof Error?friendlyApiError({}):"Could not save instructor resources.");}
  finally{lock.current=false;setPending(false);}
 }
 const parsed=facultyAssignmentMaterialLinkSchema.safeParse({title,externalUrl});
 return <section aria-label="Instructor assignment resources" className="min-w-0 space-y-3 border-t border-border pt-4 max-[767px]:[&_button]:min-h-11">
  <h3 className="text-base font-semibold">Instructions &amp; resources</h3>
  {loading?<LoadingState label="Loading instructor links…" />:null}
  {error?<Alert tone="error">{error}</Alert>:null}
  {!loading&&!error&&links.length===0?<p role="status" className="text-sm text-muted-foreground">No instructor resources yet.</p>:null}
  <ul className="divide-y divide-border">
   {links.map(link=><li key={link.id} className="flex min-w-0 flex-col items-start gap-2 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
    <a href={link.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 max-w-full items-center break-all font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">{link.title}</a>
    <Button variant="secondary" type="button" disabled={disabled||pending} onClick={()=>setRemoveId(link.id)} size="md">Remove</Button>
   </li>)}
  </ul>
  {!disabled?<div className="grid min-w-0 gap-3 md:grid-cols-2">
   <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Resource title
    <Input value={title} onChange={e=>setTitle(e.target.value)} maxLength={160}
     className="mt-1 min-h-11 w-full md:min-h-[var(--lms-control-height)]"/>
   </label>
   <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Secure resource link
    <Input value={externalUrl} onChange={e=>setExternalUrl(e.target.value)} type="url" maxLength={2048}
     placeholder="https://" className="mt-1 min-h-11 w-full md:min-h-[var(--lms-control-height)]"/>
   </label>
   <Button variant="secondary" type="button" disabled={pending||loading||links.length>=20||!parsed.success}
    onClick={()=>{if(parsed.success)void act({action:"ADD",link:parsed.data});}}
    className="w-full md:w-auto md:justify-self-start" size="md">Add link</Button>
  </div>:null}
  <p className="text-xs text-muted-foreground">Only HTTPS links can be added here. File handouts require verified private storage.</p>
  <ConfirmDialog
    open={removeId!==null}
    onOpenChange={nextOpen=>{if(!nextOpen&&!pending)setRemoveId(null);}}
    title="Remove this instructor resource link?"
    description="The link will no longer appear on this assignment."
    confirmLabel="Remove link"
    confirmVariant="danger"
    pending={pending}
    onConfirm={()=>{
      if(!removeId||pending)return;
      const selectedId=removeId;
      setRemoveId(null);
      void act({action:"REMOVE",materialId:selectedId});
    }}
  />
 </section>;
}
