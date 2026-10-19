"use client";
import { Button } from "@/components/ui/button";
import {useRef,useState} from "react";
import {apiFetch} from "@/lib/api-fetch";
import {attendanceParentContactInputSchema} from "@/modules/attendance/parent-sms-model";
export function AdminAttendanceParentContactEditor({collegeId,learners}:{collegeId:string;
 learners:readonly {membershipId:string;displayName:string|null}[]}){
 const [open,setOpen]=useState(false);
 const [membershipId,setMembershipId]=useState("");
 const [phoneE164,setPhoneE164]=useState("");
 const [evidence,setEvidence]=useState("");
 const [consent,setConsent]=useState(false),[verified,setVerified]=useState(false);
 const [pending,setPending]=useState(false),[retrying,setRetrying]=useState(false),[error,setError]=useState(""),[success,setSuccess]=useState("");
 const lock=useRef(false);
 const input={collegeId,membershipId,phoneE164,consentEvidenceReference:evidence,
  guardianConsentConfirmed:consent,verifiedParentPhone:verified};
 const valid=attendanceParentContactInputSchema.safeParse(input).success;
 async function revoke(){
  if(pending||retrying||!membershipId)return;
  if(!window.confirm("Disable guardian attendance SMS for this learner and cancel any queued texts?"))return;
  setPending(true);setError("");setSuccess("");
  try{
   const result=await apiFetch<{revoked:boolean;ready:boolean}>(
    "/api/attendance/admin/parent-contacts",{
     method:"DELETE",headers:{"Content-Type":"application/json"},
     body:JSON.stringify({collegeId,membershipId}),
    });
   if(!result.ready)setError("Guardian SMS database setup is unavailable.");
   else setSuccess(result.revoked?"Guardian SMS disabled; pending texts cancelled.":"Guardian SMS was already disabled for this learner.");
  }catch{setError("Could not disable guardian SMS. Reload and retry.");}
  finally{setPending(false);}
 }
 async function retry(){
  if(retrying||pending)return;
  setRetrying(true);setError("");setSuccess("");
  try{
   const result=await apiFetch<{ready:boolean;accepted:number;skipped:number;unavailable:number}>(
    "/api/attendance/admin/parent-contacts/retry",{
     method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({collegeId}),
    });
   if(!result.ready)setError("Attendance SMS requires the registered database migration.");
   else setSuccess(result.accepted+" SMS accepted by the provider; "+result.skipped+
    " outdated or revoked; "+result.unavailable+" unavailable or pending. Accepted is not proof of handset delivery.");
  }catch{setError("Could not review pending guardian SMS. Try again.");}
  finally{setRetrying(false);}
 }

 async function save(){
  if(lock.current||!valid)return;
  lock.current=true;setPending(true);setError("");setSuccess("");
  try{
   const result=await apiFetch<{recorded:boolean;reason?:string}>("/api/attendance/admin/parent-contacts",{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(input),
   });
   if(!result.recorded){
    setError("Guardian SMS setup is unavailable until the attendance messaging database change is installed.");
    return;
   }
   setSuccess("Verified guardian contact recorded. Absence and correction SMS depend on registered Exotel attendance templates.");
   setPhoneE164("");setEvidence("");setConsent(false);setVerified(false);
  }catch{setError("Could not save verified guardian consent. Check the contact, consent evidence and try again.");}
  finally{lock.current=false;setPending(false);}
 }
 return <section aria-label="Verified guardian absence SMS" className="space-y-2 rounded-lg border border-border bg-surface p-3">
  <Button variant="secondary" type="button" aria-expanded={open} onClick={()=>setOpen(v=>!v)}
   >Guardian attendance SMS</Button>
  {open?<div className="grid gap-3 text-sm sm:grid-cols-2">
   <p className="sm:col-span-2">Only record a separately verified parent or guardian phone with documented consent. Never use the learner&apos;s alternate contact as a parent number.</p>
   <label>Student<select className="mt-1 block min-h-10 w-full rounded border border-border px-2"
    value={membershipId} onChange={e=>setMembershipId(e.target.value)}>
    <option value="">Choose a learner</option>
    {learners.map(row=><option value={row.membershipId} key={row.membershipId}>
     {row.displayName?.trim()||row.membershipId.slice(0,8)}
    </option>)}
   </select></label>
   <label>Verified parent phone (E.164)
    <input type="tel" value={phoneE164} maxLength={20} placeholder="+919876543210"
     onChange={e=>setPhoneE164(e.target.value)}
     className="mt-1 block min-h-10 w-full rounded border border-border px-2"/>
   </label>
   <label className="sm:col-span-2">Consent evidence reference (no phone or personal secrets)
    <input value={evidence} maxLength={200} onChange={e=>setEvidence(e.target.value)}
     className="mt-1 block min-h-10 w-full rounded border border-border px-2"/>
   </label>
   <label className="flex items-center gap-2">
    <input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>
    Parent consent was recorded and confirmed
   </label>
   <label className="flex items-center gap-2">
    <input type="checkbox" checked={verified} onChange={e=>setVerified(e.target.checked)}/>
    Parent phone verified independently
   </label>
   <Button variant="primary" type="button" disabled={!valid||pending} onClick={()=>void save()}
    className="min-h-10 rounded bg-primary px-3 text-on-primary">Save verified contact</Button>
   <Button variant="secondary" type="button" disabled={pending||retrying} onClick={()=>void retry()}
    className="min-h-10 rounded border border-border px-3">Retry queued guardian SMS (up to 25)</Button>
   <Button variant="secondary" type="button" disabled={pending||retrying||!membershipId} onClick={()=>void revoke()}
    className="min-h-10 rounded border border-border px-3">Disable guardian SMS for selected learner</Button>
   {success?<p role="status" className="sm:col-span-2">{success}</p>:null}
   {error?<p role="alert" className="sm:col-span-2">{error}</p>:null}
  </div>:null}
 </section>;
}
