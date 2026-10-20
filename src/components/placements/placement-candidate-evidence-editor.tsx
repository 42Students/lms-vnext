"use client";

import { Disclosure } from "@/components/ui/disclosure";
import {
  useState,
  type FormEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";

type AcademicEvidence = {
  cgpa: number | null;
  activeBacklogs: number | null;
  pastBacklogs: number | null;
  tenthPercentage: number | null;
  twelfthPercentage: number | null;
  diplomaPercentage: number | null;
  undergraduatePercentage: number | null;
  gapYears: number | null;
  isLateralEntry: boolean;
  passingYear: number | null;
  source: "SELF" | "VERIFIED" | null;
  verifiedAt?: string | Date | null;
};

function numberOrNull(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? parsed
    : null;
}

export function PlacementCandidateEvidenceEditor({
  membershipId,
  onSaved,
}: {
  membershipId: string;
  onSaved?: () => void | Promise<void>;
}) {
  const { showToast } = useToast();
  const [loaded, setLoaded] =
    useState(false);
  const [loading, setLoading] =
    useState(false);
  const [inlineError, setInlineError] = useState("");
  const [pending, setPending] =
    useState(false);
  const [evidence, setEvidence] =
    useState<AcademicEvidence | null>(null);
  const [
    lateralEntry,
    setLateralEntry,
  ] = useState(false);

  async function loadEvidence() {
    if (loading) return;
    setInlineError("");
    setLoading(true);
    try {
      const response = await fetch(
        `/api/placements/academic-evidence/${membershipId}`,
      );
      const payload = (await response
        .json()
        .catch(() => null)) as
        | {
            evidence?: AcademicEvidence | null;
            error?: string;
          }
        | null;
      if (!response.ok) {
        throw new Error(
          payload?.error ??
            "Academic evidence could not be loaded.",
        );
      }
      const next =
        payload?.evidence ?? null;
      setEvidence(next);
      setLateralEntry(
        next?.isLateralEntry ?? false,
      );
      setLoaded(true);
    } catch (error) {
      setInlineError(error instanceof Error ? error.message : "Please try again.");
      showToast({
        tone: "error",
        title: "Could not load evidence",
        description:
          error instanceof Error
            ? error.message
            : "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function save(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    if (pending || !loaded) return;
    setInlineError("");
    setPending(true);
    try {
      const data = new FormData(
        event.currentTarget,
      );
      const response = await fetch(
        `/api/placements/academic-evidence/${membershipId}`,
        {
          method: "PUT",
          headers: {
            "content-type":
              "application/json",
          },
          body: JSON.stringify({
            cgpa: numberOrNull(
              String(
                data.get("cgpa") ?? "",
              ),
            ),
            activeBacklogs:
              numberOrNull(
                String(
                  data.get(
                    "activeBacklogs",
                  ) ?? "",
                ),
              ),
            pastBacklogs: numberOrNull(
              String(
                data.get(
                  "pastBacklogs",
                ) ?? "",
              ),
            ),
            tenthPercentage:
              numberOrNull(
                String(
                  data.get(
                    "tenthPercentage",
                  ) ?? "",
                ),
              ),
            twelfthPercentage:
              lateralEntry
                ? null
                : numberOrNull(
                    String(
                      data.get(
                        "twelfthPercentage",
                      ) ?? "",
                    ),
                  ),
            diplomaPercentage:
              lateralEntry
                ? numberOrNull(
                    String(
                      data.get(
                        "diplomaPercentage",
                      ) ?? "",
                    ),
                  )
                : null,
            undergraduatePercentage:
              numberOrNull(
                String(
                  data.get(
                    "undergraduatePercentage",
                  ) ?? "",
                ),
              ),
            gapYears: numberOrNull(
              String(
                data.get("gapYears") ?? "",
              ),
            ),
            isLateralEntry: lateralEntry,
            passingYear: numberOrNull(
              String(
                data.get(
                  "passingYear",
                ) ?? "",
              ),
            ),
          }),
        },
      );
      const payload = (await response
        .json()
        .catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) {
        throw new Error(
          payload?.error ??
            "Academic evidence could not be verified.",
        );
      }

      showToast({
        tone: "success",
        title: "Evidence verified",
        description:
          "Placement eligibility now uses the college-verified academic evidence.",
      });
      await loadEvidence();
      await onSaved?.();
    } catch (error) {
      setInlineError(error instanceof Error ? error.message : "Please try again.");
      showToast({
        tone: "error",
        title: "Could not verify evidence",
        description:
          error instanceof Error
            ? error.message
            : "Please try again.",
      });
    } finally {
      setPending(false);
    }
  }

  const evidenceFields = [
    ["cgpa", "CGPA", evidence?.cgpa, "0.01", "10"],
    ["tenthPercentage", "10th %", evidence?.tenthPercentage, "0.01", "100"],
    ["undergraduatePercentage", "UG %", evidence?.undergraduatePercentage, "0.01", "100"],
    ["activeBacklogs", "Active backlogs", evidence?.activeBacklogs, "1", "100"],
    ["pastBacklogs", "Past backlogs", evidence?.pastBacklogs, "1", "100"],
    ["gapYears", "Gap years", evidence?.gapYears, "1", "50"],
    ["passingYear", "Passing year", evidence?.passingYear, "1", "2200"],
  ] as const;
  const renderEvidenceField = ([name,label,value,step,max]: typeof evidenceFields[number]) => (
    <label key={name} className="min-w-0">
      <span className="mb-1 block text-[var(--lms-font-sm)] font-semibold text-body">{label}</span>
      <Input className="min-h-11 w-full md:min-h-9" name={name} type="number" min={0}
        max={max} step={step} defaultValue={value==null?"":String(value)} />
    </label>
  );

  return (
    <Disclosure title="Academic evidence" className="min-w-0 border-y border-border py-2">
      <div className="min-w-0 space-y-3 pt-3">
        {!loaded ? (
          <Button
            size="sm"
            type="button"
            className="min-h-11 w-full sm:w-auto md:min-h-9"
            variant="secondary"
            disabled={loading}
            onClick={loadEvidence}
          >
            {loading
              ? "Loading…"
              : "Load academic evidence"}
          </Button>
        ) : (
          <form
            onSubmit={save}
            className="min-w-0 space-y-4"
          >
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Source
              </span>
              <StatusBadge
                tone={
                  evidence?.source ===
                  "VERIFIED"
                    ? "success"
                    : evidence?.source ===
                        "SELF"
                      ? "info"
                      : "neutral"
                }
              >
                {evidence?.source ===
                "VERIFIED"
                  ? "College verified"
                  : evidence?.source ===
                      "SELF"
                    ? "Self reported"
                    : "Not provided"}
              </StatusBadge>
            </div>

            <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {evidenceFields.slice(0,3).map(renderEvidenceField)}
              <label className="flex min-h-11 min-w-0 items-center gap-2 self-end py-2 text-[var(--lms-font-sm)] font-semibold text-body">
                <Checkbox
                  checked={lateralEntry}
                  onChange={(event) =>
                    setLateralEntry(
                      event.target.checked,
                    )
                  }
                />
                Lateral entry
              </label>

              {lateralEntry ? (
                <label>
                  <span className="mb-1 block text-[var(--lms-font-sm)] font-semibold text-body">
                    Diploma %
                  </span>
                  <Input
                    className="min-h-11 w-full md:min-h-9"
                    name="diplomaPercentage"
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    defaultValue={
                      evidence?.diplomaPercentage ??
                      ""
                    }
                  />
                </label>
              ) : (
                <label>
                  <span className="mb-1 block text-[var(--lms-font-sm)] font-semibold text-body">
                    12th %
                  </span>
                  <Input
                    className="min-h-11 w-full md:min-h-9"
                    name="twelfthPercentage"
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    defaultValue={
                      evidence?.twelfthPercentage ??
                      ""
                    }
                  />
                </label>
              )}
            </div>
            <Disclosure title="Other academic details" className="border-t border-border py-3">
              <div className="grid min-w-0 gap-3 pt-2 sm:grid-cols-2 lg:grid-cols-3">
                {evidenceFields.slice(3).map(renderEvidenceField)}
              </div>
            </Disclosure>

            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="submit"
                className="min-h-11 w-full sm:w-auto md:min-h-9"
                size="sm"
                disabled={pending}
              >
                {pending
                  ? "Verifying…"
                  : "Save as college verified"}
              </Button>
            </div>
          </form>
        )}
        {inlineError ? <p role="alert" className="text-sm text-destructive">{inlineError}</p> : null}
      </div>
    </Disclosure>
  );
}
