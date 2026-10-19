"use client";
import {Button} from "@/components/ui/button";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {InlineNotice} from "@/components/ui/inline-notice";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {AFTER_COLLEGE_LABELS,MANUAL_AFTER_COLLEGE_OUTCOMES,type AfterCollegeOutcome} from "@/modules/placements/tpo-after-college-model";

type Label={id?:string|null;label:string;outcome:AfterCollegeOutcome};
function validate(label:string,labels:readonly Label[],index:number){
 const name=label.trim().toLocaleLowerCase("en-IN");
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
 const [outcome,setOutcome]=useState<AfterCollegeOutcome>("ENTREPRENEURSHIP");
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
    body:JSON.stringify({labels:labels.map(row=>({...row,label:row.label.trim()})),expectedVersion:currentVersion}),
   });
   setLabels(data.labels??[]);setCurrentVersion(data.version??null);setNotice("After college labels saved");router.refresh();
  }catch(caught){setError(caught instanceof FriendlyFetchError&&caught.code==="TPO_SETTINGS_STALE"?
   "Settings changed. Refresh and try again.":caught instanceof Error?caught.message:"Could not save the labels");}
  finally{setBusy(false);}
 }
 return <section className="space-y-4 border-t border-border pt-5">
  <h3 className="text-base font-semibold">Your own labels</h3>
  <p className="text-sm text-body">For example &quot;Family business&quot; under Entrepreneurship. The student&apos;s record shows your label; reports count the choice it sits under.</p>
  {labels.length===0?<p className="text-sm text-muted-foreground">No labels yet.</p>:null}
  <ul className="space-y-3">{labels.map((row,index)=><li key={row.id??"draft-"+index}
   className="flex flex-wrap items-start gap-2">
   <label className="flex-1 text-sm">Label {index+1}
    <Input value={row.label} maxLength={60} disabled={busy}
     onChange={event=>setLabels(rows=>rows.map((item,i)=>i===index?{...item,label:event.target.value}:item))}
     className="mt-1 min-h-11 sm:min-h-9 w-full"/>
    {validate(row.label,labels,index)?<span className="block text-xs text-error">{validate(row.label,labels,index)}</span>:null}
   </label>
   <label className="min-w-52 text-sm">Counts as
    <Select value={row.outcome} disabled={busy}
     onChange={event=>setLabels(rows=>rows.map((item,i)=>i===index?{...item,outcome:event.target.value as AfterCollegeOutcome}:item))}
     className="mt-1 min-h-11 sm:min-h-9 w-full">
     {MANUAL_AFTER_COLLEGE_OUTCOMES.map(value=><option key={value} value={value}>{AFTER_COLLEGE_LABELS[value]}</option>)}
    </Select>
   </label>
   <Button variant="secondary" type="button" disabled={busy} aria-label={"Remove "+row.label}
    onClick={()=>setLabels(rows=>rows.filter((_,i)=>i!==index))}
    className="min-h-11 sm:min-h-9 text-sm">Remove</Button>
  </li>)}</ul>
  <div className="flex flex-wrap items-end gap-2 border-t border-border pt-4">
   <label className="min-w-52 flex-1 text-sm">New label
    <Input value={draft} onChange={event=>setDraft(event.target.value)} maxLength={60}
     placeholder="New label, e.g. Family business" disabled={busy}
     className="mt-1 min-h-11 sm:min-h-9 w-full"/>
    {draft&&problem?<span className="block text-xs text-error">{problem}</span>:null}
   </label>
   <label className="text-sm">Counts as
    <Select value={outcome} onChange={e=>setOutcome(e.target.value as AfterCollegeOutcome)}
     className="mt-1 min-h-11 sm:min-h-9">
     {MANUAL_AFTER_COLLEGE_OUTCOMES.map(value=><option key={value} value={value}>{AFTER_COLLEGE_LABELS[value]}</option>)}
    </Select>
   </label>
   <Button variant="secondary" type="button" onClick={add} disabled={!draft.trim()||Boolean(problem)||busy||labels.length>=30}
    className="min-h-11 sm:min-h-9 text-sm">Add</Button>
  </div>
  <p className="text-xs text-muted-foreground">{labels.length}/30 labels. Changing a mapping affects how future student choices are grouped; existing recorded outcomes are not silently rewritten.</p>
  <Button variant="primary" type="button" onClick={()=>void save()} disabled={busy||!dirty||invalid>=0}
   className="min-h-11 sm:min-h-9 text-sm">Save changes</Button>
  {error?<InlineNotice tone="error" message={error} onDismiss={()=>setError("")}/>:null}
  {notice?<p role="status" className="text-sm text-success-text">{notice}</p>:null}
 </section>;
}
