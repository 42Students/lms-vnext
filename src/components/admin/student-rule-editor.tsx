"use client";
import {Select} from "@/components/ui/select";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import {studentRulePayload,studentRuleChangeSummary,parseStudentRuleRecheck,hasStudentRuleAcknowledgement,canReviewStudentRule,type EditableStudentModule,type StudentSelection,type ExpectedRule} from "@/modules/module-access/admin-student-rule-ui-model";
export function StudentRuleEditor({collegeId,membershipId,module,stored,locked,blocked}:{
 collegeId:string;membershipId:string;module:EditableStudentModule;
 stored:boolean|null;locked:boolean;blocked:boolean;
}){
 const router=useRouter();
 const [observed,setObserved]=useState<ExpectedRule>(stored===null?null:{enabled:stored,locked});
 const [choice,setChoice]=useState<StudentSelection>(stored===null?"INHERIT":stored?"ON":"OFF");
 const [nextLocked,setNextLocked]=useState(locked);
 const [confirming,setConfirming]=useState(false);
 const [pending,setPending]=useState(false);
 const [feedback,setFeedback]=useState("");
 const endpoint="/api/admin/features/"+encodeURIComponent(collegeId)+"/students/"+encodeURIComponent(membershipId)+"/rules";
 const noChange=(choice==="INHERIT"&&observed===null)||
  (choice!=="INHERIT"&&observed!==null&&observed.enabled===(choice==="ON")&&observed.locked===nextLocked);
 async function reload(){
  setPending(true);
  setFeedback("");
  try{
   const response=await fetch(endpoint,{method:"GET",cache:"no-store"});
   const data:unknown=await response.json().catch(()=>null);
   const state=response.ok?parseStudentRuleRecheck(data,module):undefined;
   if(state===undefined){setFeedback("Latest module state could not be verified.");return;}
   setObserved(state);
   setChoice(state===null?"INHERIT":state.enabled?"ON":"OFF");
   setNextLocked(state?.locked??false);
   setFeedback("Latest stored state loaded.");
   router.refresh();
  }catch{setFeedback("Could not recheck the persisted rule.");}
  finally{setPending(false);}
 }
 async function apply(){
  setPending(true);
  setFeedback("");
  try{
   const response=await fetch(endpoint,{
    method:"PUT",headers:{"content-type":"application/json"},
    body:JSON.stringify(studentRulePayload(module,choice,nextLocked,observed)),
   });
   const data:unknown=await response.json().catch(()=>null);
   if(!response.ok){
    const code=data&&typeof data==="object"&&"error" in data?String(data.error):"REQUEST_FAILED";
    setFeedback(code==="STALE_RULE"?"The stored rule changed. Reload this page before editing.":code==="ANCESTOR_LOCKED"?"A broader locked rule prevents this change.":"The module change could not be saved. Recheck the stored rule and try again.");
    return;
   }
   if(!hasStudentRuleAcknowledgement(data,module,choice,nextLocked)){
    setFeedback("Server response did not confirm the intended rule. Recheck before another change.");return;
   }
   const updated=choice==="INHERIT"?null:{enabled:choice==="ON",locked:nextLocked};
   setObserved(updated);
   setFeedback("Saved. The full learner access trace will now be refreshed.");
   router.refresh();
  }catch{
   setFeedback("Connection failed. No successful change was confirmed.");
  }finally{
   setConfirming(false);
   setPending(false);
  }
 }
 return <div className="mt-4 space-y-3 border-t border-border pt-3">
  {blocked?<p className="text-xs text-warning-text">A broader locked rule prevents writing On/Off. You can still remove a stored membership override with Inherit.</p>:null}
  <label className="grid gap-1 text-sm font-semibold text-body">Stored override
   <Select value={choice} disabled={pending} onChange={e=>setChoice(e.target.value as StudentSelection)}
    className="min-h-11 w-full sm:min-h-9">
    <option value="INHERIT">Inherit</option><option value="ON" disabled={blocked}>On</option><option value="OFF" disabled={blocked}>Off</option>
   </Select>
  </label>
  <label className="flex items-center gap-2 text-sm text-body">
   <Checkbox checked={nextLocked} onChange={e=>setNextLocked(e.target.checked)}
    disabled={blocked||pending||choice==="INHERIT"}/>
   Lock this membership rule
  </label>
  <div className="flex flex-wrap gap-2">
   <Button disabled={!canReviewStudentRule(choice,blocked,pending,noChange)} onClick={()=>setConfirming(true)} variant="secondary">Review change</Button>
   <Button disabled={pending} variant="ghost" onClick={()=>{void reload();}}>Recheck stored rule</Button>
  </div>
  {feedback?<p role="status" className="text-xs leading-5 text-body">{feedback}</p>:null}
  <ConfirmDialog open={confirming} onOpenChange={setConfirming} title="Confirm learner module access change"
   description={studentRuleChangeSummary(module,choice,nextLocked)}
   confirmLabel="Apply change" pending={pending} confirmVariant="danger" onConfirm={()=>{void apply();}}>
   <p className="text-sm leading-6 text-body">This changes a persisted membership-level rule for one learner. Broader locked rules, role checks and other participation gates can still affect access. The server records an audit event.</p>
  </ConfirmDialog>
 </div>;
}
