"use client";

import { useRouter } from "next/navigation";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {TPO_INELIGIBLE_REASONS} from "@/modules/placements/tpo-ineligible-reasons";
import { useState, type FormEvent } from "react";
import {
  type TpoMembershipDecisionSnapshot,
  type TpoParticipationChange,
} from "@/modules/placements/tpo-participation-model";

type Status = TpoParticipationChange["status"];

export function TpoParticipationDecisionForm({
  membershipId,
  initial,
}: {
  membershipId: string;
  initial: TpoMembershipDecisionSnapshot;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(
    initial.status ?? "NOT_DECIDED",
  );
  const [reason, setReason] = useState(initial.reason ?? "");
  const [note, setNote] = useState(initial.note ?? "");
  const [expected, setExpected] = useState(initial);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{
    tone: "error" | "success"; message: string;
  } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setFeedback(null);
    setPending(true);
    try {
      const result=await apiFetch<{changed:boolean;direct:TpoMembershipDecisionSnapshot}>(
        "/api/placements/tpo/students/"+encodeURIComponent(membershipId)+"/participation",{
          method:"PUT",headers:{"Content-Type":"application/json"},
          credentials:"same-origin",
          body:JSON.stringify({status,
            ...(status==="INELIGIBLE"?{reason}:{}),
            ...(status!=="NOT_DECIDED"?{note}:{}),
            expected}),
        });

      setExpected(result.direct);
      setFeedback({
        tone: "success",
        message: result.changed
          ? "Membership eligibility decision saved and recorded in the placement activity log."
          : "No changes were needed.",
      });
      router.refresh();
    } catch (cause) {
      setFeedback({
        tone:"error",
        message:cause instanceof FriendlyFetchError&&cause.status===409
          ?"This changed while you were working. Your reason is kept below. Refresh and try again."
          :cause instanceof Error?cause.message:"Could not save the decision. Please try again.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <label className="grid gap-2 text-sm font-semibold text-body">
        Learner-level eligibility
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as Status)}
          disabled={pending}
          className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"
        >
          <option value="NOT_DECIDED">Inherit class/batch decision</option>
          <option value="ELIGIBLE">Eligible for placements</option>
          <option value="INELIGIBLE">Ineligible for placements</option>
        </select>
      </label>

      {status === "INELIGIBLE" ? (
        <label className="grid gap-2 text-sm font-semibold text-body">
          Reason (required)
          <div role="group" aria-label="Ineligibility reason presets" className="flex flex-wrap gap-2">
            {TPO_INELIGIBLE_REASONS.map(preset=><button type="button" key={preset}
              disabled={pending} onClick={()=>setReason(preset)}
              className="min-h-10 rounded border border-border px-2 text-xs">{preset}</button>)}
            <button type="button" disabled={pending} onClick={()=>setReason("")}
              className="min-h-10 rounded border border-border px-2 text-xs">Other</button>
          </div>
          <input
            type="text"
            required
            maxLength={200}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            disabled={pending}
            placeholder="Reason for restricting placement participation"
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"
          />
        </label>
      ) : null}

      {status !== "NOT_DECIDED" ? (
        <label className="grid gap-2 text-sm font-semibold text-body">
          Internal note (optional)
          <textarea
            rows={3}
            maxLength={300}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            disabled={pending}
            className="rounded-md border border-border bg-surface px-3 py-2 text-foreground"
          />
        </label>
      ) : null}

      <div className="rounded-lg border border-border bg-surface-secondary p-4 text-sm leading-6 text-body">
        <p className="font-semibold text-foreground">
          This is not a registration-choice editor.
        </p>
        <p className="mt-1">
          Higher studies, entrepreneurship, competitive exams and placement
          consent are separate cohort-registration choices. That database
          lifecycle is not migrated yet. Selecting Ineligible with a reason
          such as higher studies restricts eligibility only; it does not
          create a Higher Studies declaration or consent record.
          Clearing this override resumes the class/batch inherited decision.
        </p>
      </div>

      {feedback ? (
        <p
          role={feedback.tone === "error" ? "alert" : "status"}
          className={feedback.tone === "error"
            ? "text-sm font-medium text-error"
            : "text-sm font-medium text-success"}
        >
          {feedback.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-hover disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save learner eligibility"}
      </button>
    </form>
  );
}
