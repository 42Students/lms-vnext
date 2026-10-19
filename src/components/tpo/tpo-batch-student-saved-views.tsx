"use client";
import {Radio} from "@/components/ui/radio";
import {Checkbox} from "@/components/ui/checkbox";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {useRef,useState} from "react";
import {useRouter,useSearchParams} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {tpoBatchViewUrl,type TpoBatchSavedFilter} from "@/modules/placements/tpo-batch-saved-view-model";
import {batchStudentViewExportHref} from "@/modules/placements/tpo-batch-student-filtered-export-model";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
type View={id:string;name:string;query:TpoBatchSavedFilter;pinned:boolean;createdAt:string};
export function TpoBatchStudentSavedViews({batchId}:{batchId:string}){
 const router=useRouter(),params=useSearchParams();
 const {run,pending:guarded}=useGuardedAction();
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false);
 const [views,setViews]=useState<View[]>([]);
 const [selected,setSelected]=useState("");
 const [deleteTarget,setDeleteTarget]=useState<View|null>(null);
 const inFlightRef=useRef(false);
 const [name,setName]=useState("");
 const [pinned,setPinned]=useState(false);
 const [error,setError]=useState(""),[notice,setNotice]=useState("");
 const api="/api/placements/tpo/batches/"+encodeURIComponent(batchId)+"/saved-views";
 function current():TpoBatchSavedFilter{
  const field=(key:string)=>params.get(key)??undefined;
  const value={batchId,q:field("q")??"",classId:field("classId"),
   decision:field("decision")??"ALL",source:field("source")??"ALL",
   registration:field("registration")??"ALL",order:field("order")??"NAME_ASC"};
  return value as TpoBatchSavedFilter;
 }
 async function load(){
  const result=await apiFetch<View[]>(api,{method:"GET",cache:"no-store"});
  if(!Array.isArray(result))throw new Error("Saved batch views could not be loaded.");
  setViews(result);
 }
 async function action(payload:Record<string,unknown>){
  if(busy||guarded||inFlightRef.current)return null;
  inFlightRef.current=true;
  setBusy(true);setError("");setNotice("");
  try{
   const response=await apiFetch<{id?:string;query?:TpoBatchSavedFilter}>(api,{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),
   });
   await load();setNotice("Saved batch views updated.");router.refresh();
   return response;
  }catch{setError("Could not save the batch view. Check the name and filters, then try again.");return null;}
  finally{inFlightRef.current=false;setBusy(false);}
 }
 async function openSaved(view:View){
  const response=await action({action:"OPEN",id:view.id});
  if(response?.query)router.push(tpoBatchViewUrl(response.query));
 }
 function toggle(){
  if(open){setOpen(false);return;}
  setOpen(true);setBusy(true);setError("");
  void load().catch(()=>setError("Could not load saved batch views.")).finally(()=>setBusy(false));
 }
 const selectedView=views.find(view=>view.id===selected);
 return <section aria-label="BATCH_STUDENTS saved views" className="space-y-2">
  <Button variant="secondary" type="button" aria-expanded={open} onClick={toggle}
   >Saved batch views</Button>
  {open?<div className="space-y-3 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
   <h3 className="font-semibold">Saved views</h3>
   <p className="text-xs text-body">These filters are private to your account and this batch. Pin up to five views.</p>
   <div className="flex flex-wrap gap-2" aria-label="Pinned batch views">
    {views.filter(view=>view.pinned).map(view=><Button variant="secondary" type="button" key={view.id}
      disabled={busy||guarded} onClick={()=>void openSaved(view)}
      >{view.name}</Button>)}
   </div>
   <label className="block text-sm">View name
    <Input value={name} onChange={e=>setName(e.target.value)} maxLength={100}
     className="mt-1"/></label>
   <label className="flex min-h-11 items-center gap-2 text-sm">
    <Checkbox  checked={pinned} onChange={e=>setPinned(e.target.checked)}/>Pin view</label>
   <div className="flex flex-wrap gap-2">
    <Button variant="primary" type="button" disabled={busy||guarded||!name.trim()} onClick={()=>void action({
     action:"CREATE",name:name.trim(),pinned,filters:current(),
    })} >Save current filters</Button>
    <Button variant="secondary" type="button" disabled={busy||guarded||!selected||!name.trim()} onClick={()=>void action({
     action:"UPDATE",id:selected,name:name.trim(),pinned,filters:current(),
    })} >Update selected</Button>
   </div>
   <ul className="space-y-2">{views.map(view=><li key={view.id}
    className="flex flex-wrap items-center gap-2 rounded-[var(--lms-canvas-radius)] border border-border p-2 text-sm">
    <label className="flex min-h-11 items-center gap-2">
     <Radio  name="selected-batch-view" checked={selected===view.id}
      onChange={()=>{setSelected(view.id);setName(view.name);setPinned(view.pinned);}}/>
     {view.name}{view.pinned?" · Pinned":""}
    </label>
    <Button variant="secondary" type="button" disabled={busy||guarded} onClick={()=>void openSaved(view)}
     >Open</Button>
    <a href={batchStudentViewExportHref(batchId,1,view.query)}
     className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border px-2">Download CSV</a>
    <Button variant="secondary" type="button" disabled={busy||guarded} onClick={()=>setDeleteTarget(view)}
     >Delete</Button>
   </li>)}</ul>
   {selectedView?<p className="text-xs text-body">Selected: {selectedView.name}</p>:null}
   {!views.length?<p className="text-sm">No saved batch views yet.</p>:null}
   {notice?<p role="status" className="text-sm">{notice}</p>:null}
   {error?<p role="alert" className="text-sm">{error}</p>:null}
  </div>:null}
  <ConfirmDialog open={deleteTarget!==null}
   onOpenChange={open=>{if(!open&&!busy&&!guarded)setDeleteTarget(null);}}
   title="Delete this saved batch view?"
   description={deleteTarget?.name}
   confirmLabel="Delete" pending={busy||guarded}
   onConfirm={()=>{if(!deleteTarget||busy||guarded)return;
    const id=deleteTarget.id;
    void run(async()=>{const result=await action({action:"DELETE",id});if(result)setDeleteTarget(null);});
   }}/>
 </section>;
}
