"use client";
import {useRouter} from "next/navigation";
import {useState} from "react";

type ResponseBody={error?:string;version?:string};
function saveError(body:ResponseBody){
 return body.error==="TPO_SETTINGS_STALE"?"Settings changed. Refresh before retrying.":
  body.error==="TPO_SETTINGS_PENDING"?"Communication settings are not yet available.":
  body.error??"Settings were not saved.";
}
export function TpoSmsCapEditor({initial,version}: {initial:number;version:string|null}){
 const router=useRouter();
 const [value,setValue]=useState(initial),[saved,setSaved]=useState(initial);
 const [currentVersion,setCurrentVersion]=useState(version);
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[error,setError]=useState("");
 async function save(){
  if(busy||!Number.isInteger(value)||value<0||value>100000)return;
  setBusy(true);setError("");setNotice("");
  try{
   const response=await fetch("/api/placements/tpo/settings/communication",{
    method:"PATCH",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({section:"SMS_CAP",smsMonthlyCap:value,expectedVersion:currentVersion}),
   });
   const body=await response.json() as ResponseBody;
   if(!response.ok)throw Error(saveError(body));
   setSaved(value);setCurrentVersion(body.version??null);setNotice("Saved");router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Settings were not saved.");}finally{setBusy(false);}
 }
 return <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
  <h2 className="text-lg font-semibold">SMS</h2>
  <p className="font-semibold text-sm">Always sent (email and SMS), never counted against the limit</p>
  <div className="flex flex-wrap gap-2">{[
   "Round scheduled or changed","Offer released, expiring, expired or withdrawn",
   "Drive cancelled","Application deadline today","Debarred or marked absent",
  ].map(label=><span key={label} className="rounded-md border border-border px-2 py-1 text-xs">{label}</span>)}</div>
  <label className="block text-sm font-semibold">Monthly limit on optional SMS
   <input type="number" min={0} max={100000} step={1} value={value} disabled={busy}
    onChange={event=>setValue(event.target.value===""?-1:Number(event.target.value))}
    className="mt-2 block min-h-11 w-40 rounded-md border border-border bg-surface px-3 text-foreground"/>
  </label>
  <p className="text-xs text-muted-foreground">SMS used this month: unavailable until delivery usage is connected. Saving a limit does not enable SMS delivery.</p>
  <button type="button" onClick={()=>void save()} disabled={busy||saved===value||value<0||value>100000||!Number.isInteger(value)}
   className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50">Save</button>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {notice?<p role="status" className="text-sm">{notice}</p>:null}
 </section>;
}
export function TpoEmailSignatureEditor({initial,version}:{initial:string;version:string|null}){
 const router=useRouter();
 const [value,setValue]=useState(initial),[saved,setSaved]=useState(initial);
 const [currentVersion,setCurrentVersion]=useState(version);
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[error,setError]=useState("");
 async function save(){
  if(busy||value.length>300)return;
  setBusy(true);setError("");setNotice("");
  try{
   const response=await fetch("/api/placements/tpo/settings/communication",{
    method:"PATCH",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({section:"SIGNATURE",emailSignature:value,expectedVersion:currentVersion}),
   });
   const body=await response.json() as ResponseBody;
   if(!response.ok)throw Error(saveError(body));
   setSaved(value);setCurrentVersion(body.version??null);setNotice("Saved");router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Settings were not saved.");}finally{setBusy(false);}
 }
 return <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
  <label className="block text-sm font-semibold">Email signature
   <textarea rows={3} maxLength={300} value={value} disabled={busy}
    placeholder={"Training and Placement Cell\nYour college's name"}
    onChange={event=>setValue(event.target.value)}
    className="mt-2 block w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground"/>
  </label>
  <p className="text-right text-xs text-muted-foreground">{value.length}/300</p>
  <div className="rounded-lg border border-dashed border-border p-4">
   <p className="mb-2 text-sm text-muted-foreground">How the end of an invite looks</p>
   <p className="whitespace-pre-line text-sm text-body">{value.trim()||"No signature yet"}</p>
  </div>
  <p className="text-xs text-muted-foreground">Saved signature is available for future invite and placement email templates. Sending requires configured email delivery.</p>
  <button type="button" onClick={()=>void save()} disabled={busy||saved===value}
   className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50">Save</button>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {notice?<p role="status" className="text-sm">{notice}</p>:null}
 </section>;
}
