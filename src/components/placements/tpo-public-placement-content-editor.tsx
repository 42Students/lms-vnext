"use client";
import { Button } from "@/components/ui/button";
import {Alert} from "@/components/ui/alert";
import {InlineNotice} from "@/components/ui/inline-notice";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {DEFAULT_PUBLIC_METRICS,PUBLIC_METRIC_LABELS,
 type PublicPlacementMetricKey} from "@/modules/placements/public-page/content-model";
const ALL=Object.keys(PUBLIC_METRIC_LABELS) as PublicPlacementMetricKey[];
export function TpoPublicPlacementContentEditor({initial}:{initial:{
 ready:boolean;about:string;metricKeys:PublicPlacementMetricKey[];updatedAt:string|null;
 /** Server-authorized public preview keys, after minimum-sample suppression. */
 previewMetricKeys?:PublicPlacementMetricKey[];
}}){
 const router=useRouter();
 const [retrying,setRetrying]=useState(false);
 const initialMetricKeys=initial.metricKeys.length?initial.metricKeys:DEFAULT_PUBLIC_METRICS;
 const visibleKeys=new Set(initial.previewMetricKeys??[]);
 const hasPreview=Array.isArray(initial.previewMetricKeys);
 const [saved,setSaved]=useState({about:initial.about,metricKeys:initialMetricKeys});
 const [about,setAbout]=useState(initial.about);
 const [metricKeys,setMetricKeys]=useState(initialMetricKeys);
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
  }catch{setMessage("Couldn't save");}
  finally{window.clearTimeout(timeout);pending.current=false;setBusy(false);}
 }
 return <section className="mt-6 space-y-4 border-t border-border pt-5" aria-label="Public placements content">
  <h2 className="font-semibold">About your placements</h2>
  <label className="grid gap-[6px] text-[13px]">About your placements
   <Textarea rows={4} maxLength={4000} value={about} disabled={!initial.ready||busy}
    onChange={e=>setAbout(e.target.value)}
    placeholder="A few lines companies read first: your programmes, batch sizes, when your season runs."
    className="min-h-28 w-full"/>
  </label>
  <p className="text-right text-xs text-muted-foreground" aria-live="polite">{about.length} / 4000</p>
  <fieldset className="space-y-3">
   <legend className="font-semibold">Numbers to show</legend>
   <p className="text-xs text-muted-foreground">Live, over the last 12 months. A number built on fewer than 5 students or offers is never shown.</p>
   <div className="grid min-w-0 gap-x-6 gap-y-1 sm:grid-cols-2">
   {ALL.map(key=><label key={key} className="flex min-h-11 md:min-h-9 items-center gap-2 text-sm">
    <Checkbox checked={metricKeys.includes(key)} disabled={!initial.ready||busy}
     onChange={()=>toggle(key)}/>{PUBLIC_METRIC_LABELS[key]}{hasPreview&&!visibleKeys.has(key)?" (not enough data yet)":""}
   </label>)}
   </div>
  </fieldset>
  <details className="min-w-0 border-t border-border pt-3">
   <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2">Public number order</summary>
  <ol aria-label="Public number order" className="space-y-2">
   {metricKeys.map((key,index)=><li key={key} className="flex min-w-0 flex-col items-stretch gap-2 border-b border-border py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
    <span>{index+1}. {PUBLIC_METRIC_LABELS[key]}</span>
    <span className="flex flex-wrap justify-end gap-2"><Button type="button" variant="secondary" disabled={busy||index===0}
     onClick={()=>move(index,-1)} className="min-h-11 md:min-h-9 text-xs">Move up</Button>
     <Button type="button" variant="secondary" disabled={busy||index===metricKeys.length-1}
      onClick={()=>move(index,1)} className="min-h-11 md:min-h-9 text-xs">Move down</Button></span>
   </li>)}
  </ol>
  </details>
  {dirty?<InlineNotice tone="info" message="Unsaved changes. Use Save to publish. The old LMS saved number selections immediately."/>:null}
  {!initial.ready?<Alert tone="warning"><div className="space-y-2">
   <p>Couldn't load the placements page</p>
   <Button type="button" variant="secondary" disabled={retrying} onClick={()=>{
    setRetrying(true);router.refresh();
   }}>Retry</Button>
  </div></Alert>:null}
  <Button variant="primary" type="button" disabled={busy||!initial.ready||!dirty}
   className="min-h-11 w-full sm:w-auto md:min-h-9"
   onClick={()=>void save()}>{busy?"Saving…":"Save"}</Button>
  {message?<InlineNotice tone={message==="Saved"?"success":"error"}
   message={message==="Couldn't save"?"Couldn't save. Your text and selected numbers are still here; try again.":message}/>:null}
 </section>;
}
