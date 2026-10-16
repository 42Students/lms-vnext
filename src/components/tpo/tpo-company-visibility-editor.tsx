"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
const labels={
 showCgpaExact:"Recruiters see exact CGPA",
 showTenthTwelfth:"Recruiters see board percentages",
 showProjectLinks:"Recruiters see project links",
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
   const response=await fetch("/api/placements/tpo/company-visibility",{
    method:"PUT",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({collegeId,expectedVersion:version,...values}),
   });
   if(!response.ok)throw Error(response.status===409?"Sharing policy changed elsewhere. Refresh before retrying.":
    response.status===503?"Sharing settings API is waiting for DB09 readiness.":"Could not save company visibility.");
   setMessage("Saved");router.refresh();
  }catch(error){setMessage(error instanceof Error?error.message:"Could not save.");}
  finally{setBusy(false);}
 }
 return <section aria-label="Edit company visibility" className="space-y-3 rounded-xl border border-border bg-surface p-4">
  <h3 className="font-semibold">What companies see</h3>
  <p className="text-xs text-muted-foreground">Your choices are saved in the college's sharing policy. Individual recruiter rights, consent and export permissions remain separate safeguards.</p>
  {Object.entries(labels).map(([key,label])=><label key={key} className="flex min-h-11 items-center justify-between gap-3 border-b border-border py-2 text-sm">
   <span>{label}</span>
   <input type="checkbox" disabled={busy} checked={values[key as keyof Choice]}
    onChange={e=>setValues(current=>({...current,[key]:e.target.checked}))}/>
  </label>)}
  <button type="button" disabled={busy} onClick={()=>void save()}
   className="min-h-11 rounded-md bg-primary px-4 font-semibold text-on-primary disabled:opacity-50">{busy?"Saving…":"Save"}</button>
  {message?<p role="status" className="text-sm">{message}</p>:null}
 </section>;
}
