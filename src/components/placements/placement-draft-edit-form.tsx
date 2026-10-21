"use client";

import { Disclosure } from "@/components/ui/disclosure";
import {
  useState,
  useRef,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/toast";
import { useUnsavedDriveGuard } from "./use-unsaved-drive-guard";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {driveDeadlineIstToIso} from "@/modules/placements/tpo-drive-deadline-ist";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {TPO_BUILTIN_JOB_TYPES} from "@/modules/placements/tpo-builtin-job-types";

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
    jobTypeLabel?:string|null;
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

const inputClass = "min-h-11 w-full min-w-0 md:min-h-9";
const textareaClass = "min-h-28 w-full min-w-0";

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
  return new Intl.DateTimeFormat("sv-SE",{
    timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
    hour:"2-digit",minute:"2-digit",hourCycle:"h23",
  }).format(new Date(value)).replace(" ","T");
}

async function requestJson(url:string,method:"POST"|"PUT"|"PATCH",body:unknown){
 return await apiFetch<Record<string,unknown>>(url,{
  method,headers:{"content-type":"application/json"},body:JSON.stringify(body),
 });
}

export function PlacementDraftEditForm({
  value,
  academicOptions,
  jobTypes,
}: {
  value: PlacementDraftEditValue;
  academicOptions: PlacementAcademicTargetingOptions;
  jobTypes?:readonly {label:string}[];
}) {
  const router = useRouter();
  const availableJobTypes=jobTypes?.length?jobTypes:TPO_BUILTIN_JOB_TYPES;
  const { showToast } = useToast();
  const { dirty, markDirty, clearDirty, guardDialog } = useUnsavedDriveGuard();
  const formRef=useRef<HTMLFormElement>(null);
  const [cancelConfirm,setCancelConfirm]=useState(false);
  const {pending,run}=useGuardedAction();
  const [staleConflict,setStaleConflict]=useState(false);
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

  function discardDraftChanges(){
    const form=formRef.current;
    form?.reset();
    setApplicationMode(value.job.applicationMode);
    setSelectedProgramIds([...value.policy.allowedProgramIds]);
    setSelectedCohortIds([...value.policy.allowedCohortIds]);
    clearDirty();
    const disclosure=form?.closest("details");
    const summary=disclosure?.querySelector("summary");
    disclosure?.removeAttribute("open");
    summary?.focus();
  }

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const description=String(data.get("description")??"").trim();
    if(!description.replace(/<[^>]*>/g,"").trim()){
      showToast({tone:"error",title:"Please enter job description."});
      return;
    }
    await run(async()=>{
    try {
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
          description,
          jobTypeLabel: String(data.get("jobTypeLabel")??"Full-time"),
          employmentType: (()=>{
            const label=String(data.get("jobTypeLabel")??"Full-time");
            return label==="Internship"?"INTERNSHIP":
              label==="Contract"||label==="Apprenticeship"?"CONTRACT":"FULL_TIME";
          })(),
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
            deadline ? deadline===toLocalInput(value.job.applicationDeadline)
              ? value.job.applicationDeadline
              : driveDeadlineIstToIso(deadline)
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
        title: "Job saved as draft",
        description:
          "Job details and eligibility rules were saved.",
      });
      clearDirty();
      router.refresh();
    } catch (error) {
      if(error instanceof FriendlyFetchError &&
        (error.status===409||error.code==="PLACEMENT_JOB_STALE")){
        setStaleConflict(true);
      }else{
        showToast({
          tone: "error",
          title: "Could not update draft",
          description:
            error instanceof Error ? error.message : "Please try again.",
        });
      }
    }
    });
  }

  return (
    <>
    <Disclosure title="Edit draft opportunity" className="border-y border-[var(--lms-canvas-border)]">
      <form
        ref={formRef}
        onSubmit={submit}
      onChange={markDirty}
        className="grid min-w-0 gap-4 py-4"
      >
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            <span className="mb-1.5 block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
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
          <label className="sm:col-span-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            <span className="mb-1.5 block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
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
            <span className="mb-1.5 block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Job type
            </span>
            <Select
              className={inputClass}
              name="jobTypeLabel"
              defaultValue={value.job.jobTypeLabel??
                (value.job.employmentType==="INTERNSHIP"?"Internship":
                 value.job.employmentType==="CONTRACT"?"Contract":"Full-time")}
            >
              {availableJobTypes
                .map(type=><option key={type.label} value={type.label}>{type.label}</option>)}
              {value.job.jobTypeLabel&&!availableJobTypes.some(type=>type.label===value.job.jobTypeLabel)?
                <option value={value.job.jobTypeLabel}>{value.job.jobTypeLabel} (historic)</option>:null}
            </Select>
          </label>
          <label>
            <span className="mb-1.5 block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
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
            <span className="mb-1.5 block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
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
            <span className="mb-1.5 block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
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
            <span className="mb-1.5 block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
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
            <span className="mb-1.5 block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
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
            <span className="mb-1.5 block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
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
            <span className="mb-1.5 block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
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
            <span className="mb-1.5 block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
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

        <details className="min-w-0 border-t border-[var(--lms-canvas-border)] pt-3">
          <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold md:min-h-9">Eligibility rules — enforced</summary>
          <div className="min-w-0 pb-4">
          <p className="mt-1 text-xs leading-5 text-body">
            Leave programs and cohorts unselected to keep the opportunity college-wide.
            These eligibility rules restrict applications. Legacy candidate preferences were advisory, not eligibility gates.
          </p>

          <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
            <fieldset className="min-w-0 border-t border-border py-3">
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

            <fieldset className="min-w-0 border-t border-border py-3">
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
                <span className="mb-1.5 block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
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
            <label className="sm:col-span-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              <span className="mb-1.5 block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
                Passing years
              </span>
              <Input
                className={inputClass}
                name="passingYears"
                defaultValue={value.policy.allowedPassingYears.join(", ")}
                placeholder="2026, 2027"
              />
            </label>
            <label className="sm:col-span-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              <span className="mb-1.5 block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
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
        </details>

        <div className="min-w-0 border-t border-border pt-4">
          <Button
            type="submit"
            size="sm"
            className="min-h-11 w-full sm:w-auto md:min-h-9"
            disabled={pending}
          >
            {pending
              ? "Saving…"
              : "Save draft changes"}
          </Button>
          <Button type="button" variant="secondary" size="sm"
            className="mt-2 min-h-11 w-full sm:ml-2 sm:mt-0 sm:w-auto md:min-h-9"
            disabled={pending}
            onClick={()=>{if(dirty)setCancelConfirm(true);else discardDraftChanges();}}>
            Cancel
          </Button>
        </div>
        {dirty ? <p role="status" className="text-xs text-muted-foreground">You have unsaved changes. Save this draft before leaving the page.</p> : null}
      </form>
      <ConfirmDialog open={staleConflict} onOpenChange={setStaleConflict}
        title="This drive changed since you loaded it"
        description="Reload the current drive before retrying. Unsaved local changes will be discarded."
        confirmLabel="Reload" cancelLabel="Dismiss" confirmVariant="primary"
        onConfirm={()=>{
          setStaleConflict(false);clearDirty();router.refresh();
        }}/>
    </Disclosure>
    {guardDialog}
    <ConfirmDialog open={cancelConfirm} onOpenChange={setCancelConfirm}
      title="Discard unsaved draft changes?"
      description="Your unsaved changes to this draft will be discarded."
      confirmLabel="Discard changes" cancelLabel="Keep editing" confirmVariant="danger"
      onConfirm={()=>{setCancelConfirm(false);discardDraftChanges();}}/>
    </>
  );
}
