"use client";
import {Checkbox} from "@/components/ui/checkbox";
import {Radio} from "@/components/ui/radio";
import {Input} from "@/components/ui/input";
import {apiFetch} from "@/lib/api-fetch";
import {Dialog} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {InlineNotice} from "@/components/ui/inline-notice";
import {Disclosure} from "@/components/ui/disclosure";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {useEffect,useId,useState} from "react";
import {useRouter,useSearchParams} from "next/navigation";
type Selection={journeyState?:string;branchId?:string;batchId?:string;search?:string;
 pageSize:number;columns?:string};
type View={id:string;name:string;query:Selection;pinned:boolean;createdAt:string;
 lastUsedAt?:string;updatedAt?:string};
const api="/api/placements/tpo/students/saved-views";
function filterQuery(params:URLSearchParams):Selection{
 const view:Selection={pageSize:Number(params.get("pageSize")??25)};
 for(const key of ["journeyState","branchId","batchId","search","columns"] as const){
  const v=params.get(key);if(v)view[key]=v;
 }
 return view;
}
function hrefFor(query:Selection){
 const p=new URLSearchParams();
 for(const key of ["journeyState","branchId","batchId","search","columns"] as const){
  if(query[key])p.set(key,query[key]!);
 }
 if(query.pageSize!==25)p.set("pageSize",String(query.pageSize));
 return "/tpo/students"+(p.size?"?"+p.toString():"");
}
export function TpoStudentSavedViews({embedded=false}:{embedded?:boolean}){
 const router=useRouter(),params=useSearchParams();
 const viewsPanelId=useId();
 const [open,setOpen]=useState(embedded);
 const [rows,setRows]=useState<View[]>([]);
 const [name,setName]=useState("");
 const [pinned,setPinned]=useState(false);
 const [selected,setSelected]=useState<string|null>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [deleteTarget,setDeleteTarget]=useState<View|null>(null);
 const {run:runGuarded,pending:guardedPending}=useGuardedAction();
 async function load(){
  setBusy(true);setError("");
  try{const body=await apiFetch<View[]>(api,{cache:"no-store"});
   if(!Array.isArray(body))throw Error("Could not load saved views. Try again.");
   setRows(body);
  }catch(e){setError(e instanceof Error?e.message:"Could not load saved views");}
  finally{setBusy(false);}
 }
 useEffect(()=>{if(embedded)void load();},[embedded]);
 async function send(input:Record<string,unknown>){
  setBusy(true);setError("");setNotice("");
  try{
   const body=await apiFetch<{id?:string}>(api,{method:"POST",credentials:"same-origin",
    headers:{"content-type":"application/json"},body:JSON.stringify(input)});
   setNotice("Saved views updated.");await load();router.refresh();return body;
  }catch(e){setError(e instanceof Error?e.message:"View action failed");return null;}
  finally{setBusy(false);}
 }
 const chosen=rows.find(row=>row.id===selected);
 const pins=rows.filter(x=>x.pinned).slice(0,5);
 const recent=rows.filter(x=>x.lastUsedAt).slice().sort((a,b)=>
  (b.lastUsedAt??"").localeCompare(a.lastUsedAt??"")).slice(0,3);
 async function use(view:View){
  const receipt=await send({action:"OPEN",id:view.id});
  if(receipt)router.push(hrefFor(view.query));
 }
 return <section className="min-w-0 space-y-3">
  {!embedded?<Button variant="secondary" type="button" aria-expanded={open} aria-controls={open?viewsPanelId:undefined} onClick={()=>{
   setOpen(v=>!v);if(!open)void load();
  }}>
   Saved student views</Button>:null}
  {open?<div id={viewsPanelId} role="region" aria-label="Saved student views" className="w-full min-w-0 max-w-4xl space-y-4 border-y border-border py-4">
   <h2 className="font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">Saved views</h2>
   {busy&&!deleteTarget?<p role="status" className="text-sm text-body leading-[22px]">Loading saved views…</p>:null}
   {pins.length?<div role="group" aria-label="Pinned student views" className="flex min-w-0 flex-wrap gap-2"><strong className="w-full text-sm">Pinned</strong>
    {pins.map(view=><Button className="min-h-11 w-full break-words sm:w-auto md:min-h-9" variant="secondary" key={view.id} type="button" disabled={busy} onClick={()=>void use(view)}
     >{view.name}</Button>)}
   </div>:null}
   {recent.length?<div role="group" aria-label="Recent student views" className="flex min-w-0 flex-wrap gap-2"><strong className="w-full text-sm">Recent</strong>
    {recent.map(view=><Button className="min-h-11 w-full break-words sm:w-auto md:min-h-9" variant="secondary" type="button" key={view.id} disabled={busy} onClick={()=>void use(view)}
     >{view.name}</Button>)}</div>:null}
   <Disclosure title="Save or update a view" className="border-t border-border" contentClassName="space-y-3 px-2 pb-3">
   <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">View name
    <Input className="w-full min-w-0" value={name} maxLength={100} disabled={busy} onChange={e=>setName(e.target.value)}
     />
   </label>
   <label className="flex min-h-11 min-w-0 items-center gap-2 text-sm"><Checkbox checked={pinned} disabled={busy} onChange={e=>setPinned(e.target.checked)}/>Pin view (up to 5)</label>
   <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
    <Button className="min-h-11 w-full sm:w-auto md:min-h-9" variant="primary" type="button" disabled={busy||!name.trim()} onClick={()=>void send({
     action:"CREATE",name:name.trim(),filters:filterQuery(new URLSearchParams(params.toString())),pinned,
    })} >Save current filters</Button>
    {selected?<Button className="min-h-11 w-full sm:w-auto md:min-h-9" variant="secondary" type="button" disabled={busy||!name.trim()} onClick={()=>void send({
     action:"UPDATE",id:selected,name:name.trim(),filters:filterQuery(new URLSearchParams(params.toString())),pinned,
    })} >Update selected view</Button>:null}
   </div>
   {chosen?<p className="break-words text-xs text-muted-foreground leading-[20px]">Selected view: {chosen.name}. Update saves the filters currently visible on this page.</p>:null}
   </Disclosure>
   <div className="max-h-64 min-w-0 divide-y divide-border overflow-auto overscroll-contain">
    {rows.map(view=><div key={view.id} className="flex min-h-11 min-w-0 flex-col items-stretch gap-2 py-3 sm:flex-row sm:items-center">
     <label className="flex min-h-11 min-w-0 flex-1 items-center gap-3">
      <Radio aria-label={"Select "+view.name} name="selected-view" disabled={busy} checked={selected===view.id}
       onChange={()=>{setSelected(view.id);setName(view.name);setPinned(view.pinned);}}/>
      <strong className="min-w-0 flex-1 break-words text-sm">{view.name}</strong>
      {view.pinned?<span className="shrink-0 text-xs text-muted-foreground">Pinned</span>:null}
     </label>

     <div className="flex min-w-0 items-center gap-2">
      <Button className="min-h-11 flex-1 sm:flex-none md:min-h-9" variant="secondary" type="button" disabled={busy} onClick={()=>void use(view)}>Open</Button>
      <Button className="min-h-11 flex-1 sm:flex-none md:min-h-9" variant="ghost" type="button" disabled={busy} onClick={()=>setDeleteTarget(view)}>Delete</Button>
     </div>
    </div>)}
    {!rows.length&&!busy&&!error?<p role="status" className="py-3 text-sm text-muted-foreground leading-[22px]">No saved student views.</p>:null}
   </div>
   <Dialog role="alertdialog" open={deleteTarget!==null} onOpenChange={value=>{if(!value&&!busy&&!guardedPending)setDeleteTarget(null);}}
    title="Delete saved view" description={"Delete saved view "+(deleteTarget?.name??"")+"?"}
    footer={<div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button className="min-h-11 w-full sm:w-auto md:min-h-9" variant="secondary" disabled={busy||guardedPending} onClick={()=>setDeleteTarget(null)}>Cancel</Button>
      <Button className="min-h-11 w-full sm:w-auto md:min-h-9" variant="danger" loading={busy||guardedPending} disabled={busy||guardedPending} onClick={()=>void runGuarded(async()=>{
        if(!deleteTarget)return;
        const result=await send({action:"DELETE",id:deleteTarget.id});
        if(result){
          if(selected===deleteTarget.id){setSelected(null);setName("");setPinned(false);}
          setDeleteTarget(null);
        }
      })}>Delete view</Button></div>}>
      <p className="text-sm leading-[22px]">The saved view will be removed. Student records will not be changed.</p>
   </Dialog>
   {error?<InlineNotice tone="error" message={error}/>:null}
   {notice?<InlineNotice tone="success" message={notice}/>:null}
  </div>:null}
 </section>;
}
