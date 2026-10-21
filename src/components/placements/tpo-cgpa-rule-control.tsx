"use client";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {InlineNotice} from "@/components/ui/inline-notice";
import {useToast} from "@/components/ui/toast";
import type {CgpaRule} from "@/modules/profile-verification/academic-marks";

const OPTIONS:[
 CgpaRule,string
][]=[
 ["X9_5","CGPA × 9.5"],
 ["MINUS_0_5_X10","(CGPA − 0.5) × 10"],
 ["MINUS_0_75_X10","(CGPA − 0.75) × 10"],
 ["X10","CGPA × 10"],
];
export function TpoCgpaRuleControl({initialRule}:{initialRule:CgpaRule}){
 const router=useRouter(),{showToast}=useToast(),lock=useRef(false);
 const [selected,setSelected]=useState<CgpaRule>(initialRule);
 const [saved,setSaved]=useState(initialRule);
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 async function save(){
  if(lock.current||selected===saved)return;
  lock.current=true;setBusy(true);setError("");
  try{
   const response=await fetch("/api/placements/tpo/settings/cgpa-rule",{
    method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({rule:selected}),
   });
   const payload:unknown=await response.json().catch(()=>null);
   if(!response.ok){
    const code=payload&&typeof payload==="object"&&"error" in payload?
     String((payload as {error:unknown}).error):"";
    throw Error(code==="FORBIDDEN"?"Only a TPO admin can change the college CGPA rule.":
     "Could not save the CGPA conversion. Try again.");
   }
   setSaved(selected);
   showToast({tone:"success",title:"CGPA conversion updated",
    description:"Verified comparable percentages were recalculated; original marks were not changed."});
   router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Could not save the CGPA conversion.");}
  finally{lock.current=false;setBusy(false);}
 }
 return <section className="min-w-0 space-y-3 border-t border-border pt-4" aria-label="CGPA percentage conversion">
  <h3 className="text-base font-semibold text-foreground">CGPA to percentage rule</h3>
  <p className="text-sm text-body">Choose how a CGPA becomes a comparable percentage.
   Changing the rule recalculates verified percentages; original marks stay unchanged.</p>
  <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end">
   <label className="grid min-w-0 flex-1 gap-[6px] text-[13px] font-semibold text-[var(--lms-neutral-400)]">
    CGPA percentage conversion
    <Select disabled={busy} value={selected}
     onChange={event=>setSelected(event.target.value as CgpaRule)}
     className="min-h-11 w-full md:min-h-9">
     {OPTIONS.map(([value,label])=><option key={value} value={value}>{label}</option>)}
    </Select>
   </label>
   <Button type="button" disabled={busy||selected===saved} loading={busy}
    className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={()=>void save()}>
    Change
   </Button>
  </div>
  {error?<InlineNotice tone="error" message={error}/>:null}
 </section>;
}
