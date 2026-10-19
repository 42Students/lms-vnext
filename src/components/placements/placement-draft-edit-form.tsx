"use client";

import {
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/toast";
import { useUnsavedDriveGuard } from "./use-unsaved-drive-guard";
import {apiFetch} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";

type ApplicationMode =
  | "INTERNAL"
  | "HYBRID"
  | "EXTERNAL_ONLY";
type EmploymentType =
  | "FULL_TIME"
  | "INTERNSHIP"
  | "CONTRACT";
type WorkMode =
  | "ONSITE"
  | "HYBRID"
  | "REMOTE";

export type PlacementAcademicTargetingOptions = {
  programs: Array<{
    id: string;
    name: string;
    code: string;
    departmentName: string;
  }>;
  cohorts: Array<{
    id: string;
    name: string;
    code: string;
    programId: string;
    programName: string;
    status: string;
  }>;
};

export type PlacementDraftEditValue = {
  job: {
    id: string;
    title: string;
    description: string;
    employmentType: EmploymentType;
    workMode: WorkMode;
    locations: string[];
    openings: number | null;
    minimumAnnualCtcInr: number | null;
    maximumAnnualCtcInr: number | null;
    applicationMode: ApplicationMode;
    externalApplicationUrl: string | null;
    applicationDeadline: string | null;
  };
  policy: {
    allowedProgramIds: string[];
    allowedCohortIds: string[];
    minCgpa: number | null;
    maxActiveBacklogs: number | null;
    maxPastBacklogs: number | null;
    minTenthPercentage: number | null;
    minTwelfthPercentage: number | null;
    minDiplomaPercentage: number | null;
    minUndergraduatePercentage: number | null;
    maxGapYears: number | null;
    allowedPassingYears: number[];
    missingEvidencePolicy:
      | "ALLOW_WITH_FLAG"
      | "REQUIRE_COMPLETE";
  };
};

const inputClass = "w-full";
const textareaClass = "min-h-28 w-full";

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function nullableDecimal(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function nullableInteger(
  value: string,
  multiplier = 1,
) {
  const parsed = nullableDecimal(value);
  return parsed === null
    ? null
    : Math.round(parsed * multiplier);
}

function toLocalInput(
  value: string | null,
) {
  if (!value) return "";
  const date = new Date(value);
  const local = new Date(
    date.getTime() -
      date.getTimezoneOffset() * 60_000,
  );
  return local.toISOString().slice(0, 16);
}

async function requestJson(url:string,method:"POST"|"PUT"|"PATCH",body:unknown){
 return await apiFetch<Record<string,unknown>>(url,{
  method,headers:{"content-type":"application/json"},body:JSON.stringify(body),
 });
}

export function PlacementDraftEditForm({
  value,
  academicOptions,
}: {
  value: PlacementDraftEditValue;
  academicOptions: PlacementAcademicTargetingOptions;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const { dirty, markDirty, clearDirty } = useUnsavedDriveGuard();
  const {pending,run}=useGuardedAction();
  const [
    applicationMode,
    setApplicationMode,
  ] = useState<ApplicationMode>(
    value.job.applicationMode,
  );
  const [
    selectedProgramIds,
    setSelectedProgramIds,
  ] = useState<string[]>(
    value.policy.allowedProgramIds,
  );
  const [
    selectedCohortIds,
    setSelectedCohortIds,
  ] = useState<string[]>(
    value.policy.allowedCohortIds,
  );

  function toggleId(
    value: string,
    current: string[],
    setCurrent: (
      next:
        | string[]
        | ((previous: string[]) => string[]),
    ) => void,
  ) {
    setCurrent(
      current.includes(value)
        ? current.filter(
            (item) => item !== value,
          )
        : [...current, value],
    );
  }

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    await run(async()=>{
    try {
      const data = new FormData(
        event.currentTarget,
      );
      const deadline = String(
        data.get("applicationDeadline") ??
          "",
      );

      await requestJson(
        `/api/placements/jobs/${value.job.id}`,
        "PATCH",
        {
          title: String(
            data.get("title") ?? "",
          ).trim(),
          description: String(
            data.get("description") ?? "",
          ).trim(),
          employmentType: String(
            data.get("employmentType") ??
              "FULL_TIME",
          ),
          workMode: String(
            data.get("workMode") ??
              "ONSITE",
          ),
          locations: splitList(
            String(
              data.get("locations") ?? "",
            ),
          ),
          openings: nullableInteger(
            String(
              data.get("openings") ?? "",
            ),
          ),
          minimumAnnualCtcInr:
            nullableInteger(
              String(
                data.get("minimumLpa") ??
                  "",
              ),
              100_000,
            ),
          maximumAnnualCtcInr:
            nullableInteger(
              String(
                data.get("maximumLpa") ??
                  "",
              ),
              100_000,
            ),
          applicationMode,
          externalApplicationUrl:
            applicationMode === "INTERNAL"
              ? null
              : String(
                  data.get(
                    "externalApplicationUrl",
                  ) ?? "",
                ).trim() || null,
          applicationDeadline:
            deadline
              ? new Date(
                  deadline,
                ).toISOString()
              : null,
        },
      );

      await requestJson(
        `/api/placements/jobs/${value.job.id}/eligibility-policy`,
        "PUT",
        {
          allowedProgramIds:
            selectedProgramIds,
          allowedCohortIds:
            selectedCohortIds,
          minCgpa: nullableDecimal(
            String(
              data.get("minCgpa") ?? "",
            ),
          ),
          maxActiveBacklogs:
            nullableInteger(
              String(
                data.get(
                  "maxActiveBacklogs",
                ) ?? "",
              ),
            ),
          maxPastBacklogs:
            nullableInteger(
              String(
                data.get(
                  "maxPastBacklogs",
                ) ?? "",
              ),
            ),
          minTenthPercentage:
            nullableDecimal(
              String(
                data.get(
                  "minTenthPercentage",
                ) ?? "",
              ),
            ),
          minTwelfthPercentage:
            nullableDecimal(
              String(
                data.get(
                  "minTwelfthPercentage",
                ) ?? "",
              ),
            ),
          minDiplomaPercentage:
            nullableDecimal(
              String(
                data.get(
                  "minDiplomaPercentage",
                ) ?? "",
              ),
            ),
          minUndergraduatePercentage:
            nullableDecimal(
              String(
                data.get(
                  "minUndergraduatePercentage",
                ) ?? "",
              ),
            ),
          maxGapYears:
            nullableInteger(
              String(
                data.get("maxGapYears") ??
                  "",
              ),
            ),
          allowedPassingYears:
            splitList(
              String(
                data.get(
                  "passingYears",
                ) ?? "",
              ),
            ).map(Number),
          missingEvidencePolicy:
            String(
              data.get(
                "missingEvidencePolicy",
              ) ??
                "ALLOW_WITH_FLAG",
            ),
        },
      );

      showToast({
        tone: "success",
        title: "Draft updated",
        description:
          "Job details and eligibility rules were saved.",
      });
      clearDirty();
      router.refresh();
    } catch (error) {
      showToast({
        tone: "error",
        title: "Could not update draft",
        description:
          error instanceof Error
            ? error.message
            : "Please try again.",
      });
    }
    });
  }

  return (
    <details className="border-y border-border">
      <summary className="cursor-pointer py-4 text-base font-semibold text-foreground">
        Edit draft opportunity
      </summary>
      <form
        onSubmit={submit}
      onChange={markDirty}
        className="grid gap-5 border-t border-border py-5"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="lg:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Job title
            </span>
            <Input
              className={inputClass}
              name="title"
              required
              maxLength={200}
              defaultValue={value.job.title}
            />
          </label>
          <label className="lg:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Description
            </span>
            <Textarea
              className={textareaClass}
              name="description"
              required
              maxLength={20000}
              defaultValue={
                value.job.description
              }
            />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Employment type
            </span>
            <Select
              className={inputClass}
              name="employmentType"
              defaultValue={
                value.job.employmentType
              }
            >
              <option value="FULL_TIME">Full time</option>
              <option value="INTERNSHIP">Internship</option>
              <option value="CONTRACT">Contract</option>
            </Select>
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Work mode
            </span>
            <Select
              className={inputClass}
              name="workMode"
              defaultValue={value.job.workMode}
            >
              <option value="ONSITE">Onsite</option>
              <option value="HYBRID">Hybrid</option>
              <option value="REMOTE">Remote</option>
            </Select>
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Locations
            </span>
            <Input
              className={inputClass}
              name="locations"
              defaultValue={
                value.job.locations.join(", ")
              }
              placeholder="Hyderabad, Bengaluru"
            />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Openings
            </span>
            <Input
              className={inputClass}
              name="openings"
              type="number"
              min={1}
              defaultValue={
                value.job.openings ?? ""
              }
            />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Minimum CTC (LPA)
            </span>
            <Input
              className={inputClass}
              name="minimumLpa"
              type="number"
              min={0}
              step="0.1"
              defaultValue={
                value.job.minimumAnnualCtcInr === null
                  ? ""
                  : value.job.minimumAnnualCtcInr / 100_000
              }
            />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Maximum CTC (LPA)
            </span>
            <Input
              className={inputClass}
              name="maximumLpa"
              type="number"
              min={0}
              step="0.1"
              defaultValue={
                value.job.maximumAnnualCtcInr === null
                  ? ""
                  : value.job.maximumAnnualCtcInr / 100_000
              }
            />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Application mode
            </span>
            <Select
              className={inputClass}
              value={applicationMode}
              onChange={(event) =>
                setApplicationMode(
                  event.target.value as ApplicationMode,
                )
              }
            >
              <option value="INTERNAL">LMS application</option>
              <option value="HYBRID">LMS or employer form</option>
              <option value="EXTERNAL_ONLY">Employer form only</option>
            </Select>
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Employer application URL
            </span>
            <Input
              className={inputClass}
              name="externalApplicationUrl"
              type="url"
              disabled={
                applicationMode === "INTERNAL"
              }
              defaultValue={
                value.job.externalApplicationUrl ?? ""
              }
            />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Application deadline
            </span>
            <Input
              className={inputClass}
              name="applicationDeadline"
              type="datetime-local"
              defaultValue={toLocalInput(
                value.job.applicationDeadline,
              )}
            />
          </label>
        </div>

        <div className="border-t border-border pt-5">
          <h3 className="m-0 text-sm font-semibold text-foreground">
            Eligibility rules
          </h3>
          <p className="mt-1 text-xs leading-5 text-body">
            Leave programs and cohorts unselected to keep the opportunity college-wide.
          </p>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <fieldset className="rounded-[var(--lms-canvas-radius)] border border-border bg-muted p-4">
              <legend className="px-1 text-xs font-semibold text-body">
                Eligible programs
              </legend>
              {academicOptions.programs.length === 0 ? (
                <p className="m-0 text-sm text-muted-foreground">
                  No active programs are available in this college yet.
                </p>
              ) : (
                <div className="grid gap-2">
                  {academicOptions.programs.map(
                    (program) => (
                      <label
                        key={program.id}
                        className="flex items-start gap-2 text-sm text-body"
                      >
                        <Checkbox
                          checked={selectedProgramIds.includes(
                            program.id,
                          )}
                          onChange={() =>
                            toggleId(
                              program.id,
                              selectedProgramIds,
                              setSelectedProgramIds,
                            )
                          }
                        />
                        <span>
                          <span className="font-semibold text-foreground">
                            {program.name}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {program.code} ·{" "}
                            {program.departmentName}
                          </span>
                        </span>
                      </label>
                    ),
                  )}
                </div>
              )}
            </fieldset>

            <fieldset className="rounded-[var(--lms-canvas-radius)] border border-border bg-muted p-4">
              <legend className="px-1 text-xs font-semibold text-body">
                Eligible cohorts
              </legend>
              <p className="mb-3 mt-0 text-xs leading-5 text-muted-foreground">
                Cohort selection narrows eligibility further when used with program selection.
              </p>
              {academicOptions.cohorts.length === 0 ? (
                <p className="m-0 text-sm text-muted-foreground">
                  No active or planned cohorts are available yet.
                </p>
              ) : (
                <div className="grid gap-2">
                  {academicOptions.cohorts.map(
                    (cohort) => (
                      <label
                        key={cohort.id}
                        className="flex items-start gap-2 text-sm text-body"
                      >
                        <Checkbox
                          checked={selectedCohortIds.includes(
                            cohort.id,
                          )}
                          onChange={() =>
                            toggleId(
                              cohort.id,
                              selectedCohortIds,
                              setSelectedCohortIds,
                            )
                          }
                        />
                        <span>
                          <span className="font-semibold text-foreground">
                            {cohort.name}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {cohort.code} ·{" "}
                            {cohort.programName} ·{" "}
                            {cohort.status}
                          </span>
                        </span>
                      </label>
                    ),
                  )}
                </div>
              )}
            </fieldset>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["minCgpa", "Minimum CGPA", value.policy.minCgpa, "0.01"],
              ["maxActiveBacklogs", "Max active backlogs", value.policy.maxActiveBacklogs, "1"],
              ["maxPastBacklogs", "Max past backlogs", value.policy.maxPastBacklogs, "1"],
              ["maxGapYears", "Max gap years", value.policy.maxGapYears, "1"],
              ["minTenthPercentage", "Minimum 10th %", value.policy.minTenthPercentage, "0.01"],
              ["minTwelfthPercentage", "Minimum 12th %", value.policy.minTwelfthPercentage, "0.01"],
              ["minDiplomaPercentage", "Minimum diploma %", value.policy.minDiplomaPercentage, "0.01"],
              ["minUndergraduatePercentage", "Minimum UG %", value.policy.minUndergraduatePercentage, "0.01"],
            ].map(([name,label,current,step]) => (
              <label key={String(name)}>
                <span className="mb-1.5 block text-xs font-semibold text-body">
                  {label}
                </span>
                <Input
                  className={inputClass}
                  name={String(name)}
                  type="number"
                  min={0}
                  step={String(step)}
                  defaultValue={
                    current === null
                      ? ""
                      : String(current)
                  }
                />
              </label>
            ))}
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-xs font-semibold text-body">
                Passing years
              </span>
              <Input
                className={inputClass}
                name="passingYears"
                defaultValue={value.policy.allowedPassingYears.join(", ")}
                placeholder="2026, 2027"
              />
            </label>
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-xs font-semibold text-body">
                Missing evidence
              </span>
              <Select
                className={inputClass}
                name="missingEvidencePolicy"
                defaultValue={
                  value.policy.missingEvidencePolicy
                }
              >
                <option value="ALLOW_WITH_FLAG">
                  Allow with missing-data flag
                </option>
                <option value="REQUIRE_COMPLETE">
                  Require complete evidence
                </option>
              </Select>
            </label>
          </div>
        </div>

        <div>
          <Button
            type="submit"
            size="sm"
            disabled={pending}
          >
            {pending
              ? "Saving…"
              : "Save draft changes"}
          </Button>
        </div>
        {dirty ? <p role="status" className="text-xs text-muted-foreground">You have unsaved changes. Save this draft before leaving the page.</p> : null}
      </form>
    </details>
  );
}
