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
  const [confirmation,setConfirmation]=useState<{body:Record<string,unknown>;prompt:string}|null>(null);
  const hasSpace=capacity===null||activeCount<capacity;
  function submit(body:Record<string,unknown>,prompt:string){
    setError("");setNotice("");setConfirmation({body,prompt});
  }
  async function commitChange(){
    if(!confirmation||busy)return;
    const {body}=confirmation;
    setBusy(true);setError("");setNotice("");
    try {
      const response=await fetch("/api/college/groups/"+encodeURIComponent(groupId)+"/detail-actions",{
        method:"PATCH",headers:{"content-type":"application/json"},
        body:JSON.stringify(body),
      });
      const json=await response.json().catch(()=>({error:"GROUP_CHANGE_FAILED"})) as {groupVersion?:number;error?:string};
      if(!response.ok)throw new Error(json.error??"GROUP_CHANGE_FAILED");
      if(typeof json.groupVersion==="number")setGroupVersion(json.groupVersion);
      setNotice("Group change saved and audited.");
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
  return <section aria-label="Group rule and waitlist actions" className="space-y-5">
    <div className="space-y-3 border-b border-border pb-4">
      <h2 className="text-lg font-semibold text-foreground">Waitlist review</h2>
      <p className="mt-1 text-sm text-body">Only the first waitlisted learner can be promoted. Locked members and full groups cannot be overridden.</p>
      {ordered.length===0?<EmptyState title="No waitlisted learners" description="No waitlisted learners recorded."/>:
        <ul className="mt-3 divide-y divide-border">{ordered.map(member=><li key={member.membershipId}
          className="flex min-w-0 flex-wrap items-center justify-between gap-3 py-3">
          <span className="text-sm text-body">{member.displayName||"Unnamed learner"} · Position {member.waitlistPosition??"not recorded"}{member.isLocked?" · Locked":""}</span>
          <Button variant="secondary" type="button" className="min-h-11 md:min-h-9" loading={busy} disabled={busy||groupStatus!=="ACTIVE"||!hasSpace||
            front?.membershipId!==member.membershipId||member.isLocked}
            
            onClick={()=>{void submit({
              action:"PROMOTE_WAITLIST",memberId:member.membershipId,
              expectedMemberVersion:member.version,expectedGroupVersion:groupVersion,confirm:true,
            },collegeGroupDetailActionLabel("PROMOTE_WAITLIST"));}}>
            Promote
          </Button>
        </li>)}</ul>}
      {!hasSpace?<Alert tone="warning">Group capacity is full. No manual promotion is available.</Alert>:null}
    </div>
    <div className="space-y-3 border-t border-border pt-4">
      <h2 className="text-lg font-semibold text-foreground">Eligibility rule</h2>
      <p className="text-sm text-body">Edit the supported V1 criteria as JSON. At least one criterion is required. Saving does not run a refresh or change membership.</p>
      <label className="grid gap-2 text-sm font-semibold text-body">Rule criteria
        <Textarea rows={9} spellCheck={false} value={ruleJson} onChange={e=>setRuleJson(e.target.value)}
          className="w-full font-mono text-xs" />
      </label>
      <Switch label="Enable rule auto-refresh setting (does not execute a refresh now)"
        checked={autoRefresh} disabled={busy} onChange={e=>setAutoRefresh(e.target.checked)}/>
      <Button variant="primary" type="button" loading={busy} className="min-h-11 md:min-h-9" disabled={busy} onClick={saveRule}
        >
        {busy?"Saving…":"Confirm rule update"}
      </Button>
    </div>
    {error?<Alert tone="error">{error}</Alert>:null}
    {notice?<Alert tone="success">{notice}</Alert>:null}
    <ConfirmDialog open={confirmation!==null} onOpenChange={value=>{if(!value&&!busy)setConfirmation(null);}}
      title={confirmation?.prompt??"Confirm group change"}
      description={"Group: "+groupName+". Changes are audited."}
      confirmLabel="Confirm" confirmVariant="primary" pending={busy}
      onConfirm={()=>void commitChange()}/>
  </section>;
}
