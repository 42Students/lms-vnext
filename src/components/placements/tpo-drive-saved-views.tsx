"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
type Saved={name:string;query:string};
const MAX=8;
export function TpoDriveSavedViews({scopeKey}:{scopeKey:string}){
 const router=useRouter(),key="tpo-drive-views:"+scopeKey;
 const [views,setViews]=useState<Saved[]>([]),[name,setName]=useState(""),[error,setError]=useState("");
 useEffect(()=>{
  try{const raw=JSON.parse(localStorage.getItem(key)??"[]") as unknown;
   if(Array.isArray(raw))setViews(raw.filter((item):item is Saved=>
    typeof item==="object"&&item!==null&&
    typeof item.name==="string"&&item.name.length<=50&&
    typeof item.query==="string"&&item.query.length<=2000).slice(0,MAX));
  }catch{setViews([]);}
 },[key]);
 function save(){
  const label=name.trim();
  if(label.length<2||label.length>50){setError("Enter a view name between 2 and 50 characters.");return;}
  const query=window.location.search.replace(/^\?/,"").slice(0,2000);
  const next=[...views.filter(v=>v.name.toLowerCase()!==label.toLowerCase()),{name:label,query}].slice(-MAX);
  try{localStorage.setItem(key,JSON.stringify(next));setViews(next);setName("");setError("");}
  catch{setError("Browser storage is disabled. Use the URL to share this filter instead.");}
 }
 function remove(label:string){
  const next=views.filter(v=>v.name!==label);
  try{localStorage.setItem(key,JSON.stringify(next));setViews(next);setError("");}
  catch{setError("Browser storage is unavailable.");}
 }
 return <section aria-label="Saved drive views" className="rounded-xl border border-border bg-surface p-4">
  <h2 className="font-semibold">My saved views</h2>
  <p className="mt-1 text-xs text-body">Save up to {MAX} named filter links in this browser for your college account. They do not change records or share filters with colleagues.</p>
  <div className="mt-3 flex flex-wrap gap-2">
   <input aria-label="Saved view name" maxLength={50} value={name}
    onChange={e=>setName(e.target.value)} placeholder="e.g. Interviews this week"
    className="min-h-10 rounded border border-border bg-surface px-3 text-sm"/>
   <button type="button" onClick={save}
    className="min-h-10 rounded border border-primary px-3 text-sm font-semibold text-primary-text">
    Save current filters
   </button>
  </div>
  {error?<p role="alert" className="mt-2 text-xs text-error">{error}</p>:null}
  {views.length?<ul className="mt-3 flex flex-wrap gap-2">{views.map(view=>
   <li key={view.name} className="inline-flex items-center gap-1 rounded border border-border">
    <button type="button" onClick={()=>router.push("/tpo/placements/lifecycle"+(view.query?"?"+view.query:""))}
     className="min-h-9 px-3 text-sm font-semibold text-primary-text">{view.name}</button>
    <button type="button" onClick={()=>remove(view.name)}
     aria-label={"Delete saved view "+view.name} className="min-h-9 px-2 text-sm text-body">×</button>
   </li>)}</ul>:<p className="mt-2 text-sm text-body">No views saved in this browser yet.</p>}
 </section>;
}
