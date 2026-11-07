"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Root 500 reference: only the locally generated 8-character support code is
 * copied. Error names, server messages and Next digests never enter the UI.
 */
export function RootErrorReference({ reference }: { reference: string }) {
  const [feedback, setFeedback] = useState("");

  async function copy() {
    const code = /^Reference: ([a-f\d]{8})$/i.exec(reference)?.[1];
    if (!code) {
      setFeedback("Reference unavailable. Try again or return to home.");
      return;
    }
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(code);
      setFeedback("Reference copied.");
    } catch {
      setFeedback("Copy isn't available here. Select the reference above to copy it manually.");
    }
  }

  return (
    <div className="mt-5 flex min-w-0 flex-col items-center gap-2">
      <p className="m-0 break-all text-xs text-[color:var(--lms-text-muted)]">{reference}</p>
      <Button type="button" variant="secondary" size="sm" onClick={() => void copy()}
        className="min-h-11">
        Copy reference
      </Button>
      <p role="status" aria-live="polite" className="min-h-4 max-w-[420px] text-xs leading-5 text-[color:var(--lms-text-muted)]">
        {feedback}
      </p>
    </div>
  );
}
