"use client";

import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function TpoCompanyFeedbackForm({
  companyId,
  contacts,
}: {
  companyId: string;
  contacts: readonly { id: string; name: string }[];
}) {
  const router = useRouter();
  const [leadId, setLeadId] = useState(contacts[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [reviewing,setReviewing]=useState(false);

  async function save() {
    if (busy) return;
    if (!leadId || note.trim().length < 3 || note.trim().length > 2000) {
      setError("Select a linked recruiter and enter 3–2000 characters.");
      return;
    }
    if(!reviewing){setReviewing(true);setError(null);return;}
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const response = await fetch(
        "/api/placements/tpo/companies/" + encodeURIComponent(companyId) + "/feedback",
        {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId, note: note.trim() }),
        },
      );
      if (!response.ok) throw new Error("The note was not saved. Refresh and verify before retrying.");
      setNote("");
      setSaved(true);setReviewing(false);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save this note.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-3 border-b border-border pb-6">
      <h2 className="text-base font-semibold text-foreground">Record recruiter feedback</h2>
      <p className="text-sm text-body">
        Internal note attached to an explicitly linked company contact. This does
        not send a message to the recruiter. Saving an activity moves a NEW CRM lead to CONTACTED.
      </p>
      <label className="block text-sm font-medium text-foreground">
        Linked contact
        <Select value={leadId} onChange={(event) => {setReviewing(false);setLeadId(event.target.value);}}
          className="mt-1 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface p-2">
          {contacts.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </Select>
      </label>
      <label className="block text-sm font-medium text-foreground">
        Feedback / meeting note
        <Textarea value={note} onChange={(event) => {setReviewing(false);setNote(event.target.value);}}
          rows={4} maxLength={2000}
          className="mt-1 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface p-2" />
      </label>
      {reviewing?<div role="group" aria-label="Review recruiter feedback" className="rounded-[var(--lms-canvas-radius)] border border-border p-3 text-sm">
        <p>Record this internal recruiter note? New CRM contacts become CONTACTED when an activity is logged.</p>
        <button type="button" className="mt-2 text-[var(--lms-teal-deep)] underline" onClick={()=>setReviewing(false)}>Cancel review</button>
      </div>:null}
      <button type="button" disabled={busy || !leadId || note.trim().length < 3}
        onClick={() => void save()}
        className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-[650] text-primary-foreground disabled:opacity-50">
        {busy ? "Saving note..." : reviewing?"Confirm note save":"Review and save note"}
      </button>
      {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
      {saved ? <p role="status" className="text-sm text-body">Note saved. The timeline is refreshing.</p> : null}
    </section>
  );
}
