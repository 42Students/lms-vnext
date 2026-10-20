"use client";
import {Select} from "@/components/ui/select";
import {Checkbox} from "@/components/ui/checkbox";
import {Switch} from "@/components/ui/selection-controls";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Button} from "@/components/ui/button";
import {Alert} from "@/components/ui/alert";
import {collegeRulePayload,isCollegeRuleDirty,collegeRuleReceipt,collegeRuleSelection,parseCollegeRuleRecheck,type CollegeModule,type CollegeChoice,type ObservedCollegeRule} from "@/modules/module-access/admin-college-rule-ui-model";
export function CollegeFeatureRuleEditor({collegeId,module,stored,ancestorLocked}:{collegeId:string;module:CollegeModule;stored:ObservedCollegeRule;ancestorLocked:boolean}){
 const router=useRouter();
 const [observed,setObserved]=useState<ObservedCollegeRule>(stored);
 const [choice,setChoice]=useState<CollegeChoice>(collegeRuleSelection(stored));
 const [locked,setLocked]=useState(stored?.locked??false);
 const [confirm,setConfirm]=useState(false);
 const [busy,setBusy]=useState(false);
 const [feedback,setFeedback]=useState("");
 const [feedbackTone,setFeedbackTone]=useState<"success"|"error">("success");
 const [impact,setImpact]=useState<string|null>(null);
 const [students,setStudents]=useState<number|null>(null);
 const [acknowledgedPopulation,setAcknowledgedPopulation]=useState(false);
 const [impactBusy,setImpactBusy]=useState(false);
 const lockChanged=observed!==null&&(choice==="INHERIT"?observed.locked:locked!==observed.locked);
 const endpoint="/api/admin/features/"+encodeURIComponent(collegeId)+"/rules";
 const disabled=busy||impactBusy||confirm||!isCollegeRuleDirty(choice,locked,observed)||(ancestorLocked&&choice!=="INHERIT");
 async function recheck(){
  setBusy(true);setFeedback("");
  try{
   const response=await fetch(endpoint,{method:"GET",cache:"no-store"});
   const data:unknown=await response.json().catch(()=>null);
   const current=response.ok?parseCollegeRuleRecheck(data,module):undefined;
   if(current===undefined){setFeedbackTone("error");setFeedback("Current policy cannot be verified. No edit state was changed.");return;}
   setObserved(current);setChoice(collegeRuleSelection(current));setLocked(current?.locked??false);
   setFeedbackTone("success");setFeedback("Current stored college rule reloaded.");router.refresh();
  }catch{setFeedbackTone("error");setFeedback("Could not recheck the college rule.");}
  finally{setBusy(false);}
 }
 async function reviewChange(){
  if(busy||impactBusy||confirm||disabled)return;
  setFeedback("");setImpactBusy(true);setImpact(null);setStudents(null);setAcknowledgedPopulation(false);
  try{
   const response=await fetch("/api/admin/features/"+encodeURIComponent(collegeId)+
     "/impact?module="+encodeURIComponent(module),{cache:"no-store"});
   if(!response.ok)throw Error("impact not available");
   const snapshot=await response.json() as {summary:string;students:number};
   setImpact(snapshot.summary);
   if(Number.isInteger(snapshot.students)&&snapshot.students>=0)setStudents(snapshot.students);
  }catch{setImpact("Blast-radius counts are unavailable. This is not a safety check.");}
  finally{setImpactBusy(false);setConfirm(true);}
 }
 async function save(){
  if(students===null||(students>=100&&!acknowledgedPopulation))return;
  setBusy(true);setFeedback("");
  try{
   const response=await fetch(endpoint,{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify(collegeRulePayload(module,choice,locked,observed))});
   const data:unknown=await response.json().catch(()=>null);
   if(!response.ok){
    const error=data&&typeof data==="object"&&"error" in data?String(data.error):"REQUEST_FAILED";
    setFeedbackTone("error");
    setFeedback(error==="STALE_RULE"?"Policy changed in another session. Recheck before editing again.":error==="ANCESTOR_LOCKED"?"A higher-level lock now prevents this override.": "Change failed ("+error+").");
    return;
   }
   if(!collegeRuleReceipt(data,module,choice,locked)){setFeedbackTone("error");setFeedback("The server did not confirm the stored state. Recheck before retrying.");return;}
   setObserved(choice==="INHERIT"?null:{enabled:choice==="ON",locked});
   setFeedbackTone("success");setFeedback("Saved. Effective policy is refreshing.");
   router.refresh();
  }catch{setFeedbackTone("error");setFeedback("Connection failed. The change was not confirmed.");}
  finally{setBusy(false);setConfirm(false);}
 }
 return <section aria-label="College feature policy" aria-busy={busy||impactBusy} className="mt-3 min-w-0 space-y-3 border-t border-border pt-3 print:hidden">
  {ancestorLocked?<Alert tone="warning">Locked by a broader policy. Only Inherit is available for cleanup.</Alert>:null}
  <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-end">
   <label className="grid min-w-0 gap-1.5 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">College stored value
    <Select className="min-h-11 w-full sm:min-h-9" value={choice} disabled={busy||impactBusy||confirm}
     onChange={e=>{setChoice(e.target.value as CollegeChoice);setFeedback("");}}>
     <option value="INHERIT">Inherit</option><option value="ON" disabled={ancestorLocked}>On</option><option value="OFF" disabled={ancestorLocked}>Off</option>
    </Select>
   </label>
   <div className="flex min-h-11 min-w-0 items-center sm:min-h-9">
    <Switch label="Lock this college rule" checked={locked}
     disabled={busy||impactBusy||confirm||ancestorLocked||choice==="INHERIT"} onChange={e=>{setLocked(e.target.checked);setFeedback("");}}/>
   </div>
  </div>
  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
   <Button size="sm" variant="primary" className="min-h-11 w-full sm:min-h-9 sm:w-auto"
    disabled={disabled} loading={impactBusy} onClick={()=>{void reviewChange();}}>
    {impactBusy?"Checking impact…":"Review policy change"}
   </Button>
   <Button size="sm" variant="secondary" className="min-h-11 w-full sm:min-h-9 sm:w-auto"
    disabled={busy||impactBusy||confirm} onClick={()=>{void recheck();}}>Recheck stored rule</Button>
  </div>
  {impactBusy?<p role="status" className="m-0 text-xs leading-5 text-muted-foreground">Checking the active student population before confirmation…</p>:null}
  {feedback?<Alert tone={feedbackTone}>{feedback}</Alert>:null}
  <ConfirmDialog open={confirm} onOpenChange={next=>{if(!busy)setConfirm(next);}}
   title={lockChanged?"Confirm college feature lock change":"Confirm college feature policy"}
   description={choice==="INHERIT"?"Remove the stored college override. Inheritance will resume.":"Store "+(choice==="ON"?"On":"Off")+(locked?" and lock it":" without a lock")+". Descendants may be affected."}
   confirmLabel="Apply change" confirmVariant="danger" pending={busy}
   confirmDisabled={busy||impactBusy||!isCollegeRuleDirty(choice,locked,observed)||(ancestorLocked&&choice!=="INHERIT")||students===null||(students>=100&&!acknowledgedPopulation)} onConfirm={()=>{void save();}}>
   <div className="min-w-0 space-y-3">
    <p className="m-0 break-words text-sm leading-5 text-body">This affects the selected college. The server checks your scope, current policy and broader locks, and writes an audit event.</p>
    {lockChanged?<Alert tone="warning">You are changing the policy lock. Descendant overrides may gain or lose the ability to take effect.</Alert>:null}
    {students!==null?<p className="m-0 break-words text-sm font-semibold leading-5 text-body">Active learners in this college: {students.toLocaleString("en-IN")}</p>:
     <Alert tone="warning">Student population could not be confirmed. The change will not be saved.</Alert>}
    {students!==null&&students>=100?<label className="flex min-h-11 min-w-0 items-start gap-3 py-2 text-sm leading-5 text-body">
      <Checkbox checked={acknowledgedPopulation} disabled={busy}
       onChange={e=>setAcknowledgedPopulation(e.target.checked)}/>
      <span className="min-w-0 break-words">I understand this may change access for {students.toLocaleString("en-IN")} active learners.</span>
    </label>:null}
    {impact?<Alert tone={students===null?"warning":"info"}>{impact}</Alert>:null}
   </div>
  </ConfirmDialog>
 </section>;
}
