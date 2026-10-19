"use client";

import { Button } from "@/components/ui/button";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {collegeCompanyDraftPayload} from "@/modules/placements/college-company-create-model";

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
 const field="min-h-11 w-full rounded-md border border-border bg-surface px-3 text-foreground";
 return <section className="space-y-3">
  <Button variant="primary" type="button" disabled={pending} onClick={()=>setOpen(value=>!value)}
    aria-expanded={open} className="min-h-11 px-4">
    Add company
  </Button>
  {notice?<p role="status" className="text-sm text-body">{notice}</p>:null}
  {open?<form onSubmit={submit} className="grid gap-3 rounded-lg border border-border bg-surface p-4 sm:grid-cols-2">
    <h2 className="font-semibold sm:col-span-2">Add company</h2>
    <label className="grid gap-1 text-sm font-semibold">Company name
      <input required minLength={2} maxLength={150} value={name} onChange={e=>setName(e.target.value)}
        className={field} />
    </label>
    <label className="grid gap-1 text-sm font-semibold">Website (HTTPS, optional)
      <input type="url" pattern="https://.*" value={websiteUrl} onChange={e=>setWebsiteUrl(e.target.value)}
        placeholder="https://example.com" className={field}/>
    </label>
    <label className="grid gap-1 text-sm font-semibold">Company email domain (optional)
      <input value={primaryDomain} maxLength={255} onChange={e=>setPrimaryDomain(e.target.value)}
        placeholder="example.com" className={field}/>
    </label>
    <p className="text-sm text-muted-foreground sm:col-span-2">
      A company is shared across colleges by its canonical identity. Only this college&apos;s relationship may be edited here.
    </p>
    {error?<p role="alert" className="sm:col-span-2 text-sm text-error">{error}</p>:null}
    <div className="flex gap-2 sm:col-span-2">
      <Button variant="primary" type="submit" disabled={pending} className="min-h-11 px-4">
        {pending?"Adding…":"Save company"}
      </Button>
      <Button variant="secondary" type="button" disabled={pending} onClick={()=>setOpen(false)}
        className="min-h-11 px-4">Cancel</Button>
    </div>
   </form>:null}
 </section>;
}
