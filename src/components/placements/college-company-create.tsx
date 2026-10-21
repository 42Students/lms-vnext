"use client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, FriendlyFetchError } from "@/lib/api-fetch";
import { useGuardedAction } from "@/hooks/use-guarded-action";
import { collegeCompanyDraftPayload } from "@/modules/placements/college-company-create-model";

/** COL-placements-14: create or reuse a canonical company and attach a
 * college-specific relationship. Editing a shared global identity stays
 * platform-admin-only; a college may edit its private contact/notes relationship. */
export function CollegeCompanyCreate({collegeId}:{collegeId:string}){
 const formId=useId();
 const router=useRouter();
 const {showToast}=useToast();
 const {pending,run}=useGuardedAction({busyLabel:"Adding company..."});
 const [open,setOpen]=useState(false);
 const [confirmDiscard,setConfirmDiscard]=useState(false);
 const [name,setName]=useState("");
 const [websiteUrl,setWebsiteUrl]=useState("");
 const [primaryDomain,setPrimaryDomain]=useState("");
 const [contactPersonName,setContactPersonName]=useState("");
 const [contactEmail,setContactEmail]=useState("");
 const [contactPhone,setContactPhone]=useState("");
 const [internalNotes,setInternalNotes]=useState("");
 const [error,setError]=useState("");
 type FieldName="name"|"websiteUrl"|"primaryDomain"|"contactEmail"|"contactPhone";
 const [fieldErrors,setFieldErrors]=useState<Partial<Record<FieldName,string>>>({});
 const [notice,setNotice]=useState("");
 const dirty=Boolean(name.trim()||websiteUrl.trim()||primaryDomain.trim()||
  contactPersonName.trim()||contactEmail.trim()||contactPhone.trim()||internalNotes.trim());
 function requestClose(){
  if(pending)return;
  if(dirty){setConfirmDiscard(true);return;}
  setOpen(false);setError("");setFieldErrors({});
 }
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  const parsed=collegeCompanyDraftPayload({collegeId,name,websiteUrl,primaryDomain});
  if(!parsed.success){
   const errors:Partial<Record<FieldName,string>>={};
   for(const issue of parsed.error.issues){
    const key=issue.path[0];
    if(key==="name"||key==="websiteUrl"||key==="primaryDomain")
     errors[key]??=issue.message;
   }
   setFieldErrors(errors);
   setError("Check the highlighted company details.");return;
  }
  const email=contactEmail.trim();
  const phone=contactPhone.trim();
  const contactErrors:Partial<Record<FieldName,string>>={};
  if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
   contactErrors.contactEmail="Must be a valid email";
  if(phone&&!/^[+()\d][\d\s().-]{6,29}$/.test(phone))
   contactErrors.contactPhone="Enter a valid phone number";
  if(Object.keys(contactErrors).length){
   setFieldErrors(contactErrors);setError("Check the highlighted company details.");return;
  }
  setFieldErrors({});
  void run(async()=>{
   setError("");setNotice("");
   let createdRelationshipId:string|null=null;
   try{
    const created=await apiFetch<{relationship:{id:string}}>("/api/placements/companies",{
      method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify(parsed.data),
    });
    createdRelationshipId=created.relationship.id;
    const details={
      contactPersonName:contactPersonName.trim()||null,
      contactEmail:email||null,
      contactPhone:phone||null,
      internalNotes:internalNotes.trim()||null,
    };
    if(Object.values(details).some(value=>value!==null)){
      await apiFetch("/api/placements/companies/"+
        encodeURIComponent(createdRelationshipId)+"/history",{
        method:"PATCH",headers:{"content-type":"application/json"},
        body:JSON.stringify(details),
      });
    }
    showToast({tone:"success",title:"Company created",
      description:"The employer is linked to this college. Private contact details stay with this college."});
    setNotice("Company created. Added to this college; existing company identities are reused where possible.");
   }catch(cause){
    if(createdRelationshipId){
      // The identity/link write succeeded but the second private contact write
      // did not. Never retry POST and imply that the entire transaction failed.
      setNotice("Company created, but contact details were not saved. Open its History to edit the college contact and notes.");
      showToast({tone:"info",title:"Company created",
        description:"College contact details were not saved. Edit them in History."});
    }else{
      setError(cause instanceof FriendlyFetchError?cause.message:
        "Check the website and domain before retrying.");
      if(cause instanceof FriendlyFetchError&&Object.keys(cause.fieldErrors).length){
        const errors:Partial<Record<FieldName,string>>={};
        for(const key of ["name","websiteUrl","primaryDomain"] as const){
          if(cause.fieldErrors[key])errors[key]=cause.fieldErrors[key];
        }
        setFieldErrors(errors);
      }
      return;
    }
   }
   setName("");setWebsiteUrl("");setPrimaryDomain("");
   setContactPersonName("");setContactEmail("");setContactPhone("");setInternalNotes("");
   setFieldErrors({});setOpen(false);router.refresh();
  });
 }
 const field="min-h-11 w-full md:min-h-9";
 return <section className="min-w-0 space-y-[var(--lms-space-3)]">
  <Button variant="primary" type="button" disabled={pending} onClick={()=>open?requestClose():setOpen(true)}
    aria-expanded={open} className="min-h-11 w-full px-4 sm:w-auto md:min-h-9">
    <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M8 2.5v11M2.5 8h11"/>
    </svg>
    Add company
  </Button>
  {notice?<p role="status" className="text-sm text-body leading-[22px]">{notice}</p>:null}
  <Dialog open={open} onOpenChange={value=>{if(!value)requestClose();else setOpen(true);}}
    title="Add Company"
    description="Link a canonical company identity with this college."
    className="max-w-[560px] max-[767px]:!max-h-[100dvh] max-[767px]:!rounded-t-[var(--lms-canvas-radius)]"
    footer={<>
      <Button variant="secondary" type="button" disabled={pending} onClick={requestClose}>Cancel</Button>
      <Button form={formId} variant="primary" type="submit" disabled={pending}>
        {pending?"Adding…":"Save company"}
      </Button>
    </>}>
   <form id={formId} onSubmit={submit}
     className="grid min-w-0 grid-cols-1 gap-[var(--lms-space-4)] sm:grid-cols-2">
    <h3 className="font-semibold text-foreground sm:col-span-2">Identity</h3>
    <label className="grid min-w-0 gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Company name
      <Input required minLength={2} maxLength={150} placeholder="e.g. Infosys Limited" value={name}
        aria-invalid={Boolean(fieldErrors.name)}
        onChange={e=>{setName(e.target.value);setFieldErrors(current=>({...current,name:undefined}));}}
        className={field} />
      {fieldErrors.name?<span role="alert" className="text-xs font-normal text-error">{fieldErrors.name}</span>:null}
    </label>
    <label className="grid min-w-0 gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Website (HTTPS, optional)
      <Input type="url" pattern="https://.*" value={websiteUrl} aria-invalid={Boolean(fieldErrors.websiteUrl)}
        onChange={e=>{setWebsiteUrl(e.target.value);setFieldErrors(current=>({...current,websiteUrl:undefined}));}}
        placeholder="https://example.com" className={field}/>
      {fieldErrors.websiteUrl?<span role="alert" className="text-xs font-normal text-error">{fieldErrors.websiteUrl}</span>:null}
    </label>
    <label className="grid min-w-0 gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Company email domain (optional)
      <Input value={primaryDomain} maxLength={255} aria-invalid={Boolean(fieldErrors.primaryDomain)}
        onChange={e=>{setPrimaryDomain(e.target.value);setFieldErrors(current=>({...current,primaryDomain:undefined}));}}
        placeholder="example.com" className={field}/>
      {fieldErrors.primaryDomain?<span role="alert" className="text-xs font-normal text-error">{fieldErrors.primaryDomain}</span>:null}
    </label>
    <h3 className="font-semibold text-foreground sm:col-span-2">Contact</h3>
    <label className="grid min-w-0 gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Contact person
      <Input value={contactPersonName} maxLength={150} placeholder="Recruiter contact name"
        onChange={e=>setContactPersonName(e.target.value)} className={field}/>
    </label>
    <label className="grid min-w-0 gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Contact email
      <Input value={contactEmail} type="email" maxLength={150}
        placeholder="recruiter@company.com" aria-invalid={Boolean(fieldErrors.contactEmail)}
        onChange={e=>{setContactEmail(e.target.value);setFieldErrors(current=>({...current,contactEmail:undefined}));}}
        className={field}/>
      {fieldErrors.contactEmail?<span role="alert" className="text-xs font-normal text-error">{fieldErrors.contactEmail}</span>:null}
    </label>
    <label className="grid min-w-0 gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Contact phone
      <Input value={contactPhone} type="tel" maxLength={30}
        aria-invalid={Boolean(fieldErrors.contactPhone)}
        onChange={e=>{setContactPhone(e.target.value);setFieldErrors(current=>({...current,contactPhone:undefined}));}}
        className={field}/>
      {fieldErrors.contactPhone?<span role="alert" className="text-xs font-normal text-error">{fieldErrors.contactPhone}</span>:null}
    </label>
    <h3 className="font-semibold text-foreground sm:col-span-2">Internal</h3>
    <div className="min-w-0 space-y-2 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] p-3 sm:col-span-2">
      <label className="grid min-w-0 gap-2 font-semibold text-[13px] text-[var(--lms-neutral-400)]">
        Internal notes
        <span className="text-xs font-normal text-muted-foreground">Visible only to your placement team, not to students.</span>
        <Textarea value={internalNotes} rows={2} maxLength={2000}
          onChange={e=>setInternalNotes(e.target.value)} />
      </label>
      <p className="text-right text-xs text-muted-foreground">{internalNotes.length}/2000</p>
    </div>
    <p className="text-sm text-muted-foreground sm:col-span-2 leading-[22px]">
      A company is shared across colleges by its canonical identity. Only this college&apos;s
      contact, notes, trust and owner settings can be edited here; global logo,
      industry and description are managed by verified platform administrators.
    </p>
    {error?<div role="alert" className="sm:col-span-2 flex flex-wrap items-start justify-between gap-2 rounded-[var(--lms-control-radius)] border border-border p-3 text-sm text-error leading-[22px]">
      <span><strong>Company was not saved.</strong> {error}</span>
      <Button type="button" variant="ghost" size="sm" onClick={()=>setError("")}>Dismiss</Button>
    </div>:null}
   </form>
  </Dialog>
  <ConfirmDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}
   title="Discard unsaved changes?" description="Your company details have not been saved."
   cancelLabel="Keep editing" confirmLabel="Discard changes" confirmVariant="danger"
   onConfirm={()=>{setConfirmDiscard(false);setOpen(false);setError("");setName("");setWebsiteUrl("");setPrimaryDomain("");setContactPersonName("");setContactEmail("");setContactPhone("");setInternalNotes("");setFieldErrors({});}} />
 </section>;
}
