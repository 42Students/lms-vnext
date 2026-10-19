"use client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {useEffect,useRef,useState} from "react";
import {DEFAULT_PUBLIC_METRICS,PUBLIC_METRIC_LABELS,
 type PublicPlacementMetricKey} from "@/modules/placements/public-page/content-model";
const ALL=Object.keys(PUBLIC_METRIC_LABELS) as PublicPlacementMetricKey[];
export function TpoPublicPlacementContentEditor({initial}:{initial:{
 ready:boolean;about:string;metricKeys:PublicPlacementMetricKey[];updatedAt:string|null;
}}){
 const [saved,setSaved]=useState({about:initial.about,metricKeys:initial.metricKeys});
 const [about,setAbout]=useState(initial.about);
 const [metricKeys,setMetricKeys]=useState(initial.metricKeys.length?initial.metricKeys:DEFAULT_PUBLIC_METRICS);
 const [version,setVersion]=useState(initial.updatedAt);
 const [busy,setBusy]=useState(false),pending=useRef(false),[message,setMessage]=useState("");
 const dirty=about!==saved.about||metricKeys.join("|")!==saved.metricKeys.join("|");
 useEffect(()=>{
  if(!dirty)return;
  const warn=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue="";};
  window.addEventListener("beforeunload",warn);
  return ()=>window.removeEventListener("beforeunload",warn);
 },[dirty]);
 function toggle(key:PublicPlacementMetricKey){
  setMessage("");setMetricKeys(current=>current.includes(key)?current.length>1?current.filter(x=>x!==key):current:
   [...current,key]);
 }
 function move(index:number,direction:-1|1){
  setMetricKeys(current=>{
   const target=index+direction;if(target<0||target>=current.length)return current;
   const copy=[...current];[copy[index],copy[target]]=[copy[target],copy[index]];return copy;
  });
 }
 async function save(){
  if(!initial.ready||!dirty||pending.current)return;
  pending.current=true;setBusy(true);setMessage("");
  const controller=new AbortController(),timeout=window.setTimeout(()=>controller.abort(),12000);
  try{
   const response=await fetch("/api/placements/tpo/public-page/content",{
    method:"PATCH",credentials:"same-origin",signal:controller.signal,
    headers:{"content-type":"application/json"},
    body:JSON.stringify({about,metricKeys,expectedUpdatedAt:version}),
   });
   const result=await response.json().catch(()=>null) as {content?:{
    about:string;metricKeys:PublicPlacementMetricKey[];updatedAt:string;
   }}|null;
   if(!response.ok||!result?.content)throw new Error("NOT_SAVED");
   setSaved({about:result.content.about,metricKeys:result.content.metricKeys});
   setVersion(result.content.updatedAt);setMessage("Saved");
  }catch{setMessage("Couldn't save. Your text and selected numbers are still here; try again.");}
  finally{window.clearTimeout(timeout);pending.current=false;setBusy(false);}
 }
 return <section className="mt-6 space-y-4 border-t border-border pt-5" aria-label="Public placements content">
  <h2 className="font-semibold">About your placements</h2>
  <label className="grid gap-1 text-sm">About your placements
   <Textarea rows={5} maxLength={4000} value={about} disabled={!initial.ready||busy}
    onChange={e=>setAbout(e.target.value)}
    placeholder="Tell recruiters about your placement cell and your students."
    className="min-h-28 w-full"/>
  </label>
  <p className="text-xs">{about.length}/4000 characters</p>
  <fieldset className="space-y-3">
   <legend className="font-semibold">Numbers to show</legend>
   <p className="text-xs text-muted-foreground">Choose the public numbers and their order. Small or unavailable values stay hidden.</p>
   {ALL.map(key=><label key={key} className="flex min-h-11 md:min-h-9 items-center gap-2 text-sm">
    <Checkbox checked={metricKeys.includes(key)} disabled={!initial.ready||busy}
     onChange={()=>toggle(key)}/>{PUBLIC_METRIC_LABELS[key]}
   </label>)}
  </fieldset>
  <ol aria-label="Public number order" className="space-y-2">
   {metricKeys.map((key,index)=><li key={key} className="flex items-center justify-between gap-3 border-b border-border py-2 text-sm">
    <span>{index+1}. {PUBLIC_METRIC_LABELS[key]}</span>
    <span className="flex gap-2"><Button type="button" variant="secondary" disabled={busy||index===0}
     onClick={()=>move(index,-1)} className="min-h-11 md:min-h-9 text-xs">Move up</Button>
     <Button type="button" variant="secondary" disabled={busy||index===metricKeys.length-1}
      onClick={()=>move(index,1)} className="min-h-11 md:min-h-9 text-xs">Move down</Button></span>
   </li>)}
  </ol>
  {dirty?<p role="status">Unsaved changes</p>:null}
  {!initial.ready?<p role="status">Page content editing is temporarily unavailable until storage is ready.</p>:null}
  <Button variant="primary" type="button" disabled={busy||!initial.ready||!dirty}
   className="min-h-11 md:min-h-9"
   onClick={()=>void save()}>{busy?"Saving…":"Save"}</Button>
  {message?<p role="status" className="text-sm">{message}</p>:null}
 </section>;
}
