"use client";
import {useState} from "react";
export function TpoVerificationSwitch({initialEnabled,collegeId}:{initialEnabled:boolean;collegeId?:string}){
 const [enabled,setEnabled]=useState(initialEnabled);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 async function save(value:boolean){
  setBusy(true);setError("");
  try{
   const response=await fetch(collegeId?"/api/admin/verification/settings":"/api/college/verification/settings",{method:"PATCH",
    headers:{"Content-Type":"application/json"},body:JSON.stringify({tpoCanVerify:value,...(collegeId?{collegeId}:{})})});
   if(!response.ok)throw Error("Could not update the placement-cell setting");
   const result=await response.json() as {tpoCanVerify:boolean};
   setEnabled(result.tpoCanVerify);
  }catch(e){setError(e instanceof Error?e.message:"Could not save setting");}
  finally{setBusy(false);}
 }
 return <section aria-label="Placement-cell verification setting" className="min-w-0 space-y-2 rounded-lg border p-3">
  <label className="flex flex-wrap items-center justify-between gap-3 text-sm">
   <span className="font-medium">Allow placement-cell administrators to verify profiles</span>
   <input type="checkbox" checked={enabled} disabled={busy}
    onChange={event=>void save(event.target.checked)} aria-label="Placement cell can verify profiles"
    className="h-5 w-5"/>
  </label>
  <p className="text-xs text-muted-foreground">Only explicitly granted TPO verifiers may review while enabled. This setting is scoped to the selected college.</p>
  {busy?<p role="status" className="text-xs">Loading or saving setting…</p>:null}
  {error?<div role="alert" className="space-y-1 text-sm"><p>{error}. Refresh to load the persisted setting before trying again.</p>
   <button type="button" onClick={()=>window.location.reload()} className="rounded border px-3 py-1">Refresh setting</button></div>:null}
 </section>;
}
