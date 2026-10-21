"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { InlineNotice } from "@/components/ui/inline-notice";
import { useToast } from "@/components/ui/toast";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const KEY="42tracker_saved_issue_views_v1";
const LEGACY_KEY="tracker_saved_filters";
const MAX_SAVED=10;
const FIELDS=["q","reporter","status","severity","environment","sort"] as const;
type SavedView={name:string;filters:string};

export function filterOnlyIssuesView(search:string):string{
  const input=new URLSearchParams(search),filtered=new URLSearchParams();
  for(const key of FIELDS){
    const value=input.get(key);
    if(value&&value.length<=120)filtered.set(key,value);
  }
  return filtered.toString();
}
function hasCustomFilters(query:string):boolean{
  const params=new URLSearchParams(filterOnlyIssuesView(query));
  for(const key of FIELDS){
    const value=params.get(key)?.trim();
    if(!value)continue;
    if(key==="sort"&&value==="newest")continue;
    if((key==="environment"||key==="status"||key==="severity")&&value==="ALL")continue;
    return true;
  }
  return false;
}
function cleanSavedViews(raw:unknown):SavedView[]{
  if(!Array.isArray(raw))return [];
  const items:SavedView[]=[];
  for(const item of raw){
    if(!item||typeof item!=="object")continue;
    const row=item as {name?:unknown;filters?:unknown};
    if(typeof row.name!=="string")continue;
    const name=row.name.trim().slice(0,40);
    if(!name||items.some(view=>view.name.toLowerCase()===name.toLowerCase()))continue;
    let filters="";
    if(typeof row.filters==="string"){
      if(row.filters.length>500)continue;
      filters=filterOnlyIssuesView(row.filters);
    }else if(row.filters&&typeof row.filters==="object"){
      const legacy=row.filters as Record<string,unknown>;
      const params=new URLSearchParams();
      for(const [oldKey,newKey] of [
        ["search","q"],["q","q"],["status","status"],
        ["env","environment"],["environment","environment"],
        ["reporter","reporter"],["sort","sort"],
      ] as const){
        const value=legacy[oldKey];
        if(typeof value!=="string"||!value.trim())continue;
        if(newKey==="sort"){
          if(value==="DESC"||value==="newest")continue;
          params.set("sort",value==="ASC"?"oldest":value);
        }else params.set(newKey,value.trim());
      }
      filters=filterOnlyIssuesView(params.toString());
    }
    items.push({name,filters});
    if(items.length===MAX_SAVED)break;
  }
  return items;
}
function readViews():SavedView[]{
  try{
    const current=window.localStorage.getItem(KEY);
    if(current!==null)return cleanSavedViews(JSON.parse(current));
    const legacy=window.localStorage.getItem(LEGACY_KEY);
    if(!legacy)return [];
    const migrated=cleanSavedViews(JSON.parse(legacy));
    window.localStorage.setItem(KEY,JSON.stringify(migrated));
    return migrated;
  }catch{return [];}
}
export function TrackerIssueSavedViews({filters}:{filters:string}){
  const router=useRouter(),{showToast}=useToast();
  const [views,setViews]=useState<SavedView[]>([]);
  const [name,setName]=useState("");
  const [notice,setNotice]=useState("");
  const [saving,setSaving]=useState(false);
  const eligible=hasCustomFilters(filters);
  useEffect(()=>{
    const frame=window.requestAnimationFrame(()=>setViews(readViews()));
    return ()=>window.cancelAnimationFrame(frame);
  },[]);
  function persist(items:SavedView[]){
    setViews(items);
    try{window.localStorage.setItem(KEY,JSON.stringify(items));setNotice("");}
    catch{setNotice("Saved views are available for this tab only; browser storage is blocked.");}
  }
  function save(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const trimmed=name.trim().slice(0,40);
    if(!trimmed||!eligible)return;
    const key=trimmed.toLowerCase();
    if(views.length>=MAX_SAVED&&!views.some(view=>view.name.toLowerCase()===key)){
      setNotice("Delete a saved view before adding another.");return;
    }
    persist([{name:trimmed,filters:filterOnlyIssuesView(filters)},
      ...views.filter(view=>view.name.toLowerCase()!==key)].slice(0,MAX_SAVED));
    setSaving(false);setName("");
    showToast({tone:"success",title:`Saved view "${trimmed}".`});
  }
  return <div className="min-w-0 flex flex-wrap items-center gap-2 border-b border-border pb-3">
    <details aria-label="Saved issue views" className="relative min-w-0">
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 md:min-h-9">
        <span aria-hidden="true">★</span> Saved views {views.length>0?`(${views.length})`:""}
      </summary>
      <div className="absolute left-0 top-full z-30 mt-2 min-w-[240px] max-w-[min(90vw,360px)] rounded-[10px] border border-border bg-surface p-3 shadow-lg">
        {views.length?<ul className="space-y-1" aria-label="Choose a saved view">
          {views.map(view=><li key={view.name} className="flex min-w-0 items-center gap-1">
            <Button type="button" variant="ghost" className="min-w-0 min-h-11 flex-1 justify-start break-words text-left md:min-h-9"
              onClick={()=>router.push("/tracker/issues"+(view.filters?"?"+view.filters:""))}>{view.name}</Button>
            <Button type="button" variant="ghost" aria-label={"Delete saved view "+view.name}
              onClick={()=>persist(views.filter(item=>item.name!==view.name))}
              className="min-h-11 min-w-11 px-2 text-error md:min-h-9 md:min-w-9">
              <span aria-hidden="true">×</span>
            </Button>
          </li>)}
        </ul>:<p className="text-sm text-body">No saved views yet.</p>}
      </div>
    </details>
    <Button type="button" variant="secondary" disabled={!eligible}
      className="min-h-11 md:min-h-9" onClick={()=>{setSaving(true);setName("");setNotice("");}}>
      Save this view
    </Button>
    {notice?<InlineNotice tone={notice.includes("tab only")?"info":"error"} message={notice}/>:null}
    <Dialog open={saving} onOpenChange={setSaving} title="Save this view">
      <form className="space-y-4" onSubmit={save}>
        <label className="grid gap-1 text-sm font-semibold text-[var(--lms-heading)]">
          View name
          <Input autoFocus value={name} onChange={event=>setName(event.target.value)}
            maxLength={40} placeholder="e.g. Open production bugs"
            className="min-h-11 w-full md:min-h-9"/>
        </label>
        <p className="text-xs text-muted-foreground">Save the current issue filters for quick access later. Up to 10 views.</p>
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={()=>setSaving(false)}>Cancel</Button>
          <Button type="submit" disabled={!eligible||!name.trim()}>Save</Button>
        </div>
      </form>
    </Dialog>
  </div>;
}
