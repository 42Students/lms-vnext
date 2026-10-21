"use client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {useEffect,useRef,useState} from "react";
import {Button} from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import {facultyContentExternalHref} from "@/modules/courses/faculty-content-preview-model";

type Material={id:string;kind:string;title:string;notes:string|null;externalUrl:string|null;
 originalName:string|null;sizeBytes:number|null;sequence:number;uploadStatus:string};
const blank={title:"",notes:"",externalUrl:""};
export function LessonResourceMaterialsControl({contentId,deliveryId,editable=false}:{
 contentId:string;deliveryId:string|null;editable?:boolean;
}){
 const [materials,setMaterials]=useState<Material[]>([]);
 const [draft,setDraft]=useState(blank);
 const [editing,setEditing]=useState<string|null>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const [notice,setNotice]=useState<string|null>(null);
 const [loading,setLoading]=useState(true);
 const [openingMaterialId,setOpeningMaterialId]=useState<string|null>(null);
 const openingRef=useRef<string|null>(null);
 const uri="/api/courses/lesson-contents/"+encodeURIComponent(contentId)+"/materials"+
  (deliveryId?"?deliveryId="+encodeURIComponent(deliveryId):"");
 const [prevUri,setPrevUri]=useState(uri);
 const currentUriRef=useRef(uri);
 currentUriRef.current=uri;
 if(prevUri!==uri){
  // An old Section or acting-college may have been visible on this mounted
  // component. Never show those private materials while the new scope loads.
  setPrevUri(uri);setLoading(true);setError(null);setNotice(null);
  setMaterials([]);setDraft(blank);setEditing(null);setBusy(false);setOpeningMaterialId(null);
 }
 useEffect(()=>{
  const controller=new AbortController();
  void fetch(uri,{cache:"no-store",signal:controller.signal}).then(async response=>{
   if(!response.ok)throw new Error("Could not load resource materials.");
   return response.json();
  }).then(data=>{
   if(!controller.signal.aborted&&currentUriRef.current===uri)
    setMaterials(Array.isArray(data?.materials)?data.materials:[]);
  }).catch(cause=>{
   if(!controller.signal.aborted&&currentUriRef.current===uri)
    setError(cause instanceof Error?cause.message:"Could not load materials.");
  }).finally(()=>{if(!controller.signal.aborted&&currentUriRef.current===uri)setLoading(false);});
  return ()=>controller.abort();
 },[uri]);
 async function openFile(materialId:string){
  if(openingRef.current)return;
  openingRef.current=materialId;
  setOpeningMaterialId(materialId);setError(null);
  // Reserve the destination synchronously, while the user gesture exists.
  // No object keys or signed URLs are stored in component state.
  const popup=window.open("about:blank","_blank");
  if(popup)popup.opener=null;
  const controller=new AbortController();
  const timeout=window.setTimeout(()=>controller.abort(),12000);
  try{
   const grantUrl="/api/courses/lesson-contents/"+encodeURIComponent(contentId)+
    "/materials/"+encodeURIComponent(materialId)+"/url"+
    (deliveryId?"?deliveryId="+encodeURIComponent(deliveryId):"");
   const response=await fetch(grantUrl,{cache:"no-store",credentials:"same-origin",
    signal:controller.signal});
   if(!response.ok)throw new Error("Resource file is unavailable. Contact your instructor.");
   const data:unknown=await response.json();
   const parsed=data&&typeof data==="object"&&"data" in data?data.data:null;
   const signed=parsed&&typeof parsed==="object"&&"url" in parsed?parsed.url:null;
   if(typeof signed!=="string")throw new Error("Resource file is unavailable. Contact your instructor.");
   const target=new URL(signed);
   if(target.protocol!=="https:"||target.username||target.password)
    throw new Error("Resource file is unavailable. Contact your instructor.");
   if(currentUriRef.current!==uri){popup?.close();return;}
   if(popup&&!popup.closed)popup.location.replace(target.href);
   else window.location.assign(target.href); // Popup-blocked fallback
  }catch{
   popup?.close();
   if(currentUriRef.current===uri)
    setError("Resource file is unavailable. Contact your instructor.");
  }finally{
   window.clearTimeout(timeout);
   openingRef.current=null;
   if(currentUriRef.current===uri)setOpeningMaterialId(null);
  }
 }
 async function reload(){
  const response=await fetch(uri,{cache:"no-store"});
  if(!response.ok)throw new Error("Could not refresh resource materials.");
  const data=await response.json();
  if(currentUriRef.current===uri)setMaterials(Array.isArray(data?.materials)?data.materials:[]);
 }
 async function submit(action:"ADD_LINK"|"EDIT_LINK"|"REMOVE",id?:string){
  if(busy)return;
  if(action==="REMOVE"&&!window.confirm("Remove this material? Students will no longer see it."))return;
  const trimmed={title:draft.title.trim(),notes:draft.notes.trim()||null,externalUrl:draft.externalUrl.trim()};
  if(action!=="REMOVE"&&!trimmed.title){setError("Enter a material title.");return;}
  if(action!=="REMOVE"&&!facultyContentExternalHref("RESOURCE",trimmed.externalUrl)){
   setError("Enter a valid HTTPS URL without credentials or spaces.");return;
  }
  setBusy(true);setError(null);setNotice(null);
  try{
   const response=await fetch(uri,{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify(action==="REMOVE"?{action,materialId:id}:
     action==="EDIT_LINK"?{...trimmed,action,materialId:id}:{...trimmed,action})});
   if(!response.ok)throw new Error("Could not save resource material. Check your permissions and try again.");
   await reload();
   if(currentUriRef.current!==uri)return;
   setDraft(blank);setEditing(null);
   setNotice(action==="REMOVE"?"Material removed.":action==="EDIT_LINK"?"Material updated.":"Material added.");
  }catch(cause){
   if(currentUriRef.current===uri)setError(cause instanceof Error?cause.message:"Material change failed.");
  }finally{
   if(currentUriRef.current===uri)setBusy(false);
  }
 }
 return <section aria-label="Resource materials" className="mt-4 space-y-3 rounded-xl border border-border bg-surface-subtle p-3">
  <div className="flex items-center justify-between gap-2">
   <h4 className="text-sm font-semibold text-foreground">Materials ({materials.length}/20)</h4>
   {loading?<span role="status" className="text-xs">Loading…</span>:null}
  </div>
  {!loading&&!materials.length?<p className="text-xs text-muted-foreground">No Resource materials.</p>:null}
  {materials.some(material=>material.kind==="FILE"&&material.uploadStatus!=="READY")?
   <Alert tone="warning" role="status">Some Resource files are unavailable. Contact your instructor.</Alert>:null}
  {editable?<p role="status" className="text-xs text-muted-foreground">
   Audience: {deliveryId?"Selected Section":"Shared course"}. Change the audience in the parent content editor before adding files. Verified private file uploads are managed separately; unverified files cannot be made available to learners.
  </p>:null}
  <ul className="space-y-2">
   {materials.map(material=><li key={material.id} className="flex flex-wrap items-start gap-2 rounded-[var(--lms-control-radius)] border border-border bg-surface p-2">
    <div className="min-w-0 flex-1">
     <p className="break-words text-sm font-semibold">{material.title}</p>
     {material.notes?<p className="whitespace-pre-wrap text-xs text-body">{material.notes}</p>:null}
     {material.kind==="LINK"&&facultyContentExternalHref("RESOURCE",material.externalUrl)?
      <a href={facultyContentExternalHref("RESOURCE",material.externalUrl)!} target="_blank" rel="noopener noreferrer"
       className="inline-flex min-h-11 items-center text-xs font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary)] md:min-h-9">Open</a>:
      material.kind==="FILE"?<div className="flex items-center gap-2">
       {material.uploadStatus==="READY"?
        <Button size="sm" type="button" variant="secondary"
         className="min-h-11 md:min-h-9"
         loading={openingMaterialId===material.id}
         disabled={busy||openingMaterialId!==null}
         onClick={()=>void openFile(material.id)}>
         {openingMaterialId===material.id?"Preparing file…":"Open"}
        </Button>:
        <span role="status" className="text-xs text-muted-foreground">File unavailable</span>}
      </div>:null}
    </div>
    {editable&&material.kind==="LINK"?<div className="flex gap-2">
     <Button size="sm" type="button" variant="secondary" className="min-h-11 md:min-h-9" disabled={busy}
      onClick={()=>{setEditing(material.id);setDraft({title:material.title,notes:material.notes??"",externalUrl:material.externalUrl??""});}}>
      Edit
     </Button>
     <Button size="sm" type="button" variant="danger" className="min-h-11 md:min-h-9" disabled={busy}
      onClick={()=>void submit("REMOVE",material.id)}>Remove</Button>
    </div>:null}
   </li>)}
  </ul>
  {editable&&(materials.length<20||editing)?<div className="grid gap-2 rounded-xl border border-border bg-surface p-3">
   <p className="text-sm font-semibold text-foreground">{editing?"Edit link material":"Add link material"}</p>
   <label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Title
    <Input value={draft.title} maxLength={255} onChange={e=>setDraft(v=>({...v,title:e.target.value}))}
     className="min-h-11 md:min-h-9" disabled={busy}/>
   </label>
   <label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">HTTPS link
    <Input type="url" value={draft.externalUrl} maxLength={2048} onChange={e=>setDraft(v=>({...v,externalUrl:e.target.value}))}
     className="min-h-11 md:min-h-9" disabled={busy}/>
   </label>
   <label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Notes (optional)
    <Textarea value={draft.notes} maxLength={2000} onChange={e=>setDraft(v=>({...v,notes:e.target.value}))}
     rows={2} className="min-h-28" disabled={busy}/>
   </label>
   <div className="flex gap-2">
    <Button size="sm" type="button" className="min-h-11 md:min-h-9" loading={busy} disabled={busy} onClick={()=>void submit(editing?"EDIT_LINK":"ADD_LINK",editing??undefined)}>
     {busy?"Saving…":editing?"Save material":"Add material"}
    </Button>
    {editing?<Button size="sm" type="button" variant="secondary" className="min-h-11 md:min-h-9" disabled={busy}
     onClick={()=>{setEditing(null);setDraft(blank);}}>Cancel edit</Button>:null}
   </div>
  </div>:null}
  {error?<Alert tone="error">{error}</Alert>:null}
  {notice?<Alert tone="success">{notice}</Alert>:null}
 </section>;
}
