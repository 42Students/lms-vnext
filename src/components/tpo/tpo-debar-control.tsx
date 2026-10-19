"use client";
import { Button } from "@/components/ui/button";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  buildTpoDebarDecision,
  isTpoDebarDecision,
  TPO_DEBAR_REASON_PREFIX,
} from "@/modules/placements/tpo-debar-model";
import {
  type TpoMembershipDecisionSnapshot,
} from "@/modules/placements/tpo-participation-model";

type Feedback = { tone: "error" | "success"; message: string } | null;

export function TpoDebarControl({
  membershipId,
  initial,
}: {
  membershipId: string;
  initial: TpoMembershipDecisionSnapshot;
}) {
  const router = useRouter();
  const [direct, setDirect] = useState(initial);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const debarred = isTpoDebarDecision(direct);
  const unrelatedRestriction =
    direct.status === "INELIGIBLE" && !debarred;
  const action = debarred ? "REMOVE_DEBAR" : "DEBAR";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !confirmed || unrelatedRestriction) return;
    setPending(true);
    setFeedback(null);
    try {
      const decision = buildTpoDebarDecision(
        action === "DEBAR"
          ? { action, reason }
          : { action },
        direct,
      );
      const result=await apiFetch<{
        changed:boolean;direct:TpoMembershipDecisionSnapshot;
      }>(
        "/api/placements/tpo/students/"+encodeURIComponent(membershipId)+"/participation",{
          method:"PUT",credentials:"same-origin",
          headers:{"Content-Type":"application/json"},body:JSON.stringify(decision),
        });
      setDirect(result.direct);
      setReason("");
      setConfirmed(false);
      setFeedback({
        tone: "success",
        message: result.changed
          ? action === "DEBAR"
            ? "Learner-level restriction saved and activity logged. New self-applications are blocked."
            : "Learner-level restriction cleared and activity logged. Inherited class/batch eligibility now applies."
          : "The current decision was already saved.",
      });
      router.refresh();
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof FriendlyFetchError&&error.status===409
          ?"This changed while you were working. Your reason is kept below; refresh and try again."
          :error instanceof Error?error.message:"Could not save this decision. Please try again.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-5">
      <h2 className="m-0 text-lg font-semibold text-foreground">
        Debar / remove learner restriction
      </h2>
      <p className="mt-2 text-sm leading-6 text-body">
        Debar records a learner-level Ineligible decision with a required reason.
        The student loses Placements self-service access and cannot submit new
        placement applications. Existing applications are not withdrawn, and
        no timed or drive-count-based debarment is created.
      </p>
      <p className="mt-2 text-sm leading-6 text-body">
        Removing this Debar-labelled override restores the existing class/batch
        inherited decision, which may still be Ineligible or Not decided.
        It does not restore a previous explicit Eligible override or erase
        the historical activity event.
      </p>
      {debarred ? (
        <p className="mt-3 text-sm font-semibold text-warning">
          Current Debar reason: {direct.reason?.slice(TPO_DEBAR_REASON_PREFIX.length)}
        </p>
      ) : unrelatedRestriction ? (
        <p className="mt-3 text-sm text-warning">
          A learner-level Ineligible decision already exists without a Debar label.
          Use the standard participation form to review or change it; this control
          will not silently replace that decision.
        </p>
      ) : null}

      {!unrelatedRestriction ? (
        <form onSubmit={submit} className="mt-5 space-y-4">
          {!debarred ? (
            <label className="grid gap-2 text-sm font-semibold text-body">
              Reason for Debar (required)
              <input
                type="text"
                value={reason}
                maxLength={200 - TPO_DEBAR_REASON_PREFIX.length}
                required
                disabled={pending}
                onChange={(event) => {
                  setReason(event.target.value);
                  setConfirmed(false);
                }}
                placeholder="Reason for restricting placement applications"
                className="min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground"
              />
            </label>
          ) : null}

          <label className="flex items-start gap-3 text-sm text-body">
            <input
              type="checkbox"
              checked={confirmed}
              disabled={pending}
              onChange={(event) => setConfirmed(event.target.checked)}
              required
              className="mt-1"
            />
            <span>
              {debarred
                ? "I confirm that the Debar-labelled learner override will be removed; the inherited class/batch decision may still block applications."
                : "I confirm that this learner will be marked Ineligible and blocked from submitting new placement applications until this membership override is changed."}
            </span>
          </label>

          <Button variant="primary"
            type="submit"
            disabled={pending || !confirmed || (!debarred && !reason.trim())}
            className="min-h-9 px-5"
          >
            {pending
              ? "Saving…"
              : debarred
                ? "Confirm remove debar"
                : "Confirm debar"}
          </Button>
        </form>
      ) : null}

      {feedback ? (
        <p
          role={feedback.tone === "error" ? "alert" : "status"}
          className={feedback.tone === "error"
            ? "mt-3 text-sm font-semibold text-error"
            : "mt-3 text-sm font-semibold text-success"}
        >
          {feedback.message}
        </p>
      ) : null}
    </section>
  );
}
