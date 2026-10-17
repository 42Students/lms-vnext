"use client";
import {useEffect,useState} from "react";
import {useRouter,useSearchParams} from "next/navigation";
type SavedView={name:string;seasonId:string;jobId:string};
const keyFor=(path:string)=>"lms.tpo.report-view."+path.replace(/[^a-z0-9/-]/gi,"");
const clean=(value:unknown):SavedView[]=>Array.isArray(value)?value.flatMap(item=>
 item&&typeof item==="object"&&typeof item.name==="string"&&
 typeof item.seasonId==="string"&&typeof item.jobId==="string"?
 [{name:item.name.slice(0,50),seasonId:item.seasonId.slice(0,80),jobId:item.jobId.slice(0,80)}]:[]).slice(0,12):[];
export function TpoReportSavedFilters({path}:{path:string}){
 const router=useRouter(),params=useSearchParams();
 const [views,setViews]=useState<SavedView[]>([]);
 const [name,setName]=useState(""),[picked,setPicked]=useState("");
 const [message,setMessage]=useState("");
 useEffect(()=>{
  try{const stored=localStorage.getItem(keyFor(path));if(stored)setViews(clean(JSON.parse(stored)));}catch{/* Private browsing can disable storage. */}
 },[path]);
 function persist(next:SavedView[]){
  try{localStorage.setItem(keyFor(path),JSON.stringify(next));setViews(next);return true;}
  catch{setMessage("Browser storage is unavailable; saved views cannot be kept.");return false;}
 }
 function save(){
  const label=name.trim();
  if(!label||label.length>50){setMessage("Choose a name up to 50 characters.");return;}
  if(views.length>=12&&!views.some(item=>item.name===label)){setMessage("Up to 12 saved filters per report.");return;}
  const next=views.filter(item=>item.name!==label);
  next.push({name:label,seasonId:params.get("seasonId")??"",jobId:params.get("jobId")??""});
  if(persist(next)){setPicked(label);setName("");setMessage("Saved filters for this report.");}
 }
 function apply(){
  const selected=views.find(v=>v.name===picked);if(!selected)return;
  const next=new URLSearchParams();
  if(selected.seasonId)next.set("seasonId",selected.seasonId);
  if(selected.jobId)next.set("jobId",selected.jobId);
  router.push(path+(next.size?"?"+next:""));
  setMessage("Saved filters applied.");
 }
 function remove(){
  if(!picked)return;
  if(persist(views.filter(v=>v.name!==picked))){setPicked("");setMessage("Saved filter removed.");}
 }
 return <details className="min-w-0 rounded-xl border border-border bg-surface p-4">
  <summary className="cursor-pointer text-sm font-semibold">Saved filters ({views.length}/12)</summary>
  <p className="mt-2 text-xs text-muted-foreground">Save this report's season and drive filter in this browser. Nothing is sent to other users or devices.</p>
  <div className="mt-3 flex flex-wrap items-end gap-2">
   <label className="grid min-w-40 flex-1 gap-1 text-xs font-semibold">Name this view
    <input value={name} onChange={e=>setName(e.target.value)} maxLength={50}
     className="min-h-10 rounded border border-border px-2 text-sm" placeholder="e.g. Current season"/>
   </label>
   <button type="button" onClick={save} disabled={!name.trim()} className="min-h-10 rounded border border-border px-3 text-sm font-semibold text-primary-text disabled:opacity-50">Save current</button>
  </div>
  <div className="mt-3 flex flex-wrap items-end gap-2">
   <label className="grid min-w-40 flex-1 gap-1 text-xs font-semibold">Choose saved view
    <select value={picked} onChange={e=>setPicked(e.target.value)}
     className="min-h-10 rounded border border-border px-2 text-sm">
     <option value="">Select view</option>
     {views.map(v=><option key={v.name} value={v.name}>{v.name}</option>)}
    </select>
   </label>
   <button type="button" disabled={!picked} onClick={apply} className="min-h-10 rounded border border-border px-3 text-sm font-semibold text-primary-text disabled:opacity-50">Apply</button>
   <button type="button" disabled={!picked} onClick={remove} className="min-h-10 rounded border border-border px-3 text-sm font-semibold text-primary-text disabled:opacity-50">Delete</button>
  </div>
  {message?<p role="status" className="mt-2 text-xs text-body">{message}</p>:null}
 </details>;
}
