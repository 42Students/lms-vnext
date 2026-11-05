"use client";
import {Button} from "@/components/ui/button";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {InlineNotice} from "@/components/ui/inline-notice";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {AFTER_COLLEGE_LABELS,CHOICE_AFTER_COLLEGE_OUTCOMES,type CustomAfterCollegeOutcome} from "@/modules/placements/tpo-after-college-model";
import { Heading } from "@/components/ui/heading";

type Label={id?:string|null;label:string;outcome:CustomAfterCollegeOutcome};
function validate(label:string,labels:readonly Label[],index:number){
 const name=label.trim().replace(/\s+/g," ").toLocaleLowerCase("en-IN");
 if(name.length<2||name.length>60)return "2-60 characters";
 if(Object.values(AFTER_COLLEGE_LABELS).some(value=>value.toLocaleLowerCase("en-IN")===name))
  return "That is already one of the fixed choices";
 if(labels.some((row,i)=>i!==index&&row.label.trim().toLocaleLowerCase("en-IN")===name))
  return "Listed twice";
 return "";
}
export function TpoOutcomeLabelsEditor({initial,version}:{initial:readonly Label[];version:string|null}){
 const router=useRouter();
 const [labels,setLabels]=useState<Label[]>([...initial]);
 const [draft,setDraft]=useState("");
 const [outcome,setOutcome]=useState<CustomAfterCollegeOutcome>("ENTREPRENEURSHIP");
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [currentVersion,setCurrentVersion]=useState(version);
 const dirty=JSON.stringify(labels)!==JSON.stringify(initial);
 const problem=validate(draft,labels,-1);
 const invalid=labels.findIndex((row,index)=>Boolean(validate(row.label,labels,index)));
 function add(){
  if(problem||labels.length>=30)return;
  setLabels(rows=>[...rows,{id:null,label:draft.trim(),outcome}]);setDraft("");
 }
 async function save(){
  if(busy||invalid>=0||labels.length>30)return;
  setBusy(true);setError("");setNotice("");
  try{
   const data=await apiFetch<{version?:string;labels?:Label[]}>("/api/placements/tpo/settings/outcome-labels",{
    method:"PUT",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({labels:labels.map(row=>({...row,label:row.label.trim().replace(/\s+/g," ")})),expectedVersion:currentVersion}),
   });
   setLabels(data.labels??[]);setCurrentVersion(data.version??null);setNotice("After college labels saved");router.refresh();
  }catch(caught){setError(caught instanceof FriendlyFetchError&&caught.code==="TPO_SETTINGS_STALE"?
   "Settings changed. Refresh and try again.":caught instanceof Error?caught.message:"Could not save the labels");}
  finally{setBusy(false);}
 }
 return <section className="space-y-4 border-t border-border pt-5">
  <Heading level={3} size="base">Your own labels</Heading>
  <p className="text-sm text-body">For example &quot;Family business&quot; under Entrepreneurship. The student&apos;s record shows your label; reports count the choice it sits under.</p>
  {labels.length===0?<p className="text-sm text-muted-foreground">No labels yet.</p>:null}
  <ul className="space-y-3">{labels.map((row,index)=><li key={row.id??"draft-"+index}
   className="grid min-w-0 grid-cols-1 items-end gap-[var(--lms-space-3)] border-b border-border pb-[var(--lms-space-3)] md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
   <label className="min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Label {index+1}
    <Input value={row.label} maxLength={60} disabled={busy}
     onChange={event=>setLabels(rows=>rows.map((item,i)=>i===index?{...item,label:event.target.value}:item))}
     className="mt-1 min-h-11 md:min-h-9 w-full"/>
    {validate(row.label,labels,index)?<span className="block text-xs text-error">{validate(row.label,labels,index)}</span>:null}
   </label>
   <label className="min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Counts as
    <Select value={row.outcome} disabled={busy}
     onChange={event=>setLabels(rows=>rows.map((item,i)=>i===index?{...item,outcome:event.target.value as CustomAfterCollegeOutcome}:item))}
     className="mt-1 min-h-11 md:min-h-9 w-full">
     {CHOICE_AFTER_COLLEGE_OUTCOMES.map(value=><option key={value} value={value}>{AFTER_COLLEGE_LABELS[value]}</option>)}
    </Select>
   </label>
   <Button variant="secondary" type="button" disabled={busy} aria-label={"Remove "+row.label}
    onClick={()=>setLabels(rows=>rows.filter((_,i)=>i!==index))}
    className="min-h-11 w-full md:min-h-9 md:w-auto text-sm">Remove</Button>
  </li>)}</ul>
  <div className="grid min-w-0 grid-cols-1 items-end gap-[var(--lms-space-3)] border-t border-border pt-[var(--lms-space-4)] md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
   <label className="min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">New label
    <Input value={draft} onChange={event=>setDraft(event.target.value)} maxLength={60}
     placeholder="New label, e.g. Family business" disabled={busy}
     className="mt-1 min-h-11 md:min-h-9 w-full"/>
    {draft&&problem?<span className="block text-xs text-error">{problem}</span>:null}
   </label>
   <label className="min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Counts as
    <Select value={outcome} disabled={busy} onChange={e=>setOutcome(e.target.value as CustomAfterCollegeOutcome)}
     className="mt-1 min-h-11 md:min-h-9">
     {CHOICE_AFTER_COLLEGE_OUTCOMES.map(value=><option key={value} value={value}>{AFTER_COLLEGE_LABELS[value]}</option>)}
    </Select>
   </label>
   <Button variant="secondary" type="button" onClick={add} disabled={!draft.trim()||Boolean(problem)||busy||labels.length>=30}
    className="min-h-11 w-full md:min-h-9 md:w-auto text-sm">Add</Button>
  </div>
  <p className="text-xs text-muted-foreground">{labels.length}/30 labels. Renaming a label updates students using it; moving it to a different choice also updates their recorded after-college outcome. Removing a label keeps each student's outcome.</p>
  <Button variant="primary" type="button" onClick={()=>void save()} disabled={busy||!dirty||invalid>=0}
   className="min-h-11 md:min-h-9 text-sm">Save changes</Button>
  {error?<InlineNotice tone="error" message={error} onDismiss={()=>setError("")}/>:null}
  {notice?<p role="status" className="rounded-[8px] border border-[color-mix(in_srgb,var(--lms-success)_25%,transparent)] bg-[var(--lms-success-subtle)] px-[var(--lms-space-4)] py-[var(--lms-space-3)] text-[14px] leading-5 text-[var(--lms-success-text)]">{notice}</p>:null}
 </section>;
}
