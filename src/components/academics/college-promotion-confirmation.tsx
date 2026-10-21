"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useToast } from "@/components/ui/toast";
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
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function submit() {
    if (pending) return;
    startTransition(async () => {
      setError(null);
      setSuccess(null);
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
        const payload: unknown = await response.json().catch(() => null);
        const result = payload && typeof payload === "object" && "result" in payload
          ? payload.result : null;
        if (!result || typeof result !== "object" ||
            !("cohortId" in result) || result.cohortId !== cohortId ||
            !("currentTermNumber" in result) || result.currentTermNumber !== targetTerm ||
            !("version" in result) || typeof result.version !== "number" ||
            result.version !== expectedVersion + 1) {
          throw new Error("The promotion response could not be verified. Refresh the preview before retrying.");
        }
        const incomplete = "facultySetupIncomplete" in result &&
          result.facultySetupIncomplete === true;
        const headline = `Batch promoted to Semester ${targetTerm}.`;
        setSuccess(incomplete ? headline + " Faculty setup is still incomplete." : headline);
        showToast({ tone: "success", title: headline,
          description: incomplete ? "Faculty setup is still incomplete." : undefined });
        setOpen(false);
        router.refresh();
      } catch (cause) {
        const code=cause instanceof Error?cause.message:"";
        const message=code==="PROMOTION_STALE"||code==="PROMOTION_PREVIEW_CHANGED"
          ? "This batch changed after you opened the dialog. Refresh the preview and try again."
          : code==="PROMOTION_BLOCKED"
            ? "The batch is not ready to promote. Refresh the preview to review blockers."
            : academicSetupErrorMessage(cause, "Refresh the promotion preview and try again.");
        setError(message);
      }
    });
  }

  return <div className="min-w-0 space-y-[var(--lms-space-3)]">
    {success ? <Alert tone="success">{success}</Alert> : null}
    <Button type="button" disabled={pending} onClick={() => { setError(null); setSuccess(null); setOpen(true); }}
      className="min-h-11 w-full sm:w-auto md:min-h-9">
      {BATCH_PROMOTION_COPY.promoteButton}
    </Button>
    <ConfirmDialog open={open} onOpenChange={next=>{if(!pending)setOpen(next);}}
      title="Promote Batch" description={"Confirm promotion to Semester "+targetTerm}
      confirmLabel="Yes, Promote" pending={pending} onConfirm={submit}>
      <div aria-busy={pending} className="min-w-0 space-y-3">
      <p className="m-0 max-w-prose break-words text-sm leading-[22px] text-body">
        {promotionImpactMessage(learnerCount)}. The server will recheck blockers and the saved version.
      </p>
      <dl className="grid min-w-0 gap-3 border-y border-border py-3 text-sm sm:grid-cols-2">
        <div><dt className="text-xs text-muted-foreground">Target semester</dt>
          <dd className="font-semibold text-foreground">Semester {targetTerm}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Learners checked</dt>
          <dd className="font-semibold text-foreground">{learnerCount}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Progression version</dt>
          <dd className="font-semibold text-foreground">{expectedVersion} → {expectedVersion + 1}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Target academic-year start</dt>
          <dd className="font-semibold text-foreground">{academicYearStart}</dd></div>
        <div className="sm:col-span-2"><dt className="text-xs text-muted-foreground">Class and faculty assignments</dt>
          <dd className="text-body">Learners remain in their existing classes. Old-only teaching assignments may end;
            shared target-course assignments remain active. Exact counts are recorded at execution.</dd></div>
      </dl>
      <p className="max-w-prose border-t border-[var(--lms-canvas-border)] pt-3 text-xs leading-5 text-muted-foreground">This operation does not move learners to a different class or period.</p>
      {error ? <Alert tone="error">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <p><strong>Batch was not promoted</strong>: {error}</p>
          <Button type="button" variant="secondary" onClick={()=>setError(null)}>Dismiss</Button>
        </div>
      </Alert> : null}
      </div>

    </ConfirmDialog>
  </div>;
}
