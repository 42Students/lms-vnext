"use client";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {useEffect,useState} from "react";
import type {EngageColumn} from "@/modules/placements/tpo-recruiter-table-view-model";
type SavedView={
 id:string;name:string;note:string|null;query_json:Record<string,string>;
 columns_json:EngageColumn[];pinned:boolean;updated_at:string;
};
const button="min-h-10 rounded-md border border-border bg-surface px-3 text-sm font-semibold disabled:opacity-50";
export function RecruiterSavedViewControls({columns}:{columns:readonly EngageColumn[]}){
 const [views,setViews]=useState<SavedView[]>([]);
 const [ready,setReady]=useState<boolean|null>(null);
 const [name,setName]=useState(""),[note,setNote]=useState("");
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState("");
 const [selected,setSelected]=useState("");
 const [editingName,setEditingName]=useState(""),[editingNote,setEditingNote]=useState("");
 const [deleteReview,setDeleteReview]=useState<string|null>(null);
 async function refresh(){
  try{
   const res=await fetch("/api/placements/tpo/leads/views",{credentials:"same-origin",cache:"no-store"});
   if(!res.ok)throw new Error("Cannot load saved views");
   const payload=await res.json() as {ready:boolean;views:SavedView[]};
   setReady(payload.ready);setViews(payload.views??[]);
  }catch{setReady(false);}
 }
 useEffect(()=>{
  let live=true;
  void Promise.resolve().then(()=>{if(live)return refresh();});
  return ()=>{live=false;};
 },[]);
 function currentQuery(){
  const params=new URLSearchParams(window.location.search),result:Record<string,string>={};
  for(const key of ["q","stage","owner","status","invite","source","company","reach",
    "designation","nextFollowup","lastActivity","added","need","attention","drives"]){
   const value=params.get(key);if(value)result[key]=value;
  }
  return result;
 }
 async function apply(action:"CREATE"|"UPDATE"|"PIN"|"DELETE",view?:SavedView){
  if(busy||!ready)return;
  setBusy(true);setNotice("");
  const payload={
   action,id:view?.id,name:action==="CREATE"?name.trim():action==="UPDATE"?editingName.trim():view?.name,
   note:action==="CREATE"?note.trim():action==="UPDATE"?editingNote.trim():view?.note??"",
   query:action==="PIN"||action==="DELETE"?undefined:currentQuery(),
   columns:action==="PIN"||action==="DELETE"?undefined:[...columns],
   pinned:action==="PIN"?!view?.pinned:action==="CREATE"?false:undefined,
  };
  if(action==="CREATE"&&!payload.name){setNotice("Name this view first.");setBusy(false);return;}
  if(action==="CREATE"&&views.length>=100){setNotice("You can save up to 100 views.");setBusy(false);return;}
  try{
   const response=await fetch("/api/placements/tpo/leads/views",{
    method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify(payload),
   });
   const data=await response.json() as {error?:string};
   if(!response.ok)throw new Error(data.error==="VIEW_LIMIT"?"You can save up to 100 views.":
    data.error==="PIN_LIMIT"?"You can pin up to 5 views.":
    data.error==="DUPLICATE_NAME"?"A view with that name already exists.":
    data.error==="STORAGE_PENDING"?"Saved view storage is not registered.":"Couldn't save.");
   setNotice(action==="CREATE"?"View saved":action==="DELETE"?"View deleted":"Saved");
   if(action==="DELETE"){setSelected("");setDeleteReview(null);setEditingName("");setEditingNote("");}
   if(action==="CREATE"){setName("");setNote("");}
   await refresh();
  }catch(e){setNotice(e instanceof Error?e.message:"Couldn't save");}
  finally{setBusy(false);}
 }
 function open(view:SavedView){
  try{window.localStorage.setItem("tpo-engage-visible-columns-v1",JSON.stringify(view.columns_json));}
  catch{}
  const url=new URLSearchParams(view.query_json);
  url.set("view","table");
  window.location.assign("/tpo/recruiters?"+url.toString());
 }
 function download(view:SavedView){
  const blob=new Blob([JSON.stringify({
   name:view.name,note:view.note,filters:view.query_json,columns:view.columns_json,
  },null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download="engage-view-"+view.name.toLowerCase().replace(/[^a-z0-9]+/g,"-")+".json";
  a.click();URL.revokeObjectURL(url);
 }
 const active=views.find(view=>view.id===selected);
 return <section aria-label="Saved recruiter views" className="space-y-3 rounded-lg border border-border bg-surface p-4">
  <h2 className="font-semibold">Saved views</h2>
  {ready===null?<p role="status" className="text-sm">Loading views…</p>:
   !ready?<p role="status" className="text-sm">Saved views are unavailable until storage is registered.</p>:<>
   <div className="flex flex-wrap items-center gap-2">
    <Input aria-label="View name" maxLength={100} placeholder="View name" value={name}
     onChange={e=>setName(e.target.value)} className="min-h-10 rounded border border-border px-3"/>
    <Input aria-label="View note" maxLength={500} placeholder="Note (optional)" value={note}
     onChange={e=>setNote(e.target.value)} className="min-h-10 rounded border border-border px-3"/>
    <button type="button" disabled={busy||!name.trim()||views.length>=100} className={button}
     onClick={()=>void apply("CREATE")}>Save current view</button>
   </div>
   {views.length?<div className="space-y-2">
    <p role="status" className="text-xs text-muted-foreground">{views.length} saved views · {views.filter(view=>view.pinned).length} of 5 pinned</p>
    {views.some(view=>view.pinned)?<nav aria-label="Pinned recruiter views" className="flex flex-wrap gap-2">
      {views.filter(view=>view.pinned).map(view=><button key={view.id} type="button"
        className={button} onClick={()=>open(view)} title={view.note??undefined}>
        ★ {view.name}
      </button>)}
    </nav>:null}
    <label className="block text-sm">Open saved view
     <Select className="mt-1 min-h-10 w-full max-w-sm rounded-[9px] border border-border px-3"
      value={selected} onChange={e=>{
       setSelected(e.target.value);setDeleteReview(null);
       const view=views.find(item=>item.id===e.target.value);
       setEditingName(view?.name??"");setEditingNote(view?.note??"");
      }}>
      <option value="">Choose a view</option>
      {views.map(view=><option key={view.id} value={view.id}>{view.pinned?"★ ":""}{view.name}</option>)}
     </Select>
    </label>
    {active?<div className="flex flex-wrap gap-2">
     <label className="text-sm">Rename view<Input maxLength={100} className="ml-2 min-h-10 rounded-[9px] border border-border px-3" value={editingName} onChange={e=>setEditingName(e.target.value)}/></label>
     <label className="text-sm">Note<Input maxLength={500} className="ml-2 min-h-10 rounded-[9px] border border-border px-3" value={editingNote} onChange={e=>setEditingNote(e.target.value)}/></label>
     <button type="button" className={button} onClick={()=>open(active)}>Open</button>
     <button type="button" className={button} disabled={busy||!editingName.trim()} onClick={()=>void apply("UPDATE",active)}>Update filters and columns</button>
     <button type="button" className={button} disabled={busy||(!active.pinned&&views.filter(view=>view.pinned).length>=5)} onClick={()=>void apply("PIN",active)}>
      {active.pinned?"Unpin":"Pin"}
     </button>
     {deleteReview===active.id?<>
       <span role="status" className="text-sm">Delete {active.name}? This view cannot be restored.</span>
       <button type="button" className={button} disabled={busy} onClick={()=>void apply("DELETE",active)}>Confirm delete</button>
       <button type="button" className={button} onClick={()=>setDeleteReview(null)}>Cancel</button>
     </>:<button type="button" className={button} disabled={busy} onClick={()=>setDeleteReview(active.id)}>Delete</button>}
     <button type="button" className={button} onClick={()=>download(active)}>Download view</button>
     <p className="w-full text-xs text-muted-foreground">{active.note||"No note"}</p>
    </div>:null}
   </div>:<p className="text-sm">No saved recruiter views yet.</p>}
  </>}
  {notice?<p role="status" className="text-sm">{notice}</p>:null}
 </section>;
}
