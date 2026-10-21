"use client";
import { Disclosure } from "@/components/ui/disclosure";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {InlineNotice} from "@/components/ui/inline-notice";
import {useToast} from "@/components/ui/toast";
import {Checkbox} from "@/components/ui/checkbox";
import {Button} from "@/components/ui/button";
import {useConfirmFlow} from "@/components/ui/use-confirm-flow";
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
 const router=useRouter(),{showToast}=useToast(),[values,setValues]=useState(initial);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const {askConfirm,dialog}=useConfirmFlow();
 async function save(){
  if(busy||!(await askConfirm("Save what companies can see? These choices control the college's recruiter-visible information policy.")))return;
  setBusy(true);setMessage("");
  try{
   await apiFetch("/api/placements/tpo/company-visibility",{
    method:"PUT",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({collegeId,expectedVersion:version,...values}),
   });
   setMessage("Saved");showToast({tone:"success",title:"Saved"});router.refresh();
  }catch(error){setMessage(error instanceof FriendlyFetchError&&error.status===409?
    "Sharing policy changed elsewhere. Refresh before retrying.":
    error instanceof Error?error.message:"Could not save.");}
  finally{setBusy(false);}
 }
 return <section aria-label="Edit company visibility" className="space-y-3 border-t border-border pt-5">
  <h3 className="font-semibold">What companies see</h3>
  <p className="text-xs text-muted-foreground">Your choices are saved in the college&apos;s sharing policy. Individual recruiter rights, consent and export permissions remain separate safeguards.</p>
  <Disclosure title="How sharing works" className="min-w-0 border-t border-border pt-3" contentClassName="pt-2 text-sm"><ul className="list-disc space-y-1 pl-5">
  <li>The college selects which verified academic fields and project links can be shown to an authorized recruiter.</li>
  <li>When exact undergraduate percentage sharing is off, eligible views may show a percentage band instead.</li>
  <li>Phone numbers and other private contact data are not controlled by these switches. Access still requires a separate need-to-know permission.</li>
  <li>These switches do not grant a recruiter access to a student, drive or download.</li>
  <li>Retention and deletion schedules, including any 90-day requirement, must be enforced by the separate data-retention service; this form does not promise automatic deletion.</li>
 </ul></Disclosure>
  {Object.entries(labels).slice(0,3).map(([key,label])=><label key={key} className="flex min-h-11 min-w-0 items-center justify-between gap-3 border-b border-border py-2 text-sm">
   <span className="min-w-0 flex-1 break-words">{label}</span>
   <Checkbox disabled={busy} checked={values[key as keyof Choice]}
    onChange={e=>setValues(current=>({...current,[key]:e.target.checked}))}/>
  </label>)}
  <Disclosure title="Additional sharing options" className="border-t border-border pt-3">
    {Object.entries(labels).slice(3).map(([key,label])=><label key={key} className="flex min-h-11 items-center justify-between gap-3 border-b border-border py-2 text-sm">
      <span className="min-w-0 flex-1 break-words">{label}</span>
      <Checkbox disabled={busy} checked={values[key as keyof Choice]}
        onChange={event=>setValues(current=>({...current,[key]:event.target.checked}))}/>
    </label>)}
  </Disclosure>
  <Button type="button" disabled={busy} onClick={()=>void save()}
   className="min-h-11 w-full md:w-auto md:min-h-9">{busy?"Saving…":"Save"}</Button>
  {message?<InlineNotice tone={message==="Saved"?"success":"error"} message={message} onDismiss={()=>setMessage("")}/>:null}
  {dialog}
 </section>;
}
