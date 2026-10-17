"use client";

import { useEffect, useRef, useState } from "react";
import {nextHrProposalAttempt} from "@/modules/placements/hr-drive-proposal-attempt-model";
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
 ["ctcLpa","CTC (LPA)"],
 ["fixedLpa","Fixed (LPA)"],
 ["variableLpa","Variable (LPA)"],
 ["stipendMonthlyInr","Stipend per month (₹)"],
 ["maximumActiveBacklogs","Maximum active backlogs"],
 ["passingYear","Passing year"],
] as const;

export function HrDriveDraftForm({
  initial,
  branchSuggestions,
  sourceJobTitle,
  storageKey,
  collegeId,
  sourceJobId,
  fixRequestId=null,
  fixUpdatedAt=null,
  editMode="RESUBMIT",
}: {
  initial: HrDriveDraft;
  branchSuggestions:readonly string[];
  sourceJobTitle: string | null;
  storageKey:string;
  collegeId:string;
  sourceJobId:string|null;
  fixRequestId?:string|null;
  fixUpdatedAt?:string|null;
  editMode?:"EDIT"|"RESUBMIT";
}) {
  const [draft, setDraft] = useState<HrDriveDraft>(initial);
  const [showPreview, setShowPreview] = useState(false);
  const [notice, setNotice] = useState("");
  const [submitting,setSubmitting] = useState(false);
  const attempted = useRef<{signature:string;submissionId:string}|null>(null);
  const submittedRef=useRef(false);
  const result = hrDriveDraftSchema.safeParse(draft);
  const inputClass = "min-h-11 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground";
  const selectOptions = [
    ["FULL_TIME", "Full-time"], ["INTERNSHIP", "Internship"], ["INTERNSHIP_FULL_TIME", "Internship + full-time"], ["CONTRACT", "Contract"],
  ] as const;
  const workModes = [
    ["ONSITE", "On-site"], ["HYBRID", "Hybrid"], ["REMOTE", "Remote"],
    ["NO_PREFERENCE", "No preference"],
  ] as const;
  const roundKinds = [
    "TALK", "TEST", "VENDOR_TEST", "GD", "INTERVIEW",
  ] as const;

  useEffect(()=>{
    if(fixRequestId||sourceJobId)return;
    try{
      const saved=restoreHrUnsentDraft(window.localStorage.getItem(storageKey),Date.now());
      if(!saved)return;
      // Adopt only a matching college/user browser draft. Never overwrite an edit/resubmit.
      queueMicrotask(()=>{setDraft(saved);setNotice("We restored your unsent draft");});
    }catch{/* Browser storage unavailable */ }
  },[storageKey,fixRequestId,sourceJobId]);

  // REC-home-drives-29: scope the draft to this signed-in user and college.
  useEffect(()=>{
    if(fixRequestId)return;
    const persist=()=>{
      if(submittedRef.current)return;
      const saved=saveHrUnsentDraft(draft,Date.now());
      if(!saved)return;
      try{window.localStorage.setItem(storageKey,saved);}catch{/* Storage disabled */ }
    };
    const timer=window.setTimeout(persist,600);
    const onVisibility=()=>{if(document.visibilityState==="hidden")persist();};
    window.addEventListener("pagehide",persist);
    document.addEventListener("visibilitychange",onVisibility);
    return ()=>{
      window.clearTimeout(timer);
      window.removeEventListener("pagehide",persist);
      document.removeEventListener("visibilitychange",onVisibility);
    };
  },[draft,storageKey,fixRequestId]);

  function saveForThisTab(){
    const raw=saveHrUnsentDraft(draft,Date.now());
    if(!raw){setNotice("Validate the draft before saving it for this tab.");return;}
    try{window.sessionStorage.setItem(storageKey,raw);window.localStorage.setItem(storageKey,raw);
      setNotice("Validated unsent draft saved for this browser tab (24-hour expiry).");}
    catch{setNotice("This browser cannot save a draft. Copy the preview instead.");}
  }
  function restoreFromThisTab(){
    try{
      const saved=restoreHrUnsentDraft(window.localStorage.getItem(storageKey)??window.sessionStorage.getItem(storageKey),Date.now());
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

  async function sendFormalDriveRequest(){
    if(submitting)return;
    const valid=hrDriveDraftSchema.safeParse(draft);
    if(!valid.success){
      setShowPreview(true);
      setNotice("Complete the draft requirements before sending for review.");
      return;
    }
    const signature=JSON.stringify([collegeId,sourceJobId,valid.data,fixRequestId]);
    const next=nextHrProposalAttempt(attempted.current,signature,()=>crypto.randomUUID());
    attempted.current=next;
    setSubmitting(true);
    setNotice(fixRequestId?(editMode==="EDIT"?"Saving changes...":"Resubmitting your updated request..."):"Sending to the placement cell for review...");
    try{
      const response=await fetch("/api/placements/recruiter/drives/requests",{
        method:fixRequestId?"PATCH":"POST",
        credentials:"same-origin",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(fixRequestId?{
          requestId:fixRequestId,collegeId,action:editMode,
          expectedUpdatedAt:fixUpdatedAt,draft:valid.data,
        }:{
          collegeId,sourceJobId:sourceJobId??undefined,
          submissionId:next.submissionId,draft:valid.data,
        }),
      });
      const raw:unknown=await response.json().catch(()=>null);
      if(!response.ok){
        const code=raw&&typeof raw==="object"&&"error" in raw
          ? String((raw as {error:unknown}).error):"REQUEST_FAILED";
        setNotice(code==="FORBIDDEN"?"Your access to this college has ended. Ask the placement cell to restore it.":
          code==="STALE"||code==="INVALID_STATE"?
          "This request has changed. Refresh Drives before trying again.":
          code==="STORAGE_NOT_READY"?"Requests are temporarily unavailable. Your draft was not sent.":
          "Your request was not sent. Please try again. ("+code+")");
        return;
      }
      if(!raw||typeof raw!=="object"||!("request" in raw)||
         typeof (raw as {request?:{id?:unknown}}).request?.id!=="string"){
        setNotice("Could not verify the saved request. Check Drives before retrying.");
        return;
      }
      submittedRef.current=true;
      // REC-home-drives-29: a submitted request is no longer an unsent local draft.
      try{window.localStorage.removeItem(storageKey);window.sessionStorage.removeItem(storageKey);}
      catch{/* Successful server submit must not depend on browser storage. */ }
      window.location.assign("/hr/drives?collegeId="+encodeURIComponent(collegeId)+"&view=WAITING");
    }catch{
      setNotice("Request status could not be confirmed. Your draft is preserved; check Drives before resending.");
    }finally{
      setSubmitting(false);
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
            Mode
            <select className={inputClass} value={draft.driveMode??"ON_CAMPUS"}
              onChange={event=>setDraft(current=>({...current,driveMode:event.target.value as "ON_CAMPUS"|"OFF_CAMPUS"}))}>
              <option value="ON_CAMPUS">On campus</option>
              <option value="OFF_CAMPUS">Off campus (students apply on your site)</option>
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
          <label className="grid gap-1 text-sm text-body">
            CTC (LPA){draft.employmentType==="INTERNSHIP"?" after the internship (optional)":""}
            <input className={inputClass} inputMode="decimal" value={draft.ctcLpa??""}
              onChange={event=>setDraft(current=>({...current,ctcLpa:event.target.value}))}/>
          </label>
          <label className="grid gap-1 text-sm text-body">
            Fixed (optional, LPA)
            <input className={inputClass} inputMode="decimal" value={draft.fixedLpa??""}
              onChange={event=>setDraft(current=>({...current,fixedLpa:event.target.value}))}/>
          </label>
          <label className="grid gap-1 text-sm text-body">
            Variable (optional, LPA)
            <input className={inputClass} inputMode="decimal" value={draft.variableLpa??""}
              onChange={event=>setDraft(current=>({...current,variableLpa:event.target.value}))}/>
          </label>
          {draft.employmentType!=="FULL_TIME"&&draft.employmentType!=="CONTRACT"?<label className="grid gap-1 text-sm text-body">
            Stipend per month (₹)
            <input className={inputClass} inputMode="numeric" value={draft.stipendMonthlyInr??""}
              onChange={event=>setDraft(current=>({...current,stipendMonthlyInr:event.target.value}))}/>
          </label>:null}
        </div>
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
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm text-body">
            Branches
            <input className={inputClass} list="recruiter-eligible-branches"
              value={(draft.branches??[]).join(", ")} placeholder="e.g. CSE, ECE, Mechanical"
              onChange={event=>setDraft(current=>({...current,
                branches:event.target.value.split(",").map(value=>value.trim()).filter(Boolean)}))}/>
            <datalist id="recruiter-eligible-branches">
              {branchSuggestions.map(name=><option key={name} value={name}/>)}
            </datalist>
            <span className="text-xs text-muted-foreground">Separate multiple college branches with commas. The placement cell verifies the final eligibility.</span>
          </label>
          <label className="grid gap-1 text-sm text-body">
            Passing year
            <input className={inputClass} inputMode="numeric" maxLength={4}
              value={draft.passingYear??""} placeholder="YYYY"
              onChange={event=>setDraft(current=>({...current,passingYear:event.target.value}))}/>
          </label>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Compensation and eligibility values are submitted as part of the formal request; the placement cell decides whether to approve.
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
          Your draft is local until you send it to the placement cell. A sent request waits for their decision and is not automatically published.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary"
            onClick={() => { setShowPreview(true); setNotice(""); }}>Preview and validate</button>
          <button type="button" disabled={!result.success||submitting}
            aria-busy={submitting}
            className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold text-primary-text disabled:opacity-50"
            onClick={() => void sendFormalDriveRequest()}>
            {submitting?"Sending request...":fixRequestId?(editMode==="EDIT"?"Save changes":"Fix and Resend"):"Send for review"}
          </button>
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
              try{window.sessionStorage.removeItem(storageKey);window.localStorage.removeItem(storageKey);}catch{/* Storage may be disabled; reset form regardless. */}
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
        {/* Live locally held student-facing draft preview; never imply publication. */}
          <div className="mt-4 space-y-2 rounded-md bg-surface-secondary p-4 text-sm text-body">
            <h3 className="text-base font-semibold text-foreground">{draft.title.trim()||"Role title"}</h3>
            <p className="whitespace-pre-wrap">{draft.description||"Add a job description to see it here."}</p>
            <p>{draft.location} · {draft.employmentType.replaceAll("_", " ")} · {draft.driveMode==="OFF_CAMPUS"?"Off campus":"On campus"} · {draft.workMode}</p>
            <h4 className="font-semibold text-foreground">Planned hiring process</h4>
            <ol className="list-inside list-decimal space-y-1">
              {hrDraftPreviewRounds(draft).map(step=>(
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
                  <dd className="font-medium text-foreground">{draft[field]||"Not specified"}</dd>
                </div>
              ))}
            </dl>
            {hrDraftCompensationWarnings(draft).length>0?
              <div role="status" className="rounded-md border border-border bg-surface p-3 text-sm">
                <h5 className="font-semibold text-foreground">Compensation details to review</h5>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {hrDraftCompensationWarnings(draft).map(note=><li key={note}>{note}</li>)}
                </ul>
                <p className="mt-2 text-xs text-muted-foreground">Review notices do not save or submit this draft.</p>
              </div>:null}
            <p className="text-xs text-muted-foreground">
              Live preview of your unsent request. The college decides what students see after approval.
            </p>
          </div>
        {notice ? <p role="status" className="mt-3 text-sm text-body">{notice}</p> : null}
        <p className="mt-3 text-xs text-muted-foreground">
          Formal requests are persisted for placement-cell review. Job-description file uploads and automatic publication are not available here.
        </p>
      </section>
    </div>
  );
}
