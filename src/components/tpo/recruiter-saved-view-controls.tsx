"use client";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {useEffect,useState} from "react";
import type {EngageColumn} from "@/modules/placements/tpo-recruiter-table-view-model";
type SavedView={
 id:string;name:string;note:string|null;query_json:Record<string,string>;
 columns_json:EngageColumn[];pinned:boolean;updated_at:string;
};
const button="min-h-11 max-w-full break-words px-3 text-sm md:min-h-9";
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
 return <section aria-label="Saved recruiter views" className="min-w-0 space-y-3 border-y border-border py-3">
  <h2 className="font-semibold">Saved views</h2>
  {ready===null?<p role="status" className="text-sm">Loading views…</p>:
   !ready?<p role="status" className="text-sm">Saved views are unavailable until storage is registered.</p>:<>
   <div className="grid min-w-0 grid-cols-1 items-center gap-2 md:grid-cols-2 xl:grid-cols-3">
    <Input aria-label="View name" maxLength={100} placeholder="View name" value={name}
     onChange={e=>setName(e.target.value)} className="min-h-11 w-full min-w-0 rounded-[var(--lms-control-radius)] border border-border px-3 md:min-h-9"/>
    <Input aria-label="View note" maxLength={500} placeholder="Note (optional)" value={note}
     onChange={e=>setNote(e.target.value)} className="min-h-11 w-full min-w-0 rounded-[var(--lms-control-radius)] border border-border px-3 md:min-h-9"/>
    <Button variant="secondary" type="button" disabled={busy||!name.trim()||views.length>=100} className={button}
     onClick={()=>void apply("CREATE")}>Save current view</Button>
   </div>
   {views.length?<div className="space-y-2">
    <p role="status" className="text-xs text-muted-foreground">{views.length} saved views · {views.filter(view=>view.pinned).length} of 5 pinned</p>
    {views.some(view=>view.pinned)?<nav aria-label="Pinned recruiter views" className="flex min-w-0 flex-wrap gap-2">
      {views.filter(view=>view.pinned).map(view=><Button variant="secondary" key={view.id} type="button"
        className={button} onClick={()=>open(view)} title={view.note??undefined}>
        ★ {view.name}
      </Button>)}
    </nav>:null}
    <label className="block text-sm">Open saved view
     <Select className="mt-1 min-h-11 w-full max-w-sm rounded-[var(--lms-control-radius)] border border-border px-3 md:min-h-9"
      value={selected} onChange={e=>{
       setSelected(e.target.value);setDeleteReview(null);
       const view=views.find(item=>item.id===e.target.value);
       setEditingName(view?.name??"");setEditingNote(view?.note??"");
      }}>
      <option value="">Choose a view</option>
      {views.map(view=><option key={view.id} value={view.id}>{view.pinned?"★ ":""}{view.name}</option>)}
     </Select>
    </label>
    {active?<div className="grid min-w-0 grid-cols-1 gap-3 border-t border-border pt-3 md:grid-cols-2 xl:grid-cols-3">
     <label className="min-w-0 text-sm">Rename view<Input maxLength={100} className="mt-1 min-h-11 w-full min-w-0 rounded-[var(--lms-control-radius)] border border-border px-3 md:min-h-9" value={editingName} onChange={e=>setEditingName(e.target.value)}/></label>
     <label className="min-w-0 text-sm">Note<Input maxLength={500} className="mt-1 min-h-11 w-full min-w-0 rounded-[var(--lms-control-radius)] border border-border px-3 md:min-h-9" value={editingNote} onChange={e=>setEditingNote(e.target.value)}/></label>
     <Button variant="secondary" type="button" className={button} onClick={()=>open(active)}>Open</Button>
     <Button variant="secondary" type="button" className={button} disabled={busy||!editingName.trim()} onClick={()=>void apply("UPDATE",active)}>Update filters and columns</Button>
     <Button variant="secondary" type="button" className={button} disabled={busy||(!active.pinned&&views.filter(view=>view.pinned).length>=5)} onClick={()=>void apply("PIN",active)}>
      {active.pinned?"Unpin":"Pin"}
     </Button>
     {deleteReview===active.id?<>
       <span role="status" className="text-sm">Delete {active.name}? This view cannot be restored.</span>
       <Button variant="secondary" type="button" className={button} disabled={busy} onClick={()=>void apply("DELETE",active)}>Confirm delete</Button>
       <Button variant="secondary" type="button" className={button} onClick={()=>setDeleteReview(null)}>Cancel</Button>
     </>:<Button variant="secondary" type="button" className={button} disabled={busy} onClick={()=>setDeleteReview(active.id)}>Delete</Button>}
     <Button variant="secondary" type="button" className={button} onClick={()=>download(active)}>Download view</Button>
     <p className="w-full text-xs text-muted-foreground">{active.note||"No note"}</p>
    </div>:null}
   </div>:<p className="text-sm">No saved recruiter views yet.</p>}
  </>}
  {notice?<p role="status" className="text-sm">{notice}</p>:null}
 </section>;
}
