"use client";
import {Select} from "@/components/ui/select";
import {Checkbox} from "@/components/ui/checkbox";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import {collegeRulePayload,isCollegeRuleDirty,collegeRuleReceipt,collegeRuleSelection,parseCollegeRuleRecheck,type CollegeModule,type CollegeChoice,type ObservedCollegeRule} from "@/modules/module-access/admin-college-rule-ui-model";
export function CollegeFeatureRuleEditor({collegeId,module,stored,ancestorLocked}:{collegeId:string;module:CollegeModule;stored:ObservedCollegeRule;ancestorLocked:boolean}){
 const router=useRouter();
 const [observed,setObserved]=useState<ObservedCollegeRule>(stored);
 const [choice,setChoice]=useState<CollegeChoice>(collegeRuleSelection(stored));
 const [locked,setLocked]=useState(stored?.locked??false);
 const [confirm,setConfirm]=useState(false);
 const [busy,setBusy]=useState(false);
 const [feedback,setFeedback]=useState("");
 const [impact,setImpact]=useState<string|null>(null);
 const [students,setStudents]=useState<number|null>(null);
 const [acknowledgedPopulation,setAcknowledgedPopulation]=useState(false);
 const [impactBusy,setImpactBusy]=useState(false);
 const lockChanged=observed!==null&&(choice==="INHERIT"?observed.locked:locked!==observed.locked);
 const endpoint="/api/admin/features/"+encodeURIComponent(collegeId)+"/rules";
 const disabled=busy||!isCollegeRuleDirty(choice,locked,observed)||(ancestorLocked&&choice!=="INHERIT");
 async function recheck(){
  setBusy(true);setFeedback("");
  try{
   const response=await fetch(endpoint,{method:"GET",cache:"no-store"});
   const data:unknown=await response.json().catch(()=>null);
   const current=response.ok?parseCollegeRuleRecheck(data,module):undefined;
   if(current===undefined){setFeedback("Current policy cannot be verified. No edit state was changed.");return;}
   setObserved(current);setChoice(collegeRuleSelection(current));setLocked(current?.locked??false);
   setFeedback("Current stored college rule reloaded.");router.refresh();
  }catch{setFeedback("Could not recheck the college rule.");}
  finally{setBusy(false);}
 }
 async function reviewChange(){
  if(busy)return;
  setImpactBusy(true);setImpact(null);setStudents(null);setAcknowledgedPopulation(false);
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
    setFeedback(error==="STALE_RULE"?"Policy changed in another session. Recheck before editing again.":error==="ANCESTOR_LOCKED"?"A higher-level lock now prevents this override.": "Change failed ("+error+").");
    return;
   }
   if(!collegeRuleReceipt(data,module,choice,locked)){setFeedback("The server did not confirm the stored state. Recheck before retrying.");return;}
   setObserved(choice==="INHERIT"?null:{enabled:choice==="ON",locked});
   setFeedback("Saved. Effective policy is refreshing.");
   router.refresh();
  }catch{setFeedback("Connection failed. The change was not confirmed.");}
  finally{setBusy(false);setConfirm(false);}
 }
 return <div className="mt-3 space-y-2 border-t border-border pt-3">
  {ancestorLocked?<p className="text-xs text-warning-text">Locked by a broader policy. Only Inherit is available for cleanup.</p>:null}
  <label className="grid gap-1 text-xs font-semibold text-body">College stored value
   <Select className="min-h-11 sm:min-h-9" value={choice} disabled={busy} onChange={e=>setChoice(e.target.value as CollegeChoice)}>
    <option value="INHERIT">Inherit</option><option value="ON" disabled={ancestorLocked}>On</option><option value="OFF" disabled={ancestorLocked}>Off</option>
   </Select>
  </label>
  <label className="flex items-center gap-2 text-xs text-body"><Checkbox checked={locked} disabled={busy||ancestorLocked||choice==="INHERIT"} onChange={e=>setLocked(e.target.checked)}/>Lock this college rule</label>
  <div className="flex flex-wrap gap-2"><Button size="sm" variant="secondary" disabled={disabled||impactBusy} onClick={()=>{void reviewChange();}}>Review policy change</Button><Button size="sm" variant="ghost" disabled={busy} onClick={()=>{void recheck();}}>Recheck stored rule</Button></div>
  {feedback?<p role="status" className="text-xs text-body">{feedback}</p>:null}
  <ConfirmDialog open={confirm} onOpenChange={setConfirm} title={lockChanged?"Confirm college feature lock change":"Confirm college feature policy"}
   description={choice==="INHERIT"?"Remove the stored college override. Inheritance will resume.":"Store "+(choice==="ON"?"On":"Off")+(locked?" and lock it":" without a lock")+". Descendants may be affected."}
   confirmLabel="Apply change" confirmVariant="danger" pending={busy} confirmDisabled={disabled||students===null||(students>=100&&!acknowledgedPopulation)} onConfirm={()=>{void save();}}>
   <p className="text-sm text-body">This affects the selected college. The server checks your scope, current policy and broader locks, and writes an audit event.</p>
   {lockChanged?<p role="alert" className="mt-2 text-sm font-semibold text-warning-text">You are changing the policy lock. Descendant overrides may gain or lose the ability to take effect.</p>:null}
   {students!==null?<p className="mt-2 text-sm font-semibold text-body">Active learners in this college: {students.toLocaleString("en-IN")}</p>:
    <p role="alert" className="mt-2 text-sm text-warning-text">Student population could not be confirmed. The change will not be saved.</p>}
   {students!==null&&students>=100?<label className="mt-3 flex items-start gap-2 text-sm text-body">
     <Checkbox checked={acknowledgedPopulation}
      onChange={e=>setAcknowledgedPopulation(e.target.checked)}/>
     I understand this may change access for {students.toLocaleString("en-IN")} active learners.
   </label>:null}
   {impact?<p role="status" className="mt-2 text-sm text-body">{impact}</p>:null}
  </ConfirmDialog>
 </div>;
}
