"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { useEffect, useRef, useState } from "react";
import {useRouter} from "next/navigation";
import {ConfirmActionDialog} from "@/components/ui/confirm-action-dialog";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {Button} from "@/components/ui/button";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
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
  feedbackKey,
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
  feedbackKey:string;
  collegeId:string;
  sourceJobId:string|null;
  fixRequestId?:string|null;
  fixUpdatedAt?:string|null;
  editMode?:"EDIT"|"RESUBMIT";
}) {
  const [draft, setDraft] = useState<HrDriveDraft>(initial);
  const [branchInput,setBranchInput]=useState((initial.branches??[]).join(", "));
  const [showPreview, setShowPreview] = useState(false);
  const [notice, setNotice] = useState("");
  const [pendingLeave,setPendingLeave]=useState<string|null>(null);
   const [draftDecision,setDraftDecision]=useState<"RESTORE"|"CLEAR"|null>(null);
  const router=useRouter();
  const [savedRequestId,setSavedRequestId]=useState<string|null>(null);
  const [submitting,setSubmitting] = useState(false);
  const attempted = useRef<{signature:string;submissionId:string}|null>(null);
  const submittedRef=useRef(false);
  const submittingRef=useRef(false);
  const result = hrDriveDraftSchema.safeParse(draft);
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
      const saved=(restoreHrUnsentDraft(window.localStorage.getItem(storageKey),Date.now())??restoreHrUnsentDraft(window.sessionStorage.getItem(storageKey),Date.now()));
      if(!saved)return;
      // Adopt only a matching college/user browser draft. Never overwrite an edit/resubmit.
      queueMicrotask(()=>{setDraft(saved);setBranchInput((saved.branches??[]).join(", "));setNotice("We restored your unsent draft");});
    }catch{/* Browser storage unavailable */ }
  },[storageKey,fixRequestId,sourceJobId]);

  // REC-home-drives-32: the browser cannot quietly throw away an active
  // edit or Hire Again draft. Unsubmitted data stays on this device.
  useEffect(()=>{
    if(submittedRef.current||
       !hrDraftContainsWork(draft)||JSON.stringify(draft)===JSON.stringify(initial))return;
    const beforeUnload=(event:BeforeUnloadEvent)=>{
      event.preventDefault();
      event.returnValue="";
    };
    const linkGuard=(event:MouseEvent)=>{
      const target=event.target instanceof Element?event.target.closest("a[href]"):null;
      if(!target||event.defaultPrevented||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return;
      const href=target.getAttribute("href");
      if(!href||href.startsWith("#"))return;
      try{
        const destination=new URL(href,window.location.href);
        if(destination.origin!==window.location.origin)return;
        if(destination.pathname===window.location.pathname&&destination.search===window.location.search)return;
        event.preventDefault();event.stopPropagation();
        setPendingLeave(destination.pathname+destination.search+destination.hash);
      }catch{/* Malformed navigation is handled by the browser. */}
    };
    window.addEventListener("beforeunload",beforeUnload);
    document.addEventListener("click",linkGuard,true);
    return ()=>{window.removeEventListener("beforeunload",beforeUnload);document.removeEventListener("click",linkGuard,true);};
  },[draft,initial,fixRequestId,sourceJobId]);

  // REC-home-drives-29: scope the draft to this signed-in user and college.
  useEffect(()=>{
    if(fixRequestId)return;
    const persist=()=>{
      if(submittedRef.current)return;
      const saved=saveHrUnsentDraft(draft,Date.now());
      if(!saved)return;
      try{window.localStorage.setItem(storageKey,saved);}catch{try{window.sessionStorage.setItem(storageKey,saved);}catch{/* Disabled */}}
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
    if(!hrDraftContainsWork(draft)){setNotice("Enter some details before saving a draft.");return;}
    const raw=saveHrUnsentDraft(draft,Date.now());
    if(!raw){setNotice("This draft is too large to save on this device. Shorten long fields before saving.");return;}
    try{window.sessionStorage.setItem(storageKey,raw);window.localStorage.setItem(storageKey,raw);
      setNotice("Unsent draft saved on this device, even if some fields are unfinished (24-hour expiry).");}
    catch{setNotice("This browser cannot save a draft. Copy the preview instead.");}
  }
  function restoreFromThisTab(confirmed=false){
    try{
      const saved=(restoreHrUnsentDraft(window.localStorage.getItem(storageKey),Date.now())??restoreHrUnsentDraft(window.sessionStorage.getItem(storageKey),Date.now()));
      if(!saved){setNotice("No unexpired saved draft for this college and job was found.");return;}
      if(hrDraftContainsWork(draft)&&JSON.stringify(draft)!==JSON.stringify(saved)&&!confirmed){setDraftDecision("RESTORE");return;}
      setDraft(saved);setBranchInput((saved.branches??[]).join(", "));setShowPreview(false);
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
    if(submitting||submittingRef.current||submittedRef.current)return;
    const valid=hrDriveDraftSchema.safeParse(draft);
    if(!valid.success){
      setShowPreview(true);
      setNotice("Complete the draft requirements before sending for review.");
      return;
    }
    const signature=JSON.stringify([collegeId,sourceJobId,valid.data,fixRequestId]);
    const next=nextHrProposalAttempt(attempted.current,signature,()=>crypto.randomUUID());
    attempted.current=next;
    submittingRef.current=true;
    setSubmitting(true);
    setNotice(fixRequestId?(editMode==="EDIT"?"Saving changes...":"Resubmitting your updated request..."):"Sending to the placement cell for review...");
    try{
      const raw:unknown=await apiFetch("/api/placements/recruiter/drives/requests",{
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
      if(!raw||typeof raw!=="object"||!("request" in raw)||
         typeof (raw as {request?:{id?:unknown}}).request?.id!=="string"){
        setNotice("Could not verify the saved request. Check Drives before retrying.");
        return;
      }
      submittedRef.current=true;
      try{
        window.sessionStorage.setItem(feedbackKey,fixRequestId
          ? editMode==="EDIT"?"Saved. The placement cell sees the new version.":"Request resent to the placement cell."
          : "Sent to the placement cell for review");
      }catch{/* A verified save must not depend on flash storage. */}
      // REC-home-drives-29: a submitted request is no longer an unsent local draft.
      try{window.localStorage.removeItem(storageKey);window.sessionStorage.removeItem(storageKey);}
      catch{/* Successful server submit must not depend on browser storage. */ }
      setSavedRequestId((raw as {request:{id:string}}).request.id);
    }catch(error){
      if(error instanceof FriendlyFetchError && (error.code==="STALE"||error.code==="INVALID_STATE")){
        setNotice("This request has changed. Refresh Drives before trying again.");
      }else if(error instanceof FriendlyFetchError && error.status===403){
        setNotice("Your access to this college has ended. Ask the placement cell to restore it.");
      }else if(error instanceof FriendlyFetchError && error.status>=400 && error.status<500){
        setNotice(error.message);
      }else{
        setNotice("Request status could not be confirmed. Your draft is preserved; check Drives before resending.");
      }
    }finally{
      submittingRef.current=false;
      setSubmitting(false);
    }
  }

  if(savedRequestId) return <section role="status" className="space-y-4 rounded-[var(--lms-radius-card)] border border-border bg-surface p-6">
    <h2 className="text-lg font-semibold text-foreground">Sent to the placement cell for review</h2>
    <p className="text-sm text-body">Your request was saved. The placement cell will review and set the dates before it can open to students.</p>
    <div className="flex flex-wrap gap-3">
      <a href={"/hr/drives?collegeId="+encodeURIComponent(collegeId)+"&view=WAITING"}
        className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-medium text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Open the request</a>
      <a href={"/hr/drives?collegeId="+encodeURIComponent(collegeId)}
        className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-medium text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Go to Drives</a>
      <a href={"/hr/drives/new?collegeId="+encodeURIComponent(collegeId)}
        className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-medium text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Request another</a>
    </div>
  </section>;

  return (
    <div className="space-y-6">
      <ConfirmActionDialog open={pendingLeave!==null}
       title="Discard this drive draft?" consequence="Leave without these changes?"
       confirmLabel="Discard" onCancel={()=>setPendingLeave(null)}
       onConfirm={()=>{
        const href=pendingLeave;setPendingLeave(null);
        submittedRef.current=true;
        if(href)router.push(href);
       }}/>
      <ConfirmDialog open={draftDecision!==null} onOpenChange={open=>{if(!open)setDraftDecision(null);}}
         title={draftDecision==="RESTORE"?"Replace your current unsent changes with the draft saved on this device?":"Discard all unsent draft changes and clear this tab's saved copy?"}
         confirmLabel={draftDecision==="RESTORE"?"Restore saved draft":"Start over"}
         confirmVariant="danger" onConfirm={()=>{
           const decision=draftDecision;setDraftDecision(null);
           if(decision==="RESTORE")restoreFromThisTab(true);
           else if(decision==="CLEAR"){
             try{window.sessionStorage.removeItem(storageKey);window.localStorage.removeItem(storageKey);}catch{}
             setDraft(emptyHrDriveDraft());setBranchInput("");setShowPreview(false);setNotice("Cleared this tab’s saved draft.");
           }
         }}/>
       {sourceJobTitle ? (
        <p className="rounded-[var(--lms-control-radius)] border border-border bg-surface-secondary p-3 text-sm text-body">
          Hire again · copied from: <strong>{sourceJobTitle}</strong>. Changes here do not update the existing drive.
        </p>
      ) : null}
      <section className="border-b border-border pb-5">
        <h2 className="font-semibold text-foreground">Role and work</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm text-body sm:col-span-2">
            Role title
            <Input className="w-full" value={draft.title} maxLength={200}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} />
          </label>
          <label className="grid gap-1 text-sm text-body sm:col-span-2">
            Job description
            <Textarea className="min-h-28" rows={5} value={draft.description} maxLength={5000}
              onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} />
          </label>
          <label className="grid gap-1 text-sm text-body">
            Location
            <Input className="w-full" value={draft.location} maxLength={180}
              onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))} />
          </label>
          <label className="grid gap-1 text-sm text-body">
            Employment type
            <Select className="w-full" value={draft.employmentType}
              onChange={(event) => setDraft((current) => ({ ...current, employmentType: event.target.value as HrDriveDraft["employmentType"] }))}>
              {selectOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </Select>
          </label>
          <label className="grid gap-1 text-sm text-body">
            Mode
            <Select className="w-full" value={draft.driveMode??"ON_CAMPUS"}
              onChange={event=>setDraft(current=>({...current,driveMode:event.target.value as "ON_CAMPUS"|"OFF_CAMPUS",
                ...(event.target.value==="ON_CAMPUS"?{externalApplicationUrl:""}:{})}))}>
              <option value="ON_CAMPUS">On campus</option>
              <option value="OFF_CAMPUS">Off campus (students apply on your site)</option>
            </Select>
          </label>
          {draft.driveMode==="OFF_CAMPUS"?<label className="grid gap-1 text-sm text-body sm:col-span-2">
            Application website (HTTPS)
            <Input className="w-full" type="url" inputMode="url" maxLength={2000}
              placeholder="https://example.com/apply" value={draft.externalApplicationUrl??""}
              onChange={event=>setDraft(current=>({...current,externalApplicationUrl:event.target.value}))}/>
            <span className="text-xs text-muted-foreground">
              The placement cell reviews the application website before publishing.
            </span>
          </label>:null}
          <label className="grid gap-1 text-sm text-body">
            Work mode
            <Select className="w-full" value={draft.workMode}
              onChange={(event) => setDraft((current) => ({ ...current, workMode: event.target.value as HrDriveDraft["workMode"] }))}>
              {workModes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </Select>
          </label>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Job-description file uploads are unavailable until private storage and signed helpers are enabled.
        </p>
      </section>

      <section className="border-b border-border pb-5">
        <h2 className="font-semibold text-foreground">Compensation and eligibility</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="grid gap-1 text-sm text-body">
            CTC (LPA){draft.employmentType==="INTERNSHIP"?" after the internship (optional)":""}
            <Input className="w-full" inputMode="decimal" value={draft.ctcLpa??""}
              onChange={event=>setDraft(current=>({...current,ctcLpa:event.target.value}))}/>
          </label>
          <label className="grid gap-1 text-sm text-body">
            Fixed (optional, LPA)
            <Input className="w-full" inputMode="decimal" value={draft.fixedLpa??""}
              onChange={event=>setDraft(current=>({...current,fixedLpa:event.target.value}))}/>
          </label>
          <label className="grid gap-1 text-sm text-body">
            Variable (optional, LPA)
            <Input className="w-full" inputMode="decimal" value={draft.variableLpa??""}
              onChange={event=>setDraft(current=>({...current,variableLpa:event.target.value}))}/>
          </label>
          <p className="text-xs text-muted-foreground sm:col-span-3">Fixed and variable LPA must add up to the total CTC if entered.</p>
          {draft.employmentType!=="FULL_TIME"&&draft.employmentType!=="CONTRACT"?<label className="grid gap-1 text-sm text-body">
            Stipend per month (₹)
            <Input className="w-full" inputMode="numeric" value={draft.stipendMonthlyInr??""}
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
              <Input className="w-full" inputMode="decimal" value={draft[field]}
                onChange={(event) => setDraft((current) => ({ ...current, [field]: event.target.value }))} />
            </label>
          ))}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm text-body">
            Branches
            <Input className="w-full" list="recruiter-eligible-branches"
              value={branchInput} placeholder="e.g. CSE, ECE, Mechanical"
              onChange={event=>{setBranchInput(event.target.value);setDraft(current=>({...current,
                branches:[...new Map(event.target.value.split(",").map(value=>value.trim()).filter(Boolean)
                  .map(value=>[value.toLocaleLowerCase("en"),value] as const)).values()]}));}}/>
            <datalist id="recruiter-eligible-branches">
              {branchSuggestions.map(name=><option key={name} value={name}/>)}
            </datalist>
            <span className="text-xs text-muted-foreground">Separate multiple college branches with commas. The placement cell verifies the final eligibility.</span>
          </label>
          <label className="grid gap-1 text-sm text-body">
            Passing year
            <Input className="w-full" inputMode="numeric" maxLength={4}
              value={draft.passingYear??""} placeholder="YYYY"
              onChange={event=>setDraft(current=>({...current,passingYear:event.target.value}))}/>
          </label>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Compensation and eligibility values are submitted as part of the formal request; the placement cell decides whether to approve.
        </p>
      </section>

      <section className="border-b border-border pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-foreground">Hiring rounds</h2>
          <Button type="button" disabled={draft.rounds.length >= 12}
            variant="secondary"
            onClick={() => setDraft((current) => ({
              ...current, rounds: [...current.rounds, { kind: "INTERVIEW", name: "Interview" }],
            }))}>
            Add round
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Choose hiring round preset">
          {HR_DRIVE_ROUND_PRESETS.map(preset=><Button key={preset.id}
            type="button" variant="secondary"
            onClick={()=>{setDraft(current=>applyHrRoundPreset(current,preset.id));setShowPreview(false);}}>
            {preset.label}
          </Button>)}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Preset replaces the round list in this unsent draft only; edit each step afterward.</p>
        <div className="mt-4 space-y-3">
          {draft.rounds.map((round, index) => (
            <div key={index} className="grid min-w-0 gap-3 rounded-[var(--lms-control-radius)] border border-border p-3 sm:grid-cols-[10rem_minmax(0,1fr)_auto]">
              <label className="grid gap-1 text-sm text-body">
                Kind
                <Select className="w-full" value={round.kind}
                  onChange={(event) => setDraft((current) => ({
                    ...current, rounds: current.rounds.map((item, i) => i === index
                      ? { ...item, kind: event.target.value as HrDriveDraft["rounds"][number]["kind"] } : item),
                  }))}>
                  {roundKinds.map((kind) => <option key={kind} value={kind}>{kind.replaceAll("_", " ")}</option>)}
                </Select>
              </label>
              <label className="grid min-w-0 gap-1 text-sm text-body">
                Round name
                <Input className="w-full" maxLength={120} value={round.name}
                  onChange={(event) => setDraft((current) => ({
                    ...current, rounds: current.rounds.map((item, i) => i === index
                      ? { ...item, name: event.target.value } : item),
                  }))} />
              </label>
              <div className="flex items-end gap-2">
                <Button type="button" disabled={index===0} aria-label={"Move "+round.name+" earlier"}
                  variant="secondary"
                  onClick={()=>{setDraft(current=>reorderHrDraftRound(current,index,-1));setShowPreview(false);}}>↑</Button>
                <Button type="button" disabled={index===draft.rounds.length-1} aria-label={"Move "+round.name+" later"}
                  variant="secondary"
                  onClick={()=>{setDraft(current=>reorderHrDraftRound(current,index,1));setShowPreview(false);}}>↓</Button>
              </div>
              <Button type="button" disabled={draft.rounds.length>=12}
                aria-label={"Duplicate "+round.name}
                variant="secondary" className="self-end"
                onClick={()=>{setDraft(current=>duplicateHrDraftRound(current,index));setShowPreview(false);}}>
                Duplicate
              </Button>
              <Button type="button" disabled={draft.rounds.length <= 1}
                variant="secondary" className="self-end"
                onClick={() => setDraft((current) => ({
                  ...current, rounds: current.rounds.filter((_, i) => i !== index),
                }))}>Remove</Button>
            </div>
          ))}
        </div>
      </section>
      <section className="border-b border-border pb-5">
        <h2 className="font-semibold text-foreground">What students will see · local preview</h2>
        <p className="mt-1 text-sm text-body">
          Your draft is local until you send it to the placement cell. A sent request waits for their decision and is not automatically published.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button type="button" 
            onClick={() => { setShowPreview(true); setNotice(""); }}>Preview and validate</Button>
          <Button type="button" disabled={!result.success||submitting}
            aria-busy={submitting}
            variant="secondary"
            onClick={() => void sendFormalDriveRequest()}>
            {submitting?"Sending request...":fixRequestId?(editMode==="EDIT"?"Save changes":"Fix and Resend"):"Send for review"}
          </Button>
          <Button type="button" disabled={!result.success}
            variant="secondary"
            onClick={() => void copyPreview()}>Copy validated draft</Button>
          <Button type="button" disabled={submitting}
            variant="secondary"
            onClick={saveForThisTab}>Save unsent draft</Button>
          <Button type="button" variant="secondary"
            onClick={()=>restoreFromThisTab()}>Restore saved draft</Button>
          <Button type="button" variant="secondary"
            onClick={() => {
              if(hrDraftContainsWork(draft)){setDraftDecision("CLEAR");return;}
              try{window.sessionStorage.removeItem(storageKey);window.localStorage.removeItem(storageKey);}catch{/* Storage may be disabled; reset form regardless. */}
              setDraft(emptyHrDriveDraft());setBranchInput("");setShowPreview(false);setNotice("Cleared this tab’s saved draft.");
            }}>Start over</Button>
        </div>
        {showPreview && !result.success ? (
          <div role="alert" className="mt-4 rounded-[var(--lms-control-radius)] border border-border p-3 text-sm text-body">
            <strong>Review the draft:</strong>
            <ul className="mt-2 list-disc pl-5">
              {result.error.issues.map((issue, index) => (
                <li key={index}>{issue.path.join(".")}: {issue.message}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {/* Live locally held student-facing draft preview; never imply publication. */}
          <div className="mt-4 space-y-2 rounded-[var(--lms-control-radius)] bg-surface-secondary p-4 text-sm text-body">
            <h3 className="text-base font-semibold text-foreground">{draft.title.trim()||"Role title"}</h3>
            <p className="whitespace-pre-wrap">{draft.description||"Add a job description to see it here."}</p>
            <p>{draft.location} · {draft.employmentType.replaceAll("_", " ")} · {draft.driveMode==="OFF_CAMPUS"?"Off campus":"On campus"} · {draft.workMode}</p>
            {draft.driveMode==="OFF_CAMPUS"?
              <p className="break-all">Application website: {result.success&&result.data.externalApplicationUrl
                ? <a href={result.data.externalApplicationUrl} rel="noopener noreferrer" target="_blank"
                  className="inline-flex min-h-9 items-center font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">{result.data.externalApplicationUrl}</a>
                : "Not specified"}</p>:null}
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
              <div role="status" className="rounded-[var(--lms-control-radius)] border border-border bg-surface p-3 text-sm">
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
