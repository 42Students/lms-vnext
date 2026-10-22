"use client";
import { Disclosure } from "@/components/ui/disclosure";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {InlineNotice} from "@/components/ui/inline-notice";
import {useToast} from "@/components/ui/toast";
import {Checkbox} from "@/components/ui/checkbox";
import {Button} from "@/components/ui/button";
import {useConfirmFlow} from "@/components/ui/use-confirm-flow";
import {useEffect,useState} from "react";
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
 const router=useRouter(),{showToast}=useToast(),[values,setValues]=useState(initial);
 const [saved,setSaved]=useState<Choice>(initial);
 const dirty=(Object.keys(values) as (keyof Choice)[]).some(key=>values[key]!==saved[key]);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
 useEffect(()=>{setValues(initial);setSaved(initial);},[version]);
 const {askConfirm,dialog}=useConfirmFlow();
 async function save(){
  if(busy||!dirty||!(await askConfirm("Save what companies can see? These choices control the college's recruiter-visible information policy.")))return;
  setBusy(true);setMessage("");
  try{
   await apiFetch("/api/placements/tpo/company-visibility",{
    method:"PUT",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({collegeId,expectedVersion:version,...values}),
   });
   setSaved({...values});setMessage("Saved");showToast({tone:"success",title:"Saved"});router.refresh();
  }catch(error){setMessage(error instanceof FriendlyFetchError&&error.status===409?
    "Sharing policy changed elsewhere. Refresh before retrying.":
    error instanceof Error?error.message:"Could not save.");}
  finally{setBusy(false);}
 }
 return <section aria-label="Edit company visibility" className="space-y-3 border-t border-border pt-5">
  <h3 className="font-semibold">What companies see</h3>
  <p className="text-xs text-muted-foreground">Your choices are saved in the college&apos;s sharing policy. Individual recruiter rights, consent and export permissions remain separate safeguards.</p>

  <div role="group" aria-label="Company sharing switches" className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface px-3 sm:px-4">
  {Object.entries(labels).slice(0,3).map(([key,label])=><label key={key} className="flex min-h-11 min-w-0 items-center justify-between gap-3 border-b border-border py-2 text-sm">
   <span className="min-w-0 flex-1 break-words">{label}</span>
   <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
    <Checkbox role="switch" aria-label={label} disabled={busy}
      className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
      checked={values[key as keyof Choice]}
      onChange={e=>setValues(current=>({...current,[key]:e.target.checked}))}/>
    <span aria-hidden="true" className="h-6 w-11 rounded-full border border-border bg-muted transition-colors peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary peer-disabled:opacity-50"/>
    <span aria-hidden="true" className="pointer-events-none absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5"/>
   </span>
  </label>)}
  </div>
  <Disclosure title="Additional sharing options" className="border-t border-border pt-3">
    {Object.entries(labels).slice(3).map(([key,label])=><label key={key} className="flex min-h-11 items-center justify-between gap-3 border-b border-border py-2 text-sm">
      <span className="min-w-0 flex-1 break-words">{label}</span>
   <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
    <Checkbox role="switch" aria-label={label} disabled={busy}
      className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
      checked={values[key as keyof Choice]}
      onChange={event=>setValues(current=>({...current,[key]:event.target.checked}))}/>
    <span aria-hidden="true" className="h-6 w-11 rounded-full border border-border bg-muted transition-colors peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary peer-disabled:opacity-50"/>
    <span aria-hidden="true" className="pointer-events-none absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5"/>
   </span>
    </label>)}
  </Disclosure>
  <Disclosure title="How sharing works" className="min-w-0 border-t border-border pt-3" contentClassName="pt-2 text-sm"><ul className="list-disc space-y-1 pl-5">
  <li>Each time you share applicants you tick the columns: name, roll number, branch, UG %, 10th, 12th, email, phone, resume, project links, stage.</li>
  <li>Marks are percentages, worked out with your CGPA rule, and only marks you have verified are shared.</li>
  <li>Phone numbers show only from the shortlist stage on.</li>
  <li>Never shown, whatever you choose: no-shows, debarments, prep scores and your notes.</li>
  <li>90 days after a drive closes, contact details and resumes of students it did not hire are hidden from the company.</li>
 </ul></Disclosure>
  <Button type="button" disabled={busy||!dirty} onClick={()=>void save()}
   className="min-h-11 w-full md:w-auto md:min-h-9">{busy?"Saving…":"Save changes"}</Button>
  {message?<InlineNotice tone={message==="Saved"?"success":"error"} message={message} onDismiss={()=>setMessage("")}/>:null}
  {dialog}
 </section>;
}
