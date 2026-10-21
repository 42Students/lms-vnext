"use client";
import {Select} from "@/components/ui/select";
import {Checkbox} from "@/components/ui/checkbox";
import {Switch} from "@/components/ui/selection-controls";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Button} from "@/components/ui/button";
import {Alert} from "@/components/ui/alert";
import {Disclosure} from "@/components/ui/disclosure";
import {useToast} from "@/components/ui/toast";
import {collegeRulePayload,isCollegeRuleDirty,collegeRuleReceipt,collegeRuleSelection,parseCollegeRuleRecheck,type CollegeModule,type CollegeChoice,type ObservedCollegeRule} from "@/modules/module-access/admin-college-rule-ui-model";
export function CollegeFeatureRuleEditor({collegeId,module,stored,ancestorLocked}:{collegeId:string;module:CollegeModule;stored:ObservedCollegeRule;ancestorLocked:boolean}){
 const router=useRouter();
 const {showToast}=useToast();
 const [observed,setObserved]=useState<ObservedCollegeRule>(stored);
 const [choice,setChoice]=useState<CollegeChoice>(collegeRuleSelection(stored));
 const [locked,setLocked]=useState(stored?.locked??false);
 const [confirm,setConfirm]=useState(false);
 const [busy,setBusy]=useState(false);
 const [feedback,setFeedback]=useState("");
 const [feedbackTone,setFeedbackTone]=useState<"success"|"error">("success");
 const [impact,setImpact]=useState<string|null>(null);
 const [impactCounts,setImpactCounts]=useState<number[]|null>(null);
 const [collegeName,setCollegeName]=useState("this college");
 const [retryFailure,setRetryFailure]=useState(false);
 const [ackUnknown,setAckUnknown]=useState(false);
 const [students,setStudents]=useState<number|null>(null);
 const [acknowledgedPopulation,setAcknowledgedPopulation]=useState(false);
 const [impactBusy,setImpactBusy]=useState(false);
 const lockChanged=observed!==null&&(choice==="INHERIT"?observed.locked:locked!==observed.locked);
 const endpoint="/api/admin/features/"+encodeURIComponent(collegeId)+"/rules";
 const dirty=isCollegeRuleDirty(choice,locked,observed);
 const disabled=busy||impactBusy||confirm||!dirty||(ancestorLocked&&choice!=="INHERIT");
 const turningOff=choice==="OFF"&&(observed===null||observed.enabled);
 const projectsOff=turningOff&&module==="projects",placementsOff=turningOff&&module==="placements";
 const canSave=students!==null&&(students<100||acknowledgedPopulation)&&(impactCounts!==null||ackUnknown);
 const moduleLabel=module==="projects"?"Projects":module==="placements"?"Placements":"Electives";
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
  if(disabled)return;
  setFeedback("");setRetryFailure(false);setImpactBusy(true);setImpact(null);
  setImpactCounts(null);setStudents(null);setAckUnknown(false);setAcknowledgedPopulation(false);
  try{
   // The immutable college name and stored rule must be rechecked for this scope.
   const ruleResponse=await fetch(endpoint,{cache:"no-store"});
   const ruleData:unknown=await ruleResponse.json().catch(()=>null);
   const scoped=ruleData&&typeof ruleData==="object"&&"college" in ruleData?ruleData.college:null;
   if(!ruleResponse.ok||!scoped||typeof scoped!=="object"||!("name" in scoped)||
      typeof scoped.name!=="string"||!scoped.name.trim())
    throw Error("Could not verify the selected college. Recheck before editing.");
   const latest=parseCollegeRuleRecheck(ruleData,module);
   if(latest===undefined||JSON.stringify(latest)!==JSON.stringify(observed))
    throw Error("The stored rule changed. Recheck the latest rule before editing.");
   setCollegeName(scoped.name.trim());
   const response=await fetch("/api/admin/features/"+encodeURIComponent(collegeId)+
     "/impact?module="+encodeURIComponent(module),{cache:"no-store"});
   const raw:unknown=response.ok?await response.json().catch(()=>null):null;
   if(raw&&typeof raw==="object"&&"module" in raw&&raw.module===module&&
      "counts" in raw&&Array.isArray(raw.counts)&&
      raw.counts.length>=(module==="placements"?3:module==="projects"?1:0)&&
      raw.counts.every((value:unknown)=>typeof value==="number"&&Number.isSafeInteger(value)&&value>=0)){
    setImpactCounts(raw.counts as number[]);
    if("summary" in raw&&typeof raw.summary==="string")setImpact(raw.summary);
    if("students" in raw&&typeof raw.students==="number"&&Number.isSafeInteger(raw.students)&&raw.students>=0)
     setStudents(raw.students);
   }else setImpact("Impact data could not be loaded. This does not mean disabling access is safe.");
   // The Placements impact route lacks learner population; use the scoped Projects
   // impact read to preserve the 100-learner confirmation gate.
   if(module==="placements"){
    const populationResponse=await fetch("/api/admin/features/"+encodeURIComponent(collegeId)+
      "/impact?module=projects",{cache:"no-store"});
    const population:unknown=populationResponse.ok?await populationResponse.json().catch(()=>null):null;
    if(population&&typeof population==="object"&&"module" in population&&population.module==="projects"&&
       "students" in population&&typeof population.students==="number"&&
       Number.isSafeInteger(population.students)&&population.students>=0)setStudents(population.students);
   }
   setConfirm(true);
  }catch(error){
   setFeedbackTone("error");
   setFeedback(error instanceof Error?error.message:"Could not review impact for this college.");
  }finally{setImpactBusy(false);}
 }
 async function save(){
  if(!canSave||busy||!dirty)return;
  setBusy(true);setFeedback("");setRetryFailure(false);
  try{
   const response=await fetch(endpoint,{method:"PUT",headers:{"content-type":"application/json"},
    body:JSON.stringify(collegeRulePayload(module,choice,locked,observed))});
   const data:unknown=await response.json().catch(()=>null);
   if(!response.ok){
    const error=data&&typeof data==="object"&&"error" in data?String(data.error):"REQUEST_FAILED";
    setFeedbackTone("error");
    setFeedback(error==="STALE_RULE"?"Policy changed in another session. Recheck before editing."
     :error==="ANCESTOR_LOCKED"?"A higher-level lock prevents this override. Open Module Access to resolve inherited locks."
     :error==="LOCAL_LOCKED"?"This college rule is locked. Review Module Access to unlock it."
     :"Change failed ("+error+"). Retry after reviewing the current module rule.");
    setRetryFailure(error!=="STALE_RULE"&&error!=="ANCESTOR_LOCKED");
    return;
   }
   if(!collegeRuleReceipt(data,module,choice,locked)){
    setFeedbackTone("error");setFeedback("Server did not confirm the stored state. Recheck before retrying.");return;
   }
   const responseAfter=await fetch(endpoint,{cache:"no-store"});
   const dataAfter:unknown=await responseAfter.json().catch(()=>null);
   const current=responseAfter.ok?parseCollegeRuleRecheck(dataAfter,module):undefined;
   const expected=choice==="INHERIT"?null:{enabled:choice==="ON",locked};
   if(current===undefined||JSON.stringify(current)!==JSON.stringify(expected)){
    setFeedbackTone("error");setFeedback("Write accepted but the latest stored rule was not verified. Recheck before editing again.");return;
   }
   setObserved(current);setChoice(collegeRuleSelection(current));setLocked(current?.locked??false);
   showToast({tone:"success",title:lockChanged?(locked?"Locked ":"Unlocked ")+moduleLabel+" for "+collegeName
    :moduleLabel+" updated for "+collegeName});
   setFeedbackTone("success");setFeedback("Stored policy verified for "+collegeName+".");
   router.refresh();
  }catch{
   setFeedbackTone("error");
   setFeedback("Connection or verification failed. The change might have saved; recheck stored policy before retrying.");
   setRetryFailure(true);
  }finally{setBusy(false);setConfirm(false);}
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
