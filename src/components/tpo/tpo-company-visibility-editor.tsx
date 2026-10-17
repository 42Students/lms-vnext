"use client";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {InlineNotice} from "@/components/ui/inline-notice";
import {useState} from "react";
import {useRouter} from "next/navigation";
const labels={
 showCgpaExact:"Show the exact UG % (off shows a band such as 75-80%)",
 showTenthTwelfth:"Show 10th and 12th / diploma %",
 showProjectLinks:"Show project links (GitHub, portfolio)",
 showAssessmentScores:"Recruiters see assessment scores",
 showAttendance:"Recruiters see attendance",
} as const;
type Choice=Record<keyof typeof labels,boolean>;
export function TpoCompanyVisibilityEditor({collegeId,initial,version}:{
 collegeId:string;initial:Choice;version:number;
}){
 const router=useRouter(),[values,setValues]=useState(initial);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
 async function save(){
  if(busy||!window.confirm("Save what companies can see? These choices control the college's recruiter-visible information policy."))return;
  setBusy(true);setMessage("");
  try{
   await apiFetch("/api/placements/tpo/company-visibility",{
    method:"PUT",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({collegeId,expectedVersion:version,...values}),
   });
   setMessage("Saved");router.refresh();
  }catch(error){setMessage(error instanceof FriendlyFetchError&&error.status===409?
    "Sharing policy changed elsewhere. Refresh before retrying.":
    error instanceof Error?error.message:"Could not save.");}
  finally{setBusy(false);}
 }
 return <section aria-label="Edit company visibility" className="space-y-3 rounded-xl border border-border bg-surface p-4">
  <h3 className="font-semibold">What companies see</h3>
  <p className="text-xs text-muted-foreground">Your choices are saved in the college&apos;s sharing policy. Individual recruiter rights, consent and export permissions remain separate safeguards.</p>
  <section aria-label="How sharing works" className="rounded-lg border border-border bg-surface-subtle p-3 text-sm"><h4 className="font-semibold">How sharing works</h4><ul className="mt-2 list-disc space-y-1 pl-5"><li>The college sets the fields recruiters may see.</li><li>Learner consent and verification still apply.</li><li>Some values appear only as a band when exact sharing is off.</li><li>These settings do not grant access to a learner or drive.</li><li>Changes to sharing settings affect future views and exports.</li></ul></section>
  {Object.entries(labels).slice(0,3).map(([key,label])=><label key={key} className="flex min-h-11 items-center justify-between gap-3 border-b border-border py-2 text-sm">
   <span>{label}</span>
   <input type="checkbox" disabled={busy} checked={values[key as keyof Choice]}
    onChange={e=>setValues(current=>({...current,[key]:e.target.checked}))}/>
  </label>)}
  <details className="rounded-lg border border-border p-3">
    <summary className="cursor-pointer text-sm font-semibold">Additional sharing options</summary>
    {Object.entries(labels).slice(3).map(([key,label])=><label key={key} className="flex min-h-11 items-center justify-between gap-3 border-b border-border py-2 text-sm">
      <span>{label}</span>
      <input type="checkbox" disabled={busy} checked={values[key as keyof Choice]}
        onChange={event=>setValues(current=>({...current,[key]:event.target.checked}))}/>
    </label>)}
  </details>
  <button type="button" disabled={busy} onClick={()=>void save()}
   className="min-h-11 rounded-md bg-primary px-4 font-semibold text-on-primary disabled:opacity-50">{busy?"Saving…":"Save"}</button>
  {message?<InlineNotice tone={message==="Saved"?"success":"error"} message={message} onDismiss={()=>setMessage("")}/>:null}
 </section>;
}
