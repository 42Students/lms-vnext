"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function CollegePromotionConfirmation({
  cohortId, programId, expectedVersion, yearStart, targetTerm, learnerCount, academicYearStart,
}: {
  cohortId: string;
  programId: string;
  expectedVersion: number;
  yearStart?: number;
  targetTerm: number;
  learnerCount: number;
  academicYearStart: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    startTransition(async () => {
      setError(null);
      try {
        const response = await fetch("/api/academics/batch-promotion/execute", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            cohortId, programId, expectedVersion, yearStart,
            expectedCheckedLearners:learnerCount, expectedTargetTerm:targetTerm,
            expectedAcademicYearStart:academicYearStart,
            action: "PROMOTE", confirm: true,
          }),
        });
        if (!response.ok) {
          const payload: unknown = await response.json().catch(() => null);
          const reason = payload && typeof payload === "object" && "error" in payload
            ? String(payload.error) : "PROMOTION_FAILED";
          throw new Error(reason);
        }
        setOpen(false);
        router.refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Promotion failed");
      }
    });
  }

  return <div className="space-y-3">
    <button type="button" onClick={() => { setError(null); setOpen(true); }}
      className="min-h-11 rounded-md bg-primary px-5 text-sm font-semibold text-on-primary">
      Review promotion
    </button>
    {open ? <div role="dialog" aria-modal="true" aria-label="Confirm batch promotion"
      className="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <p className="font-semibold text-foreground">Confirm promotion to term {targetTerm}</p>
      <p className="mt-2 text-sm text-body">
        This changes the saved progression version and academic year for this batch.
        The server will reject any blockers or a stale preview.
        {learnerCount} learner enrollments were examined.
        This operation does not move learners to a different class or period.
      </p>
      {error ? <p role="alert" className="mt-2 text-sm text-foreground">{error}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={submit} disabled={pending}
          className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50">
          {pending ? "Promoting..." : "Confirm promotion"}
        </button>
        <button type="button" onClick={() => setOpen(false)} disabled={pending}
          className="min-h-11 rounded-md border border-border px-4 text-sm text-body">Cancel</button>
      </div>
    </div> : null}
  </div>;
}
