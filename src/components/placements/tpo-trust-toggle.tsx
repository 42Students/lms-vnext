"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function TpoTrustToggle({
  relationshipId,
  companyName,
  isTrusted,
}: {
  relationshipId: string;
  companyName: string;
  isTrusted: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (pending) return;
    const nextTrusted = !isTrusted;
    const reason = window.prompt(
      "Reason for " + (nextTrusted ? "trusting " : "removing trust from ") + companyName +
      " (at least 8 characters):",
    )?.trim();
    if (!reason) return;
    if (reason.length < 8 || reason.length > 500) {
      setError("Enter a reason between 8 and 500 characters.");
      return;
    }
    if (!window.confirm(
      "Confirm " + (nextTrusted ? "mark trusted" : "remove trust") + " for " +
      companyName + "? This changes only this college-company relationship, " +
      "not recruiter-domain allowlisting or direct login permissions.",
    )) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/placements/tpo/settings/company-trust", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          relationshipId, expectedTrusted: isTrusted,
          nextTrusted, reason, confirmed: true,
        }),
      });
      if (!response.ok) {
        if (response.status === 409) {
          throw new Error("Company trust was changed elsewhere. Refresh to review.");
        }
        throw new Error("Could not update trust. The original state was preserved.");
      }
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Company trust update failed.");
    } finally {
      setPending(false);
    }
  }

  return <div className="mt-2">
    <button type="button" disabled={pending}
      onClick={() => void submit()}
      className="min-h-10 rounded-md border border-border bg-surface px-3 text-xs font-semibold text-primary-text disabled:opacity-50">
      {pending ? "Saving..." : isTrusted ? "Remove company trust" : "Mark company trusted"}
    </button>
    {error ? <p role="alert" className="mt-2 max-w-56 text-xs text-error">{error}</p> : null}
  </div>;
}
