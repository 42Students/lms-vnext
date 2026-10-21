"use client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/selection-controls";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {groupRuleCriteriaSchema} from "@/modules/groups/rule-evaluator";
import {collegeGroupDetailActionLabel} from "@/modules/groups/college-group-detail-write-model";

type Waitlisted={membershipId:string;displayName:string|null;version:number;isLocked:boolean;waitlistPosition:number|null};
export function CollegeGroupDetailWrites({
  groupId,groupName,groupVersion:initialVersion,groupStatus,capacity,activeCount,
  waitlisted,initialRule,initialAutoRefresh,
}:{
  groupId:string;groupName:string;groupVersion:number;groupStatus:string;
  capacity:number|null;activeCount:number;waitlisted:Waitlisted[];
  initialRule:string;initialAutoRefresh:boolean;
}) {
  const router=useRouter();
  const [groupVersion,setGroupVersion]=useState(initialVersion);
  const [ruleJson,setRuleJson]=useState(initialRule);
  const [autoRefresh,setAutoRefresh]=useState(initialAutoRefresh);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [confirmation,setConfirmation]=useState<{body:Record<string,unknown>;prompt:string;kind:"GROUP"|"APPLY"|"CLEAR"}|null>(null);
  const hasSpace=capacity===null||activeCount<capacity;
  function submit(body:Record<string,unknown>,prompt:string,kind:"GROUP"|"APPLY"|"CLEAR"="GROUP"){
    setError("");setNotice("");setConfirmation({body,prompt,kind});
  }
  async function commitChange(){
    if(!confirmation||busy)return;
    const {body,kind}=confirmation;
    setBusy(true);setError("");setNotice("");
    try {
      const response=await fetch("/api/college/groups/"+encodeURIComponent(groupId)+
        (kind==="GROUP"?"/detail-actions":"/rule"),{
        method:kind==="GROUP"?"PATCH":kind==="APPLY"?"POST":"DELETE",
        headers:{"content-type":"application/json"},
        body:JSON.stringify(kind==="GROUP"?body:{confirmed:true,expectedGroupVersion:groupVersion}),
      });
      const json=await response.json().catch(()=>({error:"GROUP_CHANGE_FAILED"})) as {groupVersion?:number;error?:string};
      if(!response.ok)throw new Error(json.error??"GROUP_CHANGE_FAILED");
      if(typeof json.groupVersion==="number")setGroupVersion(json.groupVersion);
      setNotice(kind==="APPLY"?"Eligibility rule applied to the current learner roster.":
        kind==="CLEAR"?"Eligibility rule cleared. Current group members were not removed.":
        "Group change saved and audited.");
      if(kind==="CLEAR"){setRuleJson("");setAutoRefresh(false);}
      setConfirmation(null);
      router.refresh();
    }catch(reason){setError(reason instanceof Error?reason.message:"Group action failed.");}
    finally{setBusy(false);}
  }
  function saveRule(){
    let json:unknown;
    try { json=JSON.parse(ruleJson); } catch {setError("Rule JSON is not valid.");return;}
    const rule=groupRuleCriteriaSchema.safeParse(json);
    if(!rule.success){
      setError(rule.error.issues[0]?.message??"Rule eligibility is invalid.");return;
    }
    void submit({action:"SAVE_RULE",criteria:rule.data,autoRefresh,
      expectedGroupVersion:groupVersion,confirm:true},collegeGroupDetailActionLabel("SAVE_RULE"));
  }
  const ordered=[...waitlisted].sort((a,b)=>(a.waitlistPosition??Number.MAX_SAFE_INTEGER)-
    (b.waitlistPosition??Number.MAX_SAFE_INTEGER)||a.membershipId.localeCompare(b.membershipId));
  const front=ordered[0];
  return <section aria-label="Group rule and waitlist actions" className="min-w-0 space-y-4">
    <div className="space-y-3 border-b border-border pb-4">
      <h2 className="text-lg font-semibold text-[var(--lms-heading)]">Waitlist review</h2>
      <p className="mt-1 text-sm text-body leading-[22px]">Only the first waitlisted learner can be promoted. Locked members and full groups cannot be overridden.</p>
      {ordered.length===0?<EmptyState title="No waitlisted learners" description="No waitlisted learners recorded."/>:
        <ul className="mt-3 divide-y divide-border">{ordered.map(member=><li key={member.membershipId}
          className="flex min-w-0 flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="min-w-0 flex-1 break-words text-sm text-body">{member.displayName||"Unnamed learner"} · Position {member.waitlistPosition??"not recorded"}{member.isLocked?" · Locked":""}</span>
          {front?.membershipId===member.membershipId?<Button variant="secondary" type="button" className="min-h-11 w-full shrink-0 sm:w-auto md:min-h-9" loading={busy} disabled={busy||groupStatus!=="ACTIVE"||!hasSpace||
            front?.membershipId!==member.membershipId||member.isLocked}
            
            onClick={()=>{void submit({
              action:"PROMOTE_WAITLIST",memberId:member.membershipId,
              expectedMemberVersion:member.version,expectedGroupVersion:groupVersion,confirm:true,
            },collegeGroupDetailActionLabel("PROMOTE_WAITLIST"));}}>
            Promote
          </Button>:null}
        </li>)}</ul>}
      {!hasSpace?<Alert tone="warning">Group capacity is full. No manual promotion is available.</Alert>:null}
    </div>
    <details className="min-w-0 border-t border-border pt-3">
      <summary className="min-h-11 cursor-pointer py-2 text-lg font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">Eligibility rule</summary>
      <div className="min-w-0 space-y-3 pt-3">
      <p className="text-sm text-body leading-[22px]">Edit the supported V1 criteria as JSON. At least one criterion is required. Saving does not run a refresh or change membership.</p>
      <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Rule criteria
        <Textarea rows={9} spellCheck={false} value={ruleJson} onChange={e=>setRuleJson(e.target.value)}
          className="min-w-0 w-full font-mono text-xs" />
      </label>
      <Switch label="Enable rule auto-refresh setting (does not execute a refresh now)"
        checked={autoRefresh} disabled={busy} onChange={e=>setAutoRefresh(e.target.checked)}/>
      <div className="flex flex-wrap gap-2">
       <Button variant="secondary" type="button" disabled={busy||groupStatus!=="ACTIVE"||!initialRule}
        onClick={()=>submit({},"Apply this eligibility rule to eligible learners now? Review the preview before applying.","APPLY")}>
        Apply rule
       </Button>
       <Button variant="secondary" type="button" disabled={busy||!initialRule}
        onClick={()=>submit({},"Clear the eligibility rule? Existing members stay in the group.","CLEAR")}>
        Clear rule
       </Button>
      </div>
      <Button variant="primary" type="button" loading={busy} className="min-h-11 w-full md:min-h-9 md:w-auto" disabled={busy} onClick={saveRule}
        >
        {busy?"Saving…":"Confirm rule update"}
      </Button>
      </div>
    </details>
    {error?<Alert tone="error">{error}</Alert>:null}
    {notice?<Alert tone="success">{notice}</Alert>:null}
    <ConfirmDialog open={confirmation!==null} onOpenChange={value=>{if(!value&&!busy)setConfirmation(null);}}
      title={confirmation?.prompt??"Confirm group change"}
      description={"Group: "+groupName+". Changes are audited."}
      confirmLabel="Confirm" confirmVariant="primary" pending={busy}
      onConfirm={()=>void commitChange()}/>
  </section>;
}
