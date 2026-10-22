"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/** Never put the private object key or signed GET in rendered page props. */
export function LearnerJobDescriptionLink({ jobId }: { jobId: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function openDocument() {
    if (pending) return;
    setPending(true);
    setError("");
    const popup = window.open("about:blank", "_blank");
    if (popup) popup.opener = null;
    try {
      const response = await fetch(
        "/api/placements/learner/jobs/" + encodeURIComponent(jobId) + "/job-description",
        { credentials: "same-origin", cache: "no-store" },
      );
      if (!response.ok) throw new Error("Not available");
      const payload: unknown = await response.json();
      if (!payload || typeof payload !== "object" || !("readUrl" in payload) ||
          typeof payload.readUrl !== "string" || !("expiresAt" in payload) ||
          typeof payload.expiresAt !== "string")
        throw new Error("Invalid read permission");
      const url = new URL(payload.readUrl);
      if (url.protocol !== "https:" || url.username || url.password ||
          Date.parse(payload.expiresAt) <= Date.now())
        throw new Error("Expired permission");
      if (popup && !popup.closed) popup.location.replace(url.href);
      else window.location.assign(url.href);
    } catch {
      popup?.close();
      setError("The job description could not be opened. Try again.");
    } finally { setPending(false); }
  }
  return <div className="flex flex-wrap items-center gap-3">
    <Button type="button" variant="secondary" disabled={pending}
      onClick={() => void openDocument()}>
      {pending ? "Opening job description..." : "View job description (PDF/Word)"}
    </Button>
    {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
  </div>;
}
