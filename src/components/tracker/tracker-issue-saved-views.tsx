"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
  const [views,setViews]=useState<SavedView[]>([]);
  const [name,setName]=useState("");
  const [notice,setNotice]=useState("");
  useEffect(()=>{
    const frame=window.requestAnimationFrame(()=>setViews(readViews()));
    return ()=>window.cancelAnimationFrame(frame);
  },[]);
  function persist(items:SavedView[]){
    try{window.localStorage.setItem(KEY,JSON.stringify(items));setViews(items);setNotice("");}
    catch{setNotice("Saved views are unavailable in this browser.");}
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
  }
  return <section aria-label="Saved issue views"
    className="border-b border-border pb-4">
    <h2 className="mb-2 font-semibold">Saved views</h2>
    <div className="flex flex-wrap items-end gap-2">
      <label className="grid gap-1 text-sm font-semibold">View name
        <Input value={name} onChange={event=>setName(event.target.value)}
          maxLength={60} placeholder="Name these filters"
         />
      </label>
      <Button variant="secondary" type="button" onClick={save}
       >
        Save current filters
      </Button>
    </div>
    {views.length?<ul className="mt-3 flex flex-wrap gap-2">
      {views.map(view=><li key={view.name} className="flex items-center gap-1 rounded-[var(--lms-control-radius)] border border-border">
        <Button variant="ghost" type="button" onClick={()=>router.push("/tracker/issues"+(view.filters?"?"+view.filters:""))}
         >
          {view.name}
        </Button>
        <Button variant="ghost" className="border-l border-border" type="button" aria-label={"Delete saved view "+view.name}
          onClick={()=>persist(views.filter(item=>item.name!==view.name))}
         >
          Delete
        </Button>
      </li>)}
    </ul>:<p className="mt-2 text-sm text-body">No saved views yet.</p>}
    {notice?<p role="alert" className="mt-2 text-sm text-error">{notice}</p>:null}
  </section>;
}
