"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestDecisionLabel } from "@/modules/placements/tpo-request-decision-model";
export function TpoRequestDecisionControl({ requestId, expectedUpdatedAt, requestType }: {
  requestId: string; expectedUpdatedAt: string; requestType: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function decide(action: "APPROVE" | "REJECT") {
    if (pending) return;
    const note = window.prompt(
      action === "REJECT" ? "Rejection reason (required)" : "Approval note (optional)", "",
    );
    if (note === null) return;
    if (action === "REJECT" && note.trim().length < 3) {
      setError("A rejection reason of at least 3 characters is required.");
      return;
    }
    if (!window.confirm(requestDecisionLabel(action, requestType) +
        "? Approval may immediately change the learner application, round exception, or offer expiry.")) return;
    setPending(true); setError(null);
    try {
      const response = await fetch("/api/placements/tpo/requests/" + encodeURIComponent(requestId) + "/decision", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirmed: true, action, note: note.trim(), expectedUpdatedAt }),
      });
      if (!response.ok) throw new Error("Decision was rejected or request changed. Refresh before retrying.");
      router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Decision failed."); }
    finally { setPending(false); }
  }
  return <div className="flex flex-col gap-2 text-sm">
    <div className="flex gap-2">
      <button type="button" disabled={pending} onClick={() => void decide("APPROVE")}
        className="min-h-10 rounded-md border border-border px-3 font-semibold text-foreground disabled:opacity-50">Approve</button>
      <button type="button" disabled={pending} onClick={() => void decide("REJECT")}
        className="min-h-10 rounded-md border border-border px-3 font-semibold text-foreground disabled:opacity-50">Reject</button>
    </div>
    {error ? <p role="alert" className="max-w-xs text-error">{error}</p> : null}
  </div>;
}
