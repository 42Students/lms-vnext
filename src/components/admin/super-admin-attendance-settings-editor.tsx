"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {attendancePolicyUpdateSchema} from "@/modules/attendance/policy-validation";
export function SuperAdminAttendanceSettingsEditor({collegeId,eligibilityThresholdPercent,correctionWindowHours,maxCorrectionHours=168}:{
 collegeId:string;eligibilityThresholdPercent:number;correctionWindowHours:number;maxCorrectionHours?:number;
}){
 const router=useRouter(),[threshold,setThreshold]=useState(String(eligibilityThresholdPercent)),
  [hours,setHours]=useState(String(correctionWindowHours)),[saving,setSaving]=useState(false),
  [message,setMessage]=useState("");
 async function save(){
  const input={collegeId,eligibilityThresholdPercent:Number(threshold),correctionWindowHours:Number(hours)};
  const parsed=attendancePolicyUpdateSchema.safeParse(input);
  if(!parsed.success){setMessage("Eligibility must be 1–100%; correction window must be 1–"+maxCorrectionHours+" hours.");return;}
  if(!window.confirm("Save attendance settings for this college?"))return;
  setSaving(true);setMessage("");
  try{
   const response=await fetch("/api/attendance/admin/policy",{method:"PUT",
    headers:{"content-type":"application/json"},body:JSON.stringify(parsed.data)});
   if(!response.ok)throw Error("Attendance settings could not be saved.");
   setMessage("Attendance settings saved.");router.refresh();
  }catch(error){setMessage(error instanceof Error?error.message:"Unable to save");}
  finally{setSaving(false);}
 }
 return <section aria-label="College attendance settings" className="space-y-3 rounded-xl border border-border bg-surface p-4">
  <h2 className="font-semibold">Attendance settings</h2>
  <p className="text-sm text-body">Current vNext database bounds: 1–100% eligibility and 1–{maxCorrectionHours} hours Faculty correction window. Higher values require the registered attendance correction-window migration.</p>
  <div className="flex flex-wrap items-end gap-3">
   <label className="grid gap-1 text-sm">Eligibility threshold %
    <input type="number" min={1} max={100} step={1} value={threshold}
     onChange={e=>setThreshold(e.target.value)} className="min-h-11 rounded border border-border bg-background px-3"/></label>
   <label className="grid gap-1 text-sm">Faculty correction window (hours)
    <input type="number" min={1} max={maxCorrectionHours} step={1} value={hours}
     onChange={e=>setHours(e.target.value)} className="min-h-11 rounded border border-border bg-background px-3"/></label>
   <button type="button" disabled={saving} onClick={()=>void save()}
    className="min-h-11 rounded bg-primary px-4 text-on-primary disabled:opacity-50">{saving?"Saving…":"Save settings"}</button>
  </div>
  {message?<p role="status" className="text-sm">{message}</p>:null}
 </section>;
}
