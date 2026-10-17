"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {apiFetch} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {DEFAULT_ATTENDANCE_POLICY} from "@/modules/attendance/policy-validation";

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
}: {
  collegeId: string;
  initialPolicy: PolicyValues;
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

  return (
    <>
    <form
      onSubmit={save}
      className="space-y-6 rounded-xl border border-border bg-surface p-5 sm:p-6"
    >
      <div>
        <h2 className="m-0 text-lg font-semibold text-foreground">
          College attendance policy
        </h2>
        <p className="mt-2 text-sm leading-6 text-body">
          These values are stored for this college.
          The eligibility threshold highlights low
          attendance, while the correction window
          controls how long attendance can be
          corrected after a class ends.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="attendance-eligibility-threshold"
            className="mb-1.5 block text-sm font-semibold text-body"
          >
            Eligibility threshold (%)
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
            disabled={saving}
            value={threshold}
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

        <div>
          <label
            htmlFor="attendance-correction-window"
            className="mb-1.5 block text-sm font-semibold text-body"
          >
            Correction window (hours)
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
            disabled={saving}
            value={correctionHours}
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

      <p className="rounded-lg bg-muted px-4 py-3 text-sm leading-6 text-body">
        Changing the correction window affects
        the permitted correction period for
        existing as well as future sessions.
        Existing attendance records are not
        modified by saving this policy.
      </p>

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

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
        <Button
          type="submit"
          disabled={saving}
        >
          {saving
            ? "Saving policy…"
            : "Save attendance policy"}
        </Button>
        <Button type="button" variant="secondary" disabled={saving||pending}
          onClick={()=>setResetOpen(true)}>Reset to default</Button>
        <span className="text-xs text-muted-foreground">
          Changes apply to this college only.
        </span>
      </div>
    </form>
    <ConfirmDialog open={resetOpen} onOpenChange={setResetOpen}
      title="Reset attendance policy to default?"
      description="The threshold will return to 75% and the correction window to 24 hours. This also affects which past sessions may be corrected; existing attendance records are not changed."
      confirmLabel="Reset to default" pending={saving||pending}
      onConfirm={()=>void resetToDefaults()}/>
    </>
  );
}
