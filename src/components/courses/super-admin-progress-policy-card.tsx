"use client";
import { useState } from "react";
import { COURSE_PROGRESS_POLICY_CARDS } from "@/modules/courses/course-progress-policy";

type CardKey = keyof typeof COURSE_PROGRESS_POLICY_CARDS;

/** SA-academics-people-49: legacy "Progress policy" / "Video policy" card, platform-wide, no college selected. */
export function SuperAdminProgressPolicyCard({ card, storedValue, version, ready }: {
  card: CardKey; storedValue: number | null; version: number; ready: boolean;
}) {
  const spec = COURSE_PROGRESS_POLICY_CARDS[card];
  const [stored, setStored] = useState<number | null>(storedValue);
  const [currentVersion, setCurrentVersion] = useState(version);
  const [draft, setDraft] = useState(String(storedValue ?? spec.defaultValue));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const effective = stored ?? spec.defaultValue;
  const draftNumber = Number(draft);
  const valid = draft.trim() !== "" && Number.isInteger(draftNumber) && draftNumber >= spec.min && draftNumber <= spec.max;
  const dirty = valid && draftNumber !== effective;

  async function submit(value: string) {
    if (saving) return;
    setSaving(true); setError(null); setNotice(null);
    try {
      const response = await fetch("/api/admin/settings/overrides", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scopeType: "GLOBAL", changes: [{ key: spec.key, value, expectedVersion: currentVersion }] }),
      });
      const body = await response.json().catch(() => null) as { results?: { status: string; message: string; version?: number }[]; error?: string } | null;
      const result = body?.results?.[0];
      if (!response.ok || !result || result.status === "FAILED") throw new Error("failed");
      if (value === "") { setStored(null); setCurrentVersion(0); setDraft(String(spec.defaultValue)); }
      else { setStored(Number(value)); setCurrentVersion(result.version ?? currentVersion + 1); }
      setNotice(spec.label + " updated");
    } catch {
      setError("Failed to save " + spec.label);
    } finally { setSaving(false); }
  }

  return <section aria-label={spec.title} data-testid={card === "video" ? "video-policy-card" : "course-progress-policy-card"}
    className="space-y-3 rounded-xl border border-border bg-surface p-4">
    <h2 className="m-0 text-base font-semibold text-foreground">{spec.title}</h2>
    <p className="m-0 text-sm text-muted-foreground">{spec.scopeNote}</p>
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={"policy-" + card} className="text-sm font-semibold text-body">{spec.label}</label>
        <span className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground">
          {stored === null ? "Default (" + spec.defaultValue + spec.suffix + ")" : "Custom"}
        </span>
      </div>
      <p id={"policy-help-" + card} className="m-0 text-xs text-muted-foreground">{spec.help}</p>
      <div className="flex flex-wrap items-center gap-2">
        <input id={"policy-" + card} type="number" inputMode="numeric" min={spec.min} max={spec.max} step={1}
          value={draft} disabled={saving || !ready} aria-describedby={"policy-help-" + card}
          onChange={(event) => setDraft(event.target.value)}
          className="min-h-10 w-28 rounded-md border border-border bg-surface px-3 text-foreground" />
        <span className="text-sm text-muted-foreground">{spec.suffix}</span>
        <button type="button" disabled={!dirty || saving || !ready} onClick={() => void submit(String(draftNumber))}
          className="min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50">Save</button>
        {stored !== null ? <button type="button" disabled={saving || !ready} onClick={() => void submit("")}
          className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold disabled:opacity-50">Reset to default</button> : null}
      </div>
      {!ready ? <p role="alert" className="m-0 text-sm text-error">Platform settings storage is not ready.</p> : null}
      {!valid ? <p role="alert" className="m-0 text-xs text-error">Enter a whole number from {spec.min} to {spec.max}.</p> : null}
      {error ? <p role="alert" className="m-0 text-sm text-error">{error}</p> : null}
      {notice ? <p role="status" className="m-0 text-sm text-body">{notice}</p> : null}
    </div>
  </section>;
}
