"use client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {useEffect,useRef,useState} from "react";
import {Button} from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Dialog } from "@/components/ui/dialog";
import {facultyContentExternalHref} from "@/modules/courses/faculty-content-preview-model";

type Material={id:string;kind:string;title:string;notes:string|null;externalUrl:string|null;
 originalName:string|null;sizeBytes:number|null;sequence:number;uploadStatus:string};
const blank={title:"",notes:"",externalUrl:""};
function materialLabel(material:Material,index:number){
 return material.title?.trim()||material.originalName?.trim()||"Material "+(index+1);
}
function materialSize(size:number|null){
 if(size==null||!Number.isFinite(size)||size<0)return null;
 if(size>=1024*1024)return (size/(1024*1024)).toFixed(1)+" MB";
 return Math.round(size/1024)+" KB";
}
function materialType(material:Material){
 if(material.kind==="LINK")return {glyph:"🔗",label:"Link"};
 const name=(material.originalName||material.title||"").toLowerCase();
 if(/\.pdf$/.test(name))return {glyph:"📕",label:"PDF"};
 if(/\.(jpg|jpeg|png|gif|svg|webp)$/.test(name))return {glyph:"🖼️",label:"Image"};
 if(/\.(xls|xlsx|csv|ods)$/.test(name))return {glyph:"📊",label:"Spreadsheet"};
 if(/\.(doc|docx|odt)$/.test(name))return {glyph:"📄",label:"Document"};
 if(/\.(ppt|pptx|odp)$/.test(name))return {glyph:"📽️",label:"Presentation"};
 if(/\.(zip|rar|7z|tar|gz)$/.test(name))return {glyph:"🗜️",label:"Archive"};
 return {glyph:"📁",label:"File"};
}
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
 const [pendingRemove,setPendingRemove]=useState<string|null>(null);
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
  setMaterials([]);setDraft(blank);setEditing(null);setBusy(false);setOpeningMaterialId(null);setPendingRemove(null);
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
  const trimmed={title:draft.title.trim(),notes:draft.notes.trim()||null,externalUrl:draft.externalUrl.trim()};
  if(action!=="REMOVE"&&!facultyContentExternalHref("RESOURCE",trimmed.externalUrl)){
   setError("Enter a valid HTTPS URL without credentials or spaces.");return;
  }
  if(action!=="REMOVE"&&!trimmed.title){
   // The old Resource composer allowed link title to be omitted. Keep
   // imported/fallback labels stable while writing a valid vNext title.
   try{trimmed.title=new URL(trimmed.externalUrl).hostname.slice(0,255);}
   catch{setError("Enter a valid HTTPS link.");return;}
  }
  setBusy(true);setError(null);setNotice(null);
  try{
   const response=await fetch(uri,{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify(action==="REMOVE"?{action,materialId:id}:
     action==="EDIT_LINK"?{...trimmed,action,materialId:id}:{...trimmed,action})});
   if(!response.ok)throw new Error("Could not save resource material. Check your permissions and try again.");
   await reload();
   if(currentUriRef.current!==uri)return;
   setDraft(blank);setEditing(null);setPendingRemove(null);
   setNotice(action==="REMOVE"?"Material removed.":action==="EDIT_LINK"?"Material updated.":"Material added.");
  }catch(cause){
   if(currentUriRef.current===uri)setError(cause instanceof Error?cause.message:"Material change failed.");
  }finally{
   if(currentUriRef.current===uri)setBusy(false);
  }
 }
 return <section aria-label="Resource materials" className="mt-4 min-w-0 space-y-3">
  <div className="flex items-center justify-between gap-2">
   <h4 className="text-sm font-semibold text-foreground">Materials <span className="font-normal text-muted-foreground">({materials.length})</span></h4>
   {loading?<span role="status" className="text-xs">Loading…</span>:null}
  </div>
  {!loading&&!error&&!materials.length?<p className="text-sm text-muted-foreground">No Resource materials</p>:null}
  {materials.some(material=>material.kind==="FILE"&&material.uploadStatus!=="READY")?
   <Alert tone="warning" role="status">Some Resource files are unavailable. Contact your instructor.</Alert>:null}
  {editable?<p role="status" className="text-xs text-muted-foreground">
   Audience: {deliveryId?"Selected Section":"Shared course"}. The parent Resource controls who can access uploaded files; file links require verified private grants.
  </p>:null}
  <ul className="min-w-0 divide-y divide-border" aria-label="Materials list">
   {materials.map((material,index)=>{
    const label=materialLabel(material,index);
    const icon=materialType(material);
    const size=materialSize(material.sizeBytes);
    const href=material.kind==="LINK"?facultyContentExternalHref("RESOURCE",material.externalUrl):null;
    const unavailable=material.kind==="FILE"?material.uploadStatus!=="READY":!href;
    return <li key={material.id} className="flex min-w-0 flex-wrap items-center gap-3 py-3 first:pt-0">
     <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-subtle text-lg">{icon.glyph}</span>
     <div className="min-w-0 flex-1">
      <p className="break-words text-sm font-semibold text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">{icon.label}{size?" · "+size:""}</p>
      {material.notes?<p className="mt-1 whitespace-pre-wrap break-words text-xs text-body">{material.notes}</p>:null}
     </div>
     <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
      {unavailable?<span role="status" className="text-xs text-muted-foreground">Unavailable</span>:
       href?<a href={href} target="_blank" rel="noopener noreferrer" aria-label={"Open "+label}
        className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-primary md:min-h-9">Open</a>:
       <Button size="sm" type="button" variant="secondary"
        aria-label={(icon.label==="PDF"?"Open or download ":"Open ")+label}
        loading={openingMaterialId===material.id} disabled={busy||openingMaterialId!==null}
        onClick={()=>void openFile(material.id)}>
        {openingMaterialId===material.id?"Preparing file…":icon.label==="PDF"?"Open / Download":"Open"}
       </Button>}
      {editable&&material.kind==="LINK"?<>
       <Button size="sm" type="button" variant="ghost" disabled={busy}
        aria-label={"Edit "+label}
        onClick={()=>{setEditing(material.id);setDraft({
         title:material.title||"",notes:material.notes??"",externalUrl:material.externalUrl??"",
        });}}>Edit</Button>
       <Button size="sm" type="button" variant="ghost" disabled={busy}
        aria-label={"Remove "+label} onClick={()=>setPendingRemove(material.id)}>Remove</Button>
      </>:null}
     </div>
    </li>;
   })}
  </ul>
  {editable&&(materials.length<20||editing)?<div className="grid gap-2 rounded-[var(--lms-control-radius)] border border-border bg-surface p-3">
   <p className="text-sm font-semibold text-foreground">{editing?"Edit link material":"Add link material"}</p>
   <label className="grid gap-1 text-[13px] font-semibold text-body">Title (optional)
    <Input value={draft.title} maxLength={255} onChange={e=>setDraft(v=>({...v,title:e.target.value}))}
     className="min-h-11 md:min-h-9" disabled={busy} placeholder="Uses link domain if blank"/>
   </label>
   <label className="grid gap-1 text-[13px] font-semibold text-body">HTTPS link
    <Input type="url" required value={draft.externalUrl} maxLength={2048}
     onChange={e=>setDraft(v=>({...v,externalUrl:e.target.value}))}
     className="min-h-11 md:min-h-9" disabled={busy} placeholder="https://example.com/resource"/>
   </label>
   <label className="grid gap-1 text-[13px] font-semibold text-body">Notes (optional)
    <Textarea value={draft.notes} maxLength={2000}
     onChange={e=>setDraft(v=>({...v,notes:e.target.value}))}
     rows={3} placeholder="Context for learners" disabled={busy}/>
   </label>
   <div className="flex flex-wrap items-center gap-2">
    <Button size="sm" type="button" loading={busy} disabled={busy}
     onClick={()=>void submit(editing?"EDIT_LINK":"ADD_LINK",editing??undefined)}>
     {busy?"Saving…":editing?"Save material":"Add material"}
    </Button>
    {editing?<Button size="sm" type="button" variant="secondary" disabled={busy}
     onClick={()=>{setEditing(null);setDraft(blank);}}>Cancel edit</Button>:null}
    <span className="text-xs text-muted-foreground">{materials.length} of 20 materials</span>
   </div>
  </div>:null}
  <Dialog open={pendingRemove!==null} onOpenChange={open=>{if(!open)setPendingRemove(null);}}
   title="Remove this material?"
   description="Students will no longer see this link. Uploaded Resource files and the parent Resource are retained."
   footer={<>
    <Button type="button" variant="secondary" disabled={busy} onClick={()=>setPendingRemove(null)}>Cancel</Button>
    <Button type="button" variant="danger" loading={busy} disabled={busy} onClick={()=>{
     if(pendingRemove)void submit("REMOVE",pendingRemove);
    }}>Remove material</Button>
   />}>
   <p className="text-sm text-body">Remove this link from the Resource materials list?</p>
  </Dialog>
  {error?<Alert tone="error">{error}</Alert>:null}
  {notice?<Alert tone="success">{notice}</Alert>:null}
 </section>;
}
