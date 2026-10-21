"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { recruiterSelectionRangeWarning } from "@/modules/placements/recruiter-selection-list-model";

type Candidate = { applicationId: string; name: string };

/** The legacy selection composer remains available as a reviewed draft.
 * Until the proposal table is registered, copying does not send or issue offers.
 * The placement cell remains the authority for verifying and releasing selections.
 */
export function HrSelectionProposalComposer({
  jobTitle,
  candidates,
  minAnnualCtcInr,
  maxAnnualCtcInr,
}: {
  jobTitle: string;
  candidates: readonly Candidate[];
  minAnnualCtcInr: number | null;
  maxAnnualCtcInr: number | null;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [kind, setKind] = useState<"OFFER" | "LETTER_OF_INTENT">("OFFER");
  const [ctcLpa, setCtcLpa] = useState("");
  const [packageDescription, setPackageDescription] = useState("");
  const [warningAccepted, setWarningAccepted] = useState(false);
  const [status, setStatus] = useState("");
  const [showManualCopy, setShowManualCopy] = useState(false);
  const warning = recruiterSelectionRangeWarning(ctcLpa, minAnnualCtcInr, maxAnnualCtcInr);
  const validCtc = ctcLpa.trim() !== "" && /^\d{1,3}(?:\.\d{1,2})?$/.test(ctcLpa) &&
    Number(ctcLpa) > 0;
  const selected = candidates.filter(candidate => selectedIds.includes(candidate.applicationId));
  const proposal = [
    "Recruiter selection proposal (DRAFT — not sent)",
    "Drive: " + jobTitle,
    "Type: " + (kind === "OFFER" ? "Offer" : "Letter of intent"),
    "CTC: " + ctcLpa + " LPA",
    "Candidates (" + selected.length + "):",
    ...selected.map((candidate, index) =>
      (index + 1) + ". " + candidate.name + " (" + candidate.applicationId + ")"),
    "Package details: " + (packageDescription.trim() || "Not specified"),
    "Placement-cell verification and formal release required.",
  ].join("\n");
  function toggle(id: string, checked: boolean) {
    setSelectedIds(previous => checked ? [...previous.filter(value => value !== id), id] :
      previous.filter(value => value !== id));
    setStatus("");
  }
  async function copyProposal() {
    if (!selected.length || !validCtc || (warning && !warningAccepted)) {
      setStatus("Choose eligible applicants, enter a valid CTC and confirm any package warning.");
      return;
    }
    try {
      await navigator.clipboard.writeText(proposal);
      setStatus("Draft copied. Share it through your authorized placement-cell conversation; nothing has been sent automatically.");
      setShowManualCopy(false);
    } catch {
      setStatus("Automatic copying is unavailable. Select and copy the draft below manually.");
      setShowManualCopy(true);
    }
  }
  return (
    <details className="min-w-0 border-b border-border pb-4">
      <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)]">
        Prepare selection list
      </summary>
      <div className="mt-3 space-y-4">
        <p className="text-sm text-body">
          Only applicants with applied passing results in all completed evaluative rounds
          on the current authorized page can be added. This prepares a copyable draft,
          not an official submission. The placement cell must verify selections.
        </p>
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">Eligible applicants</legend>
          {candidates.length ? candidates.map(candidate => (
            <label key={candidate.applicationId} className="flex min-h-11 items-center gap-3 border-b border-border py-2 text-sm">
              <input type="checkbox" className="size-4 accent-[var(--lms-primary)]"
                checked={selectedIds.includes(candidate.applicationId)}
                onChange={event => toggle(candidate.applicationId, event.target.checked)} />
              <span className="min-w-0 break-words">{candidate.name || "Candidate"}</span>
            </label>
          )) : <p className="text-sm text-muted-foreground">
            No applicants on this page meet the selection readiness checks.
          </p>}
        </fieldset>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-semibold">Selection type
            <Select value={kind} onChange={event =>
              setKind(event.target.value as "OFFER" | "LETTER_OF_INTENT")}>
              <option value="OFFER">Offer</option>
              <option value="LETTER_OF_INTENT">Letter of intent</option>
            </Select>
          </label>
          <label className="grid gap-1 text-sm font-semibold">CTC (LPA)
            <Input type="number" min="0.01" max="999.99" step="0.01"
              value={ctcLpa} onChange={event => {
                setCtcLpa(event.target.value); setWarningAccepted(false); setStatus("");
              }} placeholder="e.g. 6.50" />
          </label>
        </div>
        <label className="grid gap-1 text-sm font-semibold">Package details (optional)
          <Textarea rows={3} maxLength={500} value={packageDescription}
            onChange={event => setPackageDescription(event.target.value)} />
        </label>
        {warning ? <label className="flex items-start gap-2 text-sm text-body">
          <input type="checkbox" checked={warningAccepted}
            onChange={event => setWarningAccepted(event.target.checked)} />
          <span>{warning} I have checked the amount.</span>
        </label> : null}
        <Button type="button" variant="secondary"
          disabled={!selected.length || !validCtc || Boolean(warning && !warningAccepted)}
          onClick={() => void copyProposal()}>Copy selection draft</Button>
        {status ? <p role="status" aria-live="polite" className="text-sm text-body">{status}</p> : null}
        {showManualCopy ? <label className="grid gap-1 text-sm font-semibold">
          Selection draft for manual copy
          <Textarea rows={9} readOnly value={proposal} />
        </label> : null}
      </div>
    </details>
  );
}
