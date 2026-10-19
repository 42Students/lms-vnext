"use client";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  canApplyTpoRoundResult,
  canEditTpoRoundResult,
  TPO_RESULT_LABELS,
} from "@/modules/placements/tpo-confirmed-round-result-model";

type Outcome = keyof typeof TPO_RESULT_LABELS;
type Snapshot = {
  id: string;
  applicationId: string;
  status: string;
  outcome: string;
};
type Row = {
  applicationId: string;
  displayName: string;
  resultStatus: string | null;
  resultOutcome: string | null;
};

export function TpoRoundResultRecorder({
  roundId,
  round,
  row,
}: {
  roundId: string;
  round: { kind: string; status: string };
  row: Row;
}) {
  const router = useRouter();
  const [outcome, setOutcome] = useState<Outcome>("PASS");
  const [message, setMessage] = useState("");
  const [rank, setRank] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editable = canEditTpoRoundResult(round, row);
  const applicable = canApplyTpoRoundResult(round, row);

  async function currentResult(): Promise<Snapshot | null> {
    const response = await fetch(
      "/api/placements/rounds/" + encodeURIComponent(roundId) + "/results",
      { credentials: "same-origin", cache: "no-store" },
    );
    if (!response.ok) throw new Error("Cannot verify the current round result.");
    const payload = (await response.json()) as { results?: Snapshot[] };
    if (!Array.isArray(payload.results)) {
      throw new Error("Round result snapshot unavailable.");
    }
    const candidates = payload.results.filter((item) =>
      item.applicationId === row.applicationId && item.status !== "SUPERSEDED",
    );
    if (candidates.length > 1) throw new Error("Conflicting current results; reload the page.");
    const current = candidates[0] ?? null;
    if ((current?.status ?? null) !== row.resultStatus ||
        (current?.outcome ?? null) !== row.resultOutcome) {
      throw new Error("Round result changed. Reload the page before editing.");
    }
    return current;
  }

  async function submitStage() {
    if (!editable || busy) return;
    const candidateMessage = message.trim();
    const rankValue = Number(rank);
    if (outcome !== "PASS" && !candidateMessage) {
      setError("A learner-facing message is required for non-pass outcomes.");
      return;
    }
    if (outcome === "HOLD" && (!Number.isInteger(rankValue) ||
      rankValue < 1 || rankValue > 100000)) {
      setError("Enter a valid waitlist rank between 1 and 100000.");
      return;
    }
    if (!window.confirm(
      "Stage " + TPO_RESULT_LABELS[outcome] + " for " + row.displayName +
      "? This is not a final published result. After round completion, a TPO must apply it.",
    )) return;
    setBusy(true);
    setError(null);
    try {
      const current = await currentResult();
      if (current?.status === "APPLIED") {
        throw new Error("An applied result cannot be edited.");
      }
      const response = await fetch(
        "/api/placements/tpo/rounds/" + encodeURIComponent(roundId) + "/confirmed-results",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            confirmed: true,
            expectedCurrentResultId: current?.id ?? null,
            result: {
              applicationId: row.applicationId,
              outcome,
              ...(outcome === "HOLD" ? { waitlistRank: rankValue } : {}),
              ...(candidateMessage ? { candidateMessage } : {}),
            },
          }),
        },
      );
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Could not stage this result.");
      }
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not stage this result.");
    } finally {
      setBusy(false);
    }
  }

  async function submitApply() {
    if (!applicable || busy) return;
    if (!window.confirm(
      "Apply the staged result for " + row.displayName +
      "? This makes the result visible to the learner and cannot be edited later.",
    )) return;
    setBusy(true);
    setError(null);
    try {
      const current = await currentResult();
      if (!current || current.status !== "STAGED") {
        throw new Error("No current staged result exists. Reload the page.");
      }
      const response = await fetch(
        "/api/placements/results/" + encodeURIComponent(current.id) + "/actions",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ action: "APPLY" }),
        },
      );
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Could not apply the staged result.");
      }
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not apply this result.");
    } finally {
      setBusy(false);
    }
  }

  if (!editable && !applicable) {
    return (
      <span className="text-xs text-muted-foreground">
        {row.resultStatus === "APPLIED"
          ? "Result finalized"
          : round.kind === "TALK"
            ? "Talk round: no result"
            : "Result actions unavailable"}
      </span>
    );
  }
  return (
    <div className="mt-3 space-y-2 rounded-[var(--lms-control-radius)] border border-border bg-surface p-2 text-xs">
      {editable ? (
        <>
          <label className="block font-semibold text-body">
            Round outcome
            <Select
              aria-label={"Round outcome for " + row.displayName}
              value={outcome}
              disabled={busy}
              onChange={(event) => setOutcome(event.target.value as Outcome)}
              className="mt-1 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface p-2 text-foreground"
            >
              {Object.entries(TPO_RESULT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </label>
          {outcome === "HOLD" ? (
            <label className="block font-semibold text-body">
              Waitlist rank
              <Input
                type="number"
                min={1}
                max={100000}
                value={rank}
                onChange={(event) => setRank(event.target.value)}
                disabled={busy}
                className="mt-1 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface p-2 text-foreground"
              />
            </label>
          ) : null}
          <label className="block font-semibold text-body">
            Learner-facing message {outcome === "PASS" ? "(optional)" : "(required)"}
            <Textarea
              rows={2}
              maxLength={1000}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              disabled={busy}
              className="mt-1 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface p-2 text-foreground"
            />
          </label>
          <Button variant="primary"
            type="button"
            disabled={busy}
            onClick={() => void submitStage()}
            className="min-h-11 rounded-[var(--lms-control-radius)] bg-primary px-3 font-semibold disabled:opacity-50 text-primary-foreground md:min-h-9"
          >
            {busy ? "Saving..." : "Confirm staged result"}
          </Button>
        </>
      ) : null}
      {applicable ? (
        <Button variant="secondary"
          type="button"
          disabled={busy}
          onClick={() => void submitApply()}
          
        >
          {busy ? "Applying..." : "Confirm and apply staged result"}
        </Button>
      ) : null}
      {error ? <p role="alert" className="text-error">{error}</p> : null}
    </div>
  );
}
