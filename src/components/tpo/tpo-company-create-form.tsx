"use client";

import { useEffect,useRef,useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function TpoCompanyCreateForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [reviewing,setReviewing]=useState(false);
  const launchRef=useRef<HTMLButtonElement>(null);
  const modalRef=useRef<HTMLDivElement>(null);
  const nameRef=useRef<HTMLInputElement>(null);
  function close(){
    if(pending)return;
    setOpen(false);setReviewing(false);setError("");
    launchRef.current?.focus();
  }
  useEffect(()=>{
    if(!open)return;
    nameRef.current?.focus();
    const onKey=(e:KeyboardEvent)=>{
      if(e.key==="Escape"){e.preventDefault();close();return;}
      if(e.key!=="Tab"||!modalRef.current)return;
      const items=Array.from(modalRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]),input:not([disabled])'));
      const first=items[0],last=items[items.length-1];
      if(!first||!last)return;
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    };
    window.addEventListener("keydown",onKey);
    return ()=>window.removeEventListener("keydown",onKey);
  },[open,pending]);
  const [form, setForm] = useState({
    name: "", websiteUrl: "", primaryDomain: "",
  });
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (form.name.trim().length < 2) {
      setError("Enter a company name with at least two characters.");
      return;
    }
    if(!reviewing){setReviewing(true);setError("");return;}
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
        throw new Error(body?.error ?? "Could not save the company relationship.");
      }
      router.push("/tpo/companies/" + encodeURIComponent(body.companyId));
      router.refresh();
      setOpen(false);setReviewing(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Company creation failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button ref={launchRef}
        type="button"
        className="inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-on-primary"
        onClick={() => { setOpen(true); setReviewing(false); setError(""); }}
      >
        Add company
      </button>
      {open ? (
        <div ref={modalRef} role="dialog" aria-modal="true" aria-label="Add placement company"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={(event) => void submit(event)}
            className="w-full max-w-xl space-y-4 rounded-xl border border-border bg-surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-foreground">Create employer relationship</h2>
              <button type="button" disabled={pending} className="text-sm text-primary-text"
                onClick={close}>Cancel</button>
            </div>
            <p className="text-sm text-body">
              Reuse an existing global employer when its identity matches; otherwise
              create a company and link it to your college. New relationships are untrusted by default.
            </p>
            <label className="block text-sm font-semibold text-foreground">
              Company name
              <input ref={nameRef} required minLength={2} maxLength={200}
                className="mt-1 min-h-10 w-full rounded-md border border-border bg-surface px-3"
                value={form.name} disabled={pending}
                onChange={(event) => {setReviewing(false);setForm((v) => ({ ...v, name: event.target.value }));}}/>
            </label>
            <label className="block text-sm font-semibold text-foreground">
              Website URL (optional)
              <input type="url" maxLength={500}
                placeholder="https://company.example"
                className="mt-1 min-h-10 w-full rounded-md border border-border bg-surface px-3"
                value={form.websiteUrl} disabled={pending}
                onChange={(event) => {setReviewing(false);setForm((v) => ({ ...v, websiteUrl: event.target.value }));}}/>
            </label>
            <label className="block text-sm font-semibold text-foreground">
              Primary domain (optional)
              <input maxLength={255} placeholder="company.example"
                className="mt-1 min-h-10 w-full rounded-md border border-border bg-surface px-3"
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
              className="min-h-10 rounded-md bg-primary px-4 font-semibold text-on-primary disabled:opacity-50">
              {pending ? "Saving relationship…" : reviewing ? "Confirm company creation" : "Review and create company"}
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}
