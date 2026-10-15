"use client";

import { useState } from "react";
import type { HrDriveDraft } from "@/modules/placements/hr-drive-draft-model";
import { emptyHrDriveDraft, hrDriveDraftSchema } from "@/modules/placements/hr-drive-draft-model";
import {saveHrUnsentDraft,restoreHrUnsentDraft} from "@/modules/placements/hr-unsent-draft-storage-model";
import {HR_DRIVE_ROUND_PRESETS,applyHrRoundPreset} from "@/modules/placements/hr-drive-round-presets";
import {reorderHrDraftRound} from "@/modules/placements/hr-draft-round-order-model";
import {duplicateHrDraftRound} from "@/modules/placements/hr-draft-round-duplicate-model";
import {hrDraftContainsWork} from "@/modules/placements/hr-draft-reset-model";
import {hrDraftPreviewRounds} from "@/modules/placements/hr-draft-preview-model";
import {hrDraftCompensationWarnings} from "@/modules/placements/hr-draft-compensation-review-model";

const HR_DRAFT_PREVIEW_FIELDS=[
 ["minimumAnnualCtcInr","Minimum CTC"],
 ["maximumAnnualCtcInr","Maximum CTC"],
 ["fixedAnnualCtcInr","Fixed CTC"],
 ["variableAnnualCtcInr","Variable CTC"],
 ["bondMonths","Bond months"],
 ["bondAmountInr","Bond amount"],
 ["minimumCgpa","Minimum CGPA"],
 ["maximumActiveBacklogs","Maximum active backlogs"],
] as const;

export function HrDriveDraftForm({
  initial,
  sourceJobTitle,
  storageKey,
}: {
  initial: HrDriveDraft;
  sourceJobTitle: string | null;
  storageKey:string;
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

  function saveForThisTab(){
    const raw=saveHrUnsentDraft(draft,Date.now());
    if(!raw){setNotice("Validate the draft before saving it for this tab.");return;}
    try{window.sessionStorage.setItem(storageKey,raw);
      setNotice("Validated unsent draft saved for this browser tab (24-hour expiry).");}
    catch{setNotice("This browser cannot save a draft. Copy the preview instead.");}
  }
  function restoreFromThisTab(){
    try{
      const saved=restoreHrUnsentDraft(window.sessionStorage.getItem(storageKey),Date.now());
      if(!saved){setNotice("No valid, unexpired saved draft for this exact college and job.");return;}
      setDraft(saved);setShowPreview(false);
      setNotice("Restored local draft. It has not been submitted or sent.");}
    catch{setNotice("Unable to access saved drafts in this browser.");}
  }
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
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Choose hiring round preset">
          {HR_DRIVE_ROUND_PRESETS.map(preset=><button key={preset.id}
            type="button" className="min-h-10 rounded-md border border-border px-3 text-sm text-primary-text"
            onClick={()=>{setDraft(current=>applyHrRoundPreset(current,preset.id));setShowPreview(false);}}>
            {preset.label}
          </button>)}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Preset replaces the round list in this unsent draft only; edit each step afterward.</p>
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
              <div className="flex items-end gap-2">
                <button type="button" disabled={index===0} aria-label={"Move "+round.name+" earlier"}
                  className="min-h-11 rounded-md border border-border px-3 text-sm text-primary-text disabled:opacity-50"
                  onClick={()=>{setDraft(current=>reorderHrDraftRound(current,index,-1));setShowPreview(false);}}>↑</button>
                <button type="button" disabled={index===draft.rounds.length-1} aria-label={"Move "+round.name+" later"}
                  className="min-h-11 rounded-md border border-border px-3 text-sm text-primary-text disabled:opacity-50"
                  onClick={()=>{setDraft(current=>reorderHrDraftRound(current,index,1));setShowPreview(false);}}>↓</button>
              </div>
              <button type="button" disabled={draft.rounds.length>=12}
                aria-label={"Duplicate "+round.name}
                className="self-end rounded-md border border-border px-3 py-3 text-sm text-primary-text disabled:opacity-50"
                onClick={()=>{setDraft(current=>duplicateHrDraftRound(current,index));setShowPreview(false);}}>
                Duplicate
              </button>
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
          <button type="button" disabled={!result.success}
            className="min-h-11 rounded-md border border-border px-4 text-sm text-primary-text disabled:opacity-50"
            onClick={saveForThisTab}>Save validated draft in this tab</button>
          <button type="button" className="min-h-11 rounded-md border border-border px-4 text-sm text-primary-text"
            onClick={restoreFromThisTab}>Restore saved draft</button>
          <button type="button" className="min-h-11 rounded-md border border-border px-4 text-sm text-body"
            onClick={() => {
              if(hrDraftContainsWork(draft)&&!window.confirm("Discard all unsent draft changes and clear this tab's saved copy?"))return;
              try{window.sessionStorage.removeItem(storageKey);}catch{/* Storage may be disabled; reset form regardless. */}
              setDraft(emptyHrDriveDraft());setShowPreview(false);setNotice("Cleared this tab’s saved draft.");
            }}>Start over</button>
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
            <h4 className="font-semibold text-foreground">Planned hiring process</h4>
            <ol className="list-inside list-decimal space-y-1">
              {hrDraftPreviewRounds(result.data).map(step=>(
                <li key={step.order}>
                  <span className="font-medium text-foreground">{step.name}</span>
                  {" · "+step.kind.replaceAll("_"," ")}
                </li>
              ))}
            </ol>
            <h4 className="pt-3 font-semibold text-foreground">Compensation & eligibility</h4>
            <dl className="grid gap-2 sm:grid-cols-2">
              {HR_DRAFT_PREVIEW_FIELDS.map(([field,label])=>(
                <div key={field}>
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="font-medium text-foreground">{result.data[field]||"Not specified"}</dd>
                </div>
              ))}
            </dl>
            {hrDraftCompensationWarnings(result.data).length>0?
              <div role="status" className="rounded-md border border-border bg-surface p-3 text-sm">
                <h5 className="font-semibold text-foreground">Compensation details to review</h5>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {hrDraftCompensationWarnings(result.data).map(note=><li key={note}>{note}</li>)}
                </ul>
                <p className="mt-2 text-xs text-muted-foreground">Review notices do not save or submit this draft.</p>
              </div>:null}
            <p className="text-xs text-muted-foreground">
              Preview only. Actual student presentation is controlled by the placement cell after approval.
            </p>
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
