"use client";

import {
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";

export type PlacementAcademicEvidenceValue = {
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
};

const inputClass =
  "min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-[14px] text-foreground outline-none transition-colors focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:bg-muted disabled:text-muted-foreground sm:min-h-9";

function numberOrNull(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? parsed
    : null;
}

export function LearnerPlacementAcademicEvidence({
  evidence,
}: {
  evidence: PlacementAcademicEvidenceValue;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const locked = evidence.source === "VERIFIED";
  const [pending, setPending] =
    useState(false);
  const [lateralEntry, setLateralEntry] =
    useState(evidence.isLateralEntry);

  async function save(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    if (locked) return;
    setPending(true);
    try {
      const data = new FormData(
        event.currentTarget,
      );
      const response = await fetch(
        "/api/placements/academic-evidence/me",
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
            "Could not save academic evidence.",
        );
      }
      showToast({
        tone: "success",
        title: "Academic evidence saved",
        description:
          "Eligibility checks will now use the updated evidence.",
      });
      router.refresh();
    } catch (error) {
      showToast({
        tone: "error",
        title: "Could not save evidence",
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
    <section id="placement-academic-evidence" className="scroll-mt-24 border-b border-border pb-5">
      <div className="flex flex-col gap-3 border-b border-border py-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="m-0 text-base font-semibold text-foreground">
            Academic eligibility evidence
          </h2>
          <p className="mt-1 text-sm text-body">
            Used only for explainable placement eligibility checks.
          </p>
        </div>
        <StatusBadge
          tone={
            locked
              ? "success"
              : evidence.source === "SELF"
                ? "info"
                : "neutral"
          }
        >
          {locked
            ? "College verified"
            : evidence.source === "SELF"
              ? "Self reported"
              : "Not provided"}
        </StatusBadge>
      </div>
      <form
        onSubmit={save}
        className="grid gap-4 py-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        {[
          ["cgpa", "CGPA", evidence.cgpa, "0.01", "10"],
          [
            "activeBacklogs",
            "Active backlogs",
            evidence.activeBacklogs,
            "1",
            "100",
          ],
          [
            "pastBacklogs",
            "Past backlogs",
            evidence.pastBacklogs,
            "1",
            "100",
          ],
          [
            "tenthPercentage",
            "10th %",
            evidence.tenthPercentage,
            "0.01",
            "100",
          ],
          [
            "undergraduatePercentage",
            "Undergraduate %",
            evidence.undergraduatePercentage,
            "0.01",
            "100",
          ],
          [
            "gapYears",
            "Gap years",
            evidence.gapYears,
            "1",
            "50",
          ],
          [
            "passingYear",
            "Passing year",
            evidence.passingYear,
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
            <label key={String(name)}>
              <span className="mb-1.5 block text-xs font-semibold text-body">
                {label}
              </span>
              <input
                className={inputClass}
                name={String(name)}
                type="number"
                min={0}
                max={String(max)}
                step={String(step)}
                disabled={locked}
                defaultValue={
                  value === null
                    ? ""
                    : String(value)
                }
              />
            </label>
          ),
        )}

        <label className="flex items-center gap-2 self-end pb-2 text-sm font-semibold text-body">
          <input
            type="checkbox"
            checked={lateralEntry}
            disabled={locked}
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
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Diploma %
            </span>
            <input
              className={inputClass}
              name="diplomaPercentage"
              type="number"
              min={0}
              max={100}
              step="0.01"
              disabled={locked}
              defaultValue={
                evidence.diplomaPercentage ??
                ""
              }
            />
          </label>
        ) : (
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              12th %
            </span>
            <input
              className={inputClass}
              name="twelfthPercentage"
              type="number"
              min={0}
              max={100}
              step="0.01"
              disabled={locked}
              defaultValue={
                evidence.twelfthPercentage ??
                ""
              }
            />
          </label>
        )}

        <div className="sm:col-span-2 lg:col-span-4">
          {locked ? (
            <p className="m-0 text-sm text-muted-foreground">
              This evidence was verified by your college and cannot be overwritten by self-service.
            </p>
          ) : (
            <Button
              type="submit"
              size="sm"
              disabled={pending}
            >
              {pending
                ? "Saving…"
                : "Save academic evidence"}
            </Button>
          )}
        </div>
      </form>
    </section>
  );
}
