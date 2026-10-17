"use client";

import {
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useUnsavedDriveGuard } from "./use-unsaved-drive-guard";
import {apiFetch} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";

export type PlacementAcademicTargetingChoice = {
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

export type PlacementSeasonChoice = {
  id: string;
  name: string;
  code: string;
  startDate: string;
  endDate: string;
};

export type PlacementCompanyChoice = {
  relationshipId: string;
  name: string;
  primaryDomain: string | null;
  isTrusted: boolean;
};

const inputClass =
  "min-h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-[var(--lms-focus-ring)]";
const textareaClass =
  "min-h-28 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-[var(--lms-focus-ring)]";

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function requestJson(url:string,method:"POST"|"PUT"|"PATCH",body:unknown){
 return await apiFetch<Record<string,unknown>>(url,{
  method,headers:{"content-type":"application/json"},body:JSON.stringify(body),
 });
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

export function PlacementJobCreateForm({
  collegeId,
  activeSeason,
  companies,
  academicOptions,
  basePath,
  initialCompanyName = "",
}: {
  collegeId: string;
  activeSeason: PlacementSeasonChoice | null;
  companies: readonly PlacementCompanyChoice[];
  academicOptions: PlacementAcademicTargetingChoice;
  basePath: string;
  initialCompanyName?: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const { dirty, markDirty, clearDirty } = useUnsavedDriveGuard();
  const [companyMode, setCompanyMode] =
    useState<"EXISTING" | "NEW">(
      companies.length > 0
        ? "EXISTING"
        : "NEW",
    );
  const [
    companyRelationshipId,
    setCompanyRelationshipId,
  ] = useState(
    companies.find(company=>company.name.toLowerCase()===initialCompanyName.toLowerCase())?.relationshipId ?? companies[0]?.relationshipId ?? "",
  );
  const [companySearch,setCompanySearch]=useState("");
  const [newEmployerName,setNewEmployerName]=useState("");
  const [newEmployerDomain,setNewEmployerDomain]=useState("");
  const matchingEmployer=companies.find(company=>company.name.toLowerCase()===newEmployerName.trim().toLowerCase()&&Boolean(newEmployerName.trim())||
    Boolean(newEmployerDomain.trim())&&company.primaryDomain?.toLowerCase().replace(/^www\./,"")===newEmployerDomain.trim().toLowerCase().replace(/^www\./,""));
  const {pending,run}=useGuardedAction({timeoutMs:45000});
  const [
    selectedProgramIds,
    setSelectedProgramIds,
  ] = useState<string[]>([]);
  const [
    selectedCohortIds,
    setSelectedCohortIds,
  ] = useState<string[]>([]);

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
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const reviewPublish = submitter?.getAttribute("value") === "review-publish";
    await run(async()=>{
    try {
      if (!activeSeason) {
        throw new Error(
          "Start an active placement season before creating an opportunity",
        );
      }

      const data = new FormData(
        event.currentTarget,
      );
      const title = String(data.get("title") ?? "").trim();
      if (title.length < 3) throw new Error("Job title: At least 3 characters.");
      if (title.length > 100) throw new Error("Job title must be no longer than 100 characters.");
      const minimumLpa = nullableDecimal(String(data.get("minimumLpa") ?? ""));
      const maximumLpa = nullableDecimal(String(data.get("maximumLpa") ?? ""));
      if (minimumLpa !== null && maximumLpa !== null && maximumLpa < minimumLpa) {
        throw new Error("Maximum CTC must be greater than or equal to minimum CTC.");
      }
      const openingsValue = String(data.get("openings") ?? "").trim();
      if (openingsValue && (!Number.isInteger(Number(openingsValue)) ||
        Number(openingsValue) < 1 || Number(openingsValue) > 100_000)) {
        throw new Error("Openings must be a whole number between 1 and 100,000.");
      }
      if(reviewPublish){
        const dueText=String(data.get("applicationDeadline")??"").trim();
        const dueTime=dueText?new Date(dueText).getTime():Number.NaN;
        if(!Number.isFinite(dueTime)||dueTime<=Date.now())
          throw new Error("Set a future application deadline before publishing.");
        const roleTitle=String(data.get("title")??"").trim();
        if(roleTitle.length<3)throw new Error("Add a job role of at least 3 characters before publishing.");
        const stipend=nullableDecimal(String(data.get("stipendPerMonthInr")??""));
        const fixed=nullableDecimal(String(data.get("fixedLpa")??""));
        if(minimumLpa===null && maximumLpa===null && fixed===null && stipend===null)
          throw new Error("Add a CTC figure or stipend for at least one role before publishing.");
        const mode=String(data.get("applicationMode")??"INTERNAL");
        if(mode!=="INTERNAL"){
          const urlText=String(data.get("externalApplicationUrl")??"").trim();
          try{
            const external=new URL(urlText);
            if(external.protocol!=="https:"||!external.hostname||external.username||external.password)
              throw new Error("invalid URL");
          }catch{
            throw new Error("Add a valid HTTPS employer application link before publishing.");
          }
        }
      }
      const years = splitList(String(data.get("passingYears") ?? ""));
      if (years.some((year) => !/^\d{4}$/.test(year))) {
        throw new Error("Passing years must contain four-digit years separated by commas.");
      }
      const checks: Array<[string, string, number]> = [
        ["minCgpa", "Minimum CGPA", 10],
        ["minTenthPercentage", "Minimum 10th %", 100],
        ["minTwelfthPercentage", "Minimum 12th %", 100],
        ["minDiplomaPercentage", "Minimum diploma %", 100],
        ["minUndergraduatePercentage", "Minimum UG %", 100],
      ];
      for (const [key, label, max] of checks) {
        const value = String(data.get(key) ?? "").trim();
        if (value && (!Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > max)) {
          throw new Error(label + " must be between 0 and " + max + ".");
        }
      }
      let relationshipId =
        companyRelationshipId;

      if (companyMode === "NEW") {
        const newName=String(data.get("companyName")??"").trim().toLowerCase();
        const newDomain=String(data.get("companyDomain")??"").trim().toLowerCase().replace(/^www\./,"");
        const existing=companies.find(company=>company.name.trim().toLowerCase()===newName||
          Boolean(newDomain)&&company.primaryDomain?.trim().toLowerCase().replace(/^www\./,"")===newDomain);
        if(existing)throw Error("This employer may already be in your companies as "+existing.name+". Choose Existing employer to avoid a duplicate.");
        const companyResult =
          await requestJson(
            "/api/placements/companies",
            "POST",
            {
              collegeId,
              name: String(
                data.get("companyName") ??
                  "",
              ).trim(),
              websiteUrl:
                String(
                  data.get(
                    "companyWebsite",
                  ) ?? "",
                ).trim() || undefined,
              primaryDomain:
                String(
                  data.get("companyDomain") ??
                    "",
                ).trim() || undefined,
              isTrusted:
                data.get("companyTrusted") ===
                "on",
            },
          );
        const relationship =
          companyResult.relationship as
            | { id?: string }
            | undefined;
        if (!relationship?.id) {
          throw new Error(
            "Company relationship was not returned",
          );
        }
        relationshipId = relationship.id;
      }

      if (!relationshipId) {
        throw new Error(
          "Choose or create an employer",
        );
      }

      const applicationMode = String(
        data.get("applicationMode") ??
          "INTERNAL",
      );
      const deadlineRaw = String(
        data.get("applicationDeadline") ??
          "",
      );
      const jobResult = await requestJson(
        "/api/placements/jobs",
        "POST",
        {
          collegeId,
          seasonId: activeSeason.id,
          companyRelationshipId:
            relationshipId,
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
          fixedCtcLpa:nullableDecimal(String(data.get("fixedLpa")??"")),
          variableCtcLpa:nullableDecimal(String(data.get("variableLpa")??"")),
          stipendPerMonthInr:nullableInteger(String(data.get("stipendPerMonthInr")??"")),
          isDream:data.get("isDream")==="on",
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
            deadlineRaw
              ? new Date(
                  deadlineRaw,
                ).toISOString()
              : null,
        },
      );

      const jobId =
        typeof jobResult.id === "string"
          ? jobResult.id
          : null;
      if (!jobId) {
        throw new Error(
          "Created job id was not returned",
        );
      }

      await requestJson(
        `/api/placements/jobs/${jobId}/eligibility-policy`,
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
          maxGapYears: nullableInteger(
            String(
              data.get("maxGapYears") ?? "",
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
          missingEvidencePolicy: String(
            data.get(
              "missingEvidencePolicy",
            ) ?? "ALLOW_WITH_FLAG",
          ),
        },
      );

      showToast({
        tone: "success",
        title: "Draft opportunity created",
        description:
          "Continue in the drive workspace to configure rounds and run the hiring process.",
      });
      router.push(
        `${basePath}/jobs/${jobId}${reviewPublish ? "?publish=1#drive-lifecycle-publish" : ""}`,
      );
      clearDirty();
      router.refresh();
    } catch (error) {
      showToast({
        tone: "error",
        title: "Could not create opportunity",
        description:
          error instanceof Error
            ? error.message
            : "Please try again.",
      });
    }
    });
  }

  return (
    <form
      onSubmit={submit}
      onChange={markDirty}
      className="space-y-6"
    >
      <nav aria-label="Drive setup review" className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-base font-semibold text-foreground">Setup review</h2>
        <ol className="mt-3 grid gap-3 sm:grid-cols-4">
          {["Company","Drive details","Eligibility","Publish review"].map((label,index)=>(
            <li key={label} className="rounded-lg border border-border p-3 text-sm">
              <span className="block text-xs font-semibold text-primary-text">Step {index+1} of 4</span>
              <span className="mt-1 block font-semibold text-foreground">{label}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-body">Eligibility reach is checked from current learner records after the draft is saved. No students are notified until you confirm publication.</p>
      </nav>
      <section className="rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h2 className="m-0 text-base font-semibold text-foreground">
            Placement season
          </h2>
          <p className="mt-1 text-sm text-body">
            Every drive belongs to the current operating season. Historical seasons remain read-only.
          </p>
        </div>
        <div className="p-5">
          {activeSeason ? (
            <>
              <p className="m-0 font-semibold text-foreground">
                {activeSeason.name}
              </p>
              <p className="mt-1 text-sm text-body">
                {activeSeason.code} ·{" "}
                {activeSeason.startDate} to{" "}
                {activeSeason.endDate}
              </p>
            </>
          ) : (
            <p className="m-0 text-sm font-semibold text-danger">
              No active placement season. Start one from Drives before creating a drive.
              <a href={basePath+"/seasons"} className="ml-2 inline-flex font-semibold underline focus-visible:ring-2 focus-visible:ring-primary">Open placement seasons →</a>
            </p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h2 className="m-0 text-base font-semibold text-foreground">
            Employer
          </h2>
          <p className="mt-1 text-sm text-body">
            Reuse college relationship memory or create a canonical employer relationship once.
          </p>
        </div>
        <div className="grid gap-4 p-5">
          {companies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                type="button"
                variant={
                  companyMode ===
                  "EXISTING"
                    ? "primary"
                    : "secondary"
                }
                onClick={() =>
                  setCompanyMode(
                    "EXISTING",
                  )
                }
              >
                Existing employer
              </Button>
              <Button
                size="sm"
                type="button"
                variant={
                  companyMode === "NEW"
                    ? "primary"
                    : "secondary"
                }
                onClick={() =>
                  setCompanyMode("NEW")
                }
              >
                New employer
              </Button>
            </div>
          ) : null}

          {companyMode === "EXISTING" ? (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-body">
                Find employer by name or website domain
                <input type="search" value={companySearch} maxLength={100}
                  onChange={event=>setCompanySearch(event.target.value)}
                  placeholder="Search your companies"
                  className={inputClass+" mt-2"}/>
              </label>
              <label>
              <span className="mb-1.5 block text-xs font-semibold text-body">
                Employer
              </span>
              <select
                className={inputClass}
                required
                value={
                  companyRelationshipId
                }
                onChange={(event) =>
                  setCompanyRelationshipId(
                    event.target.value,
                  )
                }
              >
                {companies.filter(company=>company.relationshipId===companyRelationshipId||
                  (company.name+" "+(company.primaryDomain??"")).toLowerCase().includes(companySearch.trim().toLowerCase()))
                  .map((company) => (
                  <option
                    key={
                      company.relationshipId
                    }
                    value={
                      company.relationshipId
                    }
                  >
                    {company.name}
                    {company.isTrusted
                      ? " · trusted"
                      : ""}
                  </option>
                ))}
              </select>
            </label>
            {companySearch.trim()&&!companies.some(company=>
              (company.name+" "+(company.primaryDomain??"")).toLowerCase().includes(companySearch.trim().toLowerCase()))?
              <p role="status" className="text-xs text-body">No matching college employer. Check spelling or choose New employer.</p>:null}
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-body">
                  Company name
                </span>
                <input
                  className={inputClass}
                  name="companyName"
                  value={newEmployerName}
                  onChange={event=>setNewEmployerName(event.target.value)}
                  required
                  maxLength={200}
                />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-body">
                  Primary domain
                </span>
                <input
                  className={inputClass}
                  name="companyDomain"
                  value={newEmployerDomain}
                  onChange={event=>setNewEmployerDomain(event.target.value)}
                  placeholder="example.com"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-body">
                  Website
                </span>
                <input
                  className={inputClass}
                  name="companyWebsite"
                  type="url"
                  placeholder="https://example.com"
                />
              </label>
              {matchingEmployer?<div role="status" className="rounded border border-border bg-surface-subtle p-3 text-sm">
                <p className="font-semibold">This may already be {matchingEmployer.name}</p>
                <p className="mt-1 text-xs text-body">Reuse the existing college employer to keep recruiter and drive history together.</p>
                <button type="button" onClick={()=>{setCompanyRelationshipId(matchingEmployer.relationshipId);setCompanyMode("EXISTING");setCompanySearch("");}}
                  className="mt-2 min-h-10 rounded-md border border-primary px-3 font-semibold text-primary-text">
                  Use {matchingEmployer.name}
                </button>
              </div>:null}
              <label className="flex items-center gap-2 self-end pb-2 text-sm text-body">
                <input
                  name="companyTrusted"
                  type="checkbox"
                />
                Mark relationship as trusted
              </label>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h2 className="m-0 text-base font-semibold text-foreground">
            Opportunity
          </h2>
          <p className="mt-1 text-sm text-body">
            Create the learner-facing job opportunity and application window.
          </p>
        </div>
        <div className="grid gap-4 p-5 lg:grid-cols-2">
          <label className="lg:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Job title
            </span>
            <input
              className={inputClass}
              name="title"
              required
              minLength={3}
              maxLength={100}
              placeholder="Software Development Engineer"
            />
          </label>
          <label className="lg:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Description
            </span>
            <textarea
              className={textareaClass}
              name="description"
              maxLength={15000}
              placeholder="Role, responsibilities, requirements and hiring context."
            />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Employment type
            </span>
            <select
              className={inputClass}
              name="employmentType"
              defaultValue="FULL_TIME"
            >
              <option value="FULL_TIME">
                Full time
              </option>
              <option value="INTERNSHIP">
                Internship
              </option>
              <option value="CONTRACT">
                Contract
              </option>
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Work mode
            </span>
            <select
              className={inputClass}
              name="workMode"
              defaultValue="ONSITE"
            >
              <option value="ONSITE">
                Onsite
              </option>
              <option value="HYBRID">
                Hybrid
              </option>
              <option value="REMOTE">
                Remote
              </option>
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Locations
            </span>
            <input
              className={inputClass}
              name="locations"
              placeholder="Hyderabad, Bengaluru"
            />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Openings
            </span>
            <input
              className={inputClass}
              name="openings"
              type="number"
              min={1}
              max={100000}
              step={1}
            />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Minimum CTC (LPA)
            </span>
            <input
              className={inputClass}
              name="minimumLpa"
              type="number"
              min={0}
              step="0.1"
            />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Maximum CTC (LPA)
            </span>
            <input
              className={inputClass}
              name="maximumLpa"
              type="number"
              min={0}
              step="0.1"
            />
          </label>
          <label><span className="mb-1.5 block text-xs font-semibold text-body">
            Fixed CTC (LPA)
          </span><input className={inputClass} name="fixedLpa" type="number" min={0} max={1000} step="0.01"/></label>
          <label><span className="mb-1.5 block text-xs font-semibold text-body">
            Variable CTC (LPA)
          </span><input className={inputClass} name="variableLpa" type="number" min={0} max={1000} step="0.01"/></label>
          <label><span className="mb-1.5 block text-xs font-semibold text-body">
            Stipend per month (INR)
          </span><input className={inputClass} name="stipendPerMonthInr" type="number" min={0} max={10000000} step={1}/></label>
          <label className="flex items-center gap-3 text-sm font-semibold text-body">
            <input name="isDream" type="checkbox" className="h-4 w-4 accent-primary"/>
            Dream drive (college held-offer cap exception)
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Application mode
            </span>
            <select
              className={inputClass}
              name="applicationMode"
              defaultValue="INTERNAL"
            >
              <option value="INTERNAL">
                LMS application
              </option>
              <option value="HYBRID">
                LMS or employer form
              </option>
              <option value="EXTERNAL_ONLY">
                Employer form only
              </option>
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Employer application URL
            </span>
            <input
              className={inputClass}
              name="externalApplicationUrl"
              type="url"
              placeholder="Required for hybrid/external-only"
            />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Application deadline
            </span>
            <input
              className={inputClass}
              name="applicationDeadline"
              type="datetime-local"
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h2 className="m-0 text-base font-semibold text-foreground">
            Eligibility
          </h2>
          <p className="mt-1 text-sm text-body">
            Configure explainable numeric requirements now. Program/cohort scoping can remain empty when the opportunity is open across the college.
          </p>
        </div>
        <div className="grid gap-5 p-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <fieldset className="rounded-lg border border-border bg-muted p-4">
              <legend className="px-1 text-xs font-semibold text-body">
                Eligible programs
              </legend>
              <p className="mb-3 mt-0 text-xs leading-5 text-muted-foreground">
                Leave all unchecked to make the opportunity available across programs.
              </p>
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
                        <input
                          type="checkbox"
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

            <fieldset className="rounded-lg border border-border bg-muted p-4">
              <legend className="px-1 text-xs font-semibold text-body">
                Eligible cohorts
              </legend>
              <p className="mb-3 mt-0 text-xs leading-5 text-muted-foreground">
                Cohorts can narrow the opportunity further before it is published.
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
                        <input
                          type="checkbox"
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

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["minCgpa", "Minimum CGPA", "0.01"],
            [
              "maxActiveBacklogs",
              "Max active backlogs",
              "1",
            ],
            [
              "maxPastBacklogs",
              "Max past backlogs",
              "1",
            ],
            [
              "maxGapYears",
              "Max gap years",
              "1",
            ],
            [
              "minTenthPercentage",
              "Minimum 10th %",
              "0.01",
            ],
            [
              "minTwelfthPercentage",
              "Minimum 12th %",
              "0.01",
            ],
            [
              "minDiplomaPercentage",
              "Minimum diploma %",
              "0.01",
            ],
            [
              "minUndergraduatePercentage",
              "Minimum UG %",
              "0.01",
            ],
          ].map(
            ([name, label, step]) => (
              <label key={name}>
                <span className="mb-1.5 block text-xs font-semibold text-body">
                  {label}
                </span>
                <input
                  className={inputClass}
                  name={name}
                  type="number"
                  min={0}
                  max={name === "minCgpa" ? 10 : name.startsWith("min") && name.includes("Percentage") ? 100 : name.startsWith("max") ? 100 : undefined}
                  step={step}
                />
              </label>
            ),
          )}
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Passing years
            </span>
            <input
              className={inputClass}
              name="passingYears"
              placeholder="2026, 2027"
            />
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Missing evidence
            </span>
            <select
              className={inputClass}
              name="missingEvidencePolicy"
              defaultValue="ALLOW_WITH_FLAG"
            >
              <option value="ALLOW_WITH_FLAG">
                Allow with missing-data flag
              </option>
              <option value="REQUIRE_COMPLETE">
                Require complete evidence
              </option>
            </select>
          </label>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-body">Review the drive and confirm who is told before publishing.</p>
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={pending || !activeSeason}>
            {pending ? "Creating…" : "Create draft"}
          </Button>
          <button
            type="submit"
            value="review-publish"
            aria-label="Publish after reviewing the drive"
            disabled={pending || !activeSeason}
            className="min-h-10 rounded-md border border-primary px-4 text-sm font-semibold text-primary-text disabled:opacity-50"
          >
            Publish
          </button>
        </div>
      </section>
      {dirty ? <p role="status" className="text-xs text-muted-foreground">You have unsaved changes. Save this draft before leaving the page.</p> : null}
    </form>
  );
}
