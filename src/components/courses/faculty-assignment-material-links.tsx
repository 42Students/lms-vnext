"use client";
import { Button } from "@/components/ui/button";
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
 return <section aria-label="Instructor assignment resources" className="space-y-2">
  <h3 className="text-sm font-semibold">Instructions &amp; resources</h3>
  {loading?<p role="status" className="text-sm text-body">Loading instructor links…</p>:null}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  <ul className="space-y-2">
   {links.map(link=><li key={link.id} className="flex flex-wrap items-center gap-3 text-sm">
    <a href={link.href} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary-text underline">{link.title}</a>
    <Button variant="secondary" type="button" disabled={disabled||pending} onClick={()=>{
     if(window.confirm("Remove this instructor resource link?"))void act({action:"REMOVE",materialId:link.id});
    }} className="min-h-10 rounded">Remove</Button>
   </li>)}
  </ul>
  {!disabled?<div className="grid gap-2 sm:grid-cols-2">
   <label className="text-sm">Resource title
    <Input value={title} onChange={e=>setTitle(e.target.value)} maxLength={160}
     className="mt-1 min-h-10 w-full rounded px-2"/>
   </label>
   <label className="text-sm">Secure resource link
    <Input value={externalUrl} onChange={e=>setExternalUrl(e.target.value)} type="url" maxLength={2048}
     placeholder="https://" className="mt-1 min-h-10 w-full rounded px-2"/>
   </label>
   <Button variant="secondary" type="button" disabled={pending||loading||links.length>=20||!parsed.success}
    onClick={()=>{if(parsed.success)void act({action:"ADD",link:parsed.data});}}
    className="min-h-10 rounded">Add link</Button>
  </div>:null}
  <p className="text-xs text-muted-foreground">Only HTTPS links can be added here. File handouts require verified private storage.</p>
 </section>;
}
