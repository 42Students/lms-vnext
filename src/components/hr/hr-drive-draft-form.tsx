"use client";
import { Alert } from "@/components/ui/alert";
import { InlineNotice } from "@/components/ui/inline-notice";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { useEffect, useRef, useState } from "react";
import {useRouter} from "next/navigation";
import {ConfirmActionDialog} from "@/components/ui/confirm-action-dialog";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {nextHrProposalAttempt} from "@/modules/placements/hr-drive-proposal-attempt-model";
import type { HrDriveDraft } from "@/modules/placements/hr-drive-draft-model";
import { emptyHrDriveDraft, hrDriveDraftSchema,
 HR_DRIVE_ROUND_LIMIT,HR_DRIVE_BRANCH_LIMIT,LEGACY_HR_DRIVE_MODES,
 LEGACY_HR_DRIVE_FORM_LABELS,HR_DRIVE_CTC_STEP,HR_DRIVE_PACKAGE_MONEY_STEP,
 parseHrDraftLegacyBranchTags,
} from "@/modules/placements/hr-drive-draft-model";
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
  const [yearToAdd, setYearToAdd] = useState("");
  const [notice, setNotice] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const formRootRef = useRef<HTMLDivElement>(null);
  const [pendingLeave,setPendingLeave]=useState<string|null>(null);
   const [draftDecision,setDraftDecision]=useState<"RESTORE"|"CLEAR"|null>(null);
  const router=useRouter();
  const { showToast } = useToast();
  const [savedRequestId,setSavedRequestId]=useState<string|null>(null);
  const [approvedJobId,setApprovedJobId]=useState<string|null>(null);
  const [submitting,setSubmitting] = useState(false);
  const [jdUploading,setJdUploading] = useState(false);
  const [jdUploadMessage,setJdUploadMessage] = useState("");
  const [jdReadUrl,setJdReadUrl] = useState<string|null>(null);
  const [jdPendingKey,setJdPendingKey] = useState<string|null>(null);
  const attempted = useRef<{signature:string;submissionId:string}|null>(null);
  const submittedRef=useRef(false);
  const submittingRef=useRef(false);
  const result=hrDriveDraftSchema.safeParse(draft);
  // Never submit the last valid array while an invalid longer comma-tag
  // input is visible to the employer.
  const branchDraftReady=(()=>{
    try{return JSON.stringify(parseHrDraftLegacyBranchTags(branchInput))===
      JSON.stringify(draft.branches??[]);}
    catch{return false;}
  })();
  const selectOptions = [
    ["FULL_TIME", "Full-time"], ["INTERNSHIP", "Internship"], ["INTERNSHIP_FULL_TIME", "Internship + full-time"], ["CONTRACT", "Contract"],
  ] as const;
  const workModes = [
    ["ONSITE", "On-site"], ["HYBRID", "Hybrid"], ["REMOTE", "Remote"],
    ["NO_PREFERENCE", "No preference"],
  ] as const;
  const roundKindLabels: Record<string,string> = {
    TALK: "Company talk", TEST: "Test", VENDOR_TEST: "Vendor test",
    GD: "Group discussion", INTERVIEW: "Interview",
  };
  const roundKinds = [
    "TALK", "TEST", "VENDOR_TEST", "GD", "INTERVIEW",
  ] as const;

  function focusFirstInvalid(fields: Record<string, string>) {
    const first = Object.keys(fields)[0];
    if (!first) return;
    window.requestAnimationFrame(() => {
      const controls = formRootRef.current?.querySelectorAll<HTMLElement>("[data-draft-field]");
      const target = Array.from(controls ?? []).find(element =>
        element.dataset["draftField"] === first) ?? Array.from(controls ?? [])[0];
      target?.focus();
      target?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  }

  function rememberFieldErrors(fields: Record<string, string>) {
    setFieldErrors(fields);
    focusFirstInvalid(fields);
  }


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
  async function confirmJobDescription(objectKey: string) {
    setJdUploading(true);
    try {
      await apiFetch("/api/placements/recruiter/drives/jd-upload", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CONFIRM", collegeId, objectKey }),
      });
      setDraft(current => ({ ...current, jdObjectKey: objectKey }));
      setJdPendingKey(null);
      setJdUploadMessage("Job description uploaded");
    } catch {
      // Malware scanning may finish after a successful PUT. Preserve the
      // private key for a same-scope retry; never claim the file is verified.
      setJdPendingKey(objectKey);
      setJdUploadMessage("The file was transferred and is waiting for verification. Retry verification before sending.");
    } finally { setJdUploading(false); }
  }

  async function uploadJobDescription(file: File | undefined) {
    if (!file || jdUploading || submitting) return;
    const extension = file.name.toLowerCase().split(".").pop();
    const types: Record<string, string> = {
      pdf: "application/pdf", doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
    const contentType = extension ? types[extension] : undefined;
    if (!contentType) { setJdUploadMessage("A job description must be a PDF or a Word file"); return; }
    if (file.type && file.type !== contentType) {
      setJdUploadMessage("The selected file type does not match its PDF or Word extension"); return;
    }
    if (file.size === 0) { setJdUploadMessage("The file is empty"); return; }
    if (file.size > 5 * 1024 * 1024) {
      setJdUploadMessage("The file is too large. The limit is 5 MB"); return;
    }
    setJdUploading(true);
    setJdUploadMessage("Uploading job description...");
    try {
      const grant = await apiFetch("/api/placements/recruiter/drives/jd-upload", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "INITIATE", collegeId, originalName: file.name,
          contentType, sizeBytes: file.size }),
      }) as { objectKey: string; uploadUrl: string; requiredHeaders: Record<string, string> };
      const uploaded = await fetch(grant.uploadUrl, { method: "PUT", body: file,
        headers: grant.requiredHeaders, credentials: "omit", redirect: "error" });
      if (!uploaded.ok) throw new Error("Upload was rejected");
      setJdPendingKey(grant.objectKey);
      await confirmJobDescription(grant.objectKey);
    } catch {
      setJdUploadMessage("Could not upload the file. Try again. If the file is being scanned, retry after verification.");
    } finally { setJdUploading(false); }
  }

  async function viewUploadedJobDescription() {
    if (!draft.jdObjectKey) return;
    setJdUploadMessage("");setJdReadUrl(null);
    try {
      const response = await apiFetch("/api/placements/recruiter/drives/jd-upload?" +
        new URLSearchParams({ collegeId, objectKey: draft.jdObjectKey }),
        { method: "GET", credentials: "same-origin", cache: "no-store" }) as { readUrl: string; expiresAt: string };
      const parsed = new URL(response.readUrl);
      if (parsed.protocol !== "https:" || parsed.username || parsed.password ||
          !Number.isFinite(Date.parse(response.expiresAt)) ||
          Date.parse(response.expiresAt) <= Date.now())
        throw new Error("Invalid signed read link");
      // Present a verified link only after its signed URL passes validation.
      // The browser can open it in another tab via the context menu or modifier click;
      // the unsent draft stays on screen until the learner explicitly follows it.
      setJdReadUrl(parsed.toString());
      setJdUploadMessage("Signed link ready. Following it opens the file in this tab.");
    } catch { setJdReadUrl(null); setJdUploadMessage("Could not open the file. Try again after verification."); }
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
    if(submitting||jdUploading||jdPendingKey||submittingRef.current||submittedRef.current)return;
    if(!branchDraftReady){
      rememberFieldErrors({branches:"Fix the visible branch list: max 30 names under 120 characters."});
      setNotice("No branches were silently omitted. Review the list before sending.");
      return;
    }
    const valid=hrDriveDraftSchema.safeParse(draft);
    if(!valid.success){
      const fields: Record<string, string> = {};
      for (const issue of valid.error.issues) {
        const field = issue.path.join(".");
        if (field && !fields[field]) fields[field] = issue.message;
      }
      rememberFieldErrors(fields);
      setShowPreview(true);
      setNotice("Complete the draft requirements before sending for review.");
      return;
    }
    setFieldErrors({});
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
      const receipt = (raw as {request:{id:string;status?:unknown;approvedJobId?:unknown}}).request;
      // Only a durable approved draft job ID distinguishes automatic approval
      // from a request still waiting for the placement cell's decision.
      const approvedId = receipt.status === "DRAFT" && typeof receipt.approvedJobId === "string"
        ? receipt.approvedJobId : null;
      submittedRef.current=true;
      setApprovedJobId(approvedId);
      try{
        window.sessionStorage.setItem(feedbackKey,fixRequestId
          ? editMode==="EDIT"?"Saved. The placement cell sees the new version.":"Request resent to the placement cell."
          : approvedId ? "Approved. The placement cell sets the dates and opens it to students."
            : "Sent to the placement cell for review");
      }catch{/* A verified save must not depend on flash storage. */}
      // REC-home-drives-29: a submitted request is no longer an unsent local draft.
      try{window.localStorage.removeItem(storageKey);window.sessionStorage.removeItem(storageKey);}
      catch{/* Successful server submit must not depend on browser storage. */ }
      setSavedRequestId((raw as {request:{id:string}}).request.id);
       showToast({ tone: "success", title: fixRequestId
         ? editMode === "EDIT" ? "Drive changes saved" : "Drive request resent"
         : approvedId ? "Drive approved" : "Sent to the placement cell for review" });
    }catch(error){
      if (error instanceof FriendlyFetchError && Object.keys(error.fieldErrors).length) {
        const alias: Record<string, string> = {
          jobTitle: "title", job_title: "title", ctc_lpa: "ctcLpa",
          minCgpa: "minimumCgpa", min_cgpa: "minimumCgpa",
          passingYears: "passingYears", passing_years: "passingYears",
        };
        const fields: Record<string, string> = {};
        for (const [key, value] of Object.entries(error.fieldErrors)) fields[alias[key] ?? key] = value;
        rememberFieldErrors(fields);
        setShowPreview(true);
      }
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

  if(savedRequestId) return <section aria-label="Drive request submitted" className="min-w-0 max-w-3xl space-y-4 border-y border-border bg-transparent py-4 md:py-6">
    <h2 role="status" className="text-lg font-semibold text-foreground">{approvedJobId ? "Drive approved" : "Request sent"}</h2>
    <p className="text-sm text-body">{approvedJobId
      ? "Approved. The placement cell sets the dates and opens it to students."
      : "Your request was saved. The placement cell will review and set the dates before it can open to students."}</p>
    <div className="flex min-w-0 flex-col gap-2 min-[768px]:flex-row min-[768px]:flex-wrap">
      <a href={"/hr/drives?collegeId="+encodeURIComponent(collegeId)+(approvedJobId?"&view=DRAFT":"&view=WAITING")}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-medium text-primary-text min-[768px]:min-h-9 min-[768px]:w-auto hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Open the request</a>
      <a href={"/hr/drives?collegeId="+encodeURIComponent(collegeId)}
        className="inline-flex min-h-11 w-full items-center justify-center min-[768px]:min-h-9 min-[768px]:w-auto rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-medium text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Go to Drives</a>
      <a href={"/hr/drives/new?collegeId="+encodeURIComponent(collegeId)}
        className="inline-flex min-h-11 w-full items-center justify-center min-[768px]:min-h-9 min-[768px]:w-auto rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-medium text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Request another</a>
    </div>
  </section>;

  return (
    <div ref={formRootRef} className="min-w-0 max-w-full space-y-4 md:space-y-6">
      <ConfirmActionDialog open={pendingLeave!==null}
       title="Leave without these changes?" consequence="The role, eligibility and round changes on this screen will be cleared."
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
      {notice === "We restored your unsent draft" ? <Alert tone="info" title="We restored your unsent draft" className="mb-4">
         <span>Your choices remain on this device until you send them for review.</span>
         <Button type="button" variant="secondary" disabled={submitting}
           onClick={() => setDraftDecision("CLEAR")}>Start over</Button>
       </Alert> : null}
       {fixRequestId && JSON.stringify(draft) !== JSON.stringify(initial) ?
         <span role="status" className="inline-flex rounded-full border border-warning px-2 py-1 text-xs font-semibold text-warning">Unsaved changes</span> : null}
       <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
      <div className="min-w-0 space-y-5">
      <section className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
        <h2 className="font-semibold text-foreground">1 · The role</h2>
        <div className="mt-4 grid min-w-0 gap-4 md:grid-cols-2">
          <label className="grid min-w-0 gap-[6px] text-[length:var(--lms-font-sm)] md:col-span-2 leading-4 font-semibold text-[13px] text-[var(--lms-neutral-400)]">
            Role title
            <Input className="w-full" data-draft-field="title" aria-invalid={Boolean(fieldErrors["title"])} placeholder="e.g. Software Engineer" aria-describedby={fieldErrors["title"] ? "hr-title-error" : undefined}
              value={draft.title} maxLength={200}
              onChange={(event) => { setFieldErrors(current => ({ ...current, title: "" }));
                setDraft((current) => ({ ...current, title: event.target.value })); }} />
            {fieldErrors["title"] ? <span role="alert" id="hr-title-error" className="text-xs text-error">{fieldErrors["title"]}</span> : null}
          </label>
          <label className="grid min-w-0 gap-[6px] text-[length:var(--lms-font-sm)] md:col-span-2 leading-4 font-semibold text-[13px] text-[var(--lms-neutral-400)]">
            Description (optional)
            <Textarea className="min-h-28" rows={4} value={draft.description} maxLength={5000}
              onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} />
          </label>
          <label className="grid min-w-0 gap-[6px] text-[length:var(--lms-font-sm)] leading-4 font-semibold text-[13px] text-[var(--lms-neutral-400)]">
            Location (optional)
            <Input className="w-full" value={draft.location} maxLength={180}
              onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))} />
          </label>
          <label className="grid min-w-0 gap-[6px] text-[length:var(--lms-font-sm)] leading-4 font-semibold text-[13px] text-[var(--lms-neutral-400)]">
            Employment type
            <Select className="w-full" value={draft.employmentType}
              onChange={(event) => setDraft((current) => ({ ...current, employmentType: event.target.value as HrDriveDraft["employmentType"] }))}>
              {selectOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </Select>
          </label>
          <label className="grid min-w-0 gap-[6px] text-[length:var(--lms-font-sm)] leading-4 font-semibold text-[13px] text-[var(--lms-neutral-400)]">
            Mode
            <Select className="w-full" value={draft.driveMode??"ON_CAMPUS"}
              onChange={event=>setDraft(current=>({...current,driveMode:event.target.value as HrDriveDraft["driveMode"],
                ...(event.target.value!=="OFF_CAMPUS"?{externalApplicationUrl:""}:{})}))}>
              {LEGACY_HR_DRIVE_MODES.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}
            </Select>
          </label>
          {draft.driveMode==="POOL"?<p className="md:col-span-2 text-xs text-muted-foreground" role="status">
            Pool drives require placement-cell review; the source pool classification is retained when approved.
          </p>:null}
          {draft.driveMode==="OFF_CAMPUS"?<label className="grid min-w-0 gap-[6px] text-[length:var(--lms-font-sm)] md:col-span-2 leading-4 font-semibold text-[13px] text-[var(--lms-neutral-400)]">
            Application website (HTTPS)
            <Input className="w-full" type="url" inputMode="url" maxLength={2000}
              placeholder="https://example.com/apply" value={draft.externalApplicationUrl??""}
              onChange={event=>setDraft(current=>({...current,externalApplicationUrl:event.target.value}))}/>
            <span className="text-xs text-muted-foreground">
              The placement cell reviews the application website before publishing.
            </span>
          </label>:null}
          <label className="grid min-w-0 gap-[6px] text-[length:var(--lms-font-sm)] leading-4 font-semibold text-[13px] text-[var(--lms-neutral-400)]">
            Work mode
            <Select className="w-full" value={draft.workMode}
              onChange={(event) => setDraft((current) => ({ ...current, workMode: event.target.value as HrDriveDraft["workMode"] }))}>
              {workModes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </Select>
          </label>
        </div>
        <div className="mt-3 grid min-w-0 gap-[6px] text-[13px] font-semibold text-[var(--lms-neutral-400)]">
          <label htmlFor="hr-jd-url">Job description link (optional)</label>
          <Input id="hr-jd-url" type="url" inputMode="url" maxLength={2000}
            data-draft-field="jdUrl" aria-invalid={Boolean(fieldErrors["jdUrl"])}
            aria-describedby={fieldErrors["jdUrl"] ? "hr-jd-url-error" : "hr-jd-url-help"}
            value={draft.jdUrl??""} placeholder="https://example.com/job-description.pdf"
            onChange={event=>{
              setFieldErrors(current=>({...current,jdUrl:""}));
              setDraft(current=>({...current,jdUrl:event.target.value}));
            }}/>
          {fieldErrors["jdUrl"]?<span id="hr-jd-url-error" role="alert" className="text-xs text-error">
            {fieldErrors["jdUrl"]}
          </span>:null}
          <span id="hr-jd-url-help" className="text-xs font-normal text-muted-foreground">
            Use a public HTTPS link, or upload a private PDF/Word file below. Private files require a verified scan and a short-lived authorized link.
          </span>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <label htmlFor="hr-jd-upload" className="text-sm font-semibold">Upload a PDF or Word file (optional, up to 5 MB)</label>
            <input id="hr-jd-upload" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              disabled={submitting || jdUploading} className="max-w-full text-sm"
              onChange={event => { const file = event.currentTarget.files?.[0];
                void uploadJobDescription(file); event.currentTarget.value = ""; }} />
            {jdPendingKey ? <Button type="button" variant="secondary" disabled={jdUploading || submitting}
              onClick={() => void confirmJobDescription(jdPendingKey)}>Retry verification</Button> : null}
            {draft.jdObjectKey ? <>
              <Button type="button" variant="secondary" onClick={() => void viewUploadedJobDescription()}>View the uploaded file</Button>
              <Button type="button" variant="secondary" disabled={jdUploading || submitting}
                onClick={() => { setDraft(current => ({ ...current, jdObjectKey: undefined })); setJdPendingKey(null); setJdUploadMessage(""); }}>Remove</Button>
            </> : null}
          </div>
          {jdUploadMessage ? <span role="status" className="text-xs text-muted-foreground">{jdUploadMessage}</span> : null}
           {draft.jdObjectKey&&jdReadUrl?<a href={jdReadUrl} rel="noopener noreferrer" referrerPolicy="no-referrer" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Open verified job description</a>:null}
        </div>
      </section>

      <section className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
        <h2 className="font-semibold text-foreground">2 · Pay</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Enter the overall compensation, then add packages for different offers if needed.
        </p>
        <div className="mt-4 grid min-w-0 gap-4 md:grid-cols-3">
          <label className="grid min-w-0 gap-[6px] text-[length:var(--lms-font-sm)] leading-4 font-semibold text-[13px] text-[var(--lms-neutral-400)]">
            {draft.employmentType==="INTERNSHIP"?"CTC after the internship (LPA, optional)":"CTC (LPA)"}
            <Input className="w-full" type="number" min={0} step={HR_DRIVE_CTC_STEP} data-draft-field="ctcLpa" aria-invalid={Boolean(fieldErrors["ctcLpa"])}
              inputMode="decimal" value={draft.ctcLpa??""} aria-describedby={fieldErrors["ctcLpa"] ? "hr-ctc-error" : undefined}
              onChange={event=>{setFieldErrors(current=>({...current,ctcLpa:""}));
                setDraft(current=>({...current,ctcLpa:event.target.value}));}}/>
            {fieldErrors["ctcLpa"] ? <span role="alert" id="hr-ctc-error" className="text-xs text-error">{fieldErrors["ctcLpa"]}</span> : null}
          </label>
          <label className="grid min-w-0 gap-[6px] text-[length:var(--lms-font-sm)] leading-4 font-semibold text-[13px] text-[var(--lms-neutral-400)]">
            Fixed (optional)
            <Input className="w-full" type="number" min={0} step={HR_DRIVE_PACKAGE_MONEY_STEP} inputMode="decimal" value={draft.fixedLpa??""}
              onChange={event=>setDraft(current=>({...current,fixedLpa:event.target.value}))}/>
          </label>
          <label className="grid min-w-0 gap-[6px] text-[length:var(--lms-font-sm)] leading-4 font-semibold text-[13px] text-[var(--lms-neutral-400)]">
            Variable (optional)
            <Input className="w-full" type="number" min={0} step={HR_DRIVE_PACKAGE_MONEY_STEP} inputMode="decimal" value={draft.variableLpa??""}
              onChange={event=>setDraft(current=>({...current,variableLpa:event.target.value}))}/>
          </label>
          <p className="text-xs text-muted-foreground md:col-span-3">Fixed and variable LPA must not exceed total CTC. Spin controls use legacy increments; entered hundredths are preserved.</p>
          {draft.employmentType!=="FULL_TIME"&&draft.employmentType!=="CONTRACT"?<label className="grid min-w-0 gap-[6px] text-[length:var(--lms-font-sm)] leading-4 font-semibold text-[13px] text-[var(--lms-neutral-400)]">
            Stipend per month (₹)
            <Input className="w-full" inputMode="numeric" value={draft.stipendMonthlyInr??""}
              onChange={event=>setDraft(current=>({...current,stipendMonthlyInr:event.target.value}))}/>
          </label>:null}
        </div>
        <div className="mt-4 grid min-w-0 gap-4 md:grid-cols-3">
          {([
            ["minimumAnnualCtcInr", "Minimum annual CTC (₹)"],
            ["maximumAnnualCtcInr", "Maximum annual CTC (₹)"],
            ["fixedAnnualCtcInr", "Fixed annual CTC (₹)"],
            ["variableAnnualCtcInr", "Variable annual CTC (₹)"],
            ["bondMonths", "Bond months"],
            ["bondAmountInr", "Bond amount (₹)"],
          ] as const).map(([field, label]) => (
            <label key={field} className="grid min-w-0 gap-[6px] text-[length:var(--lms-font-sm)] leading-4 font-semibold text-[13px] text-[var(--lms-neutral-400)]">
              {label}
              <Input className="w-full" data-draft-field={field} aria-invalid={Boolean(fieldErrors[field])}
                inputMode="decimal" value={draft[field]}
                onChange={(event) => { setFieldErrors(current=>({...current,[field]:""}));
                  setDraft((current) => ({ ...current, [field]: event.target.value })); }} />
              {fieldErrors[field] ? <span role="alert" className="text-xs text-error">{fieldErrors[field]}</span> : null}
            </label>
          ))}
        </div>
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-semibold text-foreground">Pay packages</h3>
            <Button type="button" variant="secondary"
              disabled={(draft.payPackages??[]).length>=25}
              onClick={()=>setDraft(current=>({...current,payPackages:[
                ...(current.payPackages??[]),
                {name:"Package "+((current.payPackages?.length??0)+1),
                 ctcLpa:"",fixedLpa:"",variableLpa:"",joiningBonusLpa:"",
                 stipendMonthlyInr:""},
              ]}))}>＋ Add package</Button>
          </div>
          {(draft.payPackages??[]).map((item,index)=>
            <fieldset key={index} className="min-w-0 rounded border border-border p-3">
              <legend className="px-1 text-sm font-semibold">Package {index+1}</legend>
              <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {([
                  ["name",LEGACY_HR_DRIVE_FORM_LABELS.packageName],
                  ["ctcLpa",LEGACY_HR_DRIVE_FORM_LABELS.ctc],
                  ["fixedLpa",LEGACY_HR_DRIVE_FORM_LABELS.fixed],
                  ["variableLpa",LEGACY_HR_DRIVE_FORM_LABELS.variable],
                  ["joiningBonusLpa",LEGACY_HR_DRIVE_FORM_LABELS.joiningBonus],
                  ["stipendMonthlyInr",LEGACY_HR_DRIVE_FORM_LABELS.stipend],
                ] as const).map(([field,label])=><label key={field}
                  className="grid min-w-0 gap-1 text-[13px] font-semibold text-[var(--lms-neutral-400)]">
                  {label}
                  <Input type={field==="name"?"text":"number"}
                    min={field==="name"?undefined:0}
                    step={field==="ctcLpa"?HR_DRIVE_CTC_STEP:
                      field==="stipendMonthlyInr"?1:HR_DRIVE_PACKAGE_MONEY_STEP}
                    value={typeof item[field]==="string"||typeof item[field]==="number"?item[field]:""} onChange={event=>setDraft(current=>({
                      ...current,payPackages:(current.payPackages??[]).map((row,i)=>
                        i===index?{...row,[field]:event.target.value}:row),
                    }))}/>
                </label>)}
                <label className="grid min-w-0 gap-1 text-[13px] font-semibold text-[var(--lms-neutral-400)]">
                  {LEGACY_HR_DRIVE_FORM_LABELS.duration}
                  <Input type="number" min={1} max={120} step={1}
                    value={typeof item.internshipMonths==="string"||typeof item.internshipMonths==="number"?item.internshipMonths:""}
                    onChange={event=>setDraft(current=>({
                      ...current,payPackages:(current.payPackages??[]).map((row,i)=>
                        i===index?{...row,internshipMonths:event.target.value?
                          Number(event.target.value):undefined}:row),
                    }))}/>
                </label>
              </div>
              <Button className="mt-3" variant="secondary" type="button"
                onClick={()=>setDraft(current=>({...current,
                  payPackages:(current.payPackages??[]).filter((_,i)=>i!==index)}))}>
                Remove package
              </Button>
            </fieldset>)}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Compensation and eligibility values are submitted as part of the formal request; the placement cell decides whether to approve.
        </p>
      </section>

      <section className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
        <h2 className="font-semibold text-foreground">3 · Who can apply</h2>
        <p className="mt-2 text-sm text-body">Leave these blank to include every registered student.</p>
        <div className="mt-3 grid min-w-0 gap-4 md:grid-cols-2">
          <label className="grid gap-[6px] text-[13px] font-semibold text-[var(--lms-neutral-400)]">
            Minimum CGPA
            <Input type="number" min={0} max={10} step={0.1} inputMode="decimal"
              data-draft-field="minimumCgpa" aria-invalid={Boolean(fieldErrors["minimumCgpa"])}
              value={draft.minimumCgpa}
              onChange={event=>{setFieldErrors(current=>({...current,minimumCgpa:""}));
                setDraft(current=>({...current,minimumCgpa:event.target.value}));}}/>
            {fieldErrors["minimumCgpa"] ? <span role="alert" className="text-xs text-error">{fieldErrors["minimumCgpa"]}</span> : null}
          </label>
          <label className="grid gap-[6px] text-[13px] font-semibold text-[var(--lms-neutral-400)]">
            Maximum active backlogs
            <Input type="number" min={0} step={1} inputMode="numeric"
              data-draft-field="maximumActiveBacklogs" value={draft.maximumActiveBacklogs}
              aria-invalid={Boolean(fieldErrors["maximumActiveBacklogs"])}
              onChange={event=>{setFieldErrors(current=>({...current,maximumActiveBacklogs:""}));
                setDraft(current=>({...current,maximumActiveBacklogs:event.target.value}));}}/>
            {fieldErrors["maximumActiveBacklogs"] ? <span role="alert" className="text-xs text-error">{fieldErrors["maximumActiveBacklogs"]}</span> : null}
          </label>
        </div>
        <div className="mt-4 grid min-w-0 gap-4 md:grid-cols-2">
          <label className="grid min-w-0 gap-[6px] text-[length:var(--lms-font-sm)] leading-4 font-semibold text-[13px] text-[var(--lms-neutral-400)]">
            Branches
            <Input className="w-full" data-draft-field="branches" aria-invalid={!branchDraftReady} list="recruiter-eligible-branches"
              value={branchInput} placeholder="All branches"
              onChange={event=>{setBranchInput(event.target.value);
                const parsed=event.target.value;
                try{
                  const branches=parseHrDraftLegacyBranchTags(parsed);
                  setFieldErrors(current=>({...current,branches:""}));
                  setDraft(current=>({...current,branches}));
                }catch{
                  // Keep the unsaved text and show an explicit error, never trim tags.
                  setFieldErrors(current=>({...current,branches:
                    "Enter at most 30 branches, each under 120 characters."}));
                }
              }}/>
            <datalist id="recruiter-eligible-branches">
              {branchSuggestions.map(name=><option key={name} value={name}/>)}
            </datalist>
            <span className="text-xs text-muted-foreground">
              Separate branches with commas (maximum {HR_DRIVE_BRANCH_LIMIT}); the placement cell verifies eligibility.
            </span>
            {!branchDraftReady?
              <span role="alert" className="text-xs text-error">
                Enter at most {HR_DRIVE_BRANCH_LIMIT} branches without dropping any selection.
              </span>:null}
          </label>
          <div className="grid min-w-0 gap-[6px] text-[13px] font-semibold text-[var(--lms-neutral-400)]">
            <label htmlFor="hr-passing-year-add">Passing years</label>
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Input id="hr-passing-year-add" className="min-w-0 flex-1" data-draft-field="passingYears"
                aria-invalid={Boolean(fieldErrors["passingYears"]||fieldErrors["passingYear"])}
                aria-describedby="hr-passing-years-help" inputMode="numeric" maxLength={4}
                placeholder="e.g. 2027" list="recruiter-passing-years" value={yearToAdd}
                onChange={event=>{setYearToAdd(event.target.value);
                  setFieldErrors(current=>({...current,passingYears:"",passingYear:""}));}}/>
              <Button type="button" variant="secondary" className="min-h-11 md:min-h-9"
                onClick={()=>{
                  const year=Number(yearToAdd.trim());
                  const chosen=draft.passingYears?.length
                    ?draft.passingYears:(draft.passingYear?[Number(draft.passingYear)]:[]);
                  if(!/^(20[0-9]{2}|2100)$/.test(yearToAdd.trim()) ||
                     year<2000||year>2100||chosen.includes(year)){
                    setFieldErrors(current=>({...current,passingYears:
                      chosen.includes(year)?"This year is already selected.":"Enter a passing year from 2000 to 2100."}));
                    return;
                  }
                  setDraft(current=>({...current,passingYear:"",
                    passingYears:[...chosen,year].sort((a,b)=>a-b)}));
                  setYearToAdd("");
                  setFieldErrors(current=>({...current,passingYears:"",passingYear:""}));
                }}>Add year</Button>
            </div>
            <datalist id="recruiter-passing-years">
              {Array.from({length:5},(_,index)=>new Date().getFullYear()+index).map(year=>
                <option key={year} value={year}/>)}
            </datalist>
            <p id="hr-passing-years-help" className="text-xs font-normal text-muted-foreground">
              Leave empty for any year, or add every eligible passing year.
            </p>
            {(draft.passingYears?.length||draft.passingYear) ?
              <ul aria-label="Selected passing years" className="flex flex-wrap gap-2">
                {(draft.passingYears?.length?draft.passingYears:[Number(draft.passingYear)]).map(year=>
                  <li key={year}>
                    <Button type="button" variant="secondary" className="min-h-11 gap-2 md:min-h-9"
                      aria-label={"Remove passing year "+year}
                      onClick={()=>{
                        const chosen=draft.passingYears?.length
                          ?draft.passingYears:(draft.passingYear?[Number(draft.passingYear)]:[]);
                        setDraft(current=>({...current,passingYear:"",
                          passingYears:chosen.filter(item=>item!==year)}));
                        setFieldErrors(current=>({...current,passingYears:"",passingYear:""}));
                      }}>{year}<span aria-hidden="true">×</span></Button>
                  </li>)}
              </ul>:<span className="text-xs font-normal text-muted-foreground">Any year</span>}
            {(fieldErrors["passingYears"]||fieldErrors["passingYear"])?
              <span role="alert" className="text-xs font-normal text-error">
                {fieldErrors["passingYears"]||fieldErrors["passingYear"]}</span>:null}
          </div>
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          Student reach is estimated: the placement cell verifies branches, passing years and academic records before publication.
        </p>
        {branchSuggestions.length === 0 ? <Alert tone="warning" className="mt-3">
          College branch suggestions are unavailable. Enter known branches or leave All branches for placement-cell review.
        </Alert> : null}
      </section>
      <section className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-foreground">4 · Rounds</h2>
          <Button type="button" disabled={draft.rounds.length >= HR_DRIVE_ROUND_LIMIT}
            variant="secondary"
            onClick={() => setDraft((current) => ({
              ...current, rounds: [...current.rounds, { kind: "INTERVIEW", name: "Interview" }],
            }))}>
            <span aria-hidden="true">＋</span> Add a round
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Choose hiring round preset">
          {HR_DRIVE_ROUND_PRESETS.map(preset=><Button key={preset.id}
            type="button" variant="secondary"
            onClick={()=>{setDraft(current=>applyHrRoundPreset(current,preset.id));setShowPreview(false);}}>
            {preset.label}
          </Button>)}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Preset replaces this draft's rounds. Add is capped at {HR_DRIVE_ROUND_LIMIT} to keep approval reviewable.
        </p>
        <div className="mt-4 min-w-0 space-y-3">
          {draft.rounds.map((round, index) => (
            <div key={index} className="grid min-w-0 gap-3 border-b border-border py-4 last:border-b-0 min-[768px]:grid-cols-2 min-[992px]:grid-cols-[170px_minmax(0,1fr)_auto]">
              <label className="grid min-w-0 gap-[6px] text-[length:var(--lms-font-sm)] leading-4 font-semibold text-[13px] text-[var(--lms-neutral-400)]">
                Kind
                <Select className="w-full" value={round.kind}
                  onChange={(event) => setDraft((current) => ({
                    ...current, rounds: current.rounds.map((item, i) => i === index
                      ? { ...item, kind: event.target.value as HrDriveDraft["rounds"][number]["kind"] } : item),
                  }))}>
                  {roundKinds.map((kind) => <option key={kind} value={kind}>{roundKindLabels[kind]}</option>)}
                </Select>
              </label>
              <label className="grid min-w-0 gap-[6px] text-[length:var(--lms-font-sm)] leading-4 font-semibold text-[13px] text-[var(--lms-neutral-400)]">
                Round name
                <Input className="w-full" maxLength={100} value={round.name} placeholder={"Round " + (index + 1) + " name"}
                  onChange={(event) => setDraft((current) => ({
                    ...current, rounds: current.rounds.map((item, i) => i === index
                      ? { ...item, name: event.target.value } : item),
                  }))} />
              </label>
              <div className="flex min-w-0 flex-wrap items-end gap-2 min-[768px]:col-span-2 min-[992px]:col-span-1 min-[992px]:justify-end">
                <Button type="button" disabled={index===0} aria-label={"Move "+round.name+" earlier"}
                  variant="secondary"
                  onClick={()=>{setDraft(current=>reorderHrDraftRound(current,index,-1));setShowPreview(false);}}>↑</Button>
                <Button type="button" disabled={index===draft.rounds.length-1} aria-label={"Move "+round.name+" later"}
                  variant="secondary"
                  onClick={()=>{setDraft(current=>reorderHrDraftRound(current,index,1));setShowPreview(false);}}>↓</Button>
                <Button type="button" disabled={draft.rounds.length>=HR_DRIVE_ROUND_LIMIT}
                  aria-label={"Duplicate "+round.name}
                  variant="secondary" className="max-[767px]:flex-1"
                  onClick={()=>{setDraft(current=>duplicateHrDraftRound(current,index));setShowPreview(false);}}>
                  Duplicate
                </Button>
                <Button type="button"
                  variant="secondary" className="max-[767px]:flex-1"
                  onClick={() => setDraft((current) => ({
                    ...current, rounds: current.rounds.filter((_, i) => i !== index),
                  }))}>Remove</Button>
              </div>
            </div>
          ))}
        </div>
      </section>
      </div>
      <aside aria-label="Drive preview and submit" className="min-w-0 self-start rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4 lg:sticky lg:top-6">
      <section aria-label="What happens next" className="mb-4 border-b border-border pb-4">
        <h2 className="font-semibold text-foreground">What happens next</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-body">
          <li>The placement cell reviews your request and may ask questions.</li>
          <li>They agree dates and publish an approved drive to eligible students.</li>
          <li>Applicants appear after the college shares their records with you.</li>
        </ol>
        <p className="mt-2 text-xs text-muted-foreground">Approval, dates and applicant volume are not guaranteed before the college confirms.</p>
      </section>
      <section className="min-w-0">
        <h2 className="font-semibold text-foreground">What students will see</h2>
        <p className="mt-1 text-sm text-body">
          Your draft is local until you send it to the placement cell. A sent request waits for their decision and is not automatically published.
        </p>
        <div className="mt-4 flex min-w-0 flex-col gap-2 min-[768px]:flex-row min-[768px]:flex-wrap min-[768px]:items-center">
          <Button type="button" variant="secondary"
            onClick={() => {
              if(!branchDraftReady){
                rememberFieldErrors({branches:"Review all branches before previewing."});
                setNotice("No branches were dropped. Fix the visible list.");
                return;
              }
              setShowPreview(true);
              setNotice("");
              if (!result.success) {
                const fields: Record<string, string> = {};
                for (const issue of result.error.issues) {
                  const key = issue.path.join(".");
                  if (key && !fields[key]) fields[key] = issue.message;
                }
                rememberFieldErrors(fields);
              } else setFieldErrors({});
            }}>Preview and validate</Button>
          <Button type="button" disabled={!result.success||!branchDraftReady||submitting||jdUploading||Boolean(jdPendingKey)}
            loading={submitting} aria-busy={submitting}
            onClick={() => void sendFormalDriveRequest()}>
            {submitting?"Sending request...":fixRequestId?(editMode==="EDIT"?"Save changes":"Fix and Resend"):"Send for review"}
          </Button>
          <details className="min-w-0 min-[768px]:basis-full">
            <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary)] min-[768px]:min-h-9">Draft tools</summary>
            <div className="flex min-w-0 flex-col gap-2 pb-2 min-[768px]:flex-row min-[768px]:flex-wrap">
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
          </details>
        </div>
        {showPreview && !result.success ? (
          <Alert tone="error" title="Review the draft:" className="mt-4">
            <ul className="mt-2 list-disc pl-5">
              {result.error.issues.map((issue, index) => (
                <li key={index}>{issue.path.join(".")}: {issue.message}</li>
              ))}
            </ul>
          </Alert>
        ) : null}
        {/* Live locally held student-facing draft preview; never imply publication. */}
          <div className="mt-4 min-w-0 space-y-2 break-words border-y border-border bg-transparent py-4 text-sm text-body">
            <h3 className="text-base font-semibold text-foreground">{draft.title.trim()||"Role title"}</h3>
            <p className="whitespace-pre-wrap">{draft.description||"Add a job description to see it here."}</p>
            {draft.jdObjectKey ? <div className="space-y-2">
              <p>Private job description attached. Students receive an authorized link after publication.</p>
              <Button type="button" variant="secondary" onClick={() => void viewUploadedJobDescription()}>
                Preview private job description
              </Button>
              {jdReadUrl ? <a href={jdReadUrl} rel="noopener noreferrer" referrerPolicy="no-referrer"
                className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">
                Open verified job description
              </a> : null}
            </div> : null}
             {result.success && result.data.jdUrl ?
              <p>Job description: <a href={result.data.jdUrl}
                rel="noopener noreferrer" referrerPolicy="no-referrer"
                className="font-semibold text-primary-text underline underline-offset-2">
                View linked job description
              </a></p> : draft.jdUrl ?
              <p className="text-xs text-error">Enter a valid public HTTPS job description link to preview it.</p> : null}
            <p>{draft.location || "Location not specified"} · {draft.employmentType.replaceAll("_", " ")} · {LEGACY_HR_DRIVE_MODES.find(option=>option.value===draft.driveMode)?.label??"On campus"} · {draft.workMode}</p>
             <p>Eligible branches: {draft.branches?.length ? draft.branches.join(", ") : "All branches"} ·
               Passing years: {draft.passingYears?.length?draft.passingYears.join(", "):draft.passingYear||"Any year"}</p>
            {draft.driveMode==="OFF_CAMPUS"?
              <p className="break-all">Application website: {result.success&&result.data.externalApplicationUrl
                ? <a href={result.data.externalApplicationUrl} rel="noopener noreferrer"
                  className="inline-flex min-h-9 items-center font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary)] max-[767px]:inline-flex max-[767px]:min-h-11 max-[767px]:items-center">{result.data.externalApplicationUrl}</a>
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
            <dl className="grid gap-2 md:grid-cols-2">
              {HR_DRAFT_PREVIEW_FIELDS.map(([field,label])=>(
                <div key={field}>
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="font-medium text-foreground">{field==="passingYear"&&draft.passingYears?.length
                    ?draft.passingYears.join(", "):draft[field]||"Not specified"}</dd>
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
        {notice && notice !== "We restored your unsent draft" ? <InlineNotice
           tone={/could not|unable|cannot|changed|ended|unexpired|complete|before|too large|access/i.test(notice)?"error":"info"}
           message={notice} /> : null}
        <p className="mt-3 text-xs text-muted-foreground">
          Formal requests and verified private job descriptions are saved for placement-cell review. Files require a malware scan and are never published automatically.
        </p>
      </section>
      </aside>
      </div>
      <div className="flex justify-stretch border-t border-border pt-4 lg:hidden">
        <Button type="button" className="w-full" disabled={!result.success || !branchDraftReady || submitting || jdUploading || Boolean(jdPendingKey)}
          loading={submitting} aria-busy={submitting}
          onClick={() => void sendFormalDriveRequest()}>
          {fixRequestId ? editMode === "EDIT" ? "Save changes" : "Fix and Resend" : "Send for review"}
        </Button>
      </div>
    </div>
  );
}
