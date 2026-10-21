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
  sections:Array<{id:string;name:string;code:string;cohortId:string;
    cohortName:string;programId:string}>;
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
    legacyPostingDetails:{
      responsibilities?:string;assessmentUrl?:string|null;
      assessmentDeadline?:string|null;importantDates?:Array<{label:string;at:string}>;
      candidatePreferences?:{preferredDegree:string;specialization:string;
       graduationYear:number|null;minGpa:number|null;city:string};
    }|null;
  };
  policy: {
    allowedProgramIds: string[];
    allowedCohortIds: string[];
    allowedSectionIds:string[];
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
  const [formError,setFormError]=useState("");
  const [selectedDepartment,setSelectedDepartment]=useState("");
  const [programFilter,setProgramFilter]=useState("");
  const [cohortFilter,setCohortFilter]=useState("");
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
  const [selectedSectionIds,setSelectedSectionIds]=useState<string[]>(
    value.policy.allowedSectionIds,
  );
  const departments=[...new Set(academicOptions.programs.map(p=>p.departmentName))].sort();
  const visiblePrograms=academicOptions.programs.filter(p=>
    !selectedDepartment||p.departmentName===selectedDepartment);
  const visibleCohorts=academicOptions.cohorts.filter(c=>
    (!selectedDepartment||visiblePrograms.some(p=>p.id===c.programId))&&
    (!programFilter||c.programId===programFilter));
  const visibleSections=academicOptions.sections.filter(s=>
    (!selectedDepartment||visiblePrograms.some(p=>p.id===s.programId))&&
    (!programFilter||s.programId===programFilter)&&
    (!cohortFilter||s.cohortId===cohortFilter));

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
    setSelectedSectionIds([...value.policy.allowedSectionIds]);
    setSelectedDepartment("");setProgramFilter("");setCohortFilter("");
    setFormError("");
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
      setFormError("Please enter job description.");
      return;
    }
    const originalLegacy=value.job.legacyPostingDetails;
    const assessmentUrl=String(data.get("assessmentUrl")??"").trim();
    if(assessmentUrl&&(!/^https?:\/\//i.test(assessmentUrl)||assessmentUrl.length>2048)){
      setFormError("Must be a valid http or https URL");return;
    }
    const rawAssessmentDeadline=String(data.get("assessmentDeadline")??"");
    const assessmentDeadline=rawAssessmentDeadline?
      rawAssessmentDeadline===toLocalInput(originalLegacy?.assessmentDeadline??null)?
      originalLegacy?.assessmentDeadline??null:driveDeadlineIstToIso(rawAssessmentDeadline):null;
    const rawApplicationDeadline=String(data.get("applicationDeadline")??"");
    const applicationDeadline=rawApplicationDeadline?
      rawApplicationDeadline===toLocalInput(value.job.applicationDeadline)?
      value.job.applicationDeadline:driveDeadlineIstToIso(rawApplicationDeadline):null;
    if(assessmentDeadline){
      if(assessmentDeadline!==originalLegacy?.assessmentDeadline&&
         Date.parse(assessmentDeadline)<=Date.now()){
        setFormError("Assessment deadline cannot be in the past.");return;
      }
      if(!applicationDeadline||Date.parse(assessmentDeadline)<=Date.parse(applicationDeadline)){
        setFormError("Assessment deadline must be after application deadline.");return;
      }
    }
    const yearText=String(data.get("graduationYear")??"").trim();
    const graduationYear=yearText?Number(yearText):null;
    if(yearText&&!/^\d{4}$/.test(yearText)){
      setFormError("Graduation year must be a four-digit year.");return;
    }
    if(graduationYear!==null&&(graduationYear<1990||graduationYear>2050)){
      setFormError("Graduation year must be between 1990 and 2050.");return;
    }
    const gpaText=String(data.get("advisoryMinGpa")??"").trim();
    const minGpa=gpaText?Number(gpaText):null;
    if(minGpa!==null&&(!Number.isFinite(minGpa)||minGpa<0||minGpa>10)){
      setFormError("GPA must be between 0 and 10.");return;
    }
    const dateLines=String(data.get("importantDates")??"").split(/\r?\n/);
    const importantDates:Array<{label:string;at:string}>=[];
    for(const line of dateLines){
      if(!line.trim())continue;
      const divider=line.indexOf("|");
      const label=divider<0?line.trim():line.slice(0,divider).trim();
      const dateValue=divider<0?"":line.slice(divider+1).trim();
      if(!label){setFormError("Label required when date is set.");return;}
      if(!dateValue){setFormError("Date required when label is set.");return;}
      if(label.toLowerCase()==="application deadline"){
        setFormError("Application deadline is reserved and cannot be an important date label.");return;
      }
      const parsed=dateValue.length===16?driveDeadlineIstToIso(dateValue):dateValue;
      if(!Number.isFinite(Date.parse(parsed))){
        setFormError("Enter each date as Label | YYYY-MM-DDTHH:MM.");return;
      }
      importantDates.push({label,at:parsed});
    }
    if(importantDates.length>20){setFormError("A maximum of 20 important dates is allowed.");return;}
    if(new Set(importantDates.map(d=>d.label.toLowerCase())).size!==importantDates.length){
      setFormError("Important date labels must be unique.");return;
    }
    const legacyPostingDetails={
      ...originalLegacy,
      responsibilities:String(data.get("responsibilities")??"").trim(),
      assessmentUrl:assessmentUrl||null,
      assessmentDeadline,
      importantDates,
      candidatePreferences:{
        preferredDegree:String(data.get("preferredDegree")??"").trim(),
        specialization:String(data.get("specialization")??"").trim(),
        graduationYear,minGpa,city:String(data.get("preferredCity")??"").trim(),
      },
    };
    setFormError("");
    await run(async()=>{
    try {
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
          applicationDeadline,
          legacyPostingDetails,
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
          allowedSectionIds:selectedSectionIds,
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
      clearDirty();setFormError("");
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
              defaultValue={toLocalInput(value.job.applicationDeadline)}
            />
          </label>
        </div>
        <details className="min-w-0 border-t border-border pt-3">
          <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold md:min-h-9">
            Additional posting details and assessment
          </summary>
          <div className="grid min-w-0 gap-4 py-3 sm:grid-cols-2">
           <label className="sm:col-span-2 text-[13px] font-semibold">Responsibilities
            <Textarea name="responsibilities" rows={3} maxLength={15000}
             defaultValue={value.job.legacyPostingDetails?.responsibilities??""} className={textareaClass}/>
           </label>
           <label className="text-[13px] font-semibold">Assessment URL (optional)
            <Input type="url" name="assessmentUrl" maxLength={2048}
             defaultValue={value.job.legacyPostingDetails?.assessmentUrl??""}
             placeholder="https://..." className={inputClass}/>
           </label>
           <label className="text-[13px] font-semibold">Assessment deadline (IST)
            <Input type="datetime-local" name="assessmentDeadline"
             defaultValue={toLocalInput(value.job.legacyPostingDetails?.assessmentDeadline??null)}
             className={inputClass}/>
           </label>
           <p className="sm:col-span-2 text-xs text-muted-foreground">The assessment link and deadline are separate from the employer application URL. Assessment must follow the application deadline; existing expired dates may remain unchanged when editing unrelated terms.</p>
           <label className="sm:col-span-2 text-[13px] font-semibold">Important dates (one Label | YYYY-MM-DDTHH:MM per line, IST)
            <Textarea name="importantDates" rows={3} className={textareaClass}
             defaultValue={(value.job.legacyPostingDetails?.importantDates??[]).map(date=>
              date.label+" | "+toLocalInput(date.at)).join("\n")}/>
           </label>
          </div>
        </details>
        <details className="min-w-0 border-t border-border pt-3">
         <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold md:min-h-9">Candidate Preferences — informational</summary>
         <p className="py-2 text-xs text-muted-foreground">Preferred degree, specialization, graduation year, minimum GPA and city describe ideal applicants. Unlike Eligibility rules below, these do not gate learner applications.</p>
         <div className="grid min-w-0 gap-4 pb-4 sm:grid-cols-2">
          {([["preferredDegree","Preferred degree",value.job.legacyPostingDetails?.candidatePreferences?.preferredDegree??""],
             ["specialization","Specialization",value.job.legacyPostingDetails?.candidatePreferences?.specialization??""],
             ["preferredCity","Preferred city",value.job.legacyPostingDetails?.candidatePreferences?.city??""]] as const).map(([name,label,initial])=>
            <label key={name} className="text-[13px] font-semibold">{label}
             <Input name={name} defaultValue={initial} maxLength={160} className={inputClass}/>
            </label>)}
          <label className="text-[13px] font-semibold">Graduation year (1990–2050)
           <Input type="number" name="graduationYear" min={1990} max={2050} step={1}
            defaultValue={value.job.legacyPostingDetails?.candidatePreferences?.graduationYear??""}
            className={inputClass}/>
          </label>
          <label className="text-[13px] font-semibold">Minimum GPA (0–10)
           <Input type="number" name="advisoryMinGpa" min={0} max={10} step="0.01"
            defaultValue={value.job.legacyPostingDetails?.candidatePreferences?.minGpa??""}
            className={inputClass}/>
          </label>
         </div>
        </details>

        <details className="min-w-0 border-t border-[var(--lms-canvas-border)] pt-3">
          <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold md:min-h-9">Eligibility rules — enforced</summary>
          <div className="min-w-0 pb-4">
          <p className="mt-1 text-xs leading-5 text-body">
            Leave programs and cohorts unselected to keep the opportunity college-wide.
            These eligibility rules restrict applications. Legacy candidate preferences were advisory, not eligibility gates.
          </p>

          <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-3">
           <label className="grid gap-1 text-[13px] font-semibold">Department
            <Select className={inputClass} value={selectedDepartment} onChange={event=>{
             setSelectedDepartment(event.target.value);setProgramFilter("");setCohortFilter("");
             setSelectedProgramIds([]);setSelectedCohortIds([]);setSelectedSectionIds([]);markDirty();
            }}>
             <option value="">All departments</option>
             {departments.map(name=><option key={name} value={name}>{name}</option>)}
            </Select>
           </label>
           <label className="grid gap-1 text-[13px] font-semibold">Program
            <Select className={inputClass} value={programFilter} onChange={event=>{
             setProgramFilter(event.target.value);setCohortFilter("");
             setSelectedCohortIds([]);setSelectedSectionIds([]);markDirty();
            }}>
             <option value="">All programs</option>
             {visiblePrograms.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
           </label>
           <label className="grid gap-1 text-[13px] font-semibold">Batch
            <Select className={inputClass} value={cohortFilter} onChange={event=>{
             setCohortFilter(event.target.value);setSelectedSectionIds([]);markDirty();
            }}>
             <option value="">All batches</option>
             {visibleCohorts.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
           </label>
          </div>
          <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
            <fieldset className="min-w-0 border-t border-border py-3">
              <legend className="px-1 text-xs font-semibold text-body">
                Eligible programs
              </legend>
              {visiblePrograms.length === 0 ? (
                <p className="m-0 text-sm text-muted-foreground">
                  No active programs are available in this college yet.
                </p>
              ) : (
                <div className="grid gap-2">
                  {visiblePrograms.map(
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
              {visibleCohorts.length === 0 ? (
                <p className="m-0 text-sm text-muted-foreground">
                  No active or planned cohorts are available yet.
                </p>
              ) : (
                <div className="grid gap-2">
                  {visibleCohorts.map(
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
           <fieldset className="min-w-0 border-t border-border py-3 sm:col-span-2">
             <legend className="px-1 text-xs font-semibold text-body">Eligible classes</legend>
             <p className="text-xs text-muted-foreground">Class-level selection further narrows the chosen program and batch. Clear selections to include all classes.</p>
             {visibleSections.length===0?<p className="mt-2 text-sm text-muted-foreground">No active classes are available for this academic scope.</p>:
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
               {visibleSections.map(section=><label key={section.id} className="flex items-center gap-2 text-sm">
                <Checkbox checked={selectedSectionIds.includes(section.id)}
                 onChange={()=>{toggleId(section.id,selectedSectionIds,setSelectedSectionIds);markDirty();}}/>
                <span>{section.name} · {section.code} ({section.cohortName})</span>
               </label>)}
              </div>}
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

        {formError?<p role="alert" className="text-sm text-error">{formError}</p>:null}
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
          <a href="#drive-lifecycle-publish"
           aria-disabled={dirty}
           className={"ml-0 mt-3 inline-flex min-h-11 items-center font-semibold text-link underline md:ml-3 md:min-h-9 "+
            (dirty?"pointer-events-none opacity-50":"")}>
            Publish now (review required)
          </a>
          {dirty?<p className="mt-1 text-xs text-muted-foreground">Save draft changes before publishing; the publish workflow rechecks eligible learners and requires confirmation.</p>:null}
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
