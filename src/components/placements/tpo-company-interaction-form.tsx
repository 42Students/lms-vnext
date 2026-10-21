"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  interactionConfirmationSummary,
  type TpoCompanyInteractionKind,
} from "@/modules/placements/tpo-company-interaction-model";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Button} from "@/components/ui/button";
import {InlineNotice} from "@/components/ui/inline-notice";

export function TpoCompanyInteractionForm({
  companyId,
  contacts,
}: {
  companyId: string;
  contacts: readonly { id: string; name: string; updatedAtIso: string }[];
}) {
  const router = useRouter();
  const [leadId, setLeadId] = useState(contacts[0]?.id ?? "");
  const [type, setType] = useState<TpoCompanyInteractionKind>("CALL");
  const [outcome, setOutcome] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [reviewing,setReviewing]=useState(false);

  async function submit() {
    if (busy) return;
    const chosen = contacts.find((contact) => contact.id === leadId);
    if (!chosen || note.trim().length < 3 || note.trim().length > 2000 ||
      (outcome.trim().length > 0 && (outcome.trim().length < 2 || outcome.trim().length > 30))) {
      setError("Choose a linked contact and enter 3–2000 note characters. Outcome must be 2–30 characters if supplied.");
      return;
    }
    if(!reviewing){setReviewing(true);setError(null);return;}

    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const response = await fetch(
        "/api/placements/tpo/companies/" +
          encodeURIComponent(companyId) + "/contact-log",
        {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            confirmed: true,
            leadId: chosen.id,
            expectedLeadUpdatedAt: chosen.updatedAtIso,
            type,
            outcome: outcome.trim() || null,
            note: note.trim(),
          }),
        },
      );
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          { error?: string } | null;
        throw new Error(payload?.error === "TPO_COMPANY_INTERACTION_STALE"
          ? "Contact changed since the page loaded. Refresh and review before retrying."
          : "Could not confirm the saved activity. Refresh before retrying to avoid duplicates.");
      }
      setNote("");
      setOutcome("");
      setSaved(true);setReviewing(false);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not record activity.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="min-w-0 space-y-3 border-b border-[var(--lms-canvas-border)] pb-4">
      <h2 className="font-semibold text-[var(--lms-heading)] text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px]">Record a contact interaction</h2>
      <p className="text-sm text-body leading-[22px]">
        This records an internal CRM event, not a delivered call, email or message.
        All entries are permanent, actor-attributed history. No contact stage changes.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
          Contact
          <Select value={leadId} onChange={(event) => {setReviewing(false);setLeadId(event.target.value);}}
            disabled={busy}
            className="mt-1 block w-full">
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>{contact.name}</option>
            ))}
          </Select>
        </label>
        <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
          Interaction type
          <Select value={type}
            onChange={(event) => {setReviewing(false);setType(event.target.value as TpoCompanyInteractionKind);}}
            disabled={busy}
            className="mt-1 block w-full">
            {(["CALL", "EMAIL", "WHATSAPP", "MEETING", "NOTE"] as const).map((kind) => (
              <option key={kind} value={kind}>{kind}</option>
            ))}
          </Select>
        </label>
      </div>
      <label className="block font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
        Outcome (optional)
        <Input value={outcome} onChange={(event) => {setReviewing(false);setOutcome(event.target.value);}}
          maxLength={30} disabled={busy}
          className="mt-1 block w-full" />
      </label>
      <label className="block font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
        Notes (required)
        <Textarea value={note} onChange={(event) => {setReviewing(false);setNote(event.target.value);}}
          maxLength={2000} rows={3} disabled={busy}
          className="mt-1 block w-full" />
      </label>
      {reviewing?<div role="group" aria-label="Review company interaction" className="border-t border-[var(--lms-canvas-border)] pt-3 text-sm">
        <p>{interactionConfirmationSummary({type,contactName:contacts.find(c=>c.id===leadId)?.name??"contact"})}</p>
        <Button type="button" variant="link" className="mt-2 min-h-11 max-[767px]:min-h-11" onClick={()=>setReviewing(false)}>Cancel review</Button>
      </div>:null}
      <Button type="button" onClick={() => void submit()} disabled={busy || !leadId || note.trim().length < 3}
        className="w-full sm:w-auto">
        {busy ? "Recording..." : reviewing?"Confirm activity":"Review and confirm activity"}
      </Button>
      {error ? <InlineNotice tone="error" message={error}/> : null}
      {saved ? <InlineNotice tone="success" message="Activity recorded. The page is refreshing."/> : null}
    </section>
  );
}
