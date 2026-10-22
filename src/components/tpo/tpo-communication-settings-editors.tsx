"use client";
import {useRouter} from "next/navigation";
import {useRef,useState} from "react";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import { InlineNotice } from "@/components/ui/inline-notice";

type ResponseBody={error?:string;version?:string};
function saveError(body:ResponseBody){
 return body.error==="TPO_SETTINGS_STALE"?"Settings changed. Refresh before retrying.":
  body.error==="TPO_SETTINGS_PENDING"?"Communication settings are not yet available.":
  "Settings were not saved. Refresh and try again.";
}
export function TpoSmsCapEditor({initial,version}: {initial:number;version:string|null}){
 const router=useRouter();
 const [value,setValue]=useState(initial),[saved,setSaved]=useState(initial);
 const [currentVersion,setCurrentVersion]=useState(version);
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[error,setError]=useState("");
 const inFlight=useRef(false);
 async function save(){
  if(inFlight.current||busy||!Number.isInteger(value)||value<0||value>100000)return;
  inFlight.current=true;setBusy(true);setError("");setNotice("");
  try{
   const response=await fetch("/api/placements/tpo/settings/communication",{
    method:"PATCH",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({section:"SMS_CAP",smsMonthlyCap:value,expectedVersion:currentVersion}),
   });
   const body=await response.json() as ResponseBody;
   if(!response.ok)throw Error(saveError(body));
   setSaved(value);setCurrentVersion(body.version??null);setNotice("Saved");router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Settings were not saved.");}finally{inFlight.current=false;setBusy(false);}
 }
 return <section className="space-y-4 border-t border-border pt-5">
  <h2 className="font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">SMS</h2>
  <p className="font-semibold text-sm leading-[22px]">Always sent (email and SMS), never counted against the limit</p>
  <div className="flex flex-wrap gap-2">{[
   "Round scheduled or changed","Offer released, expiring, expired or withdrawn",
   "Drive cancelled","Application deadline today","Debarred or marked absent",
  ].map(label=><Badge key={label} tone="neutral">{label}</Badge>)}</div>
  <label className="block text-[13px] font-semibold print:hidden leading-4 text-[var(--lms-neutral-400)]">Monthly limit on optional SMS
   <Input type="number" min={0} max={100000} step={1} value={value} disabled={busy}
    onChange={event=>setValue(event.target.value===""?-1:Number(event.target.value))}
    className="mt-2 min-h-11 w-40 min-[768px]:min-h-9 print:hidden"/>
  </label>
  <p className="hidden text-sm print:block leading-[22px]">Optional SMS monthly limit: {value}</p>
  <p className="text-xs text-muted-foreground leading-[20px]">SMS used this month: unavailable until delivery usage is connected. Saving a limit does not enable SMS delivery.</p>
  <Button type="button" onClick={()=>void save()} disabled={busy||saved===value||value<0||value>100000||!Number.isInteger(value)}
   className="min-h-11 min-[768px]:min-h-9 print:hidden">Save</Button>
  {error?<InlineNotice tone="error" message={error}/>:null}
  {notice?<InlineNotice tone="success" message={notice}/>:null}
 </section>;
}
export function TpoEmailSignatureEditor({initial,version}:{initial:string;version:string|null}){
 const router=useRouter();
 const [value,setValue]=useState(initial),[saved,setSaved]=useState(initial);
 const [currentVersion,setCurrentVersion]=useState(version);
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[error,setError]=useState("");
 const inFlight=useRef(false);
 async function save(){
  if(inFlight.current||busy||value.length>300)return;
  inFlight.current=true;setBusy(true);setError("");setNotice("");
  try{
   const response=await fetch("/api/placements/tpo/settings/communication",{
    method:"PATCH",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({section:"SIGNATURE",emailSignature:value,expectedVersion:currentVersion}),
   });
   const body=await response.json() as ResponseBody;
   if(!response.ok)throw Error(saveError(body));
   setSaved(value);setCurrentVersion(body.version??null);setNotice("Saved");router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Settings were not saved.");}finally{inFlight.current=false;setBusy(false);}
 }
 return <section className="space-y-4 border-t border-border pt-5">
  <h2 className="hidden font-semibold print:block text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">Email signature preview</h2>
  <label className="block text-[13px] font-semibold print:hidden leading-4 text-[var(--lms-neutral-400)]">Email signature
   <Textarea rows={3} maxLength={300} value={value} disabled={busy}
    placeholder={"Training and Placement Cell\nYour college's name"}
    onChange={event=>setValue(event.target.value)}
    className="mt-2 w-full"/>
  </label>
  <p className="text-right text-xs text-muted-foreground print:hidden leading-[20px]">{value.length}/300</p>
  <div className="border-y border-dashed border-border py-4">
   <p className="mb-2 text-sm text-muted-foreground leading-[22px]">How the end of an invite looks</p>
   <p className="whitespace-pre-line text-sm text-body leading-[22px]">{value.trim()||"No signature yet"}</p>
  </div>
  <p className="text-xs text-muted-foreground print:hidden leading-[20px]">Saved signature is available for future invite and placement email templates. Sending requires configured email delivery.</p>
  <Button type="button" onClick={()=>void save()} disabled={busy||saved===value}
   className="min-h-11 w-full min-[768px]:w-auto min-[768px]:min-h-9 print:hidden">Save</Button>
  {error?<InlineNotice tone="error" message={error}/>:null}
  {notice?<InlineNotice tone="success" message={notice}/>:null}
 </section>;
}

/** Legacy "Approve each drive a recruiter requests" switch (tpo/settings.js RecruiterRules). */
export function TpoRecruiterApprovalEditor({initial,version}:{initial:boolean;version:string|null}){
 const router=useRouter();
 const [approval,setApproval]=useState(initial),[saved,setSaved]=useState(initial);
 const [currentVersion,setCurrentVersion]=useState(version);
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[error,setError]=useState("");
 const inFlight=useRef(false);
 async function save(){
  if(inFlight.current||busy)return;
  inFlight.current=true;setBusy(true);setError("");setNotice("");
  try{
   const response=await fetch("/api/placements/tpo/settings/communication",{
    method:"PATCH",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({section:"RECRUITER_APPROVAL",recruiterDriveNeedsApproval:approval,expectedVersion:currentVersion}),
   });
   const data=await response.json() as ResponseBody;
   if(!response.ok)throw Error(saveError(data));
   setSaved(approval);setCurrentVersion(data.version??null);setNotice("Saved");router.refresh();
  }catch(caught){setError(caught instanceof Error?caught.message:"Settings were not saved.");}
  finally{inFlight.current=false;setBusy(false);}
 }
 return <section className="space-y-3 border-t border-border pt-5">
  <h2 className="font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">How recruiters work with you</h2>
  <label className="flex items-start gap-3 text-sm font-semibold">
   <input type="checkbox" checked={approval} disabled={busy}
    onChange={event=>setApproval(event.target.checked)} className="mt-1 h-5 w-5"/>
   <span>Approve each drive a recruiter requests</span>
  </label>
  <p className="text-xs text-muted-foreground leading-[20px]">{approval?"On: a request waits for your approval before you set dates and publish it.":"Off: a request is approved as it arrives (unless the recruiter is still waiting for verification). You still set dates and publish."}</p>
  <Button type="button" onClick={()=>void save()} disabled={busy||saved===approval}
   className="min-h-11 w-full sm:w-auto min-[768px]:min-h-9 print:hidden">Save</Button>
  {error?<InlineNotice tone="error" message={error}/>:null}
  {notice?<InlineNotice tone="success" message={notice}/>:null}
 </section>;
}

/** Changes future grants only. Existing recruiter expiries are not silently extended. */
export function TpoRecruiterDurationEditor({initial,version}:{initial:number;version:string|null}){
 const router=useRouter();
 const [months,setMonths]=useState(initial),[saved,setSaved]=useState(initial);
 const [currentVersion,setCurrentVersion]=useState(version);
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[error,setError]=useState("");
 const inFlight=useRef(false);
 async function save(){
  if(inFlight.current||busy||![3,6,12,24].includes(months))return;
  inFlight.current=true;setBusy(true);setError("");setNotice("");
  try{
   const response=await fetch("/api/placements/tpo/settings/communication",{
    method:"PATCH",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({section:"RECRUITER_DURATION",recruiterAccessMonths:months,expectedVersion:currentVersion}),
   });
   const data=await response.json() as ResponseBody;
   if(!response.ok)throw Error(saveError(data));
   setSaved(months);setCurrentVersion(data.version??null);setNotice("Saved");router.refresh();
  }catch(caught){setError(caught instanceof Error?caught.message:"Settings were not saved.");}
  finally{inFlight.current=false;setBusy(false);}
 }
 return <section className="space-y-3 border-t border-border pt-5">
  <h2 className="font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">Recruiter access lasts</h2>
  <label className="block text-[13px] print:hidden font-semibold leading-4 text-[var(--lms-neutral-400)]">Access granted to a recruiter lasts
   <Select value={[3,6,12,24].includes(months)?months:6}
    onChange={event=>setMonths(Number(event.target.value))} disabled={busy}
    className="mt-2 min-h-11 min-[768px]:min-h-9">
    {[3,6,12,24].map(value=><option key={value} value={value}>{value} months</option>)}
   </Select>
  </label>
  <p className="hidden text-sm print:block leading-[22px]">New recruiter access duration: {months} months</p>
  <p className="text-xs text-muted-foreground leading-[20px]">This duration is applied to new recruiter grants. Existing access expires on its recorded date. No end date is unavailable until a corresponding grant-expiry policy is approved.</p>
  <Button type="button" onClick={()=>void save()} disabled={busy||saved===months}
   className="min-h-11 w-full sm:w-auto min-[768px]:min-h-9 print:hidden">Save</Button>
  {error?<InlineNotice tone="error" message={error}/>:null}
  {notice?<InlineNotice tone="success" message={notice}/>:null}
 </section>;
}
