"use client";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import { Button } from "@/components/ui/button";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, FriendlyFetchError } from "@/lib/api-fetch";
import { useGuardedAction } from "@/hooks/use-guarded-action";
import { collegeCompanyDraftPayload } from "@/modules/placements/college-company-create-model";

/** COL-placements-14: create or reuse a canonical company and attach a
 * college-specific relationship. Editing a shared global identity stays
 * platform-admin-only; a college may edit only its trust/owner relationship. */
export function CollegeCompanyCreate({collegeId}:{collegeId:string}){
 const router=useRouter();
 const {pending,run}=useGuardedAction({busyLabel:"Adding company..."});
 const [open,setOpen]=useState(false);
 const [confirmDiscard,setConfirmDiscard]=useState(false);
 const [name,setName]=useState("");
 const [websiteUrl,setWebsiteUrl]=useState("");
 const [primaryDomain,setPrimaryDomain]=useState("");
 const [error,setError]=useState("");
 const [fieldErrors,setFieldErrors]=useState<Partial<Record<"name"|"websiteUrl"|"primaryDomain",string>>>({});
 const [notice,setNotice]=useState("");
 const dirty=Boolean(name.trim()||websiteUrl.trim()||primaryDomain.trim());
 function requestClose(){
  if(pending)return;
  if(dirty){setConfirmDiscard(true);return;}
  setOpen(false);setError("");setFieldErrors({});
 }
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  const parsed=collegeCompanyDraftPayload({collegeId,name,websiteUrl,primaryDomain});
  if(!parsed.success){
   const errors:Partial<Record<"name"|"websiteUrl"|"primaryDomain",string>>={};
   for(const issue of parsed.error.issues){
    const key=issue.path[0];
    if(key==="name"||key==="websiteUrl"||key==="primaryDomain")
     errors[key]??=issue.message;
   }
   setFieldErrors(errors);
   setError("Check the highlighted company details.");return;
  }
  setFieldErrors({});
  void run(async()=>{
   setError("");setNotice("");
   try{
    await apiFetch("/api/placements/companies",{
      method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify(parsed.data),
    });
    setName("");setWebsiteUrl("");setPrimaryDomain("");setFieldErrors({});setOpen(false);
    setNotice("Company created. Added to this college; existing company identities are reused where possible.");
    router.refresh();
   }catch(cause){
    setError(cause instanceof FriendlyFetchError?cause.message:
      "Check the website and domain before retrying.");
   }
  });
 }
 const field="min-h-11 w-full md:min-h-9";
 return <section className="min-w-0 space-y-[var(--lms-space-3)]">
  <Button variant="primary" type="button" disabled={pending} onClick={()=>open?requestClose():setOpen(true)}
    aria-expanded={open} className="min-h-11 w-full px-4 sm:w-auto md:min-h-9">
    Add company
  </Button>
  {notice?<p role="status" className="text-sm text-body leading-[22px]">{notice}</p>:null}
  {open?<form onSubmit={submit} className="grid min-w-0 max-w-[920px] gap-[var(--lms-space-4)] border-b border-[var(--lms-canvas-border)] py-[var(--lms-space-4)] md:grid-cols-2">
    <h2 className="m-0 text-[var(--lms-font-lg)] font-semibold leading-7 text-[var(--lms-heading)] md:col-span-2">Add company</h2>
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
    <p className="text-sm text-muted-foreground sm:col-span-2 leading-[22px]">
      A company is shared across colleges by its canonical identity. Only this college&apos;s relationship may be edited here.
    </p>
    {error?<div role="alert" className="sm:col-span-2 flex flex-wrap items-start justify-between gap-2 rounded-[var(--lms-control-radius)] border border-border p-3 text-sm text-error leading-[22px]">
      <span><strong>Company was not saved.</strong> {error}</span>
      <Button type="button" variant="ghost" size="sm" onClick={()=>setError("")}>Dismiss</Button>
    </div>:null}
    <div className="flex min-w-0 flex-col-reverse gap-[var(--lms-space-2)] sm:flex-row md:col-span-2">
      <Button variant="primary" type="submit" disabled={pending} className="min-h-11 w-full px-4 sm:w-auto md:min-h-9">
        {pending?"Adding…":"Save company"}
      </Button>
      <Button variant="secondary" type="button" disabled={pending} onClick={requestClose}
        className="min-h-11 w-full px-4 sm:w-auto md:min-h-9">Cancel</Button>
    </div>
   </form>:null}
  <ConfirmDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}
   title="Discard unsaved changes?" description="Your company details have not been saved."
   cancelLabel="Keep editing" confirmLabel="Discard changes" confirmVariant="danger"
   onConfirm={()=>{setConfirmDiscard(false);setOpen(false);setError("");setName("");setWebsiteUrl("");setPrimaryDomain("");setFieldErrors({});}} />
 </section>;
}
