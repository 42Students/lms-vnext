"use client";
import { Button } from "@/components/ui/button";
import {useState} from "react";
import {apiFetch} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
export function TpoVerificationSwitch({initialEnabled,collegeId}:{initialEnabled:boolean;collegeId?:string}){
 const [enabled,setEnabled]=useState(initialEnabled);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 async function save(value:boolean){
  if(busy||value===enabled)return;
  setBusy(true);setError("");setNotice("");
  try{
   const result=await apiFetch<{tpoCanVerify:boolean}>(collegeId?"/api/admin/verification/settings":"/api/college/verification/settings",{method:"PATCH",credentials:"same-origin",timeoutMs:12000,
    headers:{"Content-Type":"application/json"},body:JSON.stringify({tpoCanVerify:value,...(collegeId?{collegeId}:{})})});
   setEnabled(result.tpoCanVerify);
   setNotice("Verification setting saved.");
  }catch(e){setError(e instanceof Error?e.message:friendlyApiError({network:true}));}
  finally{setBusy(false);}
 }
 return <section aria-label="Placement-cell verification setting" className="min-w-0 space-y-2 rounded-lg border p-3">
  <label className="flex flex-wrap items-center justify-between gap-3 text-sm">
   <span className="font-medium">The placement cell can verify profiles</span>
   <input type="checkbox" checked={enabled} disabled={busy}
    onChange={event=>void save(event.target.checked)} aria-label="Placement cell can verify profiles"
    className="h-5 w-5"/>
  </label>
  <p className="text-xs text-muted-foreground">Only explicitly granted TPO verifiers may review while enabled. This setting is scoped to the selected college.</p>
  {busy?<p role="status" className="text-xs">Saving setting…</p>:null}
  {notice?<p role="status" className="text-xs text-success">{notice}</p>:null}
  {error?<div role="alert" className="space-y-1 text-sm"><p>{error}. Refresh to load the persisted setting before trying again.</p>
   <Button variant="secondary" type="button" onClick={()=>window.location.reload()} className="rounded border px-3 py-1">Refresh setting</Button></div>:null}
 </section>;
}
