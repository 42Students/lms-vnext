"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Button} from "@/components/ui/button";
import {studentRulePayload,studentRuleChangeSummary,type EditableStudentModule,type StudentSelection,type ExpectedRule} from "@/modules/module-access/admin-student-rule-ui-model";
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
 const noChange=(choice==="INHERIT"&&observed===null)||
  (choice!=="INHERIT"&&observed!==null&&observed.enabled===(choice==="ON")&&observed.locked===nextLocked);
 async function apply(){
  setPending(true);
  setFeedback("");
  try{
   const response=await fetch("/api/admin/features/"+encodeURIComponent(collegeId)+"/students/"+encodeURIComponent(membershipId)+"/rules",{
    method:"PUT",headers:{"content-type":"application/json"},
    body:JSON.stringify(studentRulePayload(module,choice,nextLocked,observed)),
   });
   const data:unknown=await response.json().catch(()=>null);
   if(!response.ok){
    const code=data&&typeof data==="object"&&"error" in data?String(data.error):"REQUEST_FAILED";
    setFeedback(code==="STALE_RULE"?"The stored rule changed. Reload this page before editing.":code==="ANCESTOR_LOCKED"?"A broader locked rule prevents this change.":"Change failed ("+code+").");
    return;
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
  {blocked?<p className="text-xs text-warning-text">A broader locked rule prevents membership overrides.</p>:null}
  <label className="grid gap-1 text-sm font-semibold text-body">Stored override
   <select value={choice} disabled={blocked||pending} onChange={e=>setChoice(e.target.value as StudentSelection)}
    className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
    <option value="INHERIT">Inherit</option><option value="ON">On</option><option value="OFF">Off</option>
   </select>
  </label>
  <label className="flex items-center gap-2 text-sm text-body">
   <input type="checkbox" checked={nextLocked} onChange={e=>setNextLocked(e.target.checked)}
    disabled={blocked||pending||choice==="INHERIT"}/>
   Lock this membership rule
  </label>
  <Button disabled={blocked||pending||noChange} onClick={()=>setConfirming(true)} variant="secondary">Review change</Button>
  {feedback?<p role="status" className="text-xs leading-5 text-body">{feedback}</p>:null}
  <ConfirmDialog open={confirming} onOpenChange={setConfirming} title="Confirm learner module access change"
   description={studentRuleChangeSummary(module,choice,nextLocked)}
   confirmLabel="Apply change" pending={pending} confirmVariant="danger" onConfirm={()=>{void apply();}}>
   <p className="text-sm leading-6 text-body">This changes a persisted membership-level rule for one learner. Broader locked rules, role checks and other participation gates can still affect access. The server records an audit event.</p>
  </ConfirmDialog>
 </div>;
}
