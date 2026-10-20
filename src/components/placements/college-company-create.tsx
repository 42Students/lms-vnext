"use client";
import { Input } from "@/components/ui/input";

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
 const [name,setName]=useState("");
 const [websiteUrl,setWebsiteUrl]=useState("");
 const [primaryDomain,setPrimaryDomain]=useState("");
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  const parsed=collegeCompanyDraftPayload({collegeId,name,websiteUrl,primaryDomain});
  if(!parsed.success){
   setError(parsed.error.issues[0]?.message??"Check company details.");return;
  }
  void run(async()=>{
   setError("");setNotice("");
   try{
    await apiFetch("/api/placements/companies",{
      method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify(parsed.data),
    });
    setName("");setWebsiteUrl("");setPrimaryDomain("");setOpen(false);
    setNotice("Company added to this college. Existing company identities are reused where possible.");
    router.refresh();
   }catch(cause){
    setError(cause instanceof FriendlyFetchError?cause.message:
      "Could not add this company. Check the website and domain before retrying.");
   }
  });
 }
 const field="min-h-11 w-full md:min-h-9";
 return <section className="min-w-0 space-y-[var(--lms-space-3)]">
  <Button variant="primary" type="button" disabled={pending} onClick={()=>setOpen(value=>!value)}
    aria-expanded={open} className="min-h-11 w-full px-4 sm:w-auto md:min-h-9">
    Add company
  </Button>
  {notice?<p role="status" className="text-sm text-body">{notice}</p>:null}
  {open?<form onSubmit={submit} className="grid min-w-0 max-w-[920px] gap-[var(--lms-space-4)] border-b border-[var(--lms-canvas-border)] py-[var(--lms-space-4)] md:grid-cols-2">
    <h2 className="m-0 text-[var(--lms-font-lg)] font-semibold leading-7 text-[var(--lms-heading)] md:col-span-2">Add company</h2>
    <label className="grid min-w-0 gap-[var(--lms-space-2)] text-sm font-semibold">Company name
      <Input required minLength={2} maxLength={150} value={name} onChange={e=>setName(e.target.value)}
        className={field} />
    </label>
    <label className="grid min-w-0 gap-[var(--lms-space-2)] text-sm font-semibold">Website (HTTPS, optional)
      <Input type="url" pattern="https://.*" value={websiteUrl} onChange={e=>setWebsiteUrl(e.target.value)}
        placeholder="https://example.com" className={field}/>
    </label>
    <label className="grid min-w-0 gap-[var(--lms-space-2)] text-sm font-semibold">Company email domain (optional)
      <Input value={primaryDomain} maxLength={255} onChange={e=>setPrimaryDomain(e.target.value)}
        placeholder="example.com" className={field}/>
    </label>
    <p className="text-sm text-muted-foreground sm:col-span-2">
      A company is shared across colleges by its canonical identity. Only this college&apos;s relationship may be edited here.
    </p>
    {error?<p role="alert" className="sm:col-span-2 text-sm text-error">{error}</p>:null}
    <div className="flex min-w-0 flex-col-reverse gap-[var(--lms-space-2)] sm:flex-row md:col-span-2">
      <Button variant="primary" type="submit" disabled={pending} className="min-h-11 w-full px-4 sm:w-auto md:min-h-9">
        {pending?"Adding…":"Save company"}
      </Button>
      <Button variant="secondary" type="button" disabled={pending} onClick={()=>setOpen(false)}
        className="min-h-11 w-full px-4 sm:w-auto md:min-h-9">Cancel</Button>
    </div>
   </form>:null}
 </section>;
}
