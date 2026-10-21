"use client";

import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {StatusBadge} from "@/components/ui/status-badge";
import {useToast} from "@/components/ui/toast";

type SettingReceipt = {
  key:string;
  status:"SAVED"|"DELETED"|"FAILED";
  message:string;
  version?:number;
};

export function CourseProgressPolicyEditor({
  initialValue,initialVersion,isOverride,
}:{
  initialValue:number;
  initialVersion:number;
  isOverride:boolean;
}){
  const router=useRouter();
  const {showToast}=useToast();
  const [value,setValue]=useState(String(initialValue));
  const [version,setVersion]=useState(initialVersion);
  const [savedValue,setSavedValue]=useState(initialValue);
  const [overridden,setOverridden]=useState(isOverride);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  useEffect(()=>{
    setValue(String(initialValue));
    setSavedValue(initialValue);
    setVersion(initialVersion);
    setOverridden(isOverride);
  },[initialValue,initialVersion,isOverride]);
  const trimmed=value.trim();
  const valid=/^(?:0|[1-9][0-9]?)$/.test(trimmed) && Number(trimmed)<=99;
  const unchanged=valid && Number(trimmed)===savedValue;

  async function update(reset:boolean){
    if(saving||(!reset&&!valid))return;
    setSaving(true);
    setError("");
    try{
      const response=await fetch("/api/admin/settings/overrides",{
        method:"PATCH",
        credentials:"same-origin",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({
          scopeType:"GLOBAL",
          changes:[{
            key:"course.minInProgressPercent",
            value:reset?"":trimmed,
            expectedVersion:version,
          }],
        }),
      });
      if(!response.ok)throw Error("Couldn't update progress policy. Reload the current value and retry.");
      const data:unknown=await response.json();
      const receipt=data&&typeof data==="object"&&!Array.isArray(data)
        ?data as {results?:SettingReceipt[];saved?:number;failed?:number}:null;
      const outcome=receipt?.results?.find(row=>row.key==="course.minInProgressPercent");
      if(!outcome||outcome.status==="FAILED"||receipt?.saved!==1||receipt?.failed!==0)
        throw Error(outcome?.message??"Couldn't verify the progress policy save.");
      const nextVersion=reset?0:outcome.version;
      if(typeof nextVersion!=="number"||!Number.isSafeInteger(nextVersion)||nextVersion<0)
        throw Error("The saved version could not be verified. Refresh before another change.");
      setVersion(nextVersion);
      setOverridden(!reset);
      setSavedValue(reset?5:Number(trimmed));
      if(reset)setValue("5");
      showToast({tone:"success",title:reset?"Progress policy restored to default":"In progress lower bound updated"});
      router.refresh();
    }catch(cause){
      setError(cause instanceof Error?cause.message:"Couldn't update progress policy.");
    }finally{
      setSaving(false);
    }
  }

  return <section aria-label="Progress policy" className="min-w-0 space-y-3 border-b border-[var(--lms-canvas-border)] pb-5">
    <div className="flex flex-wrap items-center gap-3">
      <h2 className="text-lg font-semibold text-[var(--lms-heading)]">Progress policy</h2>
      <StatusBadge tone={overridden?"info":"neutral"}>
        {overridden?"Custom for platform":"Default (5%)"}
      </StatusBadge>
    </div>
    <p className="text-sm leading-6 text-body">Platform-wide: applies to every college.</p>
    <label className="grid max-w-xs gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
      In progress lower bound
      <span className="flex items-center gap-2">
        <Input type="number" min={0} max={99} step={1} inputMode="numeric"
          value={value} disabled={saving} aria-invalid={!valid}
          onChange={event=>{setValue(event.target.value);setError("");}} />
        <span className="font-semibold text-body">%</span>
      </span>
    </label>
    <p className="text-sm leading-6 text-body">Below this percentage a video counts as not started.</p>
    {!valid?<p role="alert" className="text-xs text-error-text">Enter a whole number from 0 to 99.</p>:null}
    {error?<p role="alert" className="text-sm text-error-text">{error}</p>:null}
    <div className="flex flex-wrap gap-2">
      <Button type="button" disabled={saving||!valid||unchanged} onClick={()=>void update(false)}>
        {saving?"Saving…":"Save"}
      </Button>
      <Button type="button" variant="secondary" disabled={saving||!overridden}
        onClick={()=>void update(true)}>Reset to default</Button>
      <Button type="button" variant="ghost" disabled={saving}
        onClick={()=>router.refresh()}>Reload</Button>
    </div>
    <p className="text-xs leading-5 text-muted-foreground">
      Values are saved as audited platform overrides. The active runtime reader must be
      verified separately before relying on the change in every course.
    </p>
  </section>;
}
