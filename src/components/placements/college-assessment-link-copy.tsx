"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/** Only receives a college-scoped HTTPS assessment URL from the server page. */
export function CollegeAssessmentLinkCopy({ url }: { url: string }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function copy() {
    if (busy) return;
    setBusy(true);
    try {
      if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
        throw new Error("Clipboard access unavailable");
      }
      await navigator.clipboard.writeText(url);
      setMessage("Assessment link copied.");
    } catch {
      setMessage("Could not copy automatically. Select the link above and copy it.");
    } finally {
      setBusy(false);
    }
  }
  return <div className="flex flex-col items-start gap-2">
    <Button type="button" variant="secondary" disabled={busy} onClick={() => void copy()}>
      {busy ? "Copying…" : "Copy link"}
    </Button>
    {message ? <p role="status" className="max-w-xs text-xs leading-5">{message}</p> : null}
  </div>;
}
