"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useRouter } from "next/navigation";
import { BATCH_PROMOTION_COPY, promotionImpactMessage } from "@/modules/academics/college-batch-promotion-copy";
import { academicSetupErrorMessage } from "@/modules/academics/academic-setup-error-copy";

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
  const [success, setSuccess] = useState<string | null>(null);

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
        const payload = await response.json() as { facultySetupIncomplete?: boolean; endedTeachingAssignments?: number };
        setSuccess(payload.facultySetupIncomplete
          ? "Batch promoted. Faculty setup is still incomplete."
          : "Batch promoted successfully.");
        setOpen(false);
        router.refresh();
      } catch (cause) {
        setError(academicSetupErrorMessage(cause));
      }
    });
  }

  return <div className="min-w-0 space-y-[var(--lms-space-3)]">
    {success && <p role="status" className="text-sm font-semibold text-[var(--lms-teal-deep)]">{success}</p>}
    <Button type="button" onClick={() => { setError(null); setOpen(true); }}
      className="min-h-11 w-full sm:w-auto md:min-h-9">
      {BATCH_PROMOTION_COPY.promoteButton}
    </Button>
    <ConfirmDialog open={open} onOpenChange={setOpen} title="Promote Batch" description={"Confirm promotion to term "+targetTerm} confirmLabel="Yes, Promote" pending={pending} onConfirm={submit}>
      <p className="m-0 break-words font-semibold text-foreground">Confirm promotion to term {targetTerm}</p>
      <p className="mt-[var(--lms-space-2)] max-w-prose text-sm leading-5 text-body">
        This changes the saved progression version and academic year for this batch.
        The server will reject any blockers or a stale preview.
        {promotionImpactMessage(learnerCount)}.
        This operation does not move learners to a different class or period.
      </p>
      {error ? <p role="alert" className="mt-[var(--lms-space-2)] break-words text-sm font-semibold text-error">{error}</p> : null}

    </ConfirmDialog>
  </div>;
}
