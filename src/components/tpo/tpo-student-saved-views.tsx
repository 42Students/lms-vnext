"use client";
import {Checkbox} from "@/components/ui/checkbox";
import {Radio} from "@/components/ui/radio";
import {Input} from "@/components/ui/input";
import {apiFetch} from "@/lib/api-fetch";
import {Dialog} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {useState} from "react";
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
export function TpoStudentSavedViews(){
 const router=useRouter(),params=useSearchParams();
 const [open,setOpen]=useState(false);
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
 return <section className="space-y-3">
  <Button variant="secondary" type="button" aria-expanded={open} onClick={()=>{
   setOpen(v=>!v);if(!open)void load();
  }} >
   Saved student views</Button>
  {open?<div className="w-full max-w-4xl space-y-4 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
   <h2 className="font-semibold">Saved views</h2>
   {pins.length?<div className="flex flex-wrap gap-2"><strong className="w-full text-sm">Pinned</strong>
    {pins.map(view=><Button variant="secondary" key={view.id} type="button" disabled={busy} onClick={()=>void use(view)}
     >{view.name}</Button>)}
   </div>:null}
   {recent.length?<div className="flex flex-wrap gap-2"><strong className="w-full text-sm">Recent</strong>
    {recent.map(view=><Button variant="secondary" type="button" key={view.id} disabled={busy} onClick={()=>void use(view)}
     >{view.name}</Button>)}</div>:null}
   <label className="grid gap-1 text-sm">View name
    <Input value={name} maxLength={100} onChange={e=>setName(e.target.value)}
     />
   </label>
   <label className="flex gap-2 text-sm"><Checkbox checked={pinned} onChange={e=>setPinned(e.target.checked)}/>Pin view (up to 5)</label>
   <div className="flex flex-wrap gap-2">
    <Button variant="primary" type="button" disabled={busy||!name.trim()} onClick={()=>void send({
     action:"CREATE",name:name.trim(),filters:filterQuery(new URLSearchParams(params.toString())),pinned,
    })} >Save current filters</Button>
    {selected?<Button variant="secondary" type="button" disabled={busy||!name.trim()} onClick={()=>void send({
     action:"UPDATE",id:selected,name:name.trim(),filters:filterQuery(new URLSearchParams(params.toString())),pinned,
    })} >Update selected view</Button>:null}
   </div>
   <div className="max-h-64 space-y-2 overflow-auto">
    {rows.map(view=><div key={view.id} className="flex flex-wrap items-center gap-2 rounded-[var(--lms-canvas-radius)] border border-border p-3">
     <Radio aria-label={"Select "+view.name} name="selected-view" checked={selected===view.id}
      onChange={()=>{setSelected(view.id);setName(view.name);setPinned(view.pinned);}}/>
     <strong className="min-w-28 text-sm">{view.name}</strong>
     {view.pinned?<span className="text-xs">Pinned</span>:null}

     <Button variant="secondary" type="button" disabled={busy} onClick={()=>void use(view)}
      >Open</Button>
     <Button variant="secondary" type="button" disabled={busy} onClick={()=>setDeleteTarget(view)} >Delete</Button>
    </div>)}
    {!rows.length?<p className="text-sm text-muted-foreground">No saved student views.</p>:null}
   </div>
   <Dialog open={deleteTarget!==null} onOpenChange={value=>{if(!value&&!busy&&!guardedPending)setDeleteTarget(null);}}
    title="Delete saved view" description={"Delete saved view "+(deleteTarget?.name??"")+"?"}
    footer={<><Button variant="secondary" disabled={busy||guardedPending} onClick={()=>setDeleteTarget(null)}>Cancel</Button>
      <Button disabled={busy||guardedPending} onClick={()=>void runGuarded(async()=>{
        if(!deleteTarget)return;
        const result=await send({action:"DELETE",id:deleteTarget.id});
        if(result)setDeleteTarget(null);
      })}>Delete view</Button></>}>
      <p className="text-sm">The saved view will be removed. Student records will not be changed.</p>
   </Dialog>
   {chosen?<p className="text-xs text-muted-foreground">Selected view: {chosen.name}. Update saves the filters currently visible on this page.</p>:null}
   {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
   {notice?<p role="status" className="text-sm">{notice}</p>:null}
  </div>:null}
 </section>;
}
