"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
type Saved={name:string;query:string};
const MAX=8;
export function TpoDriveSavedViews({scopeKey}:{scopeKey:string}){
 const router=useRouter(),key="tpo-drive-views:"+scopeKey;
 const [views,setViews]=useState<Saved[]>([]),[name,setName]=useState(""),[error,setError]=useState(""),[copied,setCopied]=useState("");
 useEffect(()=>{
  let live=true;
  void Promise.resolve().then(()=>{
   if(!live)return;
   try{const raw=JSON.parse(localStorage.getItem(key)??"[]") as unknown;
    if(Array.isArray(raw))setViews(raw.filter((item):item is Saved=>
     typeof item==="object"&&item!==null&&
     typeof item.name==="string"&&item.name.length<=50&&
     typeof item.query==="string"&&item.query.length<=2000).slice(0,MAX));
   }catch{setViews([]);}
  });
  return ()=>{live=false;};
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
 return <section aria-label="Saved drive views" className="border-b border-border pb-6">
  <h2 className="font-semibold">My saved views</h2>
  <p className="mt-1 text-xs text-body">Save up to {MAX} named filter links in this browser for your college account. They do not change records or share filters with colleagues.</p>
  <div className="mt-3 flex flex-wrap gap-2">
   <Input aria-label="Saved view name" maxLength={50} value={name}
    onChange={e=>setName(e.target.value)} placeholder="e.g. Interviews this week"
    />
   <Button variant="secondary" type="button" onClick={save}
    >
    Save current filters
   </Button>
  </div>
  {error?<p role="alert" className="mt-2 text-xs text-error">{error}</p>:null}{copied?<p role="status" className="mt-2 text-xs text-body">Link copied for {copied}.</p>:null}
  {views.length>1?<button type="button" onClick={()=>{
   if(!window.confirm("Delete all "+views.length+" saved drive views from this browser?"))return;
   try{localStorage.removeItem(key);setViews([]);setCopied("");setError("");}
   catch{setError("Browser storage is unavailable.");}
  }} className="mt-2 min-h-11 md:min-h-9 text-sm font-semibold text-error underline">
    Clear all saved views
  </button>:null}
  {views.length?<ul className="mt-3 flex flex-wrap gap-2">{views.map(view=>
   <li key={view.name} className="inline-flex items-center gap-1 rounded-[var(--lms-control-radius)] border border-border">
    <Button variant="ghost" type="button" onClick={()=>router.push("/tpo/placements/lifecycle"+(view.query?"?"+view.query:""))}
     >{view.name}</Button>
    <Button variant="ghost" type="button" onClick={()=>{if(!navigator.clipboard){setError("Clipboard unavailable. Open the view and copy its URL.");return;}void navigator.clipboard.writeText(window.location.origin+"/tpo/placements/lifecycle"+(view.query?"?"+view.query:"")).then(()=>{setCopied(view.name);setError("");}).catch(()=>setError("Copy failed. Open the view and copy its URL."));}}
     aria-label={"Copy link for saved view "+view.name} >Copy link</Button>
    <Button variant="ghost" type="button" onClick={()=>remove(view.name)}
     aria-label={"Delete saved view "+view.name} >×</Button>
   </li>)}</ul>:<p className="mt-2 text-sm text-body">No views saved in this browser yet.</p>}
 </section>;
}
