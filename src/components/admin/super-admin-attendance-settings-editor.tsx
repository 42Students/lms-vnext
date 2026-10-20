"use client";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {attendancePolicyUpdateSchema} from "@/modules/attendance/policy-validation";
export function SuperAdminAttendanceSettingsEditor({collegeId,eligibilityThresholdPercent,correctionWindowHours,maxCorrectionHours=168}:{
 collegeId:string;eligibilityThresholdPercent:number;correctionWindowHours:number;maxCorrectionHours?:number;
}){
 const router=useRouter();
 const [threshold,setThreshold]=useState(String(eligibilityThresholdPercent));
 const [hours,setHours]=useState(String(correctionWindowHours));
 const [saving,setSaving]=useState(false),[confirming,setConfirming]=useState(false);
 const [message,setMessage]=useState(""),[failed,setFailed]=useState(false);
 const parsed=attendancePolicyUpdateSchema.safeParse({
  collegeId,eligibilityThresholdPercent:Number(threshold),correctionWindowHours:Number(hours),
 });
 const withinRange=Number.isInteger(Number(hours))&&Number(hours)>=1&&Number(hours)<=maxCorrectionHours;
 function requestSave(){
  if(saving)return;
  if(!parsed.success||!withinRange){
   setMessage("Minimum attendance must be 1–100%; late marking must be 1–"+maxCorrectionHours+" hours.");
   setFailed(true);return;
  }
  setMessage("");setFailed(false);setConfirming(true);
 }
 async function save(){
  if(saving||!parsed.success||!withinRange)return;
  setSaving(true);setMessage("");setFailed(false);
  try{
   const response=await fetch("/api/attendance/admin/policy",{
    method:"PUT",credentials:"same-origin",headers:{"content-type":"application/json"},
    body:JSON.stringify(parsed.data),
   });
   if(!response.ok)throw new Error("Failed");
   setConfirming(false);setMessage("Attendance settings saved.");router.refresh();
  }catch{setMessage("Attendance settings could not be saved. Try again.");setFailed(true);}
  finally{setSaving(false);}
 }
 return <section aria-label="Attendance policy" className="space-y-3 border-b border-border pb-5">
  <h2 className="font-semibold text-foreground">Attendance policy</h2>
  <div className="grid gap-4 md:grid-cols-2 print:hidden">
   <label className="grid gap-1 text-[13px] font-semibold text-body">Late marking allowed for
    <Input type="number" min={1} max={maxCorrectionHours} step={1} value={hours}
     onChange={e=>setHours(e.target.value)} aria-describedby="late-marking-help"
     className="min-h-11 w-full md:min-h-9"/>
    <span id="late-marking-help" className="text-xs font-normal text-muted-foreground">How long after a class ends attendance can be marked or corrected. (hours)</span>
   </label>
   <label className="grid gap-1 text-[13px] font-semibold text-body">Minimum attendance
    <Input type="number" min={1} max={100} step={1} value={threshold}
     onChange={e=>setThreshold(e.target.value)} aria-describedby="minimum-attendance-help"
     className="min-h-11 w-full md:min-h-9"/>
    <span id="minimum-attendance-help" className="text-xs font-normal text-muted-foreground">Shown to students, and used here to flag students below it. It does not block anyone from exams. (%)</span>
   </label>
  </div>
  <p className="hidden text-sm text-body print:block">Late marking: {correctionWindowHours} hours · Minimum attendance: {eligibilityThresholdPercent}%</p>
  <Button variant="primary" type="button" loading={saving} disabled={saving} onClick={requestSave}
   className="min-h-11 md:min-h-9 print:hidden">{saving?"Saving…":"Save attendance policy"}</Button>
  {message?<Alert tone={failed?"error":"success"}>{message}</Alert>:null}
  <ConfirmDialog open={confirming} onOpenChange={setConfirming} title="Save attendance settings for this college?"
   description="Changes apply to the selected college." confirmVariant="primary" confirmLabel="Save settings"
   pending={saving} onConfirm={()=>void save()}>
    <p className="text-sm text-body">Late marking: {hours} hours · Minimum attendance: {threshold}%</p>
  </ConfirmDialog>
 </section>;
}
