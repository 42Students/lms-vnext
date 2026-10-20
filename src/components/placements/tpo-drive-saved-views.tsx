"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {InlineNotice} from "@/components/ui/inline-notice";
import {EmptyState} from "@/components/ui/empty-state";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
type Saved={name:string;query:string};
const MAX=8;
export function TpoDriveSavedViews({scopeKey}:{scopeKey:string}){
 const router=useRouter(),key="tpo-drive-views:"+scopeKey;
 const [views,setViews]=useState<Saved[]>([]),[name,setName]=useState(""),[error,setError]=useState(""),[copied,setCopied]=useState("");
 const [confirmClear,setConfirmClear]=useState(false);
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
 function clearAll(){
  setConfirmClear(false);
  try{localStorage.removeItem(key);setViews([]);setCopied("");setError("");}
  catch{setError("Browser storage is unavailable.");}
 }
 return <details aria-label="Saved drive views" className="min-w-0 border-b border-border pb-3">
  <summary className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">My saved views</summary>
  <div className="min-w-0 pt-2">
  <p className="mt-1 text-xs text-body">Save up to {MAX} named filter links in this browser for your college account. They do not change records or share filters with colleagues.</p>
  <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row">
   <Input aria-label="Saved view name" maxLength={50} value={name}
    onChange={e=>{setName(e.target.value);setCopied("");}} placeholder="e.g. Interviews this week"
    className="min-h-11 min-w-0 flex-1 md:min-h-9" />
   <Button variant="secondary" type="button" onClick={save} className="min-h-11 w-full sm:w-auto md:min-h-9">
    Save current filters
   </Button>
  </div>
  {error?<InlineNotice tone="error" message={error}/>:null}{copied?<InlineNotice tone="success" message={"Link copied for "+copied+"."}/>:null}
  <ConfirmDialog open={confirmClear} onOpenChange={setConfirmClear}
   title="Clear saved drive views?" description={"Delete all "+views.length+" saved drive views from this browser?"}
   confirmLabel="Clear all" confirmVariant="danger" onConfirm={clearAll}/>
  {views.length?<ul className="mt-3 min-w-0 divide-y divide-border border-y border-border">{views.map(view=>
   <li key={view.name} className="grid min-w-0 grid-cols-2 items-center gap-2 py-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
    <Button className="min-h-11 min-w-0 w-full justify-start break-words text-left font-semibold text-link sm:w-auto md:min-h-9" variant="ghost" type="button" onClick={()=>router.push("/tpo/placements/lifecycle"+(view.query?"?"+view.query:""))}
     >{view.name}</Button>
    <Button className="min-h-11 w-full sm:w-auto md:min-h-9" variant="ghost" type="button" onClick={()=>{if(!navigator.clipboard){setError("Clipboard unavailable. Open the view and copy its URL.");return;}void navigator.clipboard.writeText(window.location.origin+"/tpo/placements/lifecycle"+(view.query?"?"+view.query:"")).then(()=>{setCopied(view.name);setError("");}).catch(()=>setError("Copy failed. Open the view and copy its URL."));}}
     aria-label={"Copy link for saved view "+view.name} >Copy link</Button>
    <Button className="min-h-11 w-full sm:w-auto md:min-h-9" variant="ghost" type="button" onClick={()=>remove(view.name)}
     aria-label={"Delete saved view "+view.name} >×</Button>
   </li>)}</ul>:<EmptyState title="No views saved in this browser yet."/>}
  {views.length>1?<Button variant="link" type="button" onClick={()=>setConfirmClear(true)}
    className="mt-2 min-h-11 md:min-h-9 text-sm font-semibold text-error underline">
    Clear all saved views
  </Button>:null}
  </div>
 </details>;
}
