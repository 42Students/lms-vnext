"use client";
import { useState, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
import {useGuardedAction} from "@/hooks/use-guarded-action";
export function TpoApplicantReviewForm({jobId, applicationId, expectedUpdatedAt}: {
  jobId: string; applicationId: string; expectedUpdatedAt: string;
}) {
  const router = useRouter();
  const {run}=useGuardedAction({timeoutMs:35000});
  const [decision,setDecision]=useState<"SHORTLISTED"|"REJECTED">("SHORTLISTED");
  const [note,setNote]=useState("");
  const [internalReason,setInternalReason]=useState("");
  const [reviewed,setReviewed]=useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (pending || saved) return;
    if(!reviewed||note.trim().length<10)return;
    await run(async()=>{
    setPending(true);setError(null);
    try {
      await apiFetch(
        "/api/placements/tpo/jobs/" + encodeURIComponent(jobId) +
          "/applicants/" + encodeURIComponent(applicationId) + "/review",{
          method:"POST",credentials:"same-origin",
          headers:{"content-type":"application/json"},
          body:JSON.stringify({confirmed:true,expectedUpdatedAt,decision,note:note.trim(),...(decision==="REJECTED"&&internalReason.trim()?{internalReason:internalReason.trim()}:{})}),
        });
      setSaved(true);
      setReviewed(false);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : friendlyApiError({}));
    } finally { setPending(false); }
    });
  }
  function shortcuts(event:KeyboardEvent<HTMLFormElement>){
   if(pending||saved||event.altKey||event.metaKey)return;
   if(event.ctrlKey&&event.key==="Enter"){
    event.preventDefault();
    event.currentTarget.requestSubmit();
    return;
   }
   const target=event.target as HTMLElement;
   if(target.closest("input,textarea,select,button,[contenteditable]"))return;
   if(event.key.toLowerCase()==="s"||event.key.toLowerCase()==="r"){
    event.preventDefault();
    setDecision(event.key.toLowerCase()==="s"?"SHORTLISTED":"REJECTED");
    setReviewed(false);
   }
  }
  return <form onKeyDown={shortcuts} onSubmit={event => void submit(event)}
    className="space-y-4 rounded-xl border border-border bg-surface p-5">
    <h2 className="font-semibold text-foreground">Review application</h2>
    <label className="block text-sm text-body">Decision
      <select name="decision" value={decision} disabled={pending||saved} onChange={event=>{setDecision(event.target.value as "SHORTLISTED"|"REJECTED");setReviewed(false);}} className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface p-2">
        <option value="SHORTLISTED">Shortlist</option>
        <option value="REJECTED">Reject</option>
      </select>
    </label>
    <label className="block text-sm text-body">Decision note (rejections are candidate-visible)
      <textarea required name="note" value={note} disabled={pending||saved} onChange={event=>{setNote(event.target.value);setReviewed(false);}} minLength={10} maxLength={1000} rows={3}
        className="mt-1 w-full rounded-md border border-border bg-surface p-3"/>
    </label>
    {decision==="REJECTED"?<fieldset className="space-y-2 text-sm">
      <legend className="font-semibold">Common not-selected reasons</legend>
      <div className="flex flex-wrap gap-2">
        {["Did not meet criteria","Application incomplete","Company screening decision","Other"].map(preset=>
          <button type="button" key={preset} disabled={pending||saved}
            onClick={()=>{setInternalReason(preset==="Other"?"":preset);setReviewed(false);}}
            className="min-h-10 rounded border border-border px-3 text-primary-text">{preset}</button>)}
      </div>
      <label className="block text-sm">Internal not-selected reason (not shown to the learner)
        <textarea value={internalReason} maxLength={500} rows={2}
          onChange={event=>{setInternalReason(event.target.value);setReviewed(false);}}
          disabled={pending||saved} className="mt-1 w-full rounded-md border border-border bg-surface p-3"/>
      </label>
      <p className="text-xs text-body">The decision note above is learner-visible. Internal reason presets stay private; do not copy confidential employer notes into the learner message.</p>
    </fieldset>:null}
    <label className="flex items-start gap-2 text-sm text-body">
      <input type="checkbox" checked={reviewed} disabled={pending||saved}
        onChange={event=>setReviewed(event.target.checked)} className="mt-1 h-4 w-4 accent-primary"/>
      I reviewed the applicant and the learner-visible reason. This screening decision is audited.
    </label>
    <p className="text-xs text-body">Shortcuts: S to shortlist, R to reject (outside form fields). Ctrl+Enter submits only after you review the decision.</p>
    <p className="text-xs text-body">Only pending or held submitted applicants can be reviewed. Refresh if another TPO made a decision.</p>
    {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
    {saved ? <p role="status" className="text-sm text-body">Decision saved. Refresh the applicant list to see its current stage.</p> : null}
    <button type="submit" disabled={pending || saved || !reviewed || note.trim().length<10}
      className="min-h-11 rounded-md bg-primary px-4 font-semibold text-on-primary disabled:opacity-50">
      {pending ? "Saving…" : saved ? "Decision saved" : "Review and confirm decision"}
    </button>
  </form>;
}
