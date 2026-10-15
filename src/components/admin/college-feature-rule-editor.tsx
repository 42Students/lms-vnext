"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Button} from "@/components/ui/button";
import {collegeRulePayload,isCollegeRuleDirty,collegeRuleReceipt,collegeRuleSelection,type CollegeModule,type CollegeChoice,type ObservedCollegeRule} from "@/modules/module-access/admin-college-rule-ui-model";
export function CollegeFeatureRuleEditor({collegeId,module,stored,ancestorLocked}:{collegeId:string;module:CollegeModule;stored:ObservedCollegeRule;ancestorLocked:boolean}){
 const router=useRouter();
 const [observed,setObserved]=useState<ObservedCollegeRule>(stored);
 const [choice,setChoice]=useState<CollegeChoice>(collegeRuleSelection(stored));
 const [locked,setLocked]=useState(stored?.locked??false);
 const [confirm,setConfirm]=useState(false);
 const [busy,setBusy]=useState(false);
 const [feedback,setFeedback]=useState("");
 const endpoint="/api/admin/features/"+encodeURIComponent(collegeId)+"/rules";
 const disabled=busy||!isCollegeRuleDirty(choice,locked,observed)||(ancestorLocked&&choice!=="INHERIT");
 async function save(){
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
   <select className="min-h-10 rounded-md border border-border bg-surface px-2 text-foreground" value={choice} disabled={busy} onChange={e=>setChoice(e.target.value as CollegeChoice)}>
    <option value="INHERIT">Inherit</option><option value="ON" disabled={ancestorLocked}>On</option><option value="OFF" disabled={ancestorLocked}>Off</option>
   </select>
  </label>
  <label className="flex items-center gap-2 text-xs text-body"><input type="checkbox" checked={locked} disabled={busy||ancestorLocked||choice==="INHERIT"} onChange={e=>setLocked(e.target.checked)}/>Lock this college rule</label>
  <Button size="sm" variant="secondary" disabled={disabled} onClick={()=>setConfirm(true)}>Review policy change</Button>
  {feedback?<p role="status" className="text-xs text-body">{feedback}</p>:null}
  <ConfirmDialog open={confirm} onOpenChange={setConfirm} title="Confirm college feature policy"
   description={choice==="INHERIT"?"Remove the stored college override. Inheritance will resume.":"Store "+(choice==="ON"?"On":"Off")+(locked?" and lock it":" without a lock")+". Descendants may be affected."}
   confirmLabel="Apply change" confirmVariant="danger" pending={busy} confirmDisabled={disabled} onConfirm={()=>{void save();}}>
   <p className="text-sm text-body">This affects the selected college. The server checks your scope, current policy and broader locks, and writes an audit event.</p>
  </ConfirmDialog>
 </div>;
}
