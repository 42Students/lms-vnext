"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {InlineNotice} from "@/components/ui/inline-notice";
import {useToast} from "@/components/ui/toast";

import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";

const KEY="42tracker_saved_issue_views_v1";
const FIELDS=["q","reporter","status","severity","environment","sort"] as const;
type SavedView={name:string;filters:string};
function readViews():SavedView[]{
  try{
    const raw=window.localStorage.getItem(KEY);
    if(!raw)return [];
    const parsed:unknown=JSON.parse(raw);
    if(!Array.isArray(parsed))return [];
    return parsed.filter((item):item is SavedView=>
      Boolean(item)&&typeof item==="object"&&
      typeof item.name==="string"&&item.name.length<=60&&
      typeof item.filters==="string"&&item.filters.length<=500).slice(0,12);
  }catch{return [];}
}
export function filterOnlyIssuesView(search:string):string{
  const input=new URLSearchParams(search),filtered=new URLSearchParams();
  for(const key of FIELDS){
    const value=input.get(key);
    if(value&&value.length<=120)filtered.set(key,value);
  }
  return filtered.toString();
}
export function TrackerIssueSavedViews({filters}:{filters:string}){
  const router=useRouter();
  const {showToast}=useToast();
  const [views,setViews]=useState<SavedView[]>([]);
  const [name,setName]=useState("");
  const [notice,setNotice]=useState("");
  useEffect(()=>{
    const frame=window.requestAnimationFrame(()=>setViews(readViews()));
    return ()=>window.cancelAnimationFrame(frame);
  },[]);
  function persist(items:SavedView[]){
    // Memory always remains available for this tab even when browser storage
    // is disabled, quota-exhausted or blocked by privacy policy.
    setViews(items);
    try{window.localStorage.setItem(KEY,JSON.stringify(items));setNotice("");}
    catch{setNotice("Saved views are available for this tab only; browser storage is blocked.");}
  }
  function save(){
    const trimmed=name.trim();
    if(!trimmed){setNotice("Enter a name for this view.");return;}
    if(trimmed.length>60){setNotice("Use a name of 60 characters or fewer.");return;}
    if(views.length>=12&&!views.some(view=>view.name===trimmed)){
      setNotice("Delete a saved view before adding another.");return;
    }
    const next=[...views.filter(view=>view.name!==trimmed),{name:trimmed,filters:filterOnlyIssuesView(filters)}];
    persist(next);setName("");
    showToast({tone:"success",title:`Saved view "${trimmed}".`});
  }
  return <details aria-label="Saved issue views" className="min-w-0 border-b border-[var(--lms-canvas-border)] pb-3">
    <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary-text md:min-h-9">Saved views</summary>
    <div className="min-w-0 space-y-3 pt-2">
    <div className="flex min-w-0 flex-wrap items-end gap-2">
      <label className="grid w-full min-w-0 basis-full gap-[6px] text-[13px] font-semibold md:w-[220px] md:basis-auto leading-4 text-[var(--lms-neutral-400)]">View name
        <Input value={name} onChange={event=>setName(event.target.value)}
          maxLength={60} className="min-h-11 w-full" placeholder="Name these filters"
         />
      </label>
      <Button variant="secondary" type="button" className="min-h-11 w-full md:min-h-9 md:w-auto" onClick={save}
       >
        Save current filters
      </Button>
    </div>
    {views.length?<ul className="mt-3 flex flex-wrap gap-2">
      {views.map(view=><li key={view.name} className="flex items-center gap-1 rounded-[var(--lms-control-radius)] border border-border">
        <Button variant="ghost" type="button" className="min-h-11 md:min-h-9" onClick={()=>router.push("/tracker/issues"+(view.filters?"?"+view.filters:""))}
         >
          {view.name}
        </Button>
        <Button variant="ghost" className="min-h-11 border-l border-border md:min-h-9" type="button" aria-label={"Delete saved view "+view.name}
          onClick={()=>persist(views.filter(item=>item.name!==view.name))}
         >
          Delete
        </Button>
      </li>)}
    </ul>:<p className="mt-2 text-sm text-body">No saved views yet.</p>}
    {notice?<InlineNotice tone={notice.includes("tab only")?"info":"error"} message={notice}/>:null}
    </div>
  </details>;
}
