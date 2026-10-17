"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {moveRound} from "@/modules/placements/tpo-round-reorder-model";
import {useUnsavedDriveGuard} from "./use-unsaved-drive-guard";

type Round={id:string;name:string;sequence:number;status:string};
export function TpoRoundReorder({jobId,readiness}:{jobId:string;readiness:{
 allowed:boolean;reason:string|null;rounds:Round[];
}}){
 const router=useRouter();
 const {markDirty,clearDirty}=useUnsavedDriveGuard();
 const [ids,setIds]=useState(()=>readiness.rounds.map(round=>round.id));
 const [dragged,setDragged]=useState<string|null>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const [saved,setSaved]=useState(false);
 const roundsById=new Map(readiness.rounds.map(round=>[round.id,round]));
 const changed=ids.some((id,index)=>id!==readiness.rounds[index]?.id);
 async function save(){
  if(!changed||!readiness.allowed||busy)return;
  setBusy(true);setError(null);setSaved(false);
  try{
   const res=await fetch("/api/placements/jobs/"+encodeURIComponent(jobId)+"/rounds/reorder",{
    method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({roundIds:ids}),
   });
   if(!res.ok){
    const data=await res.json().catch(()=>null) as {error?:string}|null;
    throw new Error(data?.error==="PLACEMENT_ROUND_REORDER_INVALID"?
      "The order is locked now that results or students are in a round.":
      "The order could not be saved. Refresh and try again.");
   }
   clearDirty();setSaved(true);router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Could not reorder rounds.");}
  finally{setBusy(false);}
 }
 return <section aria-label="Reorder rounds" className="rounded-xl border border-border bg-surface p-5">
  <h2 className="text-base font-semibold text-foreground">Round order</h2>
  <p className="mt-1 text-sm text-body">Drag by the handle or use Move up / Move down. Save the order before you continue.</p>
  {!readiness.allowed?<p role="status" className="mt-2 text-sm text-body">{readiness.reason}</p>:null}
  <ol className="mt-3 space-y-2">{ids.map((id,index)=>{
   const round=roundsById.get(id);
   if(!round)return null;
   return <li key={id}
    className="flex flex-wrap items-center gap-2 rounded border border-border bg-surface-secondary p-3"
    onDragOver={event=>{if(readiness.allowed)event.preventDefault();}}
    onDrop={event=>{event.preventDefault();if(!readiness.allowed||!dragged||busy)return;setIds(current=>moveRound(current,dragged,index));markDirty();setDragged(null);setSaved(false);}}>
    <span draggable={readiness.allowed&&!busy} onDragStart={()=>setDragged(id)} onDragEnd={()=>setDragged(null)}
     title="Drag to reorder" aria-label={"Drag "+round.name} className={readiness.allowed?"cursor-grab select-none font-semibold":"font-semibold"}>☰</span>
    <span className="flex-1 text-sm font-semibold text-foreground">{index+1}. {round.name}</span>
    <button type="button" aria-label={"Move "+round.name+" up"} disabled={!readiness.allowed||busy||index===0}
     onClick={()=>{setIds(current=>moveRound(current,id,index-1));markDirty();setSaved(false);}}
     className="min-h-10 rounded border border-border px-3 text-xs disabled:opacity-50">Move up</button>
    <button type="button" aria-label={"Move "+round.name+" down"} disabled={!readiness.allowed||busy||index===ids.length-1}
     onClick={()=>{setIds(current=>moveRound(current,id,index+1));markDirty();setSaved(false);}}
     className="min-h-10 rounded border border-border px-3 text-xs disabled:opacity-50">Move down</button>
   </li>;
  })}</ol>
  {changed?<p role="status" className="mt-2 text-sm text-warning-text">Unsaved round order changes. Save or undo before leaving this page.</p>:null}
  <div className="mt-3 flex flex-wrap gap-2">
   <button type="button" disabled={!readiness.allowed||busy||!changed} onClick={()=>void save()}
    className="min-h-10 rounded bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50">
    {busy?"Saving…":"Save round order"}</button>
   <button type="button" disabled={busy||!changed} onClick={()=>{setIds(readiness.rounds.map(round=>round.id));clearDirty();setError(null);}}
    className="min-h-10 rounded border border-border px-4 text-sm disabled:opacity-50">Undo</button>
  </div>
  {error?<p role="alert" className="mt-3 text-sm text-error">{error}</p>:null}
  {saved?<p role="status" className="mt-3 text-sm text-body">Round order saved.</p>:null}
 </section>;
}
