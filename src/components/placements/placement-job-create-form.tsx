"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/toast";
import { useUnsavedDriveGuard } from "./use-unsaved-drive-guard";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {driveDeadlineIstToIso,driveDeadlineIstEndOfDay} from "@/modules/placements/tpo-drive-deadline-ist";
import {tpoDriveFormErrorMessage} from "@/modules/placements/tpo-drive-form-error-copy";
import {tpoDriveStatusLabel} from "@/modules/placements/tpo-drive-lifecycle-list-model";
import {TPO_DRIVE_ROUND_PRESETS,isTpoRoundPresetKey,plannedTpoRoundRows,type TpoRoundPresetKey} from "@/modules/placements/tpo-drive-round-presets";
import {driveEligibilityPresetValue,type DriveEligibilityPreset} from "@/modules/placements/tpo-drive-eligibility-presets";
import {useGuardedAction} from "@/hooks/use-guarded-action";

export type PlacementAcademicTargetingChoice = {
  programs: Array<{
    id: string;
    name: string;
    code: string;
    departmentName: string;
  }>;
  sections:Array<{id:string;name:string;code:string;cohortId:string;cohortName:string;
    programId:string;departmentName:string}>;
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
  memory:{pastDrives:number;joinedLearners:number;lastDriveAt:Date;recentRoles:string[];existingRoles:Array<{jobId:string;title:string;status:string}>} | null;
};

const inputClass = "min-h-11 w-full min-w-0 md:min-h-9";
const textareaClass = "min-h-28 w-full min-w-0";
type ImportantDateRow = {id:number;label:string;date:string};
type CustomRuleRow = {id:number;label:string;value:string};
type ExtraPackageRow = {id:number;name:string;ctcLpa:string;
  fixedLpa:string;variableLpa:string;joiningBonusLpa:string;
  stipendPerMonthInr:string;stipendMonths:string};

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
  jobTypes,
  activeSeason,
  companies,
  academicOptions,
  basePath,
  initialCompanyName = "",
}: {
  userId: string;
  collegeId: string;
  jobTypes?: readonly {label:string}[];
  activeSeason: PlacementSeasonChoice | null;
  companies: readonly PlacementCompanyChoice[];
  academicOptions: PlacementAcademicTargetingChoice;
  basePath: string;
  initialCompanyName?: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const { dirty, markDirty, clearDirty, guardDialog } = useUnsavedDriveGuard();
  const formRef=useRef<HTMLFormElement>(null);
  const clearedBackup=useRef(false);
  // TPO-drives-45: apply the 11:59 PM IST default only to the first newly chosen date.
  const deadlineTimeChosen=useRef(false);
  const [restoredBackup,setRestoredBackup]=useState(false);
  const [lastLocalSaveAt,setLastLocalSaveAt]=useState<number|null>(null);
  const [lastServerSavedAt,setLastServerSavedAt]=useState<string|null>(null);
  const backupKey="lms:drive-create:"+userId+":"+collegeId;
  const uncertainKey=backupKey+":create-outcome-unknown";
  const [uncertainCreate,setUncertainCreate]=useState(false);
  const [publishMissing,setPublishMissing]=useState<string[]>([]);
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
  const [driveMode,setDriveMode]=useState<"ON_CAMPUS"|"POOL"|"OFF_CAMPUS">("ON_CAMPUS");
  const [applicationMode,setApplicationMode]=useState<"INTERNAL"|"HYBRID"|"EXTERNAL_ONLY">("INTERNAL");
  const [roundPreset,setRoundPreset]=useState<TpoRoundPresetKey>("NONE");
  const nextRowId=useRef(1000);
  const [importantDateRows,setImportantDateRows]=useState<ImportantDateRow[]>([{id:0,label:"",date:""}]);
  const [customRuleRows,setCustomRuleRows]=useState<CustomRuleRow[]>([{id:1,label:"",value:""}]);
  const [assessmentUrlLength,setAssessmentUrlLength]=useState(0);
  const [wantedSkills,setWantedSkills]=useState<string[]>([]);
  const [skillDraft,setSkillDraft]=useState("");
  function addSkills(text:string) {
    const items=text.split(/[,\n]+/).map(value=>value.trim()).filter(Boolean);
    setWantedSkills(current=>{
      const keys=new Set(current.map(value=>value.toLocaleLowerCase("en")));
      const next=[...current];
      for(const item of items) {
        if(item.length>50||keys.has(item.toLocaleLowerCase("en"))||next.length>=30)continue;
        next.push(item);
        keys.add(item.toLocaleLowerCase("en"));
      }
      return next;
    });
    setSkillDraft("");
    markDirty();
  }
  const [saveError,setSaveError]=useState<string|null>(null);
  const [loadingCopy,setLoadingCopy]=useState(false);
  const [copyJobId,setCopyJobId]=useState("");
  const autoCopyHandled=useRef(false);
  const [cancelConfirmOpen,setCancelConfirmOpen]=useState(false);
  const clonableDrives=companies.flatMap(company=>
    (company.memory?.existingRoles??[]).map(role=>({
      ...role,companyName:company.name,companyRelationshipId:company.relationshipId
    })));
  const [roundRows,setRoundRows]=useState<Array<{id:number;kind:string;name:string}>>([]);
  const [extraPackages,setExtraPackages]=useState<ExtraPackageRow[]>([]);
  const [enteredDriveTitle,setEnteredDriveTitle]=useState("");
  const selectedEmployer=companies.find(company=>company.relationshipId===companyRelationshipId);
  // TPO-drives-25: recent-role highlights must not cap duplicate-drive checks.
  const existingDrive=selectedEmployer?.memory?.existingRoles.find(row=>
    Boolean(enteredDriveTitle.trim())&&row.title.trim().toLowerCase()===enteredDriveTitle.trim().toLowerCase());
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
  const [departmentFilter,setDepartmentFilter]=useState("ALL");
  const [selectedSectionIds,setSelectedSectionIds]=useState<string[]>([]);
  const departments=[...new Set(academicOptions.programs.map(program=>program.departmentName))]
    .sort((a,b)=>a.localeCompare(b));
  const visiblePrograms=departmentFilter==="ALL"?academicOptions.programs:
    academicOptions.programs.filter(program=>program.departmentName===departmentFilter);
  const [
    selectedProgramIds,
    setSelectedProgramIds,
  ] = useState<string[]>([]);
  const [
    selectedCohortIds,
    setSelectedCohortIds,
  ] = useState<string[]>([]);
  // Child choices narrow when their parent is checked. Previously selected
  // children outside a changed parent filter are never posted to the policy.
  const visibleCohorts=academicOptions.cohorts.filter(cohort=>
    visiblePrograms.some(program=>program.id===cohort.programId) &&
    (!selectedProgramIds.length||selectedProgramIds.includes(cohort.programId)));
  const visibleSections=academicOptions.sections.filter(section=>
    visibleCohorts.some(cohort=>cohort.id===section.cohortId) &&
    (!selectedCohortIds.length||selectedCohortIds.includes(section.cohortId)));
  const effectiveProgramIds=selectedProgramIds.length?selectedProgramIds:
    departmentFilter==="ALL"?[]:visiblePrograms.map(program=>program.id);
  const effectiveCohortIds=selectedCohortIds.filter(id=>visibleCohorts.some(c=>c.id===id));
  const effectiveSectionIds=selectedSectionIds.filter(id=>visibleSections.some(c=>c.id===id));

  async function loadCloneSource(sourceJobId:string){
    if(!sourceJobId||partialJobId||loadingCopy)return;
    setLoadingCopy(true);
    setSaveError(null);
    try{
      const response=await apiFetch<{job:{
        id:string;collegeId:string;companyRelationshipId:string;title:string;
        description:string;employmentType:string;jobTypeLabel:string|null;
        workMode:string;locations:string[];openings:number|null;
        minimumAnnualCtcInr:number|null;maximumAnnualCtcInr:number|null;
        fixedCtcLpa:string|null;variableCtcLpa:string|null;
        stipendPerMonthInr:number|null;isDream:boolean;
        legacyPostingDetails?:{responsibilities?:string;skillsWanted?:string[];
          customEligibilityRules?:Array<{label:string;value:string}>};
      }}>(`/api/placements/jobs/${encodeURIComponent(sourceJobId)}`,{
        credentials:"same-origin",timeoutMs:30000
      });
      const source=response.job;
      if(!source||source.id!==sourceJobId||source.collegeId!==collegeId||
        !companies.some(company=>company.relationshipId===source.companyRelationshipId)){
        throw new Error("The selected drive is not available in this college.");
      }
      const form=formRef.current;
      if(!form)throw new Error("The form is not ready to copy a drive.");
      const copiedTitle=(source.title.replace(/\s*\(Copy\)\s*$/i,"")+" (Copy)").slice(0,100);
      setEnteredDriveTitle(copiedTitle);
      setCompanyMode("EXISTING");
      setCompanyRelationshipId(source.companyRelationshipId);
      setDriveMode("ON_CAMPUS");
      setApplicationMode("INTERNAL");
      const fields:Record<string,string>={
        description:source.description??"",
        jobTypeLabel:source.jobTypeLabel??(source.employmentType==="INTERNSHIP"?"Internship":"Full-time"),
        workMode:source.workMode??"ONSITE",
        locations:Array.isArray(source.locations)?source.locations.join(", "):"",
        openings:source.openings===null?"":String(source.openings),
        minimumLpa:source.minimumAnnualCtcInr===null?"":String(source.minimumAnnualCtcInr/100000),
        maximumLpa:source.maximumAnnualCtcInr===null?"":String(source.maximumAnnualCtcInr/100000),
        fixedLpa:source.fixedCtcLpa??"",
        variableLpa:source.variableCtcLpa??"",
        stipendPerMonthInr:source.stipendPerMonthInr===null?"":String(source.stipendPerMonthInr),
        responsibilities:source.legacyPostingDetails?.responsibilities??"",
        assessmentUrl:"",assessmentDeadline:"",applicationDeadline:"",
        externalApplicationUrl:"",importantDates:"",customEligibilityRules:""
      };
      for(const [key,value] of Object.entries(fields)){
        const field=form.elements.namedItem(key);
        if(field instanceof HTMLInputElement||field instanceof HTMLTextAreaElement||
          field instanceof HTMLSelectElement)field.value=value;
      }
      const dream=form.elements.namedItem("isDream");
      if(dream instanceof HTMLInputElement)dream.checked=Boolean(source.isDream);
      const copiedRules=source.legacyPostingDetails?.customEligibilityRules??[];
      setCustomRuleRows(copiedRules.length?copiedRules.slice(0,20).map(row=>({
        id:nextRowId.current++,label:row.label,value:row.value
      })):[{id:nextRowId.current++,label:"",value:""}]);
      setWantedSkills((source.legacyPostingDetails?.skillsWanted??[]).slice(0,30));
      setImportantDateRows([{id:nextRowId.current++,label:"",date:""}]);
      setRoundRows([]);
      setExtraPackages([]);
      setRoundPreset("NONE");
      setAssessmentUrlLength(0);
      deadlineTimeChosen.current=false;
      markDirty();
      saveBrowserDraft(form);
      showToast({tone:"success",title:"Past drive copied",description:"Review this new draft. Application and assessment deadlines, external links and rounds were cleared."});
    }catch(error){
      setSaveError(tpoDriveFormErrorMessage(error));
    }finally{
      setLoadingCopy(false);
    }
  }
  // TPO-drives-41: per-user/college browser-only recovery for long-form drafts.
  // No passwords, tokens, email invitations or learner records are present here.
  // TPO-drives-43: lost POST replies have unknown commit outcome; never blind-retry.
  async function createDriveWithKnownResponse(body:Record<string,unknown>){
    if(uncertainCreate)throw new Error("Check your existing Drives before submitting again. The prior create request may have succeeded.");
    try{return await requestJson("/api/placements/jobs","POST",body);}
    catch(reason){
      if(reason instanceof FriendlyFetchError&&[0,499,504].includes(reason.status)){
        setUncertainCreate(true);
        try{localStorage.setItem(uncertainKey,"1");}catch{}
        throw new Error("The create request might have succeeded, but its response was lost. Check Drives before retrying.");
      }
      throw reason;
    }
  }
  useEffect(()=>{
    try{setUncertainCreate(localStorage.getItem(uncertainKey)==="1");}catch{}
  },[uncertainKey]);
  useEffect(()=>{
    if(!partialJobId)return;
    let active=true;
    void apiFetch<{job:{updatedAt:string;createdByUserId:string}}>(
      `/api/placements/jobs/${encodeURIComponent(partialJobId)}`,
      {credentials:"same-origin",timeoutMs:15000},
    ).then(response=>{
      if(!active)return;
      const lastSaved=response.job?.updatedAt;
      if(lastSaved&&Number.isFinite(Date.parse(lastSaved)))setLastServerSavedAt(lastSaved);
    }).catch(()=>{/* Keep the server attribution unknown on a failed read. */});
    return ()=>{active=false;};
  },[partialJobId]);
  useEffect(()=>{
    if(autoCopyHandled.current)return;
    const sourceId=new URLSearchParams(window.location.search).get("duplicateFrom");
    if(!sourceId||!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(sourceId))
      return;
    autoCopyHandled.current=true;
    const task=window.setTimeout(()=>{
      // Existing unsaved work wins over any URL-based copy request.
      try{if(localStorage.getItem(backupKey))return;}catch{}
      setCopyJobId(sourceId);
      void loadCloneSource(sourceId);
    },0);
    return ()=>window.clearTimeout(task);
    // Duplication is a one-time initial form seed, not a background sync.
  },[backupKey]);
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
        companyMode,companyRelationshipId,driveMode,applicationMode,departmentFilter,selectedProgramIds,selectedCohortIds,selectedSectionIds,
        eligibilityPreset,importantDateRows,customRuleRows,roundRows,extraPackages,wantedSkills,partialDraft:createdJobRef.current}));
      setLastLocalSaveAt(Date.now());
    }catch{/* Storage may be unavailable in private mode; form still works. */}
  },[backupKey,companyMode,companyRelationshipId,driveMode,applicationMode,departmentFilter,selectedProgramIds,selectedCohortIds,
    selectedSectionIds,eligibilityPreset,importantDateRows,customRuleRows,roundRows,extraPackages,wantedSkills]);
  useEffect(()=>{
    // Defer restoration until the uncontrolled form fields have mounted.
    const task=window.setTimeout(()=>{
      try{
        const raw=localStorage.getItem(backupKey);
        if(!raw||!formRef.current)return;
        const saved=JSON.parse(raw) as {values?:Record<string,string>;checked?:string[];
          companyMode?:"EXISTING"|"NEW";companyRelationshipId?:string;
          driveMode?:"ON_CAMPUS"|"POOL"|"OFF_CAMPUS";
          applicationMode?:"INTERNAL"|"HYBRID"|"EXTERNAL_ONLY";
          selectedProgramIds?:string[];selectedCohortIds?:string[];selectedSectionIds?:string[];
          departmentFilter?:string;eligibilityPreset?:DriveEligibilityPreset;
          importantDateRows?:ImportantDateRow[];customRuleRows?:CustomRuleRow[];
          roundRows?:Array<{id:number;kind:string;name:string}>;extraPackages?:ExtraPackageRow[];wantedSkills?:string[];
          partialDraft?:{jobId:string;relationshipId:string;fingerprint:string}};
        if(!saved||!saved.values||typeof saved.values!=="object")return;
        // TPO-drives-43: recover a saved partial draft before allowing another POST.
        const resume=saved.partialDraft;
        if(resume&&/^[0-9a-f-]{36}$/i.test(resume.jobId)&&
          typeof resume.fingerprint==="string"&&resume.fingerprint.length<100_000&&
          companies.some(company=>company.relationshipId===resume.relationshipId)){
          createdJobRef.current=resume;
          setPartialJobId(resume.jobId);
        }
        if(saved.companyMode==="EXISTING"||saved.companyMode==="NEW")setCompanyMode(saved.companyMode);
        if(saved.driveMode==="ON_CAMPUS"||saved.driveMode==="POOL"||saved.driveMode==="OFF_CAMPUS")
          setDriveMode(saved.driveMode);
        if(saved.applicationMode==="INTERNAL"||saved.applicationMode==="HYBRID"||
          saved.applicationMode==="EXTERNAL_ONLY")setApplicationMode(saved.applicationMode);
        if(saved.companyRelationshipId&&companies.some(c=>c.relationshipId===saved.companyRelationshipId))
          setCompanyRelationshipId(saved.companyRelationshipId);
        setSelectedProgramIds((saved.selectedProgramIds??[]).filter(id=>academicOptions.programs.some(p=>p.id===id)));
        setSelectedCohortIds((saved.selectedCohortIds??[]).filter(id=>academicOptions.cohorts.some(c=>c.id===id)));
        setSelectedSectionIds((saved.selectedSectionIds??[]).filter(id=>academicOptions.sections.some(c=>c.id===id)));
        if(saved.departmentFilter==="ALL"||departments.includes(saved.departmentFilter??""))
          setDepartmentFilter(saved.departmentFilter??"ALL");
        if(["OPEN","CGPA_6","CGPA_7","PCT_60","PCT_70"].includes(saved.eligibilityPreset??""))
          setEligibilityPreset(saved.eligibilityPreset!);
        if(isTpoRoundPresetKey(saved.values.roundPreset))setRoundPreset(saved.values.roundPreset);
        if(Array.isArray(saved.importantDateRows)&&saved.importantDateRows.length<=20){
          const dates=saved.importantDateRows.filter(row=>row&&typeof row.id==="number"&&
            typeof row.label==="string"&&typeof row.date==="string");
          if(dates.length)setImportantDateRows(dates);
        }
        if(Array.isArray(saved.customRuleRows)&&saved.customRuleRows.length<=20){
          const rules=saved.customRuleRows.filter(row=>row&&typeof row.id==="number"&&
            typeof row.label==="string"&&typeof row.value==="string");
          if(rules.length)setCustomRuleRows(rules);
        }
        if(Array.isArray(saved.roundRows)&&saved.roundRows.length<=20){
          setRoundRows(saved.roundRows.filter(row=>row&&typeof row.id==="number"&&
            typeof row.kind==="string"&&typeof row.name==="string"));
        }
        if(Array.isArray(saved.extraPackages)&&saved.extraPackages.length<=10){
          setExtraPackages(saved.extraPackages.filter(row=>row&&typeof row.id==="number"&&
            typeof row.name==="string"&&typeof row.ctcLpa==="string").map(row=>({
            ...row,
            fixedLpa:String(row.fixedLpa??""),variableLpa:String(row.variableLpa??""),
            joiningBonusLpa:String(row.joiningBonusLpa??""),
            stipendPerMonthInr:String(row.stipendPerMonthInr??""),
            stipendMonths:String(row.stipendMonths??""),
          })));
        }
        const restoredIds=[...(saved.importantDateRows??[]),...(saved.customRuleRows??[]),...(saved.roundRows??[]),...(saved.extraPackages??[])]
          .map(row=>row.id).filter(id=>Number.isInteger(id)&&id>=0);
        nextRowId.current=Math.max(nextRowId.current,...restoredIds.map(id=>id+1));
        setEnteredDriveTitle(String(saved.values.title??""));
        setNewEmployerName(String(saved.values.companyName??""));
        setNewEmployerDomain(String(saved.values.companyDomain??""));
        setAssessmentUrlLength(String(saved.values.assessmentUrl??"").length);
        if(Array.isArray(saved.wantedSkills)){
          setWantedSkills(saved.wantedSkills.filter(skill=>typeof skill==="string"&&skill.length<=50).slice(0,30));
        }else setWantedSkills(splitList(String(saved.values.skillsWanted??"")).slice(0,30));
        for(const field of Array.from(formRef.current.querySelectorAll<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>("input[name],textarea[name],select[name]"))){
          if(field instanceof HTMLInputElement&&field.type==="checkbox")field.checked=(saved.checked??[]).includes(field.name);
          else if(saved.values[field.name]!==undefined)field.value=saved.values[field.name];
        }
        // TPO-drives-45: restoring a draft must never overwrite its chosen time.
        if(typeof saved.values.applicationDeadline==="string"&&saved.values.applicationDeadline.trim()){
          deadlineTimeChosen.current=true;
        }
        markDirty();
        setRestoredBackup(true);
      }catch{/* Corrupt or disabled browser storage must not break creation. */}
    },0);
    return ()=>window.clearTimeout(task);
    // One-time restore scoped to this actor and college only.
  },[backupKey,companies,academicOptions.programs,academicOptions.cohorts,academicOptions.sections,markDirty]);
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
      setSaveError(null);
      if (!activeSeason) {
        throw new Error(
          "Start an active placement season before creating an opportunity",
        );
      }

      const data = new FormData(
        event.currentTarget,
      );
      const title = String(data.get("title") ?? "").trim();
      const description=String(data.get("description")??"").trim();
      // Keep HTML-stripped validation at prepublish without interpreting
      // arbitrary rich markup or introducing an unsafe HTML renderer.
      const meaningfulDescription=description.replace(/<[^>]*>/g,"")
        .replace(/&(?:nbsp|#160);/gi," ").trim();
      // TPO-drives-45: datetime-local is IST regardless of browser timezone.
      const deadlineRaw=String(data.get("applicationDeadline")??"").trim();
      const deadlineIso=deadlineRaw?driveDeadlineIstToIso(deadlineRaw):null;
      if (!title) throw new Error("Please enter a job title.");
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
      if(companyMode==="NEW"&&!createdJobRef.current){
        const name=String(data.get("companyName")??"").trim();
        const domain=String(data.get("companyDomain")??"").trim();
        const website=String(data.get("companyWebsite")??"").trim();
        if(!name)throw new Error("Please enter company name.");
        if(name.length<2||name.length>150)
          throw new Error("Company name must be between 2 and 150 characters");
        if(!domain&&!website)
          throw new Error("Add the company's website or a company email domain");
        if(website){
          let secure=false;
          try{
            const parsed=new URL(website);
            secure=parsed.protocol==="https:"&&Boolean(parsed.hostname)&&
              !parsed.username&&!parsed.password&&website.length<=500;
          }catch{/* Invalid URL */}
          if(!secure)throw new Error("Company website must be a valid https link");
        }
      }
      if(reviewPublish){
        const missing:string[]=[];
        if(!meaningfulDescription)missing.push("Job description");
        if(companyMode==="EXISTING"&&!companies.some(company=>company.relationshipId===companyRelationshipId))
          missing.push("Employer");
        if(companyMode==="NEW"&&!String(data.get("companyName")??"").trim())
          missing.push("Company name");
        if(!deadlineIso||Date.parse(deadlineIso)<=Date.now())
          missing.push("Future application deadline");
        const stipendCheck=nullableDecimal(String(data.get("stipendPerMonthInr")??""));
        const fixedCheck=nullableDecimal(String(data.get("fixedLpa")??""));
        if(minimumLpa===null&&maximumLpa===null&&fixedCheck===null&&stipendCheck===null)
          missing.push("CTC or stipend");
        const modeCheck=String(data.get("applicationMode")??"INTERNAL");
        if(modeCheck!=="INTERNAL"&&!String(data.get("externalApplicationUrl")??"").trim())
          missing.push("HTTPS employer application link");
        setPublishMissing(missing);
        if(missing.length)
          throw new Error("Complete "+missing.length+" item(s) before review: "+missing.join(", ")+".");
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
      // TPO-drives-29/30/38: validate informational metadata before writing the draft.
      const skillsWanted=splitList(String(data.get("skillsWanted")??""));
      if(skillsWanted.length>30||skillsWanted.some(skill=>skill.length>50)||
        new Set(skillsWanted.map(skill=>skill.toLocaleLowerCase("en"))).size!==skillsWanted.length)
        throw new Error("Enter no more than 30 unique skills, each at most 50 characters.");
      const studentsRegisterSeparately=data.get("studentsRegisterSeparately")==="on";
      const portalName=String(data.get("portalName")??"").trim();
      const portalUrl=String(data.get("portalUrl")??"").trim();
      if(studentsRegisterSeparately){
        let valid=false;
        try{const u=new URL(portalUrl);valid=u.protocol==="https:"&&!u.username&&!u.password;}
        catch{}
        if(!portalName||portalName.length>160||!valid)
          throw new Error("Enter the separate employer portal name and a valid HTTPS link.");
      }
      const hostCollege=String(data.get("poolHostCollege")??"").trim();
      const travelNote=String(data.get("poolTravelNote")??"").trim();
      if(hostCollege.length>160||travelNote.length>1000)
        throw new Error("Check the host college and travel instructions.");
      const reportingRaw=String(data.get("poolReportingTime")??"").trim();
      const reportingTime=reportingRaw?driveDeadlineIstToIso(reportingRaw):null;
      const importantDates=importantDateRows.filter(row=>row.label.trim()||row.date.trim())
        .map(row=>{
          const label=row.label.trim();
          if(!label)throw new Error("Label required when date is set");
          if(!row.date)throw new Error("Date required when label is set");
          if(label.toLowerCase()==="application deadline")
            throw new Error("This label is reserved — use the Application deadline field above");
          if(label.length>100)throw new Error("Important date labels must be at most 100 characters.");
          return {label,at:driveDeadlineIstToIso(row.date+"T23:59")};
        });
      if(new Set(importantDates.map(row=>row.label.toLowerCase())).size!==importantDates.length)
        throw new Error("Important date labels must be unique.");
      const customEligibilityRules=customRuleRows.filter(row=>row.label.trim()||row.value.trim())
        .map(row=>{
          const label=row.label.trim(),value=row.value.trim();
          if(!label||!value)throw new Error("Rule label and rule value are both required.");
          if(label.length>160||value.length>200)
            throw new Error("Rules must have labels at most 160 characters and values at most 200 characters.");
          return {label,value};
        });
      const assessmentUrl=String(data.get("assessmentUrl")??"").trim();
      if(assessmentUrl.length>2048)throw new Error("Assessment URL cannot exceed 2048 characters.");
      if(assessmentUrl&&!/^https?:\/\//i.test(assessmentUrl))
        throw new Error("Assessment URL must begin with http:// or https://.");
      if(deadlineIso&&Date.parse(deadlineIso)<Date.now())
        throw new Error("Application deadline cannot be in the past.");
      const assessmentRaw=String(data.get("assessmentDeadline")??"").trim();
      const assessmentDeadline=assessmentRaw?driveDeadlineIstToIso(assessmentRaw):null;
      if(assessmentDeadline&&Date.parse(assessmentDeadline)<Date.now())
        throw new Error("Assessment deadline cannot be in the past.");
      if(assessmentDeadline&&(!deadlineIso||Date.parse(assessmentDeadline)<=Date.parse(deadlineIso)))
        throw new Error("Assessment deadline must be after application deadline.");
      const graduationYearRaw=String(data.get("preferredGraduationYear")??"").trim();
      const gpaRaw=String(data.get("preferredMinimumGpa")??"").trim();
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
      function moneyField(raw:string,max:number,label:string){
        if(!raw.trim())return null;
        const value=Number(raw);
        if(!Number.isFinite(value)||value<0||value>max||Math.abs(Math.round(value*100)-value*100)>1e-7)
          throw new Error(label+" must be between 0 and "+max+" with at most two decimal places.");
        return value;
      }
      function durationField(raw:string,label:string){
        if(!raw.trim())return null;
        const value=Number(raw);
        if(!Number.isInteger(value)||value<1||value>120)
          throw new Error(label+" must be between 1 and 120 months.");
        return value;
      }
      const defaultRoleTitle=title;
      const validatedPackages=extraPackages.map(row=>{
        const name=row.name.trim(),ctc=moneyField(row.ctcLpa,1000,"Package CTC");
        if(name.length<2||name.length>200)throw new Error("Each package needs a name between 2 and 200 characters.");
        if(ctc===null)throw new Error("Each additional package needs a CTC between 0 and 1000 LPA.");
        const fixedLpa=moneyField(row.fixedLpa,1000,"Fixed CTC"),
          variableLpa=moneyField(row.variableLpa,1000,"Variable CTC"),
          joiningBonusLpa=moneyField(row.joiningBonusLpa,1000,"Joining bonus"),
          stipendPerMonthInr=moneyField(row.stipendPerMonthInr,10_000_000,"Stipend per month"),
          stipendMonths=durationField(row.stipendMonths,"Stipend duration");
        if(stipendMonths!==null&&stipendPerMonthInr===null)
          throw new Error("Add a monthly stipend when duration is set.");
        return {name,ctcLpa:ctc,fixedLpa,variableLpa,joiningBonusLpa,
          stipendPerMonthInr,stipendMonths,annualCtcInr:Math.round(ctc*100_000)};
      });
      const primaryJoiningBonus=moneyField(String(data.get("joiningBonusLpa")??""),1000,"Joining bonus");
      const primaryStipendMonths=durationField(String(data.get("stipendMonths")??""),"Stipend duration");
      if(primaryStipendMonths!==null&&!String(data.get("stipendPerMonthInr")??"").trim())
        throw new Error("Add a monthly stipend when duration is set.");
      if(new Set([defaultRoleTitle,...validatedPackages.map(row=>row.name)].map(name=>name.toLocaleLowerCase("en"))).size!==validatedPackages.length+1)
        throw new Error("Each package must have a different name from the main job role and other packages.");
      const fingerprint=JSON.stringify({
        fields:Array.from(data.entries()).map(([key,value])=>[key,String(value)]),
        selectedProgramIds:[...effectiveProgramIds].sort(),
        selectedCohortIds:[...effectiveCohortIds].sort(),
        selectedSectionIds:[...effectiveSectionIds].sort(),
        companyMode,companyRelationshipId,driveMode,applicationMode,roundPreset,importantDateRows,customRuleRows,roundRows,extraPackages,
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
       await createDriveWithKnownResponse({
          collegeId,
          seasonId: activeSeason.id,
          companyRelationshipId:
            relationshipId,
          title: String(
            data.get("title") ?? "",
          ).trim(),
          description,
          legacyPostingDetails:{
            campusPool:{hostCollege:driveMode==="POOL"?hostCollege:"",
              reportingTime:driveMode==="POOL"?reportingTime:null,
              travelNote:driveMode==="POOL"?travelNote:""},
            portal:{studentsRegisterSeparately,name:studentsRegisterSeparately?portalName:"",
              url:studentsRegisterSeparately?portalUrl:""},
            skillsWanted,
            responsibilities:String(data.get("responsibilities")??"").trim(),
            assessmentUrl:assessmentUrl||null,
            assessmentDeadline,importantDates,customEligibilityRules,
            candidatePreferences:{
              preferredDegree:String(data.get("preferredDegree")??"").trim(),
              specialization:String(data.get("preferredSpecialization")??"").trim(),
              graduationYear:graduationYearRaw?Number(graduationYearRaw):null,
              minGpa:gpaRaw?Number(gpaRaw):null,
              city:String(data.get("preferredCity")??"").trim(),
            },
          },
          jobTypeLabel: String(data.get("jobTypeLabel") ?? "Full-time"),
          employmentType: (() => {
            const label=String(data.get("jobTypeLabel") ?? "Full-time");
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
        if(formRef.current)saveBrowserDraft(formRef.current);
      }

      await requestJson(
        `/api/placements/jobs/${jobId}/eligibility-policy`,
        "PUT",
        {
          allowedProgramIds:effectiveProgramIds,
          allowedCohortIds:effectiveCohortIds,
          allowedSectionIds:effectiveSectionIds,
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

      // The default named package maps to the primary role option. Other rows
      // remain non-primary options; retrying a partial save never duplicates them.
      const savedRoles=await apiFetch<{roles:Array<{id:string;title:string;status:string;isPrimary:boolean}>}>(
        `/api/placements/jobs/${encodeURIComponent(jobId)}/roles`,
        {credentials:"same-origin",timeoutMs:30000},
      );
      const defaultRole=savedRoles.roles.find(role=>role.isPrimary&&role.status==="ACTIVE");
      if(!defaultRole)throw new Error("Could not load the draft's default pay package.");
      await requestJson(`/api/placements/jobs/${encodeURIComponent(jobId)}/roles/${encodeURIComponent(defaultRole.id)}`,"PATCH",{
        joiningBonusLpa:primaryJoiningBonus,
        stipendMonths:primaryStipendMonths,
        stipendPerMonthInr:moneyField(String(data.get("stipendPerMonthInr")??""),10_000_000,"Stipend per month"),
        fixedLpa:moneyField(String(data.get("fixedLpa")??""),1000,"Fixed CTC"),
        variableLpa:moneyField(String(data.get("variableLpa")??""),1000,"Variable CTC"),
      });
      if(validatedPackages.length){
        for(const pkg of validatedPackages){
          if(savedRoles.roles.some(row=>row.title.trim().toLocaleLowerCase("en")===pkg.name.toLocaleLowerCase("en"))){
            continue;
          }
          await requestJson(`/api/placements/jobs/${encodeURIComponent(jobId)}/roles`,"POST",{
            title:pkg.name,
            employmentType:(()=>{
              const label=String(data.get("jobTypeLabel")??"Full-time");
              return label==="Internship"?"INTERNSHIP":
                label==="Contract"||label==="Apprenticeship"?"CONTRACT":"FULL_TIME";
            })(),
            workMode:String(data.get("workMode")??"ONSITE"),
            locations:splitList(String(data.get("locations")??"")),
            openings:null,
            minimumAnnualCtcInr:pkg.annualCtcInr,
            maximumAnnualCtcInr:pkg.annualCtcInr,
            ctcLpa:pkg.ctcLpa,
            fixedLpa:pkg.fixedLpa,
            variableLpa:pkg.variableLpa,
            joiningBonusLpa:pkg.joiningBonusLpa,
            stipendPerMonthInr:pkg.stipendPerMonthInr,
            stipendMonths:pkg.stipendMonths,
          });
        }
      }
      // TPO-drives-39 / TPO-drives-43: read server rounds before retrying
      // individual creates; a lost POST response must not duplicate a round.
      const planned=roundRows.length?roundRows.map((row,index)=>({
        sequence:index+1,kind:row.kind,name:row.name.trim()
      })):plannedTpoRoundRows(roundPreset);
      if(planned.some(row=>!row.name||row.name.length>100))
        throw new Error("Each interview round requires a name of at most 100 characters.");
      if(planned.length){
        const saved=await apiFetch<{rounds:Array<{kind:string;name:string}>}>(
          `/api/placements/jobs/${encodeURIComponent(jobId)}/rounds`,
          {credentials:"same-origin",timeoutMs:30000},
        );
        if(saved.rounds.length>planned.length||saved.rounds.some((row,index)=>
          row.kind!==planned[index]?.kind||row.name!==planned[index]?.name))
          throw new Error("Saved rounds have changed. Open the draft to review rounds before trying again.");
        for(const round of planned.slice(saved.rounds.length)){
          await requestJson(`/api/placements/jobs/${encodeURIComponent(jobId)}/rounds`,
            "POST",{kind:round.kind,name:round.name});
        }
      }
      setPublishMissing([]);
      showToast({
        tone: "success",
        title: reviewPublish ? "Draft saved — review before publishing" : "Drive draft created",
        description:planned.length
          ? `Saved ${planned.length} planned round(s). Choose each round's mode and schedule in the drive workspace.`
          : "Continue in the drive workspace to configure rounds and run the hiring process.",
      });
      router.push(
        `${basePath}/jobs/${jobId}${reviewPublish ? "?publish=1#drive-lifecycle-publish" : ""}`,
      );
      clearDirty();
      clearedBackup.current=true;
      try{localStorage.removeItem(backupKey);localStorage.removeItem(uncertainKey);}catch{}
      createdJobRef.current=null;
      setPartialJobId(null);
      router.refresh();
    } catch (error) {
      setSaveError(tpoDriveFormErrorMessage(error));
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
      className="min-w-0 space-y-[var(--lms-space-4)]"
    >
      <p role="status" aria-live="polite" className="max-w-[75ch] break-words text-xs leading-5 text-body">
        {pending?"Saving changes…":lastServerSavedAt&&partialJobId?
          "Last saved on server at "+new Intl.DateTimeFormat("en-IN",{
            dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
          }).format(new Date(lastServerSavedAt))+" IST · Draft created by your account; finish setup before publishing.":
          partialJobId?"Draft exists on server · Last-saved timestamp unavailable; retry setup or open the draft.":
          lastLocalSaveAt?
          "Changes not saved to the server · Browser backup at "+new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",hour:"2-digit",minute:"2-digit",day:"2-digit",month:"short",year:"numeric"}).format(new Date(lastLocalSaveAt))+" IST.":
          "Not saved yet · Your changes are backed up locally until you create the draft."}
      </p>

      {saveError?<div role="alert" className="rounded-lg border border-danger p-3 text-sm text-danger">
        <strong>Changes not saved.</strong> {saveError}
      </div>:null}
      {existingDrive?<div role="alert" className="flex flex-wrap items-center gap-2 rounded-lg border border-warning p-3 text-sm">
        <span>A drive for {selectedEmployer?.name} · {existingDrive.title} already exists ({tpoDriveStatusLabel(existingDrive.status)}).</span>
        <Link href={basePath+"/jobs/"+encodeURIComponent(existingDrive.jobId)} className="font-semibold text-primary-text underline">Open it</Link>
      </div>:null}
      <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
      <fieldset disabled={pending||loadingCopy} className="min-w-0 space-y-4">
      <details className="group min-w-0 border-b border-border pb-[var(--lms-space-4)] lg:hidden">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-base font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 [&::-webkit-details-marker]:hidden">Setup review <span aria-hidden="true" className="text-body transition-transform group-open:rotate-180 motion-reduce:transition-none">⌄</span></summary>
        <nav aria-label="Drive setup review" className="min-w-0 pt-3">
        <ol className="grid gap-3 border-y border-border sm:grid-cols-2 lg:grid-cols-4">
          {["Company","Drive details","Eligibility","Publish review"].map((label,index)=>(
            <li key={label} className="min-w-0 border-l-2 border-border py-3 pl-3 text-sm">
              <span className="block text-xs font-semibold text-primary-text">Step {index+1} of 4</span>
              <span className="mt-1 block font-semibold text-foreground">{label}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-body">Eligibility reach is checked from current learner records after the draft is saved. No students are notified until you confirm publication.</p>
        <div aria-label="Publish preflight warnings" className="mt-3 space-y-1 text-xs text-body">
          {plannedTpoRoundRows(roundPreset).length===0?
           <p role="status">No interview rounds added yet</p>:null}
          {!hasEnteredEligibilityRule&&eligibilityPreset==="OPEN"&&selectedProgramIds.length===0&&selectedCohortIds.length===0?
            <p role="status">Open eligibility is selected; actual reach still depends on registration, membership and learner participation.</p>:null}
          <p>Draft review does not publish or notify learners. Confirm the server's eligibility reach and missing items on the next screen.</p>
        </div>
        </nav>
      </details>
      <details open={!activeSeason||clonableDrives.length>0} className="min-w-0 border-b border-border pb-3">
       <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold md:min-h-9">Start from</summary>
      <section className="min-w-0 border-b border-border pb-[var(--lms-space-4)]">
        <p className="pb-[var(--lms-space-3)] text-sm text-body">
          Every drive belongs to the current operating season. Historical seasons remain read-only.
        </p>
        <div className="grid gap-3 pt-4">
          <label className="grid gap-1 text-sm font-semibold text-foreground">
            Clone a past drive
            <Select value={copyJobId} className={inputClass}
              disabled={loadingCopy||pending||Boolean(partialJobId)}
              onChange={event=>{setCopyJobId(event.target.value);void loadCloneSource(event.target.value);}}>
              <option value="">Choose a past drive to copy</option>
              {clonableDrives.map(role=><option key={role.jobId} value={role.jobId}>
                {role.companyName} · {role.title} ({tpoDriveStatusLabel(role.status)})
              </option>)}
            </Select>
          </label>
          {loadingCopy?<p role="status" className="text-sm text-body">Loading the past drive…</p>:null}
          {!clonableDrives.length?<p className="text-xs text-muted-foreground">No past drives to copy yet. Or just fill it in below.</p>:null}
          <p className="text-xs text-body">New drives start in the current placement season; past applicants, dates and rounds are not copied.</p>
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
              <a href={basePath+"/seasons"} className="ml-2 inline-flex font-semibold underline focus-visible:ring-2 focus-visible:ring-primary max-[767px]:inline-flex max-[767px]:min-h-11 max-[767px]:items-center">Open placement seasons →</a>
            </p>
          )}
        </div>
      </section>

      </details>
      <section className="min-w-0 border-b border-border pb-[var(--lms-space-4)]">
        <div className="border-b border-border pb-[var(--lms-space-3)]">
          <h2 className="m-0 text-base font-semibold text-foreground">
            Employer
          </h2>
          <p className="mt-1 text-sm text-body">
            Reuse college relationship memory or create a canonical employer relationship once.
          </p>
        </div>
        <div className="grid min-w-0 gap-[var(--lms-space-4)] pt-[var(--lms-space-4)]">
          {companies.length > 0 ? (
            <div className="grid min-w-0 grid-cols-2 gap-[var(--lms-space-2)] sm:flex sm:flex-wrap [&_button]:min-h-11 [&_button]:w-full sm:[&_button]:w-auto md:[&_button]:min-h-9">
              <Button size="sm"
                type="button"
                className="min-h-11 flex-1 sm:flex-none md:min-h-9"
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
                className="min-h-11 flex-1 sm:flex-none md:min-h-9"
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
              <label className="block text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">
                Find employer by name or website domain
                <Input type="search" value={companySearch} maxLength={100}
                  onChange={event=>setCompanySearch(event.target.value)}
                  placeholder="Search your companies"
                  className={inputClass+" mt-2"}/>
              </label>
              <label>
              <span className="mb-1.5 block text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
                Company Name
              </span>
              <Select
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
              </Select>
            </label>
            {companySearch.trim()&&!companies.some(company=>
              (company.name+" "+(company.primaryDomain??"")+" "+(company.otherNames??[]).join(" ")+" "+(company.domains??[]).join(" ")).toLowerCase().includes(companySearch.trim().toLowerCase()))?
              <p role="status" className="text-xs text-body">No matching college employer. Check spelling or choose New employer.</p>:null}
              {selectedEmployer?.memory?<details className="min-w-0 border-t border-border py-3 text-sm"><summary className="min-h-11 cursor-pointer py-3 font-semibold md:min-h-9">Company Memory</summary><aside aria-label="Company Memory" className="pt-3 text-sm">
                <h3 className="font-semibold text-foreground">Company Memory</h3>
                <p>{selectedEmployer.memory.pastDrives} past drives · {selectedEmployer.memory.joinedLearners} confirmed hires</p>
                <p>Last drive: {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(new Date(selectedEmployer.memory.lastDriveAt))} IST</p>
                <p>Recent roles: {selectedEmployer.memory.recentRoles.join(", ")}</p>
                {existingDrive?
                  <p role="alert" className="mt-2 font-semibold text-[var(--lms-gold-accent)]">
                    A drive for {selectedEmployer.name} · {existingDrive.title} already exists ({tpoDriveStatusLabel(existingDrive.status)}).{" "}
                    <Link href={`${basePath}/jobs/${encodeURIComponent(existingDrive.jobId)}`} className="underline max-[767px]:inline-flex max-[767px]:min-h-11 max-[767px]:items-center">Open it</Link> before creating another.
                  </p>:null}
              </aside></details>:null}
            </div>
          ) : (
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <label>
                <span className="mb-1.5 block text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
                  Company Name
                </span>
                <Input
                  className={inputClass}
                  name="companyName"
                  value={newEmployerName}
                  onChange={event=>setNewEmployerName(event.target.value)}
                  required
                  maxLength={150}
                />
              </label>
              <label>
                <span className="mb-1.5 block text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
                  Primary domain
                </span>
                <Input
                  className={inputClass}
                  name="companyDomain"
                  value={newEmployerDomain}
                  onChange={event=>setNewEmployerDomain(event.target.value)}
                  placeholder="example.com"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
                  Website
                </span>
                <Input
                  className={inputClass}
                  name="companyWebsite"
                  type="url"
                  maxLength={500}
                  placeholder="https://example.com"
                />
              </label>
              {matchingEmployer?<div role="status" className="rounded-[var(--lms-control-radius)] border border-border bg-muted p-3 text-sm">
                <p className="font-semibold">This may already be {matchingEmployer.name}</p>
                <p className="mt-1 text-xs text-body">Reuse the existing college employer to keep recruiter and drive history together.</p>
                <Button variant="secondary" type="button" onClick={()=>{setCompanyRelationshipId(matchingEmployer.relationshipId);setCompanyMode("EXISTING");setCompanySearch("");}}
                  className="mt-2 min-h-11 rounded-[var(--lms-control-radius)] border border-primary px-3 font-[650] text-primary-text md:min-h-9">
                  Use {matchingEmployer.name}
                </Button>
              </div>:null}
              <label className="flex items-center gap-2 self-end pb-2 text-sm text-body">
                <Checkbox
                  name="companyTrusted"
                />
                Mark relationship as trusted
              </label>
            </div>
          )}
        </div>
      </section>

      <section className="min-w-0 border-b border-border pb-[var(--lms-space-4)]">
        <div className="border-b border-border pb-[var(--lms-space-3)]">
          <h2 className="m-0 text-base font-semibold text-foreground">
            The drive
          </h2>
          <p className="mt-1 text-sm text-body">
            Create the learner-facing job opportunity and application window.
          </p>
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-[var(--lms-space-4)] pt-[var(--lms-space-4)] sm:grid-cols-2 md:grid-cols-3">
          <label className="sm:col-span-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            <span className="mb-1.5 block text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Job Title
            </span>
            <Input
              className={inputClass}
              name="title"
              value={enteredDriveTitle}
              onChange={event=>setEnteredDriveTitle(event.target.value)}
              required
              minLength={3}
              maxLength={100}
              placeholder="e.g., Software Engineer"
            />
          </label>
          <label className="sm:col-span-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            <span className="mb-1.5 block text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Job Description
            </span>
            <Textarea
              className={textareaClass}
              name="description"
              maxLength={15000}
              placeholder="Role, responsibilities, requirements and hiring context."
            />
          </label>
          <label>
            <span className="mb-1.5 block text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Job Type
            </span>
            <Select
              className={inputClass}
              name="jobTypeLabel"
              defaultValue={(jobTypes?.[0]?.label??"Full-time")}
            >
              {(jobTypes?.length ? jobTypes : [{label:"Full-time"},{label:"Internship"},{label:"Internship + full-time"},{label:"Contract"},{label:"Apprenticeship"}]).map(type=>
                <option key={type.label} value={type.label}>{type.label}</option>)}
            </Select>
            <span className="mt-1 block text-xs text-muted-foreground">Job types are managed in Settings &gt; Job types. A switched-off type remains on existing drives but cannot be selected for new drives.</span>
          </label>
          <label>
            <span className="mb-1.5 block text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Mode
            </span>
            <Select className={inputClass} value={driveMode}
              onChange={event=>{
                const mode=event.target.value as "ON_CAMPUS"|"POOL"|"OFF_CAMPUS";
                setDriveMode(mode);
                setApplicationMode(mode==="OFF_CAMPUS"?"EXTERNAL_ONLY":"INTERNAL");
                markDirty();
              }}>
              <option value="ON_CAMPUS">On campus</option>
              <option value="POOL">Pool (at another college)</option>
              <option value="OFF_CAMPUS">Off campus (company&apos;s site)</option>
            </Select>
            <span className="mt-1 block text-xs text-muted-foreground">
              {driveMode==="POOL"?"Held at another college; your students travel there.":
                driveMode==="OFF_CAMPUS"?"Students apply on the company's site; you track them here.":
                "Students apply here; rounds at your college or online."}
            </span>
          </label>
          <label>
            <span className="mb-1.5 block text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Work mode
            </span>
            <Select
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
            </Select>
            <span className="mt-1 block text-xs text-muted-foreground">These describe work location, not a pool or campus-hosted interview event. Pool reporting time and travel arrangements must be coordinated separately.</span>
          </label>
          <label>
            <span className="mb-1.5 block text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Location
            </span>
            <Input
              className={inputClass}
              name="locations"
              placeholder="e.g. Bangalore, Remote"
            />
          </label>
          <label>
            <span className="mb-1.5 block text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Openings
            </span>
            <Input
              className={inputClass}
              name="openings"
              type="number"
              min={1}
              max={100000}
              step={1}
            />
          </label>
          <label>
            <span className="mb-1.5 block text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Application mode
            </span>
            <Select
              className={inputClass}
              name="applicationMode"
              value={applicationMode}
              onChange={event=>{
                setApplicationMode(event.target.value as "INTERNAL"|"HYBRID"|"EXTERNAL_ONLY");
                markDirty();
              }}
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
            </Select>
            <span className="mt-1 block text-xs text-muted-foreground">Hybrid accepts LMS or employer applications. Employer-form-only applications are completed outside LMS; on-campus slot scheduling is not set up by this selection.</span>
          </label>
          {applicationMode!=="INTERNAL"||driveMode==="OFF_CAMPUS"?<label>
            <span className="mb-1.5 block text-[var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">
              Company application link
            </span>
            <Input
              className={inputClass}
              name="externalApplicationUrl"
              type="url"
              placeholder="Required for hybrid/external-only"
            />
            <span className="mt-1 block text-xs text-muted-foreground">Use the HTTPS company registration link. Off-campus drives require this link.</span>
          </label>:null}
          <div>
            <label>
              <span className="mb-1.5 block text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
                Application deadline
              </span>
              <Input id="tpo-drive-application-deadline"
                className={inputClass}
                name="applicationDeadline"
                type="datetime-local"
                aria-describedby="drive-deadline-ist-help"
                onFocus={event=>{if(event.currentTarget.value)deadlineTimeChosen.current=true;}}
                onChange={event=>{
                  const field=event.currentTarget;
                  if(!deadlineTimeChosen.current&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(field.value)){
                    try{field.value=driveDeadlineIstEndOfDay(field.value);deadlineTimeChosen.current=true;}
                    catch{/* Invalid dates are rejected on submit, not while typing. */}
                  }
                  // The native datetime input is uncontrolled. Persist its latest
                  // value rather than losing it to a delayed draft snapshot.
                  markDirty();
                  if(formRef.current)saveBrowserDraft(formRef.current);
                }}
              />
            </label>
            <span id="drive-deadline-ist-help" className="mt-1 block text-xs text-body">Times are in IST (Asia/Kolkata). A newly selected date defaults to 11:59 PM; you can change the time.</span>
            <Button variant="secondary" type="button" aria-controls="tpo-drive-application-deadline"
              className="mt-2 inline-flex min-h-11 items-center text-sm font-[650] text-primary-text underline md:min-h-9"
              onClick={()=>{
                const form=formRef.current;
                const field=form?.elements.namedItem("applicationDeadline");
                if(!(field instanceof HTMLInputElement)||!form||!field.value){
                  showToast({tone:"error",title:"Choose a date first",description:"Select a date in IST before using the 11:59 PM deadline."});
                  return;
                }
                try{
                  field.value=driveDeadlineIstEndOfDay(field.value);
                  deadlineTimeChosen.current=true;
                  clearedBackup.current=false;
                  saveBrowserDraft(form);
                  markDirty();
                }catch{
                  showToast({tone:"error",title:"Deadline not updated",description:"Enter a valid application deadline in IST."});
                }
              }}>Use 11:59 PM IST</Button>
          </div>
        </div>
      </section>

      <section className="min-w-0 border-b border-border pb-[var(--lms-space-4)]" aria-label="Pay packages">
        <h2 className="m-0 border-b border-border pb-3 text-base font-semibold text-foreground">Pay packages</h2>
        <div className="grid min-w-0 gap-4 pt-4 sm:grid-cols-2 md:grid-cols-3">

          <p className="sm:col-span-2 -mt-2 text-xs text-muted-foreground">Default package · main job role. Salary amounts are in LPA unless labelled otherwise.</p>
          <label>
            <span className="mb-1.5 block text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Minimum CTC (LPA)
            </span>
            <Input
              className={inputClass}
              name="minimumLpa"
              type="number"
              min={0}
              max={1000}
              step="0.5"
            />
            <span className="mt-1 block text-xs text-muted-foreground">CTC Range, e.g. 6–10 LPA; use minimum and maximum fields.</span>
          </label>
          <label>
            <span className="mb-1.5 block text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Maximum CTC (LPA)
            </span>
            <Input
              className={inputClass}
              name="maximumLpa"
              type="number"
              min={0}
              max={1000}
              step="0.5"
            />
          </label>
          <label><span className="mb-1.5 block text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Fixed CTC (LPA)
          </span><Input className={inputClass} name="fixedLpa" type="number" min={0} max={1000} step="0.5"/></label>
          <label><span className="mb-1.5 block text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Variable CTC (LPA)
          </span><Input className={inputClass} name="variableLpa" type="number" min={0} max={1000} step="0.5"/></label>
          <label><span className="mb-1.5 block text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Stipend per month (INR)
          </span><Input className={inputClass} name="stipendPerMonthInr" type="number" min={0} max={10000000} step={1}/></label>
          <label><span className="mb-1.5 block text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Joining bonus (LPA)
          </span><Input className={inputClass} name="joiningBonusLpa" type="number" min={0} max={1000} step="0.5"/></label>
          <label><span className="mb-1.5 block text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Duration (months)
          </span><Input className={inputClass} name="stipendMonths" type="number" min={1} max={120} step={1}/></label>
          <div className="grid gap-1 rounded-lg border border-border bg-muted/30 p-3 text-sm">
            <span className="font-semibold">Visibility</span>
            <span className="text-body">College only · this drive stays within the selected college workspace.</span>
            <span className="text-xs text-muted-foreground">Choose eligible departments, programs and batches below to narrow its audience.</span>
          </div>
          <div className="grid gap-3 border-t border-border pt-3 sm:col-span-2">
            {extraPackages.map((pkg,index)=>(
              <div key={pkg.id} className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-2 lg:grid-cols-3">
                <label className="grid min-w-0 gap-1 text-xs font-semibold">Package name
                  <Input className={inputClass} maxLength={200} placeholder="e.g. Digital, Ninja"
                    aria-label={"Package "+(index+2)+" name"} value={pkg.name}
                    onChange={event=>setExtraPackages(rows=>rows.map(row=>row.id===pkg.id?{...row,name:event.target.value}:row))}/>
                </label>
                <label className="grid min-w-0 gap-1 text-xs font-semibold">CTC (LPA)
                  <Input className={inputClass} type="number" min={0} max={1000} step="0.5"
                    aria-label={"Package "+(index+2)+" CTC in LPA"} value={pkg.ctcLpa}
                    onChange={event=>setExtraPackages(rows=>rows.map(row=>row.id===pkg.id?{...row,ctcLpa:event.target.value}:row))}/>
                </label>
                {([
                  ["fixedLpa","Fixed (LPA)",1000,"0.5"],
                  ["variableLpa","Variable (LPA)",1000,"0.5"],
                  ["joiningBonusLpa","Joining bonus (LPA)",1000,"0.5"],
                  ["stipendPerMonthInr","Stipend / month (INR)",10000000,"1"],
                  ["stipendMonths","Duration (months)",120,"1"],
                ] as const).map(([field,label,max,step])=>(
                  <label key={field} className="grid min-w-0 gap-1 text-xs font-semibold">{label}
                    <Input className={inputClass} type="number" min={field==="stipendMonths"?1:0}
                      max={max} step={step} value={pkg[field]}
                      aria-label={"Package "+(index+2)+" "+label}
                      onChange={event=>setExtraPackages(rows=>rows.map(row=>
                        row.id===pkg.id?{...row,[field]:event.target.value}:row))}/>
                  </label>
                ))}
                <Button variant="secondary" type="button" className="self-end text-danger"
                  aria-label={"Remove package "+(index+2)}
                  onClick={()=>{setExtraPackages(rows=>rows.filter(row=>row.id!==pkg.id));markDirty();}}>
                  Remove package
                </Button>
              </div>
            ))}
            <Button variant="secondary" type="button" disabled={extraPackages.length>=10}
              className="min-h-11 justify-self-start border-dashed md:min-h-9"
              onClick={()=>{setExtraPackages(rows=>[...rows,{id:nextRowId.current++,name:"",ctcLpa:"",
                    fixedLpa:"",variableLpa:"",joiningBonusLpa:"",stipendPerMonthInr:"",stipendMonths:""}]);markDirty();}}>
              Add another package
            </Button>
            <p className="text-xs text-muted-foreground">
              Additional pay tracks are saved as separate role options. Every bonus and stipend duration is stored with its named package.
            </p>
          </div>
          <label className="flex items-center gap-3 text-sm font-semibold text-body">
            <Checkbox name="isDream" className="h-4 w-4 accent-primary"/>
            Dream drive (college held-offer cap exception)
          </label>
        </div>
      </section>

      <details open className="min-w-0 border-b border-border pb-6">
        <summary className="min-h-11 cursor-pointer text-base font-semibold text-foreground md:min-h-9">Additional job details</summary>
        <div className="pt-3">
          <h2 className="sr-only">Additional job details</h2>
          <p className="mt-1 text-sm text-body">Responsibilities, dates and preferences are informational. Only the eligibility policy below governs learner eligibility.</p>
        </div>
        <div className="grid gap-4 pt-4 sm:grid-cols-2">
          <fieldset className="sm:col-span-2 grid gap-3 rounded-[var(--lms-canvas-radius)] border border-border p-3">
            <legend className="px-1 text-sm font-semibold">Pool drive logistics (optional, staff-reviewed)</legend>
            <label className="grid min-w-0 gap-2 text-[length:var(--lms-font-sm)] leading-4 font-semibold text-[13px] text-[var(--lms-neutral-400)]">Host college
              <Input name="poolHostCollege" maxLength={160} className={inputClass} />
            </label>
            <label className="grid min-w-0 gap-2 text-[length:var(--lms-font-sm)] leading-4 font-semibold text-[13px] text-[var(--lms-neutral-400)]">Reporting time (IST)
              <Input name="poolReportingTime" type="datetime-local" className={inputClass} />
            </label>
            <label className="grid min-w-0 gap-2 text-[length:var(--lms-font-sm)] leading-4 font-semibold text-[13px] text-[var(--lms-neutral-400)]">Travel instructions
              <Textarea name="poolTravelNote" maxLength={1000} rows={2} className={inputClass} />
            </label>
            <p className="text-xs text-muted-foreground">Pool logistics are informational and do not create a round, venue booking or student travel authorization.</p>
          </fieldset>
          <fieldset className="sm:col-span-2 grid gap-3 rounded-[var(--lms-canvas-radius)] border border-border p-3">
            <legend className="px-1 text-sm font-semibold">Separate employer registration</legend>
            <label className="flex min-h-11 min-w-0 items-center gap-2 break-words py-2 text-sm">
              <Checkbox name="studentsRegisterSeparately" /> Students also register on the company's portal
            </label>
            <label className="grid min-w-0 gap-2 text-[length:var(--lms-font-sm)] leading-4 font-semibold text-[13px] text-[var(--lms-neutral-400)]">Portal name
              <Input name="portalName" maxLength={160} className={inputClass} />
            </label>
            <label className="grid min-w-0 gap-2 text-[length:var(--lms-font-sm)] leading-4 font-semibold text-[13px] text-[var(--lms-neutral-400)]">Portal link (HTTPS)
              <Input name="portalUrl" type="url" maxLength={2000} placeholder="https://..." className={inputClass} />
            </label>
            <p className="text-xs text-muted-foreground">This records the employer's separate portal; it does not automatically register students. Keep the application mode and primary employer URL consistent.</p>
          </fieldset>
          <label className="grid gap-2 text-[length:var(--lms-font-sm)] font-semibold sm:col-span-2 leading-4 text-[13px] text-[var(--lms-neutral-400)]">Responsibilities
            <Textarea name="responsibilities" rows={6} maxLength={15000} className={textareaClass} placeholder="Responsibilities, duties and expectations"/>
          </label>
          <label className="grid min-w-0 gap-2 text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Assessment URL
            <Input name="assessmentUrl" type="url" maxLength={2048} className={inputClass} placeholder="https://..."
              onChange={event=>setAssessmentUrlLength(event.target.value.length)}/>
            <span className="text-xs font-normal text-muted-foreground">{assessmentUrlLength}/2048 characters · HTTP or HTTPS</span>
          </label>
          <label className="grid min-w-0 gap-2 text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Assessment deadline (IST)
            <Input name="assessmentDeadline" type="datetime-local" className={inputClass}/>
          </label>
          <fieldset className="grid gap-3 sm:col-span-2">
            <legend className="text-sm font-semibold text-foreground">Important dates</legend>
            <p className="text-xs text-muted-foreground">Add up to 20 dates. The Application deadline field above is reserved.</p>
            {importantDateRows.map(row=>(
              <div key={row.id} className="grid items-end gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                <label className="grid min-w-0 gap-1 text-xs font-semibold">Label
                  <Input aria-label="Important date label" maxLength={100} placeholder="e.g. Screening round, Technical round"
                    value={row.label} onChange={event=>setImportantDateRows(current=>current.map(item=>item.id===row.id?{...item,label:event.target.value}:item))}
                    className={inputClass}/>
                </label>
                <label className="grid min-w-0 gap-1 text-xs font-semibold">Date (IST)
                  <Input aria-label="Important date" type="date" value={row.date}
                    onChange={event=>setImportantDateRows(current=>current.map(item=>item.id===row.id?{...item,date:event.target.value}:item))}
                    className={inputClass}/>
                </label>
                <Button type="button" variant="secondary" disabled={importantDateRows.length<=1}
                  title={importantDateRows.length<=1?"At least one row required":"Remove important date"}
                  aria-label="Remove important date"
                  onClick={()=>{setImportantDateRows(current=>current.filter(item=>item.id!==row.id));markDirty();}}
                  className="min-h-11 text-danger md:min-h-9">Remove</Button>
              </div>
            ))}
            <Button type="button" variant="secondary" disabled={importantDateRows.length>=20}
              onClick={()=>{setImportantDateRows(current=>[...current,{id:nextRowId.current++,label:"",date:""}]);markDirty();}}
              className="min-h-11 border-dashed md:min-h-9">
              Add date{importantDateRows.length>=20?" (max 20)":""}
            </Button>
          </fieldset>
          <label className="grid min-w-0 gap-2 text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Preferred degree
            <Input name="preferredDegree" maxLength={160} className={inputClass}/>
          </label>
          <label className="grid min-w-0 gap-2 text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Specialization
            <Input name="preferredSpecialization" maxLength={160} className={inputClass}/>
          </label>
          <label className="grid min-w-0 gap-2 text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Graduation year
            <Input name="preferredGraduationYear" type="number" min={1990} max={2050} className={inputClass}/>
          </label>
          <label className="grid min-w-0 gap-2 text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Minimum GPA (informational)
            <Input name="preferredMinimumGpa" type="number" min={0} max={10} step="0.01" className={inputClass}/>
          </label>
          <label className="grid min-w-0 gap-2 text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Preferred city
            <Input name="preferredCity" maxLength={160} className={inputClass}/>
          </label>
          <fieldset className="grid gap-3 sm:col-span-2">
            <legend className="text-sm font-semibold text-foreground">Custom eligibility rules</legend>
            <p className="text-xs text-muted-foreground">Add your own rules (e.g. Work permit, Experience). Displayed to students, informational only. Max 20.</p>
            {customRuleRows.map(row=>(
              <div key={row.id} className="grid items-end gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                <label className="grid min-w-0 gap-1 text-xs font-semibold">Rule label
                  <Input aria-label="Rule label" maxLength={160} placeholder="Label (e.g. Work permit)"
                    value={row.label} onChange={event=>setCustomRuleRows(current=>current.map(item=>item.id===row.id?{...item,label:event.target.value}:item))}
                    className={inputClass}/>
                </label>
                <label className="grid min-w-0 gap-1 text-xs font-semibold">Rule value
                  <Input aria-label="Rule value" maxLength={200} placeholder="Value (e.g. Required)"
                    value={row.value} onChange={event=>setCustomRuleRows(current=>current.map(item=>item.id===row.id?{...item,value:event.target.value}:item))}
                    className={inputClass}/>
                </label>
                <Button type="button" variant="secondary" disabled={customRuleRows.length<=1}
                  title={customRuleRows.length<=1?"At least one row required":"Remove custom rule"}
                  aria-label="Remove custom rule"
                  onClick={()=>{setCustomRuleRows(current=>current.filter(item=>item.id!==row.id));markDirty();}}
                  className="min-h-11 text-danger md:min-h-9">Remove</Button>
              </div>
            ))}
            <Button type="button" variant="secondary" disabled={customRuleRows.length>=20}
              onClick={()=>{setCustomRuleRows(current=>[...current,{id:nextRowId.current++,label:"",value:""}]);markDirty();}}
              className="min-h-11 border-dashed md:min-h-9">Add custom rule{customRuleRows.length>=20?" (max 20)":""}</Button>
          </fieldset>
          <p className="sm:col-span-2 text-xs text-muted-foreground">Visibility and cross-college targeting are not implied by application mode. This drive remains scoped to its college; use eligible programs and cohorts below for enforced audience rules.</p>
        </div>
      </details>
      <section className="min-w-0 border-b border-border border-l-[3px] border-l-primary pl-3 pb-[var(--lms-space-4)]">
        <div className="border-b border-border pb-[var(--lms-space-3)]">
          <h2 className="m-0 text-base font-semibold text-foreground">
            Eligibility · Target Audience
          </h2>
          <p className="mt-1 text-sm text-body">
            Configure explainable numeric requirements now. Program/cohort scoping can remain empty when the opportunity is open across the college.
          </p>
        </div>
        <div className="grid min-w-0 gap-[var(--lms-space-4)] pt-[var(--lms-space-4)]">
          <label className="grid min-w-0 gap-2 text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Department · Target Audience
            <Select className={inputClass} value={departmentFilter} onChange={event=>{
              setDepartmentFilter(event.target.value);setSelectedProgramIds([]);
              setSelectedCohortIds([]);setSelectedSectionIds([]);
            }}>
              <option value="ALL">All departments</option>
              {departments.map(department=><option key={department} value={department}>{department}</option>)}
            </Select>
            <span className="text-xs font-normal text-muted-foreground">
              Department selection targets every active program in that department.
              Choose specific programs, batches and classes below to narrow the audience.
            </span>
          </label>
          <div className="grid gap-4 min-[992px]:grid-cols-2">
            <fieldset className="min-w-0 border-t border-border px-0 py-4">
              <legend className="px-1 text-xs font-semibold text-body">
                Eligible programs
              </legend>
              <p className="mb-3 mt-0 text-xs leading-5 text-muted-foreground">
                Leave all unchecked to make the opportunity available across programs.
              </p>
              {visiblePrograms.length === 0 ? (
                <p className="m-0 text-sm text-muted-foreground">
                  No active programs are available in this college yet.
                </p>
              ) : (
                <div className="grid gap-2">
                  {visiblePrograms.map(
                    (program) => (
                      <label key={program.id} className="flex min-h-11 min-w-0 items-start gap-2 break-words py-2 text-sm text-body"
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

            <fieldset className="min-w-0 border-t border-border px-0 py-4">
              <legend className="px-1 text-xs font-semibold text-body">
                Eligible cohorts
              </legend>
              <p className="mb-3 mt-0 text-xs leading-5 text-muted-foreground">
                Cohorts can narrow the opportunity further before it is published.
              </p>
              {visibleCohorts.length === 0 ? (
                <p className="m-0 text-sm text-muted-foreground">
                  No active or planned cohorts are available yet.
                </p>
              ) : (
                <div className="grid gap-2">
                  {visibleCohorts.map(
                    (cohort) => (
                      <label key={cohort.id} className="flex min-h-11 min-w-0 items-start gap-2 break-words py-2 text-sm text-body"
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

          <fieldset className="min-w-0 border-t border-border px-0 py-4">
            <legend className="px-1 text-xs font-semibold text-body">Classes (sections)</legend>
            <p className="mb-3 text-xs text-muted-foreground">
              Leave unselected to include all classes in the selected programs and batches.
              Class targeting uses the persisted section whitelist.
            </p>
            <div className="grid min-w-0 grid-cols-1 gap-[var(--lms-space-2)] sm:grid-cols-2">
              {visibleSections.slice(0,500).map(section=><label key={section.id}
                className="flex min-h-11 min-w-0 items-center gap-2 break-words py-2 text-sm">
                <Checkbox checked={selectedSectionIds.includes(section.id)}
                 disabled={!selectedSectionIds.includes(section.id)&&selectedSectionIds.length>=100}
                 onChange={()=>toggleId(section.id,selectedSectionIds,setSelectedSectionIds)}/>
                {section.name} · {section.cohortName}
              </label>)}
              {!visibleSections.length?<p className="text-sm text-muted-foreground">No active classes in this selection.</p>:null}
              {visibleSections.length>500?<p className="text-sm text-muted-foreground">Showing first 500 classes. Narrow your program and batch selection to target later classes.</p>:null}
              {selectedSectionIds.length>=100?<p className="text-sm text-muted-foreground">Maximum 100 classes selected. Deselect a class to choose another.</p>:null}
            </div>
          </fieldset>
          <label className="block text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Eligibility preset
            <Select className={inputClass} value={eligibilityPreset} onChange={event=>setEligibilityPreset(event.target.value as DriveEligibilityPreset)}>
              <option value="OPEN">Open to all</option>
              <option value="CGPA_6">CGPA 6.0+</option>
              <option value="CGPA_7">CGPA 7.0+</option>
              <option value="PCT_60">60% throughout</option>
              <option value="PCT_70">70% throughout</option>
            </Select>
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
                <span className="mb-1.5 block text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
                  {label}
                </span>
                <Input
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
          <label className="sm:col-span-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            <span className="mb-1.5 block text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Passing years
            </span>
            <Input
              className={inputClass}
              name="passingYears"
              placeholder="2026, 2027"
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-body sm:col-span-2">
            <Checkbox name="requireVerifiedEvidence" className="h-4 w-4 accent-primary"/>
            Only students whose marks are verified
          </label>
          <label className="sm:col-span-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            <span className="mb-1.5 block text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Missing evidence
            </span>
            <Select
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
            </Select>
          </label>
          </div>
        </div>
      </section>

      <section aria-label="Skills the company wants" className="min-w-0 border-b border-border pb-[var(--lms-space-4)]">
        <h2 className="mb-3 text-base font-semibold text-foreground">Skills the company wants</h2>
          <div className="grid gap-2 sm:col-span-2">
            <label htmlFor="drive-skills-input" className="text-sm font-semibold text-foreground">Skills the company wants</label>
            <p className="text-xs text-muted-foreground">Type a skill and press Enter. Applicants get a skill match, but skills never decide who can apply. Up to 30 skills, 50 characters each.</p>
            <input type="hidden" name="skillsWanted" value={wantedSkills.join(", ")} readOnly />
            {wantedSkills.length>0?<div className="flex flex-wrap gap-2" aria-label="Skills selected">
              {wantedSkills.map(skill=><span key={skill} className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-xs">
                {skill}
                <Button variant="secondary" type="button" className="min-h-7 px-1 py-0 text-xs text-danger"
                  aria-label={"Remove skill "+skill} onClick={()=>{setWantedSkills(items=>items.filter(item=>item!==skill));markDirty();}}>×</Button>
              </span>)}
            </div>:null}
            <Input id="drive-skills-input" className={inputClass} value={skillDraft} maxLength={50}
              disabled={wantedSkills.length>=30} placeholder="e.g. Java, SQL, React"
              onChange={event=>{
                if(event.target.value.includes(","))addSkills(event.target.value);
                else setSkillDraft(event.target.value);
              }}
              onKeyDown={event=>{if(event.key==="Enter"||event.key===","){
                event.preventDefault();addSkills(skillDraft);
              }}}
              onBlur={()=>{if(skillDraft.trim())addSkills(skillDraft);}}
            />
            <p className="text-xs text-muted-foreground">{wantedSkills.length} of 30 skills selected</p>
          </div>
      </section>

      <section aria-label="Planned rounds" className="min-w-0 border-b border-border pb-[var(--lms-space-4)]">
        <h2 className="font-semibold text-foreground">Rounds</h2>
        <label className="mt-3 block text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">
          Round template
          <Select name="roundPreset" value={roundPreset}
            onChange={event=>{
              if(isTpoRoundPresetKey(event.target.value)){setRoundPreset(event.target.value);setRoundRows([]);markDirty();}
            }} className={inputClass}>
            {Object.entries(TPO_DRIVE_ROUND_PRESETS).map(([key,preset])=>
              <option key={key} value={key}>{preset.label}</option>)}
          </Select>
        </label>
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Round presets">
          {Object.entries(TPO_DRIVE_ROUND_PRESETS).filter(([key])=>key!=="NONE").map(([key,preset])=>(
            <Button key={key} variant="secondary" type="button"
              onClick={()=>{setRoundPreset(key as TpoRoundPresetKey);setRoundRows([]);markDirty();}}>
              {preset.label}
            </Button>
          ))}
        </div>
        <p role="status" className="mt-3 text-sm font-semibold text-body">
          {roundRows.length||plannedTpoRoundRows(roundPreset).length} rounds planned
        </p>
        <div className="mt-2 space-y-2">
          {(roundRows.length?roundRows:plannedTpoRoundRows(roundPreset).map(row=>({...row,id:row.sequence}))).map((round,index)=>(
            <div key={round.id} className="grid items-center gap-2 rounded-lg border border-border p-2 sm:grid-cols-[150px_minmax(0,1fr)_auto]">
              <Select aria-label={"Round "+(index+1)+" kind"} value={round.kind}
                onChange={event=>{
                  const rows=roundRows.length?roundRows:plannedTpoRoundRows(roundPreset).map(row=>({...row,id:row.sequence}));
                  setRoundRows(rows.map(item=>item.id===round.id?{...item,kind:event.target.value}:item));markDirty();
                }}>
                {["TALK","TEST","VENDOR_TEST","GD","INTERVIEW"].map(kind=><option key={kind} value={kind}>{kind}</option>)}
              </Select>
              <Input aria-label={"Round "+(index+1)+" name"} value={round.name} maxLength={100}
                placeholder="Round name" onChange={event=>{
                  const rows=roundRows.length?roundRows:plannedTpoRoundRows(roundPreset).map(row=>({...row,id:row.sequence}));
                  setRoundRows(rows.map(item=>item.id===round.id?{...item,name:event.target.value}:item));markDirty();
                }}/>
              <Button type="button" variant="secondary" aria-label="Remove this round" title="Remove this round"
                onClick={()=>{
                  const rows=roundRows.length?roundRows:plannedTpoRoundRows(roundPreset).map(item=>({...item,id:item.sequence}));
                  setRoundRows(rows.filter(item=>item.id!==round.id));setRoundPreset("NONE");markDirty();
                }}>Remove</Button>
            </div>
          ))}
        </div>
        <Button variant="secondary" type="button" className="mt-3 min-h-11 border-dashed md:min-h-9"
          disabled={roundRows.length>=20}
          onClick={()=>{
            const rows=roundRows.length?roundRows:plannedTpoRoundRows(roundPreset).map(item=>({...item,id:item.sequence}));
            setRoundRows([...rows,{id:nextRowId.current++,kind:"INTERVIEW",name:""}]);markDirty();
          }}>Add round</Button>
        <p className="mt-2 text-xs text-muted-foreground">
          The selected round template creates pending rounds with the draft. Review each round's
          name, kind and mode in the saved drive before sending any candidate invitations.
        </p>
      </section>
      <details className="min-w-0 border-b border-border pb-3">
       <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold md:min-h-9">Who this reaches</summary>
      <section aria-label="Who this reaches" className="min-w-0 pb-[var(--lms-space-4)]">
        <p role="status" className="mt-2 text-sm text-body">Eligibility preview unavailable before the draft is saved. Save the draft, then review eligible and excluded counts in the drive workspace before publishing.</p>
        <p className="mt-2 text-xs text-muted-foreground">Round templates are saved as pending during draft setup; scheduling, eligibility reach verification and recruiter invitations are managed in the saved drive workspace.</p>
      </section>

      </details>
      </fieldset>
      <aside aria-label="Setup review" className="sticky top-24 hidden rounded-xl border border-border bg-background p-4 lg:block">
        <h2 className="m-0 text-base font-semibold text-foreground">Setup review</h2>
        <p className="mt-1 text-xs text-body">Your milestones remain visible as you build the opportunity.</p>
        <ol className="mt-4 space-y-4 border-l-2 border-border pl-4 text-sm">
          {["Company","The drive","Eligibility","Publish review"].map((label,index)=>(
            <li key={label} className="relative">
              <span className="absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 border-primary bg-background" aria-hidden="true"/>
              <span className="block text-xs font-semibold text-primary-text">Step {index+1} of 4</span>
              <span className="mt-1 block font-semibold text-foreground">{label}</span>
            </li>
          ))}
        </ol>
        <div className="mt-4 border-t border-border pt-3 text-xs text-body">
          <p>No students are notified until you confirm publication.</p>
          {plannedTpoRoundRows(roundPreset).length===0&&roundRows.length===0?<p className="mt-2">No interview rounds added yet</p>:null}
          {!hasEnteredEligibilityRule&&eligibilityPreset==="OPEN"?
            <p className="mt-2">Open eligibility · verify reach after saving.</p>:null}
        </div>
      </aside>
      </div>
      {publishMissing.length>0?<div role="alert" className="rounded-[var(--lms-control-radius)] border border-warning p-3 text-sm">
        <p className="font-semibold">Complete {publishMissing.length} item(s) before reviewing publication</p>
        <ul className="mt-2 list-disc pl-5">{publishMissing.map(label=><li key={label}>{label}</li>)}</ul>
        <p className="mt-2">Your form is still here. Complete these fields and choose Review &amp; publish again.</p>
      </div>:null}
      <section className="flex min-w-0 flex-col gap-3 border-t border-border py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-body">Create a draft, then review the server reach, rounds and notifications before confirming publication.</p>
        <div className="flex min-w-0 flex-col gap-[var(--lms-space-2)] sm:flex-row sm:items-center">
          <Button variant="secondary" type="button" className="min-h-11 w-full sm:w-auto md:min-h-9"
            onClick={()=>{if(dirty)setCancelConfirmOpen(true);else router.push(basePath);}}>Cancel</Button>
          <Button className="min-h-11 w-full sm:w-auto md:min-h-9" type="submit" disabled={pending || !activeSeason || uncertainCreate || loadingCopy}>
            {pending ? "Saving changes…" : "Save as draft"}
          </Button>
          <Button variant="secondary"
            type="submit"
            value="review-publish"
            aria-label="Create draft and review before publication"
            disabled={pending || !activeSeason || uncertainCreate || loadingCopy}
            className="w-full min-h-11 rounded-[var(--lms-control-radius)] border border-primary px-4 text-sm font-[650] text-primary-text disabled:opacity-50 sm:w-auto md:min-h-9"
          >
            Review &amp; publish
          </Button>
        </div>
      </section>
      {uncertainCreate?<div role="alert" className="space-y-2 rounded-[var(--lms-control-radius)] border border-warning p-3 text-sm text-body">
        The previous create request may have succeeded. <Link href={basePath} className="font-semibold text-primary-text underline max-[767px]:inline-flex max-[767px]:min-h-11 max-[767px]:items-center focus-visible:underline">Review Drives</Link> before retrying.
        <Button variant="secondary" type="button" className="mt-[var(--lms-space-2)] min-h-11 w-full font-[650] text-primary-text underline sm:ml-[var(--lms-space-3)] sm:mt-0 sm:w-auto md:min-h-9"
          onClick={()=>{try{localStorage.removeItem(uncertainKey);}catch{}setUncertainCreate(false);}}>
          I checked Drives — allow another attempt
        </Button>
      </div>:null}
      {restoredBackup?<p role="status" className="text-sm text-body">A saved drive draft was restored from this browser. Review the values before submitting.</p>:null}
      {dirty?<Button variant="secondary" type="button" onClick={()=>{
        clearedBackup.current=true;
        try{localStorage.removeItem(backupKey);}catch{}
        setRestoredBackup(false);
      }} className="min-h-11 rounded-[var(--lms-control-radius)] border border-border px-3 text-xs font-[650] text-primary-text md:min-h-9">Discard saved browser backup</Button>:null}
      {partialJobId?<p role="alert" className="text-sm text-body">A draft exists. If setup did not finish, retry without changing the form or
        <a className="ml-1 font-semibold text-primary-text underline max-[767px]:inline-flex max-[767px]:min-h-11 max-[767px]:items-center focus-visible:underline" href={basePath+"/jobs/"+encodeURIComponent(partialJobId)}>open the existing draft</a>.
        Do not submit a second drive.
      </p>:null}
      {dirty ? <p role="status" className="text-xs text-muted-foreground">You have unsaved changes. Save this draft before leaving the page.</p> : null}
      <ConfirmDialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen}
        title="Discard unsaved changes?" description="Your changes will not be saved."
        confirmLabel="Discard changes" cancelLabel="Keep editing" confirmVariant="danger"
        onConfirm={()=>{setCancelConfirmOpen(false);clearDirty();router.push(basePath);}} />
      {guardDialog}
    </form>
  );
}
