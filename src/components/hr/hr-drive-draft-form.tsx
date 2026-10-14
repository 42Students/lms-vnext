"use client";

import { useState } from "react";
import type { HrDriveDraft } from "@/modules/placements/hr-drive-draft-model";
import { emptyHrDriveDraft, hrDriveDraftSchema } from "@/modules/placements/hr-drive-draft-model";

export function HrDriveDraftForm({
  initial,
  sourceJobTitle,
}: {
  initial: HrDriveDraft;
  sourceJobTitle: string | null;
}) {
  const [draft, setDraft] = useState<HrDriveDraft>(initial);
  const [showPreview, setShowPreview] = useState(false);
  const [notice, setNotice] = useState("");
  const result = hrDriveDraftSchema.safeParse(draft);
  const inputClass = "min-h-11 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground";
  const selectOptions = [
    ["FULL_TIME", "Full-time"], ["INTERNSHIP", "Internship"], ["CONTRACT", "Contract"],
  ] as const;
  const workModes = [
    ["ONSITE", "On-site"], ["HYBRID", "Hybrid"], ["REMOTE", "Remote"],
    ["NO_PREFERENCE", "No preference"],
  ] as const;
  const roundKinds = [
    "TALK", "TEST", "VENDOR_TEST", "GD", "INTERVIEW",
  ] as const;

  async function copyPreview() {
    if (!result.success) {
      setNotice("Complete the highlighted requirements before copying a draft.");
      return;
    }
    try {
      await navigator.clipboard.writeText(JSON.stringify(result.data, null, 2));
      setNotice("Validated draft copied to clipboard. It has not been submitted.");
    } catch {
      setNotice("Clipboard unavailable. Your draft has not been submitted.");
    }
  }

  return (
    <div className="space-y-6">
      {sourceJobTitle ? (
        <p className="rounded-md border border-border bg-surface-secondary p-3 text-sm text-body">
          Hire Again preview copied from: <strong>{sourceJobTitle}</strong>. Changes here do not update the existing drive.
        </p>
      ) : null}
      <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="font-semibold text-foreground">Role and work</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm text-body sm:col-span-2">
            Role title
            <input className={inputClass} value={draft.title} maxLength={200}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} />
          </label>
          <label className="grid gap-1 text-sm text-body sm:col-span-2">
            Job description
            <textarea className={inputClass} rows={5} value={draft.description} maxLength={5000}
              onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} />
          </label>
          <label className="grid gap-1 text-sm text-body">
            Location
            <input className={inputClass} value={draft.location} maxLength={180}
              onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))} />
          </label>
          <label className="grid gap-1 text-sm text-body">
            Employment type
            <select className={inputClass} value={draft.employmentType}
              onChange={(event) => setDraft((current) => ({ ...current, employmentType: event.target.value as HrDriveDraft["employmentType"] }))}>
              {selectOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm text-body">
            Work mode
            <select className={inputClass} value={draft.workMode}
              onChange={(event) => setDraft((current) => ({ ...current, workMode: event.target.value as HrDriveDraft["workMode"] }))}>
              {workModes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Job-description file uploads are unavailable until private storage and signed helpers are enabled.
        </p>
      </section>

      <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="font-semibold text-foreground">Compensation and eligibility</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {([
            ["minimumAnnualCtcInr", "Minimum annual CTC (₹)"],
            ["maximumAnnualCtcInr", "Maximum annual CTC (₹)"],
            ["fixedAnnualCtcInr", "Fixed annual CTC (₹)"],
            ["variableAnnualCtcInr", "Variable annual CTC (₹)"],
            ["bondMonths", "Bond months"],
            ["bondAmountInr", "Bond amount (₹)"],
            ["minimumCgpa", "Minimum CGPA (0–10)"],
            ["maximumActiveBacklogs", "Maximum active backlogs"],
          ] as const).map(([field, label]) => (
            <label key={field} className="grid gap-1 text-sm text-body">
              {label}
              <input className={inputClass} inputMode="decimal" value={draft[field]}
                onChange={(event) => setDraft((current) => ({ ...current, [field]: event.target.value }))} />
            </label>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          All compensation, bond and eligibility fields are local preview values. They are not submitted or saved.
        </p>
      </section>

      <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-foreground">Hiring rounds</h2>
          <button type="button" disabled={draft.rounds.length >= 12}
            className="min-h-10 rounded-md border border-border px-3 text-sm text-primary-text disabled:opacity-50"
            onClick={() => setDraft((current) => ({
              ...current, rounds: [...current.rounds, { kind: "INTERVIEW", name: "Interview" }],
            }))}>
            Add round
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {draft.rounds.map((round, index) => (
            <div key={index} className="grid min-w-0 gap-3 rounded-lg border border-border p-3 sm:grid-cols-[10rem_minmax(0,1fr)_auto]">
              <label className="grid gap-1 text-sm text-body">
                Kind
                <select className={inputClass} value={round.kind}
                  onChange={(event) => setDraft((current) => ({
                    ...current, rounds: current.rounds.map((item, i) => i === index
                      ? { ...item, kind: event.target.value as HrDriveDraft["rounds"][number]["kind"] } : item),
                  }))}>
                  {roundKinds.map((kind) => <option key={kind} value={kind}>{kind.replaceAll("_", " ")}</option>)}
                </select>
              </label>
              <label className="grid min-w-0 gap-1 text-sm text-body">
                Round name
                <input className={inputClass} maxLength={120} value={round.name}
                  onChange={(event) => setDraft((current) => ({
                    ...current, rounds: current.rounds.map((item, i) => i === index
                      ? { ...item, name: event.target.value } : item),
                  }))} />
              </label>
              <button type="button" disabled={draft.rounds.length <= 1}
                className="self-end rounded-md border border-border px-3 py-3 text-sm text-body disabled:opacity-50"
                onClick={() => setDraft((current) => ({
                  ...current, rounds: current.rounds.filter((_, i) => i !== index),
                }))}>Remove</button>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="font-semibold text-foreground">What students will see · local preview</h2>
        <p className="mt-1 text-sm text-body">
          This draft stays in this browser session and is not saved or sent for approval.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary"
            onClick={() => { setShowPreview(true); setNotice(""); }}>Preview and validate</button>
          <button type="button" disabled={!result.success}
            className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold text-primary-text disabled:opacity-50"
            onClick={() => void copyPreview()}>Copy validated draft</button>
          <button type="button" className="min-h-11 rounded-md border border-border px-4 text-sm text-body"
            onClick={() => { setDraft(emptyHrDriveDraft()); setShowPreview(false); setNotice(""); }}>Start over</button>
        </div>
        {showPreview && !result.success ? (
          <div role="alert" className="mt-4 rounded-md border border-border p-3 text-sm text-body">
            <strong>Review the draft:</strong>
            <ul className="mt-2 list-disc pl-5">
              {result.error.issues.map((issue, index) => (
                <li key={index}>{issue.path.join(".")}: {issue.message}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {showPreview && result.success ? (
          <div className="mt-4 space-y-2 rounded-md bg-surface-secondary p-4 text-sm text-body">
            <h3 className="text-base font-semibold text-foreground">{result.data.title}</h3>
            <p className="whitespace-pre-wrap">{result.data.description}</p>
            <p>{result.data.location} · {result.data.employmentType.replaceAll("_", " ")} · {result.data.workMode}</p>
            <p>{result.data.rounds.length} planned hiring rounds</p>
            <dl className="grid gap-2 sm:grid-cols-2">
              {([
                ["Minimum CTC", result.data.minimumAnnualCtcInr],
                ["Maximum CTC", result.data.maximumAnnualCtcInr],
                ["Fixed CTC", result.data.fixedAnnualCtcInr],
                ["Variable CTC", result.data.variableAnnualCtcInr],
                ["Bond months", result.data.bondMonths],
                ["Bond amount", result.data.bondAmountInr],
                ["Minimum CGPA", result.data.minimumCgpa],
                ["Maximum active backlogs", result.data.maximumActiveBacklogs],
              ] as const).map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="font-medium text-foreground">{value || "Not specified"}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}
        {notice ? <p role="status" className="mt-3 text-sm text-body">{notice}</p> : null}
        <p className="mt-3 text-xs text-muted-foreground">
          Send for Approval, Fix and Resend, file attachments and messaging remain unavailable until the registered request workflow is ready.
        </p>
      </section>
    </div>
  );
}
