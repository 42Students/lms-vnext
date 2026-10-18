"use client";
import {Dialog} from "@/components/ui/dialog";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function TpoCompanyCreateForm() {
  const router = useRouter();
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
      <button
        type="button"
        className="inline-flex min-h-11 items-center rounded-[9px] bg-primary px-4 text-sm font-[650] text-on-primary"
        onClick={() => { setOpen(true); setReviewing(false); setError(""); }}
      >
        Add company
      </button>
      <Dialog open={open} onOpenChange={next=>{if(!next)close();}} title="Create employer relationship"
       description="Create or link a company to your college; new relationships are untrusted by default.">
          <form onSubmit={(event) => void submit(event)}
            className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <strong className="text-base font-semibold text-foreground">Company details</strong>
              <button type="button" disabled={pending} className="text-sm text-primary-text"
                onClick={close}>Cancel</button>
            </div>
            <p className="text-sm text-body">
              Reuse an existing global employer when its identity matches; otherwise
              create a company and link it to your college. New relationships are untrusted by default.
            </p>
            <label className="block text-sm font-semibold text-foreground">
              Company name
              <input required minLength={2} maxLength={200}
                className="mt-1 min-h-11 w-full rounded-[9px] border border-border bg-surface px-3"
                value={form.name} disabled={pending}
                onChange={(event) => {setReviewing(false);setForm((v) => ({ ...v, name: event.target.value }));}}/>
            </label>
            <label className="block text-sm font-semibold text-foreground">
              Website URL (optional)
              <input type="url" maxLength={500}
                placeholder="https://company.example"
                className="mt-1 min-h-11 w-full rounded-[9px] border border-border bg-surface px-3"
                value={form.websiteUrl} disabled={pending}
                onChange={(event) => {setReviewing(false);setForm((v) => ({ ...v, websiteUrl: event.target.value }));}}/>
            </label>
            <label className="block text-sm font-semibold text-foreground">
              Primary domain (optional)
              <input maxLength={255} placeholder="company.example"
                className="mt-1 min-h-11 w-full rounded-[9px] border border-border bg-surface px-3"
                value={form.primaryDomain} disabled={pending}
                onChange={(event) => {setReviewing(false);setForm((v) => ({ ...v, primaryDomain: event.target.value }));}}/>
            </label>
            {reviewing?<p role="status" className="rounded-lg border border-border p-3 text-sm text-body">
              Create or link {form.name.trim()} to this college?
              Existing canonical companies will be reused where identity matches.
              This creates an auditable college relationship.
            </p>:null}
            {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
            <button type="submit" disabled={pending}
              className="min-h-11 rounded-[9px] bg-primary px-4 font-[650] text-on-primary disabled:opacity-50">
              {pending ? "Saving relationship…" : reviewing ? "Confirm company creation" : "Review and create company"}
            </button>
          </form>
      </Dialog>
    </>
  );
}
