"use client";
import {useRouter} from "next/navigation";
import {useState} from "react";
export function TpoPrepPercentageEditor({initial,version}:{initial:number;version:string|null}){
 const router=useRouter(),[percent,setPercent]=useState(initial),[busy,setBusy]=useState(false);
 const [error,setError]=useState(""),[message,setMessage]=useState("");
 async function save(){
  if(!Number.isInteger(percent)||percent<0||percent>100||busy)return;
  setBusy(true);setError("");setMessage("");
  try{
   const response=await fetch("/api/placements/tpo/settings/communication",{
    method:"PATCH",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({section:"PREP_THRESHOLD",prepThresholdPct:percent,expectedVersion:version}),
   });
   const result=await response.json() as {error?:string};
   if(!response.ok)throw Error(result.error==="TPO_SETTINGS_STALE"?"Settings changed. Refresh before retrying.":
    result.error??"Could not save threshold.");
   setMessage("Readiness bar saved");router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Could not save threshold.");}
  finally{setBusy(false);}
 }
 return <section className="space-y-3 rounded-xl border border-border bg-surface p-5">
  <h3 className="font-semibold">Readiness bar</h3>
  <p className="text-sm text-body">A student needs average progress of at least this percentage in the selected preparation courses.</p>
  <label className="block text-sm">Average progress required (%)
   <input type="number" min={0} max={100} step={1} value={percent} disabled={busy}
    onChange={e=>setPercent(Number(e.target.value))}
    className="mt-1 block min-h-11 w-28 rounded border border-border bg-surface px-3"/>
  </label>
  <p className="text-xs text-muted-foreground">This configures the legacy percentage threshold. The student readiness calculation still requires the learner course-progress producer.</p>
  <button type="button" disabled={busy||percent===initial||percent<0||percent>100}
   onClick={()=>void save()} className="min-h-11 rounded bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50">Save changes</button>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {message?<p role="status" className="text-sm text-body">{message}</p>:null}
 </section>;
}
