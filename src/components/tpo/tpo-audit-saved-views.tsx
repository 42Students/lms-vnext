"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
type View={name:string;kind:string;from:string;to:string;q:string;pinned:boolean;usedAt:number};
function safeViews(value:unknown):View[]{
 if(!Array.isArray(value))return [];
 return value.slice(0,12).flatMap(row=>{
  if(!row||typeof row!=="object")return [];
  const x=row as Record<string,unknown>;
  if(typeof x.name!=="string"||typeof x.kind!=="string"||typeof x.q!=="string"||
   typeof x.from!=="string"||typeof x.to!=="string")return [];
  return [{name:x.name.slice(0,50),kind:x.kind.slice(0,40),q:x.q.slice(0,120),
   from:x.from.slice(0,10),to:x.to.slice(0,10),pinned:x.pinned===true,
   usedAt:typeof x.usedAt==="number"&&Number.isFinite(x.usedAt)?x.usedAt:0}];
 });
}
export function TpoAuditSavedViews({collegeId,filters}:{collegeId:string;filters:{
 kind:string;from?:string;to?:string;q:string;
}}){
 const router=useRouter();
 const key="lms.tpo.audit.views."+collegeId;
 const [views,setViews]=useState<View[]>([]);
 const [name,setName]=useState("");
 const [selected,setSelected]=useState("");
 const [message,setMessage]=useState("");
 useEffect(()=>{try{setViews(safeViews(JSON.parse(localStorage.getItem(key)??"[]")));}catch{setViews([]);}},[key]);
 function persist(next:View[]){
  try{localStorage.setItem(key,JSON.stringify(next));setViews(next);return true;}
  catch{setMessage("This browser cannot store saved audit views.");return false;}
 }
 function save(){
  const title=name.trim();if(!title||title.length>50){setMessage("Name must be 1–50 characters.");return;}
  const existing=views.find(v=>v.name===title);
  if(views.length>=12&&!existing){setMessage("Maximum 12 saved audit views.");return;}
  if(persist([...views.filter(v=>v.name!==title),{...filters,from:filters.from??"",to:filters.to??"",
   name:title,pinned:existing?.pinned??false,usedAt:Date.now()}])){setSelected(title);setName("");setMessage("Audit view saved in this browser.");}
 }
 function apply(){
  const view=views.find(v=>v.name===selected);if(!view)return;
  const params=new URLSearchParams();
  if(view.kind&&view.kind!=="ALL")params.set("kind",view.kind);
  if(view.from)params.set("from",view.from);
  if(view.to)params.set("to",view.to);
  if(view.q)params.set("q",view.q);
  persist(views.map(v=>v.name===view.name?{...v,usedAt:Date.now()}:v));
  router.push("/tpo/audit"+(params.size?"?"+params:""));
 }
 function pin(){
  const current=views.find(v=>v.name===selected);if(!current)return;
  if(!current.pinned&&views.filter(v=>v.pinned).length>=5){setMessage("Maximum five pinned audit views.");return;}
  persist(views.map(v=>v.name===selected?{...v,pinned:!v.pinned}:v));
 }
 function rename(){
  const title=name.trim();if(!selected||!title||title.length>50)return;
  if(views.some(v=>v.name===title&&v.name!==selected)){setMessage("That name already exists.");return;}
  if(persist(views.map(v=>v.name===selected?{...v,name:title}:v))){setSelected(title);setName("");}
 }
 return <details className="rounded-xl border border-border bg-surface p-4">
  <summary className="cursor-pointer font-semibold">Saved audit views ({views.length}/12)</summary>
  <p className="mt-1 text-xs text-muted-foreground">Views are stored only in this browser for the current college. Server-wide syncing and sharing are not enabled.</p>
  <div className="mt-3 flex flex-wrap items-end gap-2">
   <label className="grid min-w-44 flex-1 gap-1 text-xs">View name
    <input value={name} maxLength={50} onChange={e=>setName(e.target.value)}
     className="min-h-10 rounded border border-border px-2 text-sm"/>
   </label>
   <button type="button" onClick={save} disabled={!name.trim()} className="min-h-10 rounded border border-border px-3 text-sm disabled:opacity-50">Save current</button>
  </div>
  {views.length?<div className="mt-3 flex flex-wrap gap-2">
   <label className="grid min-w-40 flex-1 gap-1 text-xs">Saved view
    <select value={selected} onChange={e=>setSelected(e.target.value)}
     className="min-h-10 rounded border border-border px-2 text-sm">
     <option value="">Select a view</option>
     {[...views].sort((a,b)=>Number(b.pinned)-Number(a.pinned)||b.usedAt-a.usedAt)
      .map(v=><option key={v.name} value={v.name}>{v.pinned?"★ ":""}{v.name}</option>)}
    </select>
   </label>
   <button type="button" disabled={!selected} onClick={apply} className="min-h-10 rounded border px-3 text-xs disabled:opacity-50">Open</button>
   <button type="button" disabled={!selected} onClick={pin} className="min-h-10 rounded border px-3 text-xs disabled:opacity-50">{views.find(v=>v.name===selected)?.pinned?"Unpin":"Pin"}</button>
   <button type="button" disabled={!selected||!name.trim()} onClick={rename} className="min-h-10 rounded border px-3 text-xs disabled:opacity-50">Rename</button>
   <button type="button" disabled={!selected} onClick={()=>{if(persist(views.filter(v=>v.name!==selected)))setSelected("");}}
    className="min-h-10 rounded border px-3 text-xs disabled:opacity-50">Delete</button>
  </div>:null}
  {message?<p role="status" className="mt-2 text-xs">{message}</p>:null}
 </details>;
}
