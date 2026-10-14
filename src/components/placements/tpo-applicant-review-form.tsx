"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
export function TpoApplicantReviewForm({jobId, applicationId, expectedUpdatedAt}: {
  jobId: string; applicationId: string; expectedUpdatedAt: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (pending) return;
    const data = new FormData(event.currentTarget);
    const decision = String(data.get("decision"));
    const note = String(data.get("note") ?? "").trim();
    if (!window.confirm("Confirm " + decision.toLowerCase() +
      " screening decision? The candidate may see rejection feedback. The action is audited.")) return;
    setPending(true); setError(null);
    try {
      const response = await fetch(
        "/api/placements/tpo/jobs/" + jobId + "/applicants/" + applicationId + "/review", {
        method: "POST", credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({confirmed:true, expectedUpdatedAt, decision, note}),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null) as {error?: string} | null;
        throw new Error(body?.error ?? "Applicant decision failed; refresh and retry.");
      }
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Review failed");
    } finally { setPending(false); }
  }
  return <form onSubmit={event => void submit(event)}
    className="space-y-4 rounded-xl border border-border bg-surface p-5">
    <h2 className="font-semibold text-foreground">Review application</h2>
    <label className="block text-sm text-body">Decision
      <select name="decision" className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface p-2">
        <option value="SHORTLISTED">Shortlist</option>
        <option value="REJECTED">Reject</option>
      </select>
    </label>
    <label className="block text-sm text-body">Decision note (rejections are candidate-visible)
      <textarea required name="note" minLength={10} maxLength={1000} rows={3}
        className="mt-1 w-full rounded-md border border-border bg-surface p-3"/>
    </label>
    <p className="text-xs text-body">Only pending or held submitted applicants can be reviewed. Refresh if another TPO made a decision.</p>
    {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
    <button type="submit" disabled={pending}
      className="min-h-11 rounded-md bg-primary px-4 font-semibold text-on-primary disabled:opacity-50">
      {pending ? "Saving…" : "Review and confirm decision"}
    </button>
  </form>;
}
