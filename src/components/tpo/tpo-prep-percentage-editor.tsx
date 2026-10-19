"use client";
import {useRouter} from "next/navigation";
import {useRef,useState} from "react";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
export function TpoPrepPercentageEditor({initial,version}:{initial:number;version:string|null}){
 const router=useRouter(),[percent,setPercent]=useState(initial),[busy,setBusy]=useState(false);
 const [saved,setSaved]=useState(initial),[currentVersion,setCurrentVersion]=useState(version);
 const [error,setError]=useState(""),[message,setMessage]=useState("");
 const inFlight=useRef(false);
 async function save(){
  if(!Number.isInteger(percent)||percent<0||percent>100||percent===saved||inFlight.current)return;
  inFlight.current=true;
  setBusy(true);setError("");setMessage("");
  try{
   const response=await fetch("/api/placements/tpo/settings/communication",{
    method:"PATCH",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({section:"PREP_THRESHOLD",prepThresholdPct:percent,expectedVersion:currentVersion}),
   });
   const result=await response.json().catch(()=>({})) as {error?:string;version?:string};
   if(!response.ok){
    setError(response.status===401?"Your session expired. Sign in again.":
     response.status===403?"You no longer have permission to change the readiness bar.":
     response.status===409||result.error==="TPO_SETTINGS_STALE"?"Settings changed. Refresh before retrying.":
     response.status===503||result.error==="TPO_SETTINGS_PENDING"?"Readiness settings are temporarily unavailable. Try again.":
     "Could not save threshold. Refresh and try again.");
    return;
   }
   setSaved(percent);setCurrentVersion(result.version??currentVersion);
   setMessage("Readiness bar saved");router.refresh();
  }catch{
   setError("Could not save threshold. Check the connection and try again.");
  }finally{
   inFlight.current=false;setBusy(false);
  }
 }
 return <section className="space-y-3 border-t border-border pt-5">
  <h3 className="font-semibold">Readiness bar</h3>
  <p className="text-sm text-body">A student needs average progress of at least this percentage in the selected preparation courses.</p>
  <label className="block text-sm">Average progress required (%)
   <Input type="number" min={0} max={100} step={1} value={percent} disabled={busy}
    onChange={e=>setPercent(e.target.value===""?-1:Number(e.target.value))}
    className="mt-1 min-h-11 w-28 sm:min-h-9"/>
  </label>
  <p className="text-xs text-muted-foreground">This threshold is applied to learner course-progress records when the selected preparation courses have published content. Unavailable records are not treated as a failed learner.</p>
  <Button type="button" disabled={busy||percent===saved||!Number.isInteger(percent)||percent<0||percent>100}
   onClick={()=>void save()} className="min-h-11 sm:min-h-9">Save changes</Button>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {message?<p role="status" className="text-sm text-body">{message}</p>:null}
 </section>;
}
