"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {Button} from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Alert} from "@/components/ui/alert";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {useToast} from "@/components/ui/toast";

type CollegeContact={
 contactName:string|null;contactEmail:string|null;contactPhone:string|null;internalNotes:string|null;
};
type Company={
 id:string;name:string;website:string|null;industry:string|null;
 about:string|null;logoPublicUrl:string|null;updatedAt:string|null;
};
const emptyContact:CollegeContact={
 contactName:null,contactEmail:null,contactPhone:null,internalNotes:null,
};

/** Super Admin edits the canonical identity and the selected college's
 * private contact fields in a single legacy-shaped dialog. The two storage
 * scopes have different permissions: canonical changes are audited on the
 * platform, while the CRM endpoint is college-scoped. A partial failure is
 * explicitly surfaced, never reported as an atomic success. */
export function SuperAdminCollegeCompanyEdit({relationshipId,company}:{
 relationshipId:string;company:Company;
}){
 const router=useRouter();
 const {pending,run}=useGuardedAction();
 const {showToast}=useToast();
 const [open,setOpen]=useState(false);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 const [details,setDetails]=useState<CollegeContact>(emptyContact);
 const [shared,setShared]=useState({
  name:company.name,website:company.website??"",industry:company.industry??"",
  about:company.about??"",logoPublicUrl:company.logoPublicUrl??"",
 });
 const [dirtyPrivate,setDirtyPrivate]=useState(false);
 const [confirmDiscard,setConfirmDiscard]=useState(false);
 const [canonicalSaved,setCanonicalSaved]=useState(false);
 const endpoint="/api/placements/companies/"+encodeURIComponent(relationshipId)+"/history";
 const sharedDirty=shared.name!==company.name||
   shared.website!==(company.website??"")||
   shared.industry!==(company.industry??"")||
   shared.about!==(company.about??"")||
   shared.logoPublicUrl!==(company.logoPublicUrl??"");
 const dirty=dirtyPrivate||sharedDirty;
 async function showEditor(){
  setError("");setLoading(true);setDirtyPrivate(false);setCanonicalSaved(false);setOpen(true);
  setShared({name:company.name,website:company.website??"",industry:company.industry??"",
   about:company.about??"",logoPublicUrl:company.logoPublicUrl??""});
  try{
   const result=await apiFetch<{company:CollegeContact}>(endpoint);
   setDetails(result.company);
  }catch(reason){
   setError(reason instanceof Error?reason.message:"Unable to load college contact details. Retry.");
  }finally{setLoading(false);}
 }
 function requestClose(){
  if(pending)return;
  if(dirty){setConfirmDiscard(true);return;}
  setOpen(false);setError("");
 }
 function setField(field:keyof CollegeContact,value:string){
  setDirtyPrivate(true);
  setDetails(current=>({...current,[field]:value}));
 }
 function setGlobal(field:keyof typeof shared,value:string){
  setShared(current=>({...current,[field]:value}));
 }
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(loading||pending)return;
  const email=(details.contactEmail??"").trim();
  const phone=(details.contactPhone??"").trim();
  if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
   setError("Must be a valid contact email");return;
  }
  if(phone&&!/^[+()\d][\d\s().-]{6,29}$/.test(phone)){
   setError("Enter a valid phone number");return;
  }
  if(shared.name.trim().length<2||shared.name.trim().length>150){
   setError("Company name must be between 2 and 150 characters");return;
  }
  if(shared.industry.length>160||shared.about.length>3000){
   setError("Industry is limited to 160 characters and About to 3,000.");return;
  }
  for(const value of [shared.website,shared.logoPublicUrl]){
   if(!value.trim())continue;
   try{const url=new URL(value.trim());
    if(url.protocol!=="https:"||url.username||url.password)throw new Error("INVALID_URL");
   }catch{setError("Website and logo must be valid HTTPS links");return;}
  }
  if(sharedDirty&&!company.updatedAt&&!canonicalSaved){
   setError("Shared identity revision is unavailable. Refresh the directory before editing.");return;
  }
  void run(async()=>{
   setError("");
   let savedGlobal=canonicalSaved;
   try{
    // These canonical fields are shared across all colleges. The server
    // requires a Super Admin permission and rejects stale revisions.
    if(sharedDirty&&!savedGlobal){
     await apiFetch("/api/admin/companies/edit",{
      method:"PATCH",headers:{"content-type":"application/json"},
      body:JSON.stringify({companyId:company.id,expectedUpdatedAt:company.updatedAt,
       name:shared.name.trim(),website:shared.website.trim(),
       industry:shared.industry.trim()||null,about:shared.about.trim()||null,
       logoPublicUrl:shared.logoPublicUrl.trim(),
      }),
     });
     savedGlobal=true;setCanonicalSaved(true);
    }
    if(dirtyPrivate){
     await apiFetch(endpoint,{
      method:"PATCH",headers:{"content-type":"application/json"},
      body:JSON.stringify({
       contactPersonName:details.contactName?.trim()||null,
       contactEmail:email||null,contactPhone:phone||null,
       internalNotes:details.internalNotes?.trim()||null,
      }),
     });
    }
    showToast({tone:"success",title:"Company updated",
     description:savedGlobal?"Shared company changes appear across linked college drives.":"Contact changes are private to this college."});
    setDirtyPrivate(false);setOpen(false);router.refresh();
   }catch(reason){
    const reasonText=reason instanceof Error?reason.message:"Could not update company details.";
    setError(savedGlobal&&dirtyPrivate
     ?"Shared company details were saved, but private college details were not. Retry contact changes or reload. "+reasonText
     :reasonText);
   }
  });
 }
 const cls="min-h-11 w-full md:min-h-9";
 const label="grid min-w-0 gap-2 text-[13px] font-semibold text-[var(--lms-neutral-400)]";
 return <>
  <Button type="button" variant="secondary" className="min-h-11 md:min-h-9"
   onClick={()=>void showEditor()} aria-label={"Edit "+company.name+" company details"}>Edit</Button>
  <Dialog open={open} onOpenChange={next=>{if(!next)requestClose();}}
   title={"Edit "+company.name} className="!max-w-[560px]" dismissible={!pending&&!loading}>
   {loading?<p role="status" className="py-4 text-sm">Loading contact details…</p>:
    error&&!dirty&&!canonicalSaved?<div className="space-y-3">
     <Alert role="alert" tone="error">{error}</Alert>
     <Button type="button" variant="secondary" onClick={()=>void showEditor()}>Retry</Button>
    </div>:<form onSubmit={submit} className="min-w-0 space-y-4">
     <fieldset disabled={pending||canonicalSaved} className="space-y-3">
      <legend className="text-sm font-semibold text-[var(--lms-heading)]">Identity</legend>
      <label className={label}>Company name
       <Input required minLength={2} maxLength={150} value={shared.name} className={cls}
        onChange={event=>setGlobal("name",event.target.value)}/>
      </label>
      <label className={label}>Website (HTTPS)
       <Input type="url" maxLength={500} value={shared.website} className={cls}
        onChange={event=>setGlobal("website",event.target.value)}/>
      </label>
      <label className={label}>Company logo (HTTPS)
       <Input type="url" maxLength={500} value={shared.logoPublicUrl} className={cls}
        onChange={event=>setGlobal("logoPublicUrl",event.target.value)}/>
      </label>
      <label className={label}>Industry
       <Input maxLength={160} value={shared.industry} className={cls}
        onChange={event=>setGlobal("industry",event.target.value)}/>
      </label>
      <label className={label}>Description
       <Textarea rows={3} maxLength={3000} value={shared.about} className={cls}
        onChange={event=>setGlobal("about",event.target.value)}/>
      </label>
      <p className="text-xs font-normal leading-5 text-muted-foreground">Changing shared identity updates this employer across every linked college; permission and revision are rechecked before saving.</p>
     </fieldset>
     <fieldset disabled={pending} className="space-y-3 border-t border-border pt-3">
      <legend className="text-sm font-semibold text-[var(--lms-heading)]">Contact</legend>
      <label className={label}>Recruiter contact name
       <Input maxLength={150} className={cls} value={details.contactName??""}
        onChange={event=>setField("contactName",event.target.value)}/>
      </label>
      <label className={label}>Contact email
       <Input type="email" maxLength={150} className={cls} value={details.contactEmail??""}
        onChange={event=>setField("contactEmail",event.target.value)}/>
      </label>
      <label className={label}>Phone
       <Input type="tel" maxLength={30} className={cls} value={details.contactPhone??""}
        onChange={event=>setField("contactPhone",event.target.value)}/>
      </label>
     </fieldset>
     <fieldset disabled={pending} className="space-y-3 border-t border-border pt-3">
      <legend className="flex items-center gap-2 text-sm font-semibold text-[var(--lms-heading)]">
       <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
       Internal only
      </legend>
      <label className={label}>Notes
       <Textarea rows={4} maxLength={2000} className={cls} value={details.internalNotes??""}
        onChange={event=>setField("internalNotes",event.target.value)}/>
      </label>
      <p className="text-xs text-muted-foreground">Private contact details are visible to authorized staff of the selected college only.</p>
     </fieldset>
     {error?<Alert role="alert" tone="error">{error}</Alert>:null}
     <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
      <Button type="button" variant="secondary" disabled={pending} onClick={requestClose}>Cancel</Button>
      <Button type="submit" loading={pending} disabled={pending||!dirty}>Save changes</Button>
     </div>
    </form>}
  </Dialog>
  <Dialog open={confirmDiscard} onOpenChange={setConfirmDiscard}
   title="Discard unsaved company changes?" className="max-w-[420px]">
   <div className="flex flex-wrap justify-end gap-2">
    <Button type="button" variant="secondary" onClick={()=>setConfirmDiscard(false)}>Keep editing</Button>
    <Button type="button" variant="danger" onClick={()=>{setConfirmDiscard(false);setDirtyPrivate(false);setOpen(false);}}>Discard</Button>
   </div>
  </Dialog>
 </>;
}
