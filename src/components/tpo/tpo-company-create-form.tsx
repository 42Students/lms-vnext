"use client";
import {Input} from "@/components/ui/input";
import {InlineNotice} from "@/components/ui/inline-notice";
import {Disclosure} from "@/components/ui/disclosure";
import {Button} from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";

import { useId, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function TpoCompanyCreateForm() {
  const router = useRouter();
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  // Synchronous latch closes the double-click window before React re-renders.
  const submittingRef = useRef(false);
  const [error, setError] = useState("");
  const [reviewing,setReviewing]=useState(false);
  const [notTheSame,setNotTheSame]=useState(false);
  const [conflict,setConflict]=useState<{error:string;message:string;companyId?:string;name?:string}|null>(null);
  const [resolved,setResolved]=useState<{companyId:string;name:string;existed:boolean;verifiedBy42:boolean}|null>(null);
  function close(){
    if(pending)return;
    setOpen(false);setReviewing(false);setError("");setConflict(null);setResolved(null);setNotTheSame(false);
  }
  const [form, setForm] = useState({
    name: "", websiteUrl: "", primaryDomain: "", recruiterEmail: "",
  });
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || submittingRef.current) return;
    if (form.name.trim().length < 2) {
      setError("Enter a company name with at least two characters.");
      return;
    }
    if(!reviewing){setReviewing(true);setError("");return;}
    submittingRef.current = true;
    setPending(true);
    setError("");
    setConflict(null);
    try {
      const response = await fetch("/api/placements/tpo/companies/create", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmed: true,
          notTheSame,
          ...(form.recruiterEmail.trim()?{recruiterEmail:form.recruiterEmail.trim().toLowerCase()}:{}),
          name: form.name.trim(),
          ...(form.websiteUrl.trim() ? { websiteUrl: form.websiteUrl.trim() } : {}),
          ...(form.primaryDomain.trim() ? { primaryDomain: form.primaryDomain.trim().toLowerCase() } : {}),
        }),
      });
      const body = (await response.json().catch(() => null)) as
        | { companyId?: string; companyName?: string; name?: string; existed?: boolean;
            verifiedBy42?: boolean; error?: string; message?: string }
        | null;
      if(!response.ok||!body?.companyId){
        if(response.status===409){
          setConflict({error:body?.error??"SAME_COMPANY",
            message:body?.message??"A matching company requires review.",
            companyId:body?.companyId,name:body?.name});
        }
        throw new Error(body?.message??(
          body?.error==="RECRUITER_EMAIL_DOMAIN_MISMATCH"
          ?"Use a recruiter email from the company domain."
          :"Could not save the company relationship. Check the details and try again."
        ));
      }
      setResolved({companyId:body.companyId,name:body.companyName??body.name??form.name,
        existed:Boolean(body.existed),verifiedBy42:Boolean(body.verifiedBy42)});
      setNotTheSame(false);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Company creation failed.");
    } finally {
      submittingRef.current = false;
      setPending(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        
        className="min-h-11 w-full sm:w-auto md:min-h-9"
        onClick={() => { setOpen(true); setReviewing(false); setError("");setConflict(null);setResolved(null);setNotTheSame(false); }}
      >
        Add other
      </Button>
      <Dialog open={open} onOpenChange={next=>{if(!next)close();}} title="Create employer relationship"
       description="Add other company or link an existing employer to your college; new relationships are untrusted by default."
       footer={<div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
         <Button type="button" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={pending} onClick={close}>Cancel</Button>
         {resolved?
          <Button type="button" variant="primary" className="min-h-11 w-full sm:w-auto md:min-h-9"
            onClick={()=>{router.push("/tpo/companies/"+encodeURIComponent(resolved.companyId));close();}}>View company</Button>:
          <Button type="submit" form={formId} variant="primary" className="min-h-11 w-full sm:w-auto md:min-h-9" loading={pending} disabled={pending}>
           {pending ? "Saving relationship…" : reviewing ? "Confirm company creation" : "Review and create company"}
          </Button>}
       </div>}>
          <form id={formId} onSubmit={(event) => void submit(event)}
            className="space-y-4">
            <p className="text-sm text-body leading-[22px]">
              Reuse an existing global employer when its identity matches; otherwise
              create a company and link it to your college.
            </p>
            <label className="block text-[13px] font-semibold text-[var(--lms-neutral-400)] leading-4">
              Company name
              <Input className="mt-1 min-h-11 w-full md:min-h-9" required minLength={2} maxLength={200}
                
                value={form.name} disabled={pending}
                onChange={(event) => {setReviewing(false);setError("");setForm((v) => ({ ...v, name: event.target.value }));}}/>
            </label>
            <Disclosure title="Optional website and domain" className="border-t border-border" contentClassName="space-y-3 px-2 pb-2">
            <label className="block min-w-0 text-[13px] font-semibold text-[var(--lms-neutral-400)] leading-4">
              Website URL (optional)
              <Input className="mt-1 w-full min-w-0" type="url" maxLength={500}
                placeholder="https://company.example"
                
                value={form.websiteUrl} disabled={pending}
                onChange={(event) => {setReviewing(false);setError("");setForm((v) => ({ ...v, websiteUrl: event.target.value }));}}/>
            </label>
            <label className="block text-[13px] font-semibold text-[var(--lms-neutral-400)] leading-4">
              Primary domain (optional)
              <Input className="mt-1 w-full min-w-0" maxLength={255} placeholder="company.example"
                
                value={form.primaryDomain} disabled={pending}
                onChange={(event) => {setReviewing(false);setError("");setForm((v) => ({ ...v, primaryDomain: event.target.value }));}}/>
            </label>
              <label className="block text-[13px] font-semibold text-[var(--lms-neutral-400)] leading-4">
                Recruiter work email (optional)
                <Input className="mt-1 w-full min-w-0" type="email" maxLength={150} placeholder="recruiter@company.example"
                  value={form.recruiterEmail} disabled={pending}
                  onChange={(event)=>{setReviewing(false);setConflict(null);setError("");setForm(v=>({...v,recruiterEmail:event.target.value}));}}/>
              </label>
            </Disclosure>
            {reviewing?<p role="status" className="break-words border-l-2 border-warning bg-warning-subtle px-3 py-3 text-sm text-body leading-[22px]">
              Create or link {form.name.trim()} to this college?
              Existing canonical companies will be reused where identity matches.
              This creates an auditable college relationship.
            </p>:null}
            {notTheSame?<InlineNotice tone="warning" message="A distinct employer needs its own verified domain and placement-cell review. This choice cannot bypass a matching canonical company."/>:null}
            {conflict?<div role="alert" className="space-y-2 border-y border-border py-3">
              <p className="text-sm font-semibold text-[var(--lms-heading)]">{conflict.error==="PLACEMENT_COMPANY_IDENTITY_CONFLICT"?"Company identity needs review":"Matching company found"}</p>
              <p className="text-sm text-body">{conflict.message}</p>
              <div className="flex flex-wrap gap-2">
               <Button type="button" variant="secondary" disabled={pending}
                onClick={()=>{router.push(conflict.companyId?"/tpo/companies/"+encodeURIComponent(conflict.companyId):"/tpo/companies");close();}}>Use {conflict.name??"existing company"}</Button>
               <Button type="button" variant="secondary" disabled={pending}
                onClick={()=>{setNotTheSame(true);setReviewing(true);setConflict(null);setError("");}}>It&apos;s a different company</Button>
              </div>
            </div>:null}
            {resolved?<div role="status" className="space-y-1 border-y border-border py-3 text-sm text-body">
              <p className="font-semibold text-[var(--lms-heading)]">{resolved.existed?"Existing company linked":"New company created"}: {resolved.name}</p>
              <p>{resolved.verifiedBy42?"Verified company":"Company verification pending"} · {resolved.existed?"Matched an existing employer":"New employer identity"}</p>
              <p>Review the company details before continuing.</p>
            </div>:null}
            {error ? <InlineNotice tone="error" message={error}/> : null}
          </form>
      </Dialog>
    </>
  );
}
