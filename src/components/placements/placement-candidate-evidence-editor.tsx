"use client";

import { Disclosure } from "@/components/ui/disclosure";
import {
  useState,
  type FormEvent,
} from "react";
import { Button } from "@/components/ui/button";
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

const inputClass =
  "min-h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-[var(--lms-focus-ring)]";

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
  const [pending, setPending] =
    useState(false);
  const [evidence, setEvidence] =
    useState<AcademicEvidence | null>(null);
  const [
    lateralEntry,
    setLateralEntry,
  ] = useState(false);

  async function loadEvidence() {
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

  return (
    <Disclosure title="Academic evidence" className="mt-3 border-y border-border">
      <div className="border-t border-border py-3">
        {!loaded ? (
          <Button
            size="sm"
            variant="ghost"
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
            className="grid gap-3"
          >
            <div className="flex flex-wrap items-center gap-2">
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

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                [
                  "cgpa",
                  "CGPA",
                  evidence?.cgpa,
                  "0.01",
                  "10",
                ],
                [
                  "activeBacklogs",
                  "Active backlogs",
                  evidence?.activeBacklogs,
                  "1",
                  "100",
                ],
                [
                  "pastBacklogs",
                  "Past backlogs",
                  evidence?.pastBacklogs,
                  "1",
                  "100",
                ],
                [
                  "tenthPercentage",
                  "10th %",
                  evidence?.tenthPercentage,
                  "0.01",
                  "100",
                ],
                [
                  "undergraduatePercentage",
                  "UG %",
                  evidence?.undergraduatePercentage,
                  "0.01",
                  "100",
                ],
                [
                  "gapYears",
                  "Gap years",
                  evidence?.gapYears,
                  "1",
                  "50",
                ],
                [
                  "passingYear",
                  "Passing year",
                  evidence?.passingYear,
                  "1",
                  "2200",
                ],
              ].map(
                ([
                  name,
                  label,
                  value,
                  step,
                  max,
                ]) => (
                  <label
                    key={String(name)}
                  >
                    <span className="mb-1 block text-xs font-semibold text-body">
                      {label}
                    </span>
                    <input
                      className={inputClass}
                      name={String(name)}
                      type="number"
                      min={0}
                      max={String(max)}
                      step={String(step)}
                      defaultValue={
                        value == null
                          ? ""
                          : String(value)
                      }
                    />
                  </label>
                ),
              )}

              <label className="flex items-center gap-2 self-end pb-2 text-xs font-semibold text-body">
                <input
                  type="checkbox"
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
                  <span className="mb-1 block text-xs font-semibold text-body">
                    Diploma %
                  </span>
                  <input
                    className={inputClass}
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
                  <span className="mb-1 block text-xs font-semibold text-body">
                    12th %
                  </span>
                  <input
                    className={inputClass}
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

            <div>
              <Button
                type="submit"
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
      </div>
    </Disclosure>
  );
}
