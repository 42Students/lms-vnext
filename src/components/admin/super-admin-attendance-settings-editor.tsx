"use client";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {DEFAULT_ATTENDANCE_POLICY} from "@/modules/attendance/policy-validation";
export function SuperAdminAttendanceSettingsEditor({collegeId,eligibilityThresholdPercent,correctionWindowHours,maxCorrectionHours=168}:{
 collegeId:string;eligibilityThresholdPercent:number;correctionWindowHours:number;maxCorrectionHours?:number;
}){
 const router=useRouter();
 const [threshold,setThreshold]=useState(String(eligibilityThresholdPercent));
 const [hours,setHours]=useState(String(correctionWindowHours));
 const [saving,setSaving]=useState(false),[confirming,setConfirming]=useState(false);
 const [selectedField,setSelectedField]=useState<"correctionWindowHours"|"eligibilityThresholdPercent"|null>(null);
 const [savedHours,setSavedHours]=useState(correctionWindowHours),[savedThreshold,setSavedThreshold]=useState(eligibilityThresholdPercent);
 const [source,setSource]=useState<"UNKNOWN"|"COLLEGE"|"DEFAULT">("UNKNOWN");
 const [reloading,setReloading]=useState(false);
 const [message,setMessage]=useState(""),[failed,setFailed]=useState(false);
 useEffect(()=>{
  let cancelled=false;
  void fetch("/api/attendance/admin/policy?collegeId="+encodeURIComponent(collegeId),{credentials:"same-origin"})
   .then(async response=>{if(!response.ok)throw new Error("Policy source unavailable");return response.json() as Promise<{hasCollegeOverride:boolean}>;})
   .then(value=>{if(!cancelled)setSource(value.hasCollegeOverride?"COLLEGE":"DEFAULT");})
   .catch(()=>{if(!cancelled)setSource("UNKNOWN");});
  return ()=>{cancelled=true;};
 },[collegeId]);
 const withinRange=hours.trim()!==""&&Number.isInteger(Number(hours))&&Number(hours)>=1&&Number(hours)<=maxCorrectionHours;
 const thresholdValid=threshold.trim()!==""&&Number.isInteger(Number(threshold))&&Number(threshold)>=1&&Number(threshold)<=100;
 const hoursDirty=hours!==String(savedHours);
 const thresholdDirty=threshold!==String(savedThreshold);
 function requestSave(field:"correctionWindowHours"|"eligibilityThresholdPercent"){
  if(saving||reloading)return;
  const dirty=field==="correctionWindowHours"?hoursDirty:thresholdDirty;
  const valid=field==="correctionWindowHours"?withinRange:thresholdValid;
  if(!dirty)return;
  if(!valid){setMessage(field==="correctionWindowHours"
    ?"Late marking must be 1–"+maxCorrectionHours+" hours.":"Minimum attendance must be 1–100%.");
    setFailed(true);return;}
  setSelectedField(field);setMessage("");setFailed(false);setConfirming(true);
 }
 async function reloadField(field:"correctionWindowHours"|"eligibilityThresholdPercent"){
  if(saving||reloading)return;
  setReloading(true);setMessage("");setFailed(false);
  try{
   const response=await fetch("/api/attendance/admin/policy?collegeId="+encodeURIComponent(collegeId),{credentials:"same-origin"});
   if(!response.ok)throw new Error("Could not reload attendance policy.");
   const data=await response.json() as {policy:{correctionWindowHours:number;eligibilityThresholdPercent:number};hasCollegeOverride:boolean};
   setSavedHours(data.policy.correctionWindowHours);setSavedThreshold(data.policy.eligibilityThresholdPercent);
   if(field==="correctionWindowHours")setHours(String(data.policy.correctionWindowHours));
   else setThreshold(String(data.policy.eligibilityThresholdPercent));
   setSource(data.hasCollegeOverride?"COLLEGE":"DEFAULT");
   setMessage("Attendance setting reloaded.");
  }catch{setMessage("Couldn't reload attendance settings. Retry.");setFailed(true);}
  finally{setReloading(false);}
 }
 async function save(){
  if(saving||!selectedField)return;
  const valid=selectedField==="correctionWindowHours"?withinRange:thresholdValid;
  if(!valid)return;
  setSaving(true);setMessage("");setFailed(false);
  try{
   const response=await fetch("/api/attendance/admin/policy",{
    method:"PATCH",credentials:"same-origin",headers:{"content-type":"application/json"},
    body:JSON.stringify({collegeId,field:selectedField,
      expectedValue:selectedField==="correctionWindowHours"?savedHours:savedThreshold,
      value:Number(selectedField==="correctionWindowHours"?hours:threshold)}),
   });
   if(!response.ok)throw new Error(response.status===409?"Attendance setting changed elsewhere. Reload this field before saving.":"Failed");
   const data=await response.json() as {policy:{correctionWindowHours:number;eligibilityThresholdPercent:number}};
   setSavedHours(data.policy.correctionWindowHours);setSavedThreshold(data.policy.eligibilityThresholdPercent);
   setSource("COLLEGE");setConfirming(false);setSelectedField(null);
   setMessage("Saved");router.refresh();
  }catch(error){setMessage(error instanceof Error&&error.message!=="Failed"?error.message:"Attendance setting could not be saved. Try again.");setFailed(true);}
  finally{setSaving(false);}
 }
 return <section aria-label="Attendance policy" className="min-w-0 space-y-[var(--lms-space-3)] pb-[var(--lms-space-4)]">
  <h2 className="font-semibold text-[var(--lms-heading)]">Attendance policy</h2>
  <div className="grid gap-4 md:grid-cols-2 print:hidden">
   <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold text-[var(--lms-neutral-400)] leading-4">Late marking allowed for
    <Input type="number" min={1} max={maxCorrectionHours} step={1} value={hours}
     onChange={e=>{setHours(e.target.value);setMessage("");setFailed(false);}} aria-describedby="late-marking-help"
     aria-invalid={failed&&!withinRange}
     className="min-h-11 w-full md:min-h-9"/>
    <span className="text-xs font-normal text-muted-foreground">{source==="COLLEGE"?"College policy":source==="DEFAULT"?"Default (24 hours)":"Policy source unavailable"}</span>
    <div className="flex flex-wrap gap-2">
     <Button size="sm" type="button" disabled={saving||reloading||!hoursDirty||!withinRange} onClick={()=>requestSave("correctionWindowHours")}>Save</Button>
     <Button size="sm" variant="secondary" type="button" disabled={saving||reloading} onClick={()=>void reloadField("correctionWindowHours")}>Reload</Button>
     <Button size="sm" variant="secondary" type="button" disabled={saving||reloading} onClick={()=>setHours(String(DEFAULT_ATTENDANCE_POLICY.correctionWindowHours))}>Use default value</Button>
    </div>
    <span id="late-marking-help" className="max-w-prose text-xs font-normal leading-5 text-muted-foreground">How long after a class ends attendance can be marked or corrected. (hours)</span>
   </label>
   <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold text-[var(--lms-neutral-400)] leading-4">Minimum attendance
    <Input type="number" min={1} max={100} step={1} value={threshold}
     onChange={e=>{setThreshold(e.target.value);setMessage("");setFailed(false);}} aria-describedby="minimum-attendance-help"
     aria-invalid={failed&&!thresholdValid}
     className="min-h-11 w-full md:min-h-9"/>
    <span className="text-xs font-normal text-muted-foreground">{source==="COLLEGE"?"College policy":source==="DEFAULT"?"Default (75%)":"Policy source unavailable"}</span>
    <div className="flex flex-wrap gap-2">
     <Button size="sm" type="button" disabled={saving||reloading||!thresholdDirty||!thresholdValid} onClick={()=>requestSave("eligibilityThresholdPercent")}>Save</Button>
     <Button size="sm" variant="secondary" type="button" disabled={saving||reloading} onClick={()=>void reloadField("eligibilityThresholdPercent")}>Reload</Button>
     <Button size="sm" variant="secondary" type="button" disabled={saving||reloading} onClick={()=>setThreshold(String(DEFAULT_ATTENDANCE_POLICY.eligibilityThresholdPercent))}>Use default value</Button>
    </div>
    <span id="minimum-attendance-help" className="max-w-prose text-xs font-normal leading-5 text-muted-foreground">Shown to students, and used here to flag students below it. It does not block anyone from exams. (%)</span>
   </label>
  </div>
  <p className="hidden text-sm text-body print:block leading-[22px]">Late marking: {correctionWindowHours} hours · Minimum attendance: {eligibilityThresholdPercent}%</p>
  <p className="text-xs text-muted-foreground print:hidden">Each Save updates only its own setting. Use default value selects 24 hours or 75%, but does not remove a college override or invent global/organization inheritance.</p>
  {message?<Alert tone={failed?"error":"success"}>{message}</Alert>:null}
  <ConfirmDialog open={confirming} onOpenChange={setConfirming} title="Save attendance setting for this college?"
   description="Only the chosen setting changes. The other value stays at its latest saved value." confirmVariant="primary" confirmLabel="Save setting"
   pending={saving} onConfirm={()=>void save()}>
    <p className="text-sm text-body leading-[22px]">{selectedField==="correctionWindowHours"?"Late marking: "+hours+" hours":"Minimum attendance: "+threshold+"%"}</p>
    {failed&&message?<Alert tone="error">{message}</Alert>:null}
  </ConfirmDialog>
 </section>;
}
