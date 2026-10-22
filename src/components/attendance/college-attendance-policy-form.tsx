"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { apiFetch } from "@/lib/api-fetch";
import { useGuardedAction } from "@/hooks/use-guarded-action";
import { DEFAULT_ATTENDANCE_POLICY } from "@/modules/attendance/policy-validation";

type PolicyValues = {
  eligibilityThresholdPercent: number;
  correctionWindowHours: number;
};

type SaveMessage = {
  kind: "success" | "error";
  text: string;
};

export function CollegeAttendancePolicyForm({
  collegeId,
  initialPolicy,
  readOnly = false,
}: {
  collegeId: string;
  initialPolicy: PolicyValues;
  readOnly?: boolean;
}) {
  const router = useRouter();

  const [threshold, setThreshold] = useState(
    String(
      initialPolicy.eligibilityThresholdPercent,
    ),
  );
  const [correctionHours, setCorrectionHours] =
    useState(
      String(
        initialPolicy.correctionWindowHours,
      ),
    );
  const [saving, setSaving] = useState(false);
  const [resetOpen,setResetOpen]=useState(false);
  const {pending,run}=useGuardedAction({timeoutMs:35000});
  const [message, setMessage] =
    useState<SaveMessage | null>(null);

  async function persistPolicy(values:PolicyValues,successText:string){
    if(saving||pending)return;
    setSaving(true);
    setMessage(null);
    try{
      await run(async()=>{
        const result=await apiFetch<{policy:PolicyValues}>("/api/attendance/admin/policy",{
          method:"PUT",credentials:"same-origin",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({collegeId,...values}),
        });
        setThreshold(String(result.policy.eligibilityThresholdPercent));
        setCorrectionHours(String(result.policy.correctionWindowHours));
        setMessage({kind:"success",text:successText});
        router.refresh();
      });
    }catch(reason){
      setMessage({kind:"error",text:reason instanceof Error?reason.message:
        "The attendance policy could not be saved. Please retry."});
    }finally{
      setSaving(false);
    }
  }

  async function save(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    await persistPolicy({
      eligibilityThresholdPercent:Number(threshold),
      correctionWindowHours:Number(correctionHours),
    },"Attendance policy saved. New attendance reads and corrections will use these settings.");
  }

  async function resetToDefaults(){
    setResetOpen(false);
    // COL-attendance-16: reset persists through the audited, college-scoped PUT.
    await persistPolicy(DEFAULT_ATTENDANCE_POLICY,
      "Attendance policy reset to the defaults. Existing attendance records remain unchanged.");
  }

  if (readOnly) {
    return <section aria-label="College attendance policy" className="min-w-0 max-w-[920px] space-y-4 border-b border-[var(--lms-canvas-border)] pb-4">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--lms-heading)]">College attendance policy</h2>
          <p className="mt-1 text-sm text-muted-foreground">These attendance policy fields are read-only for College Admin.</p>
        </div>
        <Button type="button" variant="secondary" className="min-h-11 md:min-h-9"
          onClick={()=>router.refresh()} aria-label="Reload attendance policy">
          <span aria-hidden="true">↻</span> Reload
        </Button>
      </div>
      <dl className="grid min-w-0 gap-4 sm:grid-cols-2">
        <div className="min-w-0">
          <dt className="text-sm font-semibold text-[var(--lms-heading)]">Eligibility threshold (%) <span className="text-xs font-normal text-muted-foreground">Read-only</span></dt>
          <dd className="mt-2 rounded-[var(--lms-control-radius)] border border-border bg-muted p-3 text-sm tabular-nums text-body">{initialPolicy.eligibilityThresholdPercent}%</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-sm font-semibold text-[var(--lms-heading)]">Correction window (hours) <span className="text-xs font-normal text-muted-foreground">Read-only</span></dt>
          <dd className="mt-2 rounded-[var(--lms-control-radius)] border border-border bg-muted p-3 text-sm tabular-nums text-body">{initialPolicy.correctionWindowHours} hours</dd>
        </div>
      </dl>
      <p className="text-xs leading-5 text-muted-foreground">A Super Admin with the selected college scope can change these values. Reload to read the latest saved policy.</p>
    </section>;
  }

  return (
    <>
    <form
      onSubmit={save}
      className="min-w-0 max-w-[920px] space-y-[var(--lms-space-4)] [overflow-wrap:anywhere]"
    >
      <div className="min-w-0 border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)]">
        <h2 className="m-0 text-lg font-semibold text-[var(--lms-heading)]">
          College attendance policy
        </h2>
        <p className="mt-2 max-w-[65ch] text-sm leading-[22px] text-body">
          These values are stored for this college.
          The eligibility threshold highlights low
          attendance, while the correction window
          controls how long attendance can be
          corrected after a class ends.
        </p>
      </div>

      <div className="grid min-w-0 items-start gap-[var(--lms-space-4)] sm:grid-cols-2">
        <div className="min-w-0">
          <label
            htmlFor="attendance-eligibility-threshold"
            className="mb-[6px] block text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]"
          >
            Eligibility threshold (%)<span aria-hidden="true" className="ml-1 text-[var(--lms-error)]">*</span>
          </label>
          <Input
            id="attendance-eligibility-threshold"
            name="eligibilityThresholdPercent"
            type="number"
            inputMode="numeric"
            min={1}
            max={100}
            step={1}
            required
            disabled={saving || pending}
            value={threshold}
            className="min-h-11 w-full min-w-0 md:min-h-9"
            onChange={(event) => {
              setThreshold(event.target.value);
              setMessage(null);
            }}
          />
          <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
            Whole number from 1 to 100. Learners
            below this percentage are flagged
            in attendance summaries.
          </p>
        </div>

        <div className="min-w-0">
          <label
            htmlFor="attendance-correction-window"
            className="mb-[6px] block text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]"
          >
            Correction window (hours)<span aria-hidden="true" className="ml-1 text-[var(--lms-error)]">*</span>
          </label>
          <Input
            id="attendance-correction-window"
            name="correctionWindowHours"
            type="number"
            inputMode="numeric"
            min={1}
            max={168}
            step={1}
            required
            disabled={saving || pending}
            value={correctionHours}
            className="min-h-11 w-full min-w-0 md:min-h-9"
            onChange={(event) => {
              setCorrectionHours(event.target.value);
              setMessage(null);
            }}
          />
          <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
            Whole number from 1 to 168 hours.
            The window starts at the end of each
            class session.
          </p>
        </div>
      </div>

      <Alert tone="warning" className="min-w-0 break-words">
        Changing the correction window affects
        the permitted correction period for
        existing as well as future sessions.
        Existing attendance records are not
        modified by saving this policy.
      </Alert>

      {message ? (
        <p
          role={
            message.kind === "error"
              ? "alert"
              : "status"
          }
          aria-live="polite"
          className={
            message.kind === "error"
              ? "text-sm font-semibold text-error"
              : "text-sm font-semibold text-success"
          }
        >
          {message.text}
        </p>
      ) : null}

      <div className="flex min-w-0 flex-col items-stretch gap-[var(--lms-space-3)] border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-4)] sm:flex-row sm:flex-wrap sm:items-center">
        <Button
          type="submit"
          className="min-h-11 w-full sm:w-auto md:min-h-9"
          loading={saving || pending}
          disabled={saving || pending}
        >
          {saving
            ? "Saving policy…"
            : "Save attendance policy"}
        </Button>
        <Button type="button" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={saving || pending}
          onClick={()=>setResetOpen(true)}>Reset to default</Button>
        <span className="min-w-0 break-words text-xs leading-5 text-muted-foreground sm:ml-auto sm:max-w-52">
          Changes apply to this college only.
        </span>
      </div>
    </form>
    <ConfirmDialog open={resetOpen} onOpenChange={open=>{if(!saving&&!pending)setResetOpen(open);}}
      title="Reset attendance policy to default?"
      description="The threshold will return to 75% and the correction window to 24 hours. This also affects which past sessions may be corrected; existing attendance records are not changed."
      confirmLabel="Reset to default" pending={saving||pending}
      onConfirm={()=>void resetToDefaults()}/>
    </>
  );
}
