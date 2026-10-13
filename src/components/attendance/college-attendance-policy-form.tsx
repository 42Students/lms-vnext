"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  const [message, setMessage] =
    useState<SaveMessage | null>(null);

  async function save(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(
        "/api/attendance/admin/policy",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            collegeId,
            eligibilityThresholdPercent:
              Number(threshold),
            correctionWindowHours:
              Number(correctionHours),
          }),
        },
      );

      if (!response.ok) {
        if (
          response.status === 401 ||
          response.status === 403
        ) {
          throw new Error(
            "You are not authorized to change this college's attendance policy.",
          );
        }

        if (response.status === 400) {
          throw new Error(
            "Enter a whole-number threshold from 1 to 100 and a correction window from 1 to 168 hours.",
          );
        }

        throw new Error(
          "The attendance policy could not be saved. Please retry.",
        );
      }

      const result: {
        policy: PolicyValues;
      } = await response.json();

      setThreshold(
        String(
          result.policy.eligibilityThresholdPercent,
        ),
      );
      setCorrectionHours(
        String(
          result.policy.correctionWindowHours,
        ),
      );

      setMessage({
        kind: "success",
        text: "Attendance policy saved. New attendance reads and corrections will use these settings.",
      });

      router.refresh();
    } catch (error) {
      setMessage({
        kind: "error",
        text:
          error instanceof Error
            ? error.message
            : "The attendance policy could not be saved.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
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
        <span className="text-xs text-muted-foreground">
          Changes apply to this college only.
        </span>
      </div>
    </form>
  );
}
