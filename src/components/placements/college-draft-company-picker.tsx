"use client";
import {useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {apiFetch} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";

type CompanyChoice={relationshipId:string;name:string};
export function CollegeDraftCompanyPicker({
 jobId,currentRelationshipId,currentCompanyName,version,choices,truncated,
}:{jobId:string;currentRelationshipId:string;currentCompanyName:string;
 version:number;choices:readonly CompanyChoice[];truncated:boolean}){
 const router=useRouter();
 const [name,setName]=useState(currentCompanyName);
 const [selectedId,setSelectedId]=useState<string|null>(currentRelationshipId);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [saved,setSaved]=useState(false);
 const search=name.trim().toLocaleLowerCase("en-IN");
 const matches=search?choices.filter(choice=>
  choice.name.toLocaleLowerCase("en-IN").includes(search)).slice(0,12):choices.slice(0,12);
 const linked=selectedId!==null&&choices.some(choice=>choice.relationshipId===selectedId);
 const changed=selectedId!==currentRelationshipId;
 async function save(){
  if(!linked||!selectedId||!changed||busy)return;
  setBusy(true);setError("");setSaved(false);
  try{
   await apiFetch("/api/placements/college/jobs/"+encodeURIComponent(jobId)+"/company",{
    method:"PATCH",headers:{"content-type":"application/json"},
    body:JSON.stringify({companyRelationshipId:selectedId,expectedVersion:version}),
   });
   setSaved(true);router.refresh();
  }catch(cause){
   setError(cause instanceof Error?cause.message:friendlyApiError({}));
  }finally{setBusy(false);}
 }
 return <div className="mt-3 space-y-[var(--lms-space-3)]" aria-label="Company chooser">
  <label className="grid gap-[6px] text-sm font-semibold">
   Company Name <span className="font-normal text-muted-foreground">(required)</span>
   <Input type="search" value={name} maxLength={120} disabled={busy}
    placeholder="Search existing companies" autoComplete="off"
    onChange={event=>{setName(event.target.value);setSelectedId(null);setSaved(false);setError("");}}
    aria-invalid={!linked} aria-describedby="drive-company-choice-help"/>
  </label>
  <p id="drive-company-choice-help" className="text-xs text-muted-foreground">
   Choose a verified company relationship below. Free-typed company text is unlinked and cannot be saved.
   {truncated?" Showing the first 100 companies; use the directory for other choices.":""}
  </p>
  {matches.length>0?<div role="group" aria-label="Matching existing companies"
    className="max-h-48 space-y-1 overflow-y-auto rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] p-2">
    {matches.map(choice=><Button key={choice.relationshipId} type="button" variant="secondary"
     disabled={busy} aria-pressed={selectedId===choice.relationshipId}
     className="min-h-11 w-full justify-start text-left font-normal md:min-h-9"
     onClick={()=>{setName(choice.name);setSelectedId(choice.relationshipId);setSaved(false);setError("");}}>
     {choice.name}{selectedId===choice.relationshipId?" ✓":""}
    </Button>)}
   </div>:<p role="status" className="text-sm text-muted-foreground">No matching company among loaded relationships.</p>}
  {!linked?<p role="status" className="text-sm text-warning-text">
   Company is not linked. Select an existing company before saving.
  </p>:null}
  <div className="flex flex-wrap items-center gap-3">
   <Button type="button" disabled={!linked||!changed||busy} onClick={()=>void save()}
    className="min-h-11">{busy?"Saving…":"Save company"}</Button>
   <Link href="/college/companies" className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline">
    Browse company directory
   </Link>
  </div>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {saved?<p role="status" className="text-sm text-success">Company updated. Refreshing drive details.</p>:null}
 </div>;
}
