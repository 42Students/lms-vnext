"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useUnsavedDriveGuard } from "./use-unsaved-drive-guard";
import {apiFetch} from "@/lib/api-fetch";
import {driveDeadlineIstToIso,driveDeadlineIstEndOfDay} from "@/modules/placements/tpo-drive-deadline-ist";
import {tpoDriveFormErrorMessage} from "@/modules/placements/tpo-drive-form-error-copy";
import {driveEligibilityPresetValue,type DriveEligibilityPreset} from "@/modules/placements/tpo-drive-eligibility-presets";
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
  otherNames?: readonly string[];
  domains?: readonly string[];
  isTrusted: boolean;
  memory:{pastDrives:number;joinedLearners:number;lastDriveAt:Date;recentRoles:string[]} | null;
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
  userId,
  collegeId,
  activeSeason,
  companies,
  academicOptions,
  basePath,
  initialCompanyName = "",
}: {
  userId: string;
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
  const formRef=useRef<HTMLFormElement>(null);
  const clearedBackup=useRef(false);
  const [restoredBackup,setRestoredBackup]=useState(false);
  const backupKey="lms:drive-create:"+userId+":"+collegeId;
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
    companies.find(company=>company.name.toLowerCase()===initialCompanyName.toLowerCase()||company.otherNames?.some(alias=>alias.toLowerCase()===initialCompanyName.toLowerCase()))?.relationshipId ?? companies[0]?.relationshipId ?? "",
  );
  const [companySearch,setCompanySearch]=useState("");
  const [enteredDriveTitle,setEnteredDriveTitle]=useState("");
  const selectedEmployer=companies.find(company=>company.relationshipId===companyRelationshipId);
  const [eligibilityPreset,setEligibilityPreset]=useState<DriveEligibilityPreset>("OPEN");
  const [hasEnteredEligibilityRule,setHasEnteredEligibilityRule]=useState(false);
  const [newEmployerName,setNewEmployerName]=useState("");
  const [newEmployerDomain,setNewEmployerDomain]=useState("");
  const matchingEmployer=companies.find(company=>Boolean(newEmployerName.trim())&&
    (company.name.toLowerCase()===newEmployerName.trim().toLowerCase()||
      company.otherNames?.some(alias=>alias.toLowerCase()===newEmployerName.trim().toLowerCase()))||
    Boolean(newEmployerDomain.trim())&&
    (company.primaryDomain?.toLowerCase().replace(/^www\./,"")===newEmployerDomain.trim().toLowerCase().replace(/^www\./,"")||
      company.domains?.some(domain=>domain.toLowerCase()===newEmployerDomain.trim().toLowerCase().replace(/^www\./,""))));
  const {pending,run}=useGuardedAction({timeoutMs:45000});
  // TPO-drives-43: never POST a second draft on retry after a partial create.
  const createdJobRef=useRef<{jobId:string;relationshipId:string;fingerprint:string}|null>(null);
  const [partialJobId,setPartialJobId]=useState<string|null>(null);
  const [
    selectedProgramIds,
    setSelectedProgramIds,
  ] = useState<string[]>([]);
  const [
    selectedCohortIds,
    setSelectedCohortIds,
  ] = useState<string[]>([]);

  // TPO-drives-41: per-user/college browser-only recovery for long-form drafts.
  // No passwords, tokens, email invitations or learner records are present here.
  const saveBrowserDraft=useCallback((form:HTMLFormElement)=>{
    if(clearedBackup.current)return;
    try{
      const values:Record<string,string>={};
      const checked:string[]=[];
      for(const field of Array.from(form.querySelectorAll<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>("input[name],textarea[name],select[name]"))){
        if(field instanceof HTMLInputElement&&field.type==="checkbox"){
          if(field.checked)checked.push(field.name);
        }else values[field.name]=field.value;
      }
      localStorage.setItem(backupKey,JSON.stringify({values,checked,
        companyMode,companyRelationshipId,selectedProgramIds,selectedCohortIds,eligibilityPreset}));
    }catch{/* Storage may be unavailable in private mode; form still works. */}
  },[backupKey,companyMode,companyRelationshipId,selectedProgramIds,selectedCohortIds,eligibilityPreset]);
  useEffect(()=>{
    // Defer restoration until the uncontrolled form fields have mounted.
    const task=window.setTimeout(()=>{
      try{
        const raw=localStorage.getItem(backupKey);
        if(!raw||!formRef.current)return;
        const saved=JSON.parse(raw) as {values?:Record<string,string>;checked?:string[];
          companyMode?:"EXISTING"|"NEW";companyRelationshipId?:string;
          selectedProgramIds?:string[];selectedCohortIds?:string[];
          eligibilityPreset?:DriveEligibilityPreset};
        if(!saved||!saved.values||typeof saved.values!=="object")return;
        if(saved.companyMode==="EXISTING"||saved.companyMode==="NEW")setCompanyMode(saved.companyMode);
        if(saved.companyRelationshipId&&companies.some(c=>c.relationshipId===saved.companyRelationshipId))
          setCompanyRelationshipId(saved.companyRelationshipId);
        setSelectedProgramIds((saved.selectedProgramIds??[]).filter(id=>academicOptions.programs.some(p=>p.id===id)));
        setSelectedCohortIds((saved.selectedCohortIds??[]).filter(id=>academicOptions.cohorts.some(c=>c.id===id)));
        if(["OPEN","CGPA_6","CGPA_7","PCT_60","PCT_70"].includes(saved.eligibilityPreset??""))
          setEligibilityPreset(saved.eligibilityPreset!);
        setEnteredDriveTitle(String(saved.values.title??""));
        setNewEmployerName(String(saved.values.companyName??""));
        setNewEmployerDomain(String(saved.values.companyDomain??""));
        for(const field of Array.from(formRef.current.querySelectorAll<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>("input[name],textarea[name],select[name]"))){
          if(field instanceof HTMLInputElement&&field.type==="checkbox")field.checked=(saved.checked??[]).includes(field.name);
          else if(saved.values[field.name]!==undefined)field.value=saved.values[field.name];
        }
        markDirty();
        setRestoredBackup(true);
      }catch{/* Corrupt or disabled browser storage must not break creation. */}
    },0);
    return ()=>window.clearTimeout(task);
    // One-time restore scoped to this actor and college only.
  },[backupKey,companies,academicOptions.programs,academicOptions.cohorts,markDirty]);
  useEffect(()=>{
    if(!dirty||!formRef.current||clearedBackup.current)return;
    const task=window.setTimeout(()=>{if(formRef.current)saveBrowserDraft(formRef.current);},400);
    return ()=>window.clearTimeout(task);
    // Form state changes refresh the backup; uncontrolled fields also save onChange.
  },[dirty,saveBrowserDraft,enteredDriveTitle,newEmployerName,newEmployerDomain]);

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
      // TPO-drives-45: datetime-local is IST regardless of browser timezone.
      const deadlineRaw=String(data.get("applicationDeadline")??"").trim();
      const deadlineIso=deadlineRaw?driveDeadlineIstToIso(deadlineRaw):null;
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
        // TPO-drives-42: verify company selection before any employer or job is written.
        if(companyMode==="EXISTING"&&!companies.some(company=>company.relationshipId===companyRelationshipId))
          throw new Error("Pick the company from the list before publishing.");
        if(companyMode==="NEW"&&String(data.get("companyName")??"").trim().length<2)
          throw new Error("Enter the company name before publishing.");
        const dueTime=deadlineIso?Date.parse(deadlineIso):Number.NaN;
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
        ["minPctThroughout", "Percentage throughout", 100],
      ];
      for (const [key, label, max] of checks) {
        const value = String(data.get(key) ?? "").trim();
        if (value && (!Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > max)) {
          throw new Error(label + " must be between 0 and " + max + ".");
        }
      }
      const fingerprint=JSON.stringify({
        fields:Array.from(data.entries()).map(([key,value])=>[key,String(value)]),
        selectedProgramIds:[...selectedProgramIds].sort(),
        selectedCohortIds:[...selectedCohortIds].sort(),
        companyMode,companyRelationshipId,
      });
      if(createdJobRef.current&&createdJobRef.current.fingerprint!==fingerprint)
        throw new Error("A draft has already been created. Open the existing draft to edit your latest changes.");
      let relationshipId =
        createdJobRef.current?.relationshipId??companyRelationshipId;

      if (companyMode === "NEW" && !createdJobRef.current) {
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
            "We could not finish setting up the employer. Please check your companies before trying again.",
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
      
      const jobResult = createdJobRef.current?{id:createdJobRef.current.jobId}:
       await requestJson(
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
          applicationDeadline: deadlineIso,
        },
      );

      const jobId =
        typeof jobResult.id === "string"
          ? jobResult.id
          : null;
      if (!jobId) {
        throw new Error(
          "The drive may have been saved but could not be opened. Check your drafts before trying again.",
        );
      }
      if(!createdJobRef.current){
        createdJobRef.current={jobId,relationshipId,fingerprint};
        setPartialJobId(jobId);
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
          minPctThroughout:nullableDecimal(String(data.get("minPctThroughout")??"")),
          requireVerifiedEvidence:data.get("requireVerifiedEvidence")==="on",
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
      clearedBackup.current=true;
      try{localStorage.removeItem(backupKey);}catch{}
      createdJobRef.current=null;
      setPartialJobId(null);
      router.refresh();
    } catch (error) {
      showToast({
        tone: "error",
        title: "Could not create opportunity",
        description: tpoDriveFormErrorMessage(error),
      });
    }
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      onChange={event=>{
        clearedBackup.current=false;
        saveBrowserDraft(event.currentTarget);
        markDirty();
        const fields=new FormData(event.currentTarget);
        setHasEnteredEligibilityRule([
          "minCgpa","minTenthPercentage","minTwelfthPercentage","minDiplomaPercentage",
          "minUndergraduatePercentage","minPctThroughout","passingYears"
        ].some(name=>String(fields.get(name)??"").trim().length>0)
          ||fields.get("requireVerifiedEvidence")==="on"
          ||fields.get("missingEvidencePolicy")==="REQUIRE_COMPLETE");
      }}
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
        <div aria-label="Publish preflight warnings" className="mt-3 space-y-1 text-xs text-body">
          <p role="status">No interview rounds added yet</p>
          {!hasEnteredEligibilityRule&&eligibilityPreset==="OPEN"&&selectedProgramIds.length===0&&selectedCohortIds.length===0?
            <p role="status">No eligibility rules set - every registered student will see this drive</p>:null}
          <p>These are warnings, not publication blockers. Review the drive and invite the recruiter before confirming publication.</p>
        </div>
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
                  (company.name+" "+(company.primaryDomain??"")+" "+(company.otherNames??[]).join(" ")+" "+(company.domains??[]).join(" ")).toLowerCase().includes(companySearch.trim().toLowerCase()))
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
              (company.name+" "+(company.primaryDomain??"")+" "+(company.otherNames??[]).join(" ")+" "+(company.domains??[]).join(" ")).toLowerCase().includes(companySearch.trim().toLowerCase()))?
              <p role="status" className="text-xs text-body">No matching college employer. Check spelling or choose New employer.</p>:null}
              {selectedEmployer?.memory?<section aria-label="Company Memory" className="rounded-lg border border-border bg-muted p-4 text-sm">
                <h3 className="font-semibold text-foreground">Company Memory</h3>
                <p>{selectedEmployer.memory.pastDrives} past drives · {selectedEmployer.memory.joinedLearners} confirmed hires</p>
                <p>Last drive: {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(new Date(selectedEmployer.memory.lastDriveAt))} IST</p>
                <p>Recent roles: {selectedEmployer.memory.recentRoles.join(", ")}</p>
                {enteredDriveTitle.trim()&&selectedEmployer.memory.recentRoles.some(role=>role.toLowerCase()===enteredDriveTitle.trim().toLowerCase())?
                  <p role="alert" className="mt-2 font-semibold text-amber-900">
                    A drive for {selectedEmployer.name} · {enteredDriveTitle.trim()} already exists. Check the previous drive before creating another.
                  </p>:null}
              </section>:null}
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
              value={enteredDriveTitle}
              onChange={event=>setEnteredDriveTitle(event.target.value)}
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
            <span className="mt-1 block text-xs text-muted-foreground">Custom college job types and placed-counting rules are managed in placement settings, not this employment-type list. Skills the employer requires are not configured on this form yet.</span>
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
            <span className="mt-1 block text-xs text-muted-foreground">These describe work location, not a pool or campus-hosted interview event. Pool reporting time and travel arrangements must be coordinated separately.</span>
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
              max={1000}
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
              max={1000}
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
            <span className="mt-1 block text-xs text-muted-foreground">Hybrid accepts LMS or employer applications. Employer-form-only applications are completed outside LMS; on-campus slot scheduling is not set up by this selection.</span>
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
            <span className="mt-1 block text-xs text-muted-foreground">Use the HTTPS employer registration portal link. A separate portal name is not saved by this workflow.</span>
          </label>
          <div>
            <label>
              <span className="mb-1.5 block text-xs font-semibold text-body">
                Application deadline
              </span>
              <input id="tpo-drive-application-deadline"
                className={inputClass}
                name="applicationDeadline"
                type="datetime-local"
                aria-describedby="drive-deadline-ist-help"
              />
            </label>
            <span id="drive-deadline-ist-help" className="mt-1 block text-xs text-body">Times are in IST (Asia/Kolkata). Select a date and time, or use the end-of-day action for 11:59 PM.</span>
            <button type="button" aria-controls="tpo-drive-application-deadline"
              className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline"
              onClick={()=>{
                const form=formRef.current;
                const field=form?.elements.namedItem("applicationDeadline");
                if(!(field instanceof HTMLInputElement)||!form||!field.value){
                  showToast({tone:"error",title:"Choose a date first",description:"Select a date in IST before using the 11:59 PM deadline."});
                  return;
                }
                try{
                  field.value=driveDeadlineIstEndOfDay(field.value);
                  clearedBackup.current=false;
                  saveBrowserDraft(form);
                  markDirty();
                }catch{
                  showToast({tone:"error",title:"Deadline not updated",description:"Enter a valid application deadline in IST."});
                }
              }}>Use 11:59 PM IST</button>
          </div>
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

          <label className="block text-sm font-semibold text-body">Eligibility preset
            <select className={inputClass} value={eligibilityPreset} onChange={event=>setEligibilityPreset(event.target.value as DriveEligibilityPreset)}>
              <option value="OPEN">Open to all</option>
              <option value="CGPA_6">CGPA 6.0+</option>
              <option value="CGPA_7">CGPA 7.0+</option>
              <option value="PCT_60">60% throughout</option>
              <option value="PCT_70">70% throughout</option>
            </select>
            <span className="mt-1 block text-xs font-normal text-muted-foreground">Check your college CGPA-to-percentage rule before choosing a percentage threshold.</span>
          </label>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["minCgpa", "Minimum CGPA", "0.01"],
            
            
            
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
            ["minPctThroughout","Percentage throughout","0.01"],
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
                  max={name === "minCgpa" ? 10 : name==="minPctThroughout" || name.startsWith("min") && name.includes("Percentage") ? 100 : name.startsWith("max") ? 100 : undefined}
                  step={step}
                  key={eligibilityPreset+":"+name}
                  defaultValue={driveEligibilityPresetValue(eligibilityPreset,name)}
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
          <label className="flex items-center gap-2 text-sm font-semibold text-body sm:col-span-2">
            <input name="requireVerifiedEvidence" type="checkbox" className="h-4 w-4 accent-primary"/>
            Only students whose marks are verified
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

      <section aria-label="Who this reaches" className="rounded-xl border border-border bg-surface p-4">
        <h2 className="font-semibold text-foreground">Who this reaches</h2>
        <p className="mt-2 text-sm text-body">Eligible and excluded learner counts depend on saved cohort and marks evidence. Save the draft, then use the drive workspace eligibility preview to review actual counts before publishing. No reach estimate is fabricated on this form.</p>
        <p className="mt-2 text-xs text-muted-foreground">Interview round templates and recruiter invitations are configured from the saved drive workspace. Recruiter lead invitations are managed separately under Engage. No rounds are created on this form.</p>
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
      {restoredBackup?<p role="status" className="text-sm text-body">A saved drive draft was restored from this browser. Review the values before submitting.</p>:null}
      {dirty?<button type="button" onClick={()=>{
        clearedBackup.current=true;
        try{localStorage.removeItem(backupKey);}catch{}
        setRestoredBackup(false);
      }} className="min-h-10 rounded border border-border px-3 text-xs font-semibold text-primary-text">Discard saved browser backup</button>:null}
      {partialJobId?<p role="alert" className="text-sm text-body">A draft exists. If setup did not finish, retry without changing the form or
        <a className="ml-1 font-semibold text-primary-text underline" href={basePath+"/jobs/"+encodeURIComponent(partialJobId)}>open the existing draft</a>.
        Do not submit a second drive.
      </p>:null}
      {dirty ? <p role="status" className="text-xs text-muted-foreground">You have unsaved changes. Save this draft before leaving the page.</p> : null}
    </form>
  );
}
