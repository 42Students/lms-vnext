"use client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {useEffect,useRef,useState} from "react";
import {Button} from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {facultyContentExternalHref} from "@/modules/courses/faculty-content-preview-model";
import {LessonResourceFileUploader} from "./lesson-resource-file-uploader";

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
 const [openingMaterialIds,setOpeningMaterialIds]=useState<string[]>([]);
 const [removeId,setRemoveId]=useState<string|null>(null);
 const openingRef=useRef<Set<string>>(new Set());
 const uri="/api/courses/lesson-contents/"+encodeURIComponent(contentId)+"/materials"+
  (deliveryId?"?deliveryId="+encodeURIComponent(deliveryId):"");
 const [prevUri,setPrevUri]=useState(uri);
 const currentUriRef=useRef(uri);
 currentUriRef.current=uri;
 if(prevUri!==uri){
  // An old Section or acting-college may have been visible on this mounted
  // component. Never show those private materials while the new scope loads.
  setPrevUri(uri);setLoading(true);setError(null);setNotice(null);
  setMaterials([]);setDraft(blank);setEditing(null);setBusy(false);setOpeningMaterialIds([]);setRemoveId(null);
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
  const openingKey=uri+"|"+materialId;
  if(openingRef.current.has(openingKey))return;
  openingRef.current.add(openingKey);
  setOpeningMaterialIds(ids=>ids.includes(openingKey)?ids:[...ids,openingKey]);
  setError(null);
  // Materials open in the same tab (no popup windows, per the UX guard), so
  // the signed URL is followed directly once it has been issued.
  const reserved:Window|null=null;
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
   if(currentUriRef.current!==uri){reserved?.close();return;}
   if(reserved&&!reserved.closed){
    try{reserved.location.replace(target.href);}
    catch{reserved.close();window.location.assign(target.href);}
   }else window.location.assign(target.href);
  }catch{
   reserved?.close();
   if(currentUriRef.current===uri)
    setError("Resource file is unavailable. Contact your instructor.");
  }finally{
   window.clearTimeout(timeout);
   openingRef.current.delete(openingKey);
   if(currentUriRef.current===uri)
    setOpeningMaterialIds(ids=>ids.filter(id=>id!==openingKey));
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
  }catch{
   if(currentUriRef.current===uri)setError("Could not save resource material. Check your permissions and try again.");
  }finally{
   if(currentUriRef.current===uri)setBusy(false);
  }
 }
 const activeMaterials=materials.filter(material=>material.uploadStatus!=="DELETED");
 return <section aria-label="Resource materials" className="mt-4 space-y-3 rounded-xl border border-border bg-surface-subtle p-3">
  <div className="flex items-center justify-between gap-2">
   <h4 className="text-sm font-semibold text-foreground">Materials ({activeMaterials.length}/20)</h4>
   {loading?<span role="status" className="text-xs">Loading…</span>:null}
  </div>
  {!loading&&!activeMaterials.length?<p className="text-xs text-muted-foreground">No Resource materials.</p>:null}
  {activeMaterials.some(material=>material.kind==="FILE"&&material.uploadStatus!=="READY")?
   <Alert tone="warning" role="status">Some Resource files are unavailable. Contact your instructor.</Alert>:null}
  {editable?<p role="status" className="text-xs text-muted-foreground">
   Audience: {deliveryId?"Selected Section":"Shared course"}. Change the audience in the parent content editor before uploading. File materials are private until verified by the security scanner.
  </p>:null}
  <ul className="space-y-2">
   {activeMaterials.map(material=><li key={material.id} className="flex flex-wrap items-start gap-2 rounded-[var(--lms-control-radius)] border border-border bg-surface p-2">
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
         loading={openingMaterialIds.includes(uri+"|"+material.id)}
         disabled={busy||openingMaterialIds.includes(uri+"|"+material.id)}
         onClick={()=>void openFile(material.id)}>
         {openingMaterialIds.includes(uri+"|"+material.id)?"Preparing file…":"Open"}
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
      onClick={()=>setRemoveId(material.id)}>Remove</Button>
    </div>:null}
   </li>)}
  </ul>
  {editable&&(activeMaterials.length<20||editing)?<div className="grid gap-2 rounded-xl border border-border bg-surface p-3">
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
  {editable?<LessonResourceFileUploader key={uri} contentId={contentId} deliveryId={deliveryId}
   materials={activeMaterials} onChanged={reload}/>:null}
  <ConfirmDialog open={removeId!==null} onOpenChange={open=>{if(!open&&!busy)setRemoveId(null);}}
   title="Remove this material?" description="Students will no longer see it."
   confirmLabel="Remove" pending={busy} onConfirm={()=>{const id=removeId;setRemoveId(null);if(id)void submit("REMOVE",id);}}/>
  {error?<Alert tone="error">{error}</Alert>:null}
  {notice?<Alert tone="success">{notice}</Alert>:null}
 </section>;
}
