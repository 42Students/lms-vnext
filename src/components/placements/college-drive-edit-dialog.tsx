"use client";
import {useState,type FormEvent} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";

type JobView={title:string;description:string;updatedAt:string;status:string};
function validJob(payload:unknown):JobView|null{
 if(!payload||typeof payload!=="object"||Array.isArray(payload))return null;
 const record=payload as Record<string,unknown>;
 const item=record["job"];
 if(!item||typeof item!=="object"||Array.isArray(item))return null;
 const job=item as Record<string,unknown>;
 if(typeof job["title"]!=="string"||typeof job["description"]!=="string"||
    typeof job["status"]!=="string"||typeof job["updatedAt"]!=="string")return null;
 return {title:job["title"],description:job["description"],status:job["status"],
  updatedAt:job["updatedAt"]};
}

/** Old-LMS 800px in-list edit entry point; full settings remain available for
 * advanced eligibility, audience, role and publishing changes. API checks the
 * active selected-college permission and draft lifecycle on every request. */
export function CollegeDriveEditDialog({jobId,title,fullEditorHref}:{
 jobId:string;title:string;fullEditorHref:string;
}){
 const router=useRouter();
 const [open,setOpen]=useState(false),[loading,setLoading]=useState(false);
 const [saving,setSaving]=useState(false),[dirty,setDirty]=useState(false);
 const [discard,setDiscard]=useState(false),[error,setError]=useState("");
 const [initial,setInitial]=useState<JobView|null>(null);
 const [draftTitle,setDraftTitle]=useState(""),[draftDescription,setDraftDescription]=useState("");
 const endpoint="/api/placements/jobs/"+encodeURIComponent(jobId);
 async function readJob():Promise<JobView>{
  const response=await fetch(endpoint,{cache:"no-store",credentials:"same-origin"});
  if(!response.ok)throw new Error("Unable to load the latest editable job.");
  const body:unknown=await response.json();
  const result=validJob(body);
  if(!result||result.status!=="DRAFT")throw new Error("This drive is not an editable draft.");
  return result;
 }
 async function launch(){
  setOpen(true);setLoading(true);setError("");setDirty(false);setInitial(null);
  try{
   const current=await readJob();
   setInitial(current);setDraftTitle(current.title);setDraftDescription(current.description);
  }catch(reason){
   setError(reason instanceof Error?reason.message:"Could not load drive details.");
  }finally{setLoading(false);}
 }
 function requestClose(){
  if(saving)return;
  if(dirty){setDiscard(true);return;}
  setOpen(false);setInitial(null);
 }
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(saving||loading||!initial)return;
  const nextTitle=draftTitle.trim(),nextDescription=draftDescription.trim();
  if(nextTitle.length<3||nextTitle.length>100){
   setError("Job title must be between 3 and 100 characters.");return;
  }
  if(nextDescription.length>5000||!nextDescription.replace(/<[^>]*>/g,"").trim()){
   setError("Please enter job description (maximum 5000 characters).");return;
  }
  setSaving(true);setError("");
  try{
   // Do not blindly replace another editor's newer draft. The service also
   // checks its row version and last update inside the write transaction.
   const latest=await readJob();
   if(latest.updatedAt!==initial.updatedAt)
    throw new Error("This drive changed since opening. Reload before saving.");
   const response=await fetch(endpoint,{method:"PATCH",credentials:"same-origin",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({title:nextTitle,description:nextDescription})});
   if(!response.ok){
    if(response.status===409)throw new Error("This drive changed since opening. Reload before saving.");
    throw new Error("Could not save this draft. Review the job settings and retry.");
   }
   setDirty(false);setOpen(false);setInitial(null);router.refresh();
  }catch(reason){setError(reason instanceof Error?reason.message:"Could not save job.");}
  finally{setSaving(false);}
 }
 const formId="college-drive-edit-"+jobId;
 return <>
  <Button type="button" variant="link" size="sm" className="min-h-11 !px-0 md:min-h-9"
    aria-label={"Edit "+title} onClick={()=>void launch()}>Edit</Button>
  <Dialog open={open} onOpenChange={next=>{if(!next)requestClose();}}
   title="Edit Job" description={title} className="max-w-[800px]"
   dismissible={!saving}
   footer={<>
    <Link href={fullEditorHref} className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline">Full job editor</Link>
    <Button type="button" variant="secondary" disabled={saving} onClick={requestClose}>Cancel</Button>
    <Button type="submit" form={formId} disabled={saving||loading||!initial||!dirty}>
     {saving?"Saving…":"Update Job"}</Button>
   </>}>
   {loading?<p role="status" className="text-sm">Loading current job details…</p>:null}
   {error?<p role="alert" className="mb-3 text-sm text-[var(--lms-error)]">{error}</p>:null}
   {initial?<form id={formId} onSubmit={event=>void submit(event)}
     className="grid min-w-0 gap-4" aria-label="Edit placement job">
     <label className="grid gap-2 text-sm font-semibold">Job Title
      <Input autoFocus required maxLength={100} value={draftTitle}
       onChange={event=>{setDraftTitle(event.target.value);setDirty(true);}}/>
     </label>
     <label className="grid gap-2 text-sm font-semibold">Job Description
      <Textarea required maxLength={5000} rows={8} value={draftDescription}
       onChange={event=>{setDraftDescription(event.target.value);setDirty(true);}}/>
     </label>
     <p className="text-xs text-muted-foreground">Editing a draft only. The full editor manages job type, target classes, preferences, eligibility, dates and publishing.</p>
    </form>:null}
  </Dialog>
  <Dialog open={discard} onOpenChange={setDiscard} role="alertdialog"
   title="Discard unsaved changes?" description="Your job edits have not been saved."
   footer={<>
    <Button type="button" variant="secondary" onClick={()=>setDiscard(false)}>Keep editing</Button>
    <Button type="button" variant="danger" onClick={()=>{
     setDiscard(false);setDirty(false);setOpen(false);setInitial(null);
    }}>Discard changes</Button>
   </>}>
   <p className="text-sm">Discard the edits to this draft job?</p>
  </Dialog>
 </>;
}
