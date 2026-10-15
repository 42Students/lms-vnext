"use client";
import {useEffect,useState} from "react";
export function TpoVerificationSwitch(){
 const [enabled,setEnabled]=useState<boolean|null>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 async function load(){
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/college/verification/settings",{cache:"no-store"});
   if(!response.ok)throw Error("Unable to load placement-cell setting");
   const result=await response.json() as {tpoCanVerify:boolean};
   setEnabled(result.tpoCanVerify);
  }catch(e){setError(e instanceof Error?e.message:"Unable to load setting");}
  finally{setBusy(false);}
 }
 // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount / reset-on-input synchronisation
 useEffect(()=>{void load();},[]);
 async function save(value:boolean){
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/college/verification/settings",{method:"PATCH",
    headers:{"Content-Type":"application/json"},body:JSON.stringify({tpoCanVerify:value})});
   if(!response.ok)throw Error("Could not update the placement-cell setting");
   const result=await response.json() as {tpoCanVerify:boolean};
   setEnabled(result.tpoCanVerify);
  }catch(e){setError(e instanceof Error?e.message:"Could not save setting");}
  finally{setBusy(false);}
 }
 return <section aria-label="Placement-cell verification setting" className="min-w-0 space-y-2 rounded-lg border p-3">
  <label className="flex flex-wrap items-center justify-between gap-3 text-sm">
   <span className="font-medium">Allow placement-cell administrators to verify profiles</span>
   <input type="checkbox" checked={enabled??false} disabled={enabled===null||busy}
    onChange={event=>void save(event.target.checked)} aria-label="Placement cell can verify profiles"
    className="h-5 w-5"/>
  </label>
  <p className="text-xs text-muted-foreground">Only explicitly granted TPO verifiers may review while enabled.</p>
  {busy?<p role="status" className="text-xs">Loading or saving setting…</p>:null}
  {error?<div role="alert" className="space-y-1 text-sm"><p>{error}</p>
   <button type="button" onClick={()=>void load()} className="rounded border px-3 py-1">Retry</button></div>:null}
 </section>;
}
