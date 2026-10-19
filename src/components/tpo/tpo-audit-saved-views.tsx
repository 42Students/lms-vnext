"use client";
import { Button } from "@/components/ui/button";
import {useCallback,useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {
 tpoAuditSavedFiltersSchema,tpoAuditSavedViewHref,
 type TpoAuditSavedFilters,type TpoAuditSavedView,type TpoAuditSavedViewCommand,
} from "@/modules/placements/tpo-audit-saved-view-model";

const endpoint="/api/placements/tpo/audit/saved-views";
type Result={ready:boolean;views:TpoAuditSavedView[]};
type MutationResult={id:string;filters?:TpoAuditSavedFilters};
export function TpoAuditSavedViews({filters}:{filters:{
 kind:string;from?:string;to?:string;q:string;who?:string;
}}){
 const router=useRouter();
 const [views,setViews]=useState<TpoAuditSavedView[]>([]);
 const [ready,setReady]=useState(false);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [name,setName]=useState("");
 const [selected,setSelected]=useState("");
 const [message,setMessage]=useState("");
 const [error,setError]=useState("");
 const inFlight=useRef(false);
 const selectedView=views.find(view=>view.id===selected);
 const load=useCallback(async(signal?:AbortSignal)=>{
  const response=await apiFetch<Result>(endpoint,{credentials:"same-origin",signal});
  setReady(response.ready);
  setViews(response.views);
  return response;
 },[]);
 useEffect(()=>{
  const controller=new AbortController();
  void load(controller.signal).catch(()=>{
   if(!controller.signal.aborted){
    setReady(false);
    setViews([]);
    setError("Could not load saved audit views. Refresh to try again.");
   }
  }).finally(()=>{
   if(!controller.signal.aborted)setLoading(false);
  });
  return ()=>controller.abort();
 },[load]);
 async function mutate(command:TpoAuditSavedViewCommand,confirmation:string):Promise<MutationResult|null>{
  if(inFlight.current||!ready)return null;
  inFlight.current=true;setBusy(true);setError("");setMessage("");
  try{
   const changed=await apiFetch<MutationResult>(endpoint,{
    method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify(command),
   });
   await load();
   setSelected(command.action==="DELETE"?"":changed.id);
   setMessage(confirmation);
   return changed;
  }catch(cause){
   if(cause instanceof FriendlyFetchError&&[0,499,504].includes(cause.status)){
    // The first mutation may already have committed. Reconcile with server;
    // never blindly retry a create, delete or pin after losing its reply.
    try{await load();}catch{}
    setError("The result of this change is uncertain. Review saved views before trying again.");
   }else if(cause instanceof FriendlyFetchError){
    if(cause.status===401||cause.status===403){
     setReady(false);setViews([]);
    }
    const code=cause.code;
    setError(code==="VIEW_LIMIT"?"Maximum 12 saved audit views.":
     code==="PIN_LIMIT"?"Maximum five pinned audit views.":
     code==="DUPLICATE_NAME"?"That saved view name already exists.":
     code==="VIEW_STALE"?"This view changed elsewhere. Refresh and apply your edits again.":
     code==="VIEW_NOT_FOUND"?"This view is no longer available. Refresh the list.":
     code==="STORAGE_PENDING"?"Saved audit view storage is not available yet.":
     cause.status===401?"Your session expired. Sign in again.":
     cause.status===403?"You no longer have permission to change saved views.":
     "Could not save this view. Refresh and try again.");
   }else setError("Could not save this view. Refresh and try again.");
   return null;
  }finally{inFlight.current=false;setBusy(false);}
 }
 async function save(){
  const title=name.trim();
  if(!title||title.length>50){setError("Name must be 1–50 characters.");return;}
  const parsed=tpoAuditSavedFiltersSchema.safeParse({
   kind:filters.kind,from:filters.from??"",to:filters.to??"",
   q:filters.q,who:filters.who??"",
  });
  if(!parsed.success){setError("Current audit filters are invalid. Clear filters and try again.");return;}
  const saved=await mutate({action:"CREATE",name:title,filters:parsed.data},
   "Audit view saved to your account.");
  if(saved)setName("");
 }
 async function open(){
  if(!selectedView)return;
  const result=await mutate({action:"OPEN",id:selectedView.id},"Audit view opened.");
  if(result?.filters)router.push(tpoAuditSavedViewHref(result.filters));
 }
 async function pin(){
  if(!selectedView)return;
  await mutate({action:"PIN",id:selectedView.id,expectedRevision:selectedView.revision,
   pinned:!selectedView.pinned},"Saved view updated.");
 }
 async function rename(){
  if(!selectedView)return;
  const title=name.trim();
  if(!title||title.length>50){setError("Name must be 1–50 characters.");return;}
  if(title===selectedView.name)return;
  const result=await mutate({action:"RENAME",id:selectedView.id,
   expectedRevision:selectedView.revision,name:title},"Saved view renamed.");
  if(result)setName("");
 }
 async function remove(){
  if(!selectedView||!window.confirm("Delete this saved audit view?"))return;
  await mutate({action:"DELETE",id:selectedView.id,
   expectedRevision:selectedView.revision},"Saved view deleted.");
 }
 return <details className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
  <summary className="cursor-pointer font-semibold">Saved audit views ({views.length}/12)</summary>
  <p className="mt-1 text-xs text-muted-foreground">
   {ready?"Saved audit views sync across your signed-in devices, privately for your TPO account and college.":
    loading?"Loading your saved audit views…":
    "Saved audit view storage is unavailable. Your current audit filters still work."}
  </p>
  <div className="mt-3 flex flex-wrap items-end gap-2">
   <label className="grid min-w-44 flex-1 gap-1 text-xs">View name
    <input value={name} maxLength={50} disabled={!ready||busy}
     onChange={event=>setName(event.target.value)}
     className="min-h-9 rounded-[var(--lms-control-radius)] border border-border px-2 text-sm"/>
   </label>
   <Button variant="secondary" type="button" onClick={()=>void save()} disabled={!ready||busy||!name.trim()}
    className="min-h-9">Save current</Button>
  </div>
  {views.length?<div className="mt-3 flex flex-wrap gap-2">
   <label className="grid min-w-40 flex-1 gap-1 text-xs">Saved view
    <select value={selected} onChange={event=>setSelected(event.target.value)}
     disabled={!ready||busy} className="min-h-9 rounded-[var(--lms-control-radius)] border border-border px-2 text-sm">
     <option value="">Select a view</option>
     {views.map(view=><option key={view.id} value={view.id}>
      {view.pinned?"★ ":""}{view.name}
     </option>)}
    </select>
   </label>
   <Button variant="secondary" type="button" disabled={!selectedView||busy} onClick={()=>void open()}
    className="min-h-9">Open</Button>
   <Button variant="secondary" type="button" disabled={!selectedView||busy} onClick={()=>void pin()}
    className="min-h-9">
    {selectedView?.pinned?"Unpin":"Pin"}
   </Button>
   <Button variant="secondary" type="button" disabled={!selectedView||busy||!name.trim()} onClick={()=>void rename()}
    className="min-h-9">Rename</Button>
   <Button variant="secondary" type="button" disabled={!selectedView||busy} onClick={()=>void remove()}
    className="min-h-9">Delete</Button>
  </div>:null}
  {error?<p role="alert" className="mt-2 text-sm text-error">{error}</p>:null}
  {message?<p role="status" className="mt-2 text-sm">{message}</p>:null}
 </details>;
}
