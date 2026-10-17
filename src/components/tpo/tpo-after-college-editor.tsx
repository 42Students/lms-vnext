"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  afterCollegeOptions,AFTER_COLLEGE_LABELS,MANUAL_AFTER_COLLEGE_OUTCOMES, type AfterCollegeOutcome,
} from "@/modules/placements/tpo-after-college-model";

export function TpoAfterCollegeEditor({
  membershipId, learnerName, initial, available,
}: {
  membershipId: string;
  learnerName: string;
  initial: { outcome: AfterCollegeOutcome; expectedVersion: string };
  available: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(initial.outcome);
  const [draft, setDraft] = useState<AfterCollegeOutcome>(initial.outcome);
  const [version, setVersion] = useState(initial.expectedVersion);
  const [undo, setUndo] = useState<AfterCollegeOutcome | null>(null);
  const [message, setMessage] = useState("");

  function write(outcome: AfterCollegeOutcome, reversing = false) {
    if (!available || pending || (outcome === saved && !reversing)) return;
    if (!window.confirm((reversing ? "Restore" : "Save") + " after-college outcome for " + learnerName + "?")) return;
    start(async () => {
      setMessage("");
      try {
        const response = await fetch(
          "/api/placements/tpo/students/" + encodeURIComponent(membershipId) + "/after-college",
          {
            method: "PUT",
            headers: { "content-type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({ outcome, expectedVersion: version }),
          },
        );
        const data: { version?: string; error?: string } | null = await response.json().catch(() => null);
        if (!response.ok) throw new Error(
          response.status === 409
            ? "Another update was saved. Refresh this roster before trying again."
            : data?.error ?? "Could not save outcome.",
        );
        const previous = saved;
        setSaved(outcome);
        setDraft(outcome);
        setVersion(data?.version ?? version);
        setUndo(reversing ? null : previous);
        setMessage(reversing ? "Previous outcome restored." : "After-college outcome saved.");
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not save outcome.");
      }
    });
  }

  return <div className="min-w-40 space-y-2" aria-label={"After college for " + learnerName}>
    <label className="grid gap-1 text-xs font-medium">
      After college
      <select value={draft} disabled={!available || pending}
        onChange={event => setDraft(event.target.value as AfterCollegeOutcome)}
        className="min-h-10 rounded border border-border bg-surface px-2 text-xs">
        {!MANUAL_AFTER_COLLEGE_OUTCOMES.includes(draft)?<option value={draft} disabled>{AFTER_COLLEGE_LABELS[draft]} · Automatic</option>:null}
        {afterCollegeOptions().map(option => <option value={option.value} key={option.value}>
          {option.label}
        </option>)}
      </select>
    </label>
    {["ENTREPRENEURSHIP","COMPETITIVE_EXAMS"].includes(draft)?<p className="text-xs text-muted-foreground">Additional destination details are not yet stored; verify these with the learner before saving.</p>:null}
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={!available || pending || draft === saved}
        className="min-h-9 rounded border border-border px-2 text-xs font-semibold disabled:opacity-50"
        onClick={() => write(draft)}>Save</button>
      {undo !== null && undo !== saved ? <button type="button" disabled={pending}
        className="min-h-9 rounded border border-border px-2 text-xs disabled:opacity-50"
        onClick={() => write(undo, true)}>Undo</button> : null}
    </div>
    {!available ? <p className="text-xs text-muted-foreground">Outcome storage unavailable.</p> : null}
    {message ? <p role="status" className="text-xs">{message}</p> : null}
  </div>;
}
