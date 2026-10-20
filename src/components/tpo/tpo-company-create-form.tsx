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
  function close(){
    if(pending)return;
    setOpen(false);setReviewing(false);setError("");
  }
  const [form, setForm] = useState({
    name: "", websiteUrl: "", primaryDomain: "",
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
    try {
      const response = await fetch("/api/placements/tpo/companies/create", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmed: true,
          name: form.name.trim(),
          ...(form.websiteUrl.trim() ? { websiteUrl: form.websiteUrl.trim() } : {}),
          ...(form.primaryDomain.trim() ? { primaryDomain: form.primaryDomain.trim().toLowerCase() } : {}),
        }),
      });
      const body = (await response.json().catch(() => null)) as
        | { companyId?: string; error?: string }
        | null;
      if (!response.ok || !body?.companyId) {
        throw new Error("Could not save the company relationship. Check the details and try again.");
      }
      router.push("/tpo/companies/" + encodeURIComponent(body.companyId));
      router.refresh();
      setOpen(false);setReviewing(false);
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
        onClick={() => { setOpen(true); setReviewing(false); setError(""); }}
      >
        Add company
      </Button>
      <Dialog open={open} onOpenChange={next=>{if(!next)close();}} title="Create employer relationship"
       description="Create or link a company to your college; new relationships are untrusted by default."
       footer={<div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
         <Button type="button" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={pending} onClick={close}>Cancel</Button>
         <Button type="submit" form={formId} variant="primary" className="min-h-11 w-full sm:w-auto md:min-h-9" loading={pending} disabled={pending}>
           {pending ? "Saving relationship…" : reviewing ? "Confirm company creation" : "Review and create company"}
         </Button>
       </div>}>
          <form id={formId} onSubmit={(event) => void submit(event)}
            className="space-y-4">
            <p className="text-sm text-body">
              Reuse an existing global employer when its identity matches; otherwise
              create a company and link it to your college.
            </p>
            <label className="block text-sm font-semibold text-foreground">
              Company name
              <Input className="mt-1 min-h-11 w-full md:min-h-9" required minLength={2} maxLength={200}
                
                value={form.name} disabled={pending}
                onChange={(event) => {setReviewing(false);setForm((v) => ({ ...v, name: event.target.value }));}}/>
            </label>
            <Disclosure title="Optional website and domain" className="border-t border-border" contentClassName="space-y-3 px-2 pb-2">
            <label className="block min-w-0 text-sm font-semibold text-foreground">
              Website URL (optional)
              <Input className="mt-1 w-full min-w-0" type="url" maxLength={500}
                placeholder="https://company.example"
                
                value={form.websiteUrl} disabled={pending}
                onChange={(event) => {setReviewing(false);setForm((v) => ({ ...v, websiteUrl: event.target.value }));}}/>
            </label>
            <label className="block text-sm font-semibold text-foreground">
              Primary domain (optional)
              <Input className="mt-1 w-full min-w-0" maxLength={255} placeholder="company.example"
                
                value={form.primaryDomain} disabled={pending}
                onChange={(event) => {setReviewing(false);setForm((v) => ({ ...v, primaryDomain: event.target.value }));}}/>
            </label>
            </Disclosure>
            {reviewing?<p role="status" className="break-words border-l-2 border-warning bg-warning-subtle px-3 py-3 text-sm text-body">
              Create or link {form.name.trim()} to this college?
              Existing canonical companies will be reused where identity matches.
              This creates an auditable college relationship.
            </p>:null}
            {error ? <InlineNotice tone="error" message={error}/> : null}
          </form>
      </Dialog>
    </>
  );
}
