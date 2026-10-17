import {TPO_OWNER_PAGE_COPY} from "@/modules/placements/tpo-page-copy";
import Link from "next/link";
import {TpoSafeCsvDownload} from "@/components/tpo/tpo-safe-csv-download";
import {Suspense} from "react";
import {TpoStudentsSpreadsheet} from "@/components/tpo/tpo-students-spreadsheet";
import {TpoStudentsAssignPrep} from "@/components/tpo/tpo-students-assign-prep";
import {placementTableExists} from "@/modules/placements/staged-tables";
import {TpoDebouncedStudentSearch} from "@/components/tpo/tpo-debounced-student-search";
import {TpoStudentsBulkDebar} from "@/components/tpo/tpo-students-bulk-debar";
import {TpoStudentsSelectionProvider,TpoStudentsSelectionSummary} from "@/components/tpo/tpo-students-selection";
import {TpoStudentSavedViews} from "@/components/tpo/tpo-student-saved-views";
import { TpoAcademicImportWorkspace } from "@/components/tpo/tpo-academic-import-workspace";
import {TpoStudentNudgePanel} from "@/components/tpo/tpo-student-nudge-panel";
import {TpoRosterVerificationBulk} from "@/components/tpo/tpo-roster-verification-bulk";
import {getTpoVerificationQueue} from "@/modules/placements/tpo-verification-queue-service";
import {getTpoAfterCollegeForRoster} from "@/modules/placements/tpo-after-college-roster-service";
import {AFTER_COLLEGE_OUTCOMES,AFTER_COLLEGE_LABELS} from "@/modules/placements/tpo-after-college-model";
import { redirect } from "next/navigation";
import {tpoStudentUrlError,tpoStudentFilterMessage} from "@/modules/placements/tpo-students-url-guard";
import {normalizeTpoStudentLegacyFilters} from "@/modules/placements/tpo-students-filter-aliases";
import {TpoBulkActionPanel} from "@/components/tpo/tpo-bulk-action-panel";

import { getCurrentRequestContext } from "@/auth/request-context";
import {listTpoBatches} from "@/modules/placements/tpo-batch-workspace-read-service";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { TpoStudentsBulkAdd } from "@/components/tpo/tpo-students-bulk-add";
import { listPlacementJobs } from "@/modules/placements/job-service";
import {tpoJourneyDrillFilters,tpoBranchDrillFilters} from "@/modules/placements/tpo-student-drill-filters-model";
import {tpoStudentRosterClearHref} from "@/modules/placements/tpo-student-roster-clear-model";
import {tpoStudentJourneySteps,tpoStudentJourneyGaps} from "@/modules/placements/tpo-student-journey-strip-model";
import { can, requirePermission } from "@/modules/permissions/policy";
import { requirePlacementManageScope } from "@/modules/placements/scope";
import { hasMembershipRole } from "@/modules/identity/context";
import {
  getTpoStudentsIntelligence,
  tpoStudentsQuerySchema,
} from "@/modules/placements/tpo-students-service";
import {
  TPO_STUDENT_JOURNEY_STATES,
  type TpoStudentJourneyState,
} from "@/modules/placements/tpo-students-model";

type SearchParams = {
  journeyState?: string | string[];
  branchId?: string | string[];
  programId?: string | string[];
  afterCollege?:string|string[];
  legacyStage?:string|string[];minRoundReached?:string|string[];needsAttention?:string|string[];
  interviewedWith?:string|string[];debarred?:string|string[];
  gender?:string|string[];birthYear?:string|string[];skillName?:string|string[];minSkills?:string|string[];
  minProjects?:string|string[];minCertifications?:string|string[];minExperiences?:string|string[];
  hasProfileLinks?:string|string[];hasResume?:string|string[];hasCodingProfiles?:string|string[];
  minTenthPct?:string|string[];minTwelfthPct?:string|string[];minDiplomaPct?:string|string[];minUgPct?:string|string[];
  passingYear?:string|string[];maxGapYears?:string|string[];marksVerified?:string|string[];isLateralEntry?:string|string[];
  profileStatus?:string|string[];
  minApplications?:string|string[];maxApplications?:string|string[];
  minOffers?:string|string[];maxOffers?:string|string[];
  offerWaiting?:string|string[];
  minCgpa?:string|string[];maxCgpa?:string|string[];
  maxActiveBacklogs?:string|string[];maxPastBacklogs?:string|string[];
  cgpaRecorded?:string|string[];
  classId?:string|string[];
  batchId?: string | string[];
  search?: string | string[];
  q?: string | string[];
  page?: string | string[];
  pageSize?: string | string[];
  columns?: string | string[];
  student?: string | string[];
};

const JOURNEY_LABELS: Record<TpoStudentJourneyState, string> = {
  NOT_REGISTERED: "Not registered",
  NEEDS_READINESS_SUPPORT: "Needs readiness support",
  READY_NOT_APPLYING: "Ready, not applying",
  APPLYING: "Already applying",
  PLACED: "Placed",
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function studentsHref(
  filters: {
    journeyState?: string;
    legacyStage?:string;minRoundReached?:number;needsAttention?:boolean;debarred?:boolean;
    interviewedWith?:string;
    gender?:string;birthYear?:number;skillName?:string;minSkills?:number;minProjects?:number;minCertifications?:number;minExperiences?:number;hasProfileLinks?:boolean;hasResume?:boolean;hasCodingProfiles?:boolean;
    branchId?: string;
    programId?:string;
    afterCollege?:string;
    profileStatus?:string;
    minApplications?:number;maxApplications?:number;minOffers?:number;maxOffers?:number;
    offerWaiting?:boolean;
    minCgpa?:number;maxCgpa?:number;
    minTenthPct?:number;minTwelfthPct?:number;minDiplomaPct?:number;minUgPct?:number;
    passingYear?:number;maxGapYears?:number;marksVerified?:boolean;isLateralEntry?:boolean;
    maxActiveBacklogs?:number;maxPastBacklogs?:number;
    cgpaRecorded?:boolean;
    classId?:string;
    batchId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
    columns?: string;
  },
  exportCsv = false,
) {
  const params = new URLSearchParams();

  if (filters.journeyState) {
    params.set("journeyState",filters.journeyState);
  }
  if(filters.legacyStage)params.set("legacyStage",filters.legacyStage);
  if(filters.debarred!==undefined)params.set("debarred",filters.debarred?"YES":"NO");
  if(filters.interviewedWith)params.set("interviewedWith",filters.interviewedWith);
  if(filters.gender)params.set("gender",filters.gender);
  if(filters.skillName)params.set("skillName",filters.skillName);
  if(filters.hasProfileLinks!==undefined)params.set("hasProfileLinks",filters.hasProfileLinks?"YES":"NO");
  if(filters.hasResume!==undefined)params.set("hasResume",filters.hasResume?"YES":"NO");
  if(filters.hasCodingProfiles!==undefined)params.set("hasCodingProfiles",filters.hasCodingProfiles?"YES":"NO");
  for(const key of ["birthYear","minSkills","minProjects","minCertifications","minExperiences"] as const)
   if(filters[key]!==undefined)params.set(key,String(filters[key]));
  if(filters.minRoundReached!==undefined)params.set("minRoundReached",String(filters.minRoundReached));
  if(filters.needsAttention!==undefined)params.set("needsAttention",filters.needsAttention?"YES":"NO");

  if (filters.branchId) {
    params.set("branchId", filters.branchId);
  }
  if(filters.programId)params.set("programId",filters.programId);
  if(filters.afterCollege)params.set("afterCollege",filters.afterCollege);
  if(filters.profileStatus)params.set("profileStatus",filters.profileStatus);
  if(filters.offerWaiting!==undefined)params.set("offerWaiting",filters.offerWaiting?"YES":"NO");
  if(filters.cgpaRecorded!==undefined)params.set("cgpaRecorded",filters.cgpaRecorded?"YES":"NO");
  if(filters.marksVerified!==undefined)params.set("marksVerified",filters.marksVerified?"YES":"NO");
  if(filters.isLateralEntry!==undefined)params.set("isLateralEntry",filters.isLateralEntry?"YES":"NO");
  for(const key of ["minCgpa","maxCgpa","maxActiveBacklogs","maxPastBacklogs","minTenthPct","minTwelfthPct","minDiplomaPct","minUgPct","passingYear","maxGapYears"] as const){
   if(filters[key]!==undefined)params.set(key,String(filters[key]));
  }
  for(const key of ["minApplications","maxApplications","minOffers","maxOffers"] as const){
   if(filters[key]!==undefined)params.set(key,String(filters[key]));
  }
  if(filters.classId)params.set("classId",filters.classId);
  if(filters.batchId)params.set("batchId",filters.batchId);

  if (filters.search) {
    params.set("search", filters.search);
  }
  if(!exportCsv&&filters.columns)params.set("columns",filters.columns);

  if (!exportCsv) {
    if (filters.page && filters.page > 1) {
      params.set("page", String(filters.page));
    }

    if (filters.pageSize && filters.pageSize !== 25) {
      params.set("pageSize", String(filters.pageSize));
    }
  }

  const base = exportCsv
    ? "/api/placements/tpo/students/export"
    : "/tpo/students";

  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

function metricTone(
  state: TpoStudentJourneyState,
): "neutral" | "warning" | "info" | "success" {
  if (state === "PLACED") return "success";

  if (
    state === "NEEDS_READINESS_SUPPORT" ||
    state === "NOT_REGISTERED"
  ) {
    return "warning";
  }

  if (state === "APPLYING") return "info";

  return "neutral";
}

function percentage(value: number | null) {
  return value === null ? "—" : `${value.toFixed(2)}%`;
}

export default async function TpoStudentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const context = await getCurrentRequestContext();

  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    redirect("/dashboard");
  }

  const incoming=await searchParams;
  const urlError=tpoStudentUrlError(incoming);
  const raw=urlError?incoming:normalizeTpoStudentLegacyFilters(incoming);
  const parsed = tpoStudentsQuerySchema.safeParse({
    collegeId: context.membership.collegeId,
    journeyState:first(raw.journeyState)||undefined,
    legacyStage:first(raw.legacyStage)||undefined,
    debarred:first(raw.debarred)||undefined,
    interviewedWith:first(raw.interviewedWith)||undefined,
    gender:first(raw.gender)||undefined,birthYear:first(raw.birthYear)||undefined,
    skillName:first(raw.skillName)||undefined,
    minSkills:first(raw.minSkills)||undefined,minProjects:first(raw.minProjects)||undefined,
    minCertifications:first(raw.minCertifications)||undefined,minExperiences:first(raw.minExperiences)||undefined,
    hasProfileLinks:first(raw.hasProfileLinks)||undefined,
    hasResume:first(raw.hasResume)||undefined,hasCodingProfiles:first(raw.hasCodingProfiles)||undefined,
    minRoundReached:first(raw.minRoundReached)||undefined,
    needsAttention:first(raw.needsAttention)||undefined,
    branchId: first(raw.branchId) || undefined,
    programId:first(raw.programId)||undefined,
    afterCollege:first(raw.afterCollege)||undefined,
    profileStatus:first(raw.profileStatus)||undefined,
    minApplications:first(raw.minApplications)||undefined,
    maxApplications:first(raw.maxApplications)||undefined,
    minOffers:first(raw.minOffers)||undefined,
    maxOffers:first(raw.maxOffers)||undefined,
    offerWaiting:first(raw.offerWaiting)||undefined,
    minCgpa:first(raw.minCgpa)||undefined,maxCgpa:first(raw.maxCgpa)||undefined,
    minTenthPct:first(raw.minTenthPct)||undefined,
    minTwelfthPct:first(raw.minTwelfthPct)||undefined,
    minDiplomaPct:first(raw.minDiplomaPct)||undefined,
    minUgPct:first(raw.minUgPct)||undefined,
    passingYear:first(raw.passingYear)||undefined,
    maxGapYears:first(raw.maxGapYears)||undefined,
    marksVerified:first(raw.marksVerified)||undefined,
    isLateralEntry:first(raw.isLateralEntry)||undefined,
    maxActiveBacklogs:first(raw.maxActiveBacklogs)||undefined,maxPastBacklogs:first(raw.maxPastBacklogs)||undefined,
    cgpaRecorded:first(raw.cgpaRecorded)||undefined,
    classId:first(raw.classId)||undefined,
    batchId: first(raw.batchId) || undefined,
    search: first(raw.search) || first(raw.q) || undefined,
    page: first(raw.page) || undefined,
    pageSize: first(raw.pageSize) || undefined,
  });

  if (urlError || !parsed.success) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={TPO_OWNER_PAGE_COPY.students}
          description="Everyone in placements, from the batches you made eligible."
        />
        <section
          role="alert"
          className="rounded-xl border border-border bg-surface p-6"
        >
          <h2 className="text-lg font-semibold text-foreground">
            Invalid Students filters
          </h2>
          <p className="mt-2 text-sm text-body">
            {urlError ?? tpoStudentFilterMessage(raw)}
          </p>
          <Link
            href="/tpo/students"
            className="mt-4 inline-flex min-h-10 items-center font-semibold text-primary-text hover:underline"
          >
            Clear filters
          </Link>
        </section>
      </div>
    );
  }

  const query = parsed.data;
  const collegeId = context.membership.collegeId;
  const manageAllowed = can(context, "placements.manage", { collegeId });
  if (manageAllowed) {
    requirePermission(context, "placements.manage", { collegeId });
    await requirePlacementManageScope(context, collegeId);
  }
  const [data, managedJobs, batchDirectory] = await Promise.all([
    getTpoStudentsIntelligence(context, query, {includeExportRows:true}),
    manageAllowed ? listPlacementJobs(context, collegeId) : Promise.resolve([]),
    listTpoBatches(context),
  ]);
  const bulkDriveChoices = managedJobs.filter((item) =>
    item.job.status === "PUBLISHED" &&
    item.season.status === "ACTIVE" &&
    item.job.applicationMode !== "EXTERNAL_ONLY"
  ).map((item) => ({
    id: item.job.id,
    title: item.job.title,
    companyName: item.company.name,
  }));
  const programChoices=[...new Map(batchDirectory.batches.map(item=>[item.programId,item.program] as const))];
  const summary = data.summary;
  const roster = data.roster;
  const afterCollege = await getTpoAfterCollegeForRoster(context, roster.items.map(row=>row.membershipId));
  const rosterIds=roster.items.map(row=>row.membershipId);
  const rosterVerifications=manageAllowed&&rosterIds.length?await getTpoVerificationQueue(context,{
    tab:"WAITING",kind:"ALL",waitingState:"ALL",waitingSince:"ALL",search:"",page:1,pageSize:100,
  },rosterIds):null;
  const nextRosterReviews=rosterVerifications?.hasMore?await getTpoVerificationQueue(context,{
    tab:"WAITING",kind:"ALL",waitingState:"ALL",waitingSince:"ALL",search:"",page:2,pageSize:100,
  },rosterIds):null;
  const waitingRosterRows=[...(rosterVerifications?.rows??[]),...(nextRosterReviews?.rows??[])];

  const counts: Record<TpoStudentJourneyState, number> = {
    NOT_REGISTERED: summary.notRegistered,
    NEEDS_READINESS_SUPPORT: summary.needsReadinessSupport,
    READY_NOT_APPLYING: summary.readyNotApplying,
    APPLYING: summary.applying,
    PLACED: summary.placed,
  };

  const scopedHref=(filters:Parameters<typeof studentsHref>[0],exportCsv=false)=>
    studentsHref({...filters,skillName:filters.skillName??query.skillName,programId:filters.programId??query.programId,afterCollege:filters.afterCollege??query.afterCollege,profileStatus:filters.profileStatus??query.profileStatus,
      minApplications:filters.minApplications??query.minApplications,maxApplications:filters.maxApplications??query.maxApplications,
      minOffers:filters.minOffers??query.minOffers,maxOffers:filters.maxOffers??query.maxOffers,offerWaiting:filters.offerWaiting??query.offerWaiting,minCgpa:filters.minCgpa??query.minCgpa,maxCgpa:filters.maxCgpa??query.maxCgpa,maxActiveBacklogs:filters.maxActiveBacklogs??query.maxActiveBacklogs,maxPastBacklogs:filters.maxPastBacklogs??query.maxPastBacklogs,cgpaRecorded:filters.cgpaRecorded??query.cgpaRecorded,classId:filters.classId??query.classId,batchId:query.batchId},exportCsv);
  const exportHref = scopedHref(
    {
      journeyState: query.journeyState,
      branchId: query.branchId,
      programId:query.programId,
      afterCollege:query.afterCollege,
      profileStatus:query.profileStatus,
      legacyStage:query.legacyStage,
      debarred:query.debarred,
      interviewedWith:query.interviewedWith,
      gender:query.gender,birthYear:query.birthYear,skillName:query.skillName,minSkills:query.minSkills,minProjects:query.minProjects,
    hasResume:query.hasResume,hasCodingProfiles:query.hasCodingProfiles,
      minCertifications:query.minCertifications,minExperiences:query.minExperiences,hasProfileLinks:query.hasProfileLinks,
      minRoundReached:query.minRoundReached,
      needsAttention:query.needsAttention,
      minApplications:query.minApplications,maxApplications:query.maxApplications,
      minOffers:query.minOffers,maxOffers:query.maxOffers,
      offerWaiting:query.offerWaiting,
    minCgpa:query.minCgpa,maxCgpa:query.maxCgpa,
    minTenthPct:query.minTenthPct,
    minTwelfthPct:query.minTwelfthPct,
    minDiplomaPct:query.minDiplomaPct,
    minUgPct:query.minUgPct,
    passingYear:query.passingYear,
    maxGapYears:query.maxGapYears,
    marksVerified:query.marksVerified,isLateralEntry:query.isLateralEntry,
    maxActiveBacklogs:query.maxActiveBacklogs,maxPastBacklogs:query.maxPastBacklogs,
    cgpaRecorded:query.cgpaRecorded,
      classId:query.classId,
      search: query.search,
    },
    true,
  );

  const currentFilters = {
    columns:first(raw.columns)?.slice(0,800),
    journeyState: query.journeyState,
    branchId: query.branchId,
    programId:query.programId,
    afterCollege:query.afterCollege,
    profileStatus:query.profileStatus,
    legacyStage:query.legacyStage,
      debarred:query.debarred,
      interviewedWith:query.interviewedWith,
      gender:query.gender,birthYear:query.birthYear,skillName:query.skillName,minSkills:query.minSkills,minProjects:query.minProjects,
    hasResume:query.hasResume,hasCodingProfiles:query.hasCodingProfiles,
      minCertifications:query.minCertifications,minExperiences:query.minExperiences,hasProfileLinks:query.hasProfileLinks,
    minRoundReached:query.minRoundReached,
    needsAttention:query.needsAttention,
    minApplications:query.minApplications,maxApplications:query.maxApplications,
    minOffers:query.minOffers,maxOffers:query.maxOffers,
    offerWaiting:query.offerWaiting,
    minCgpa:query.minCgpa,maxCgpa:query.maxCgpa,
    minTenthPct:query.minTenthPct,
    minTwelfthPct:query.minTwelfthPct,
    minDiplomaPct:query.minDiplomaPct,
    minUgPct:query.minUgPct,
    passingYear:query.passingYear,
    maxGapYears:query.maxGapYears,
    marksVerified:query.marksVerified,isLateralEntry:query.isLateralEntry,
    maxActiveBacklogs:query.maxActiveBacklogs,maxPastBacklogs:query.maxPastBacklogs,
    cgpaRecorded:query.cgpaRecorded,
    classId:query.classId,
    batchId: query.batchId,
    search: query.search,
    pageSize: query.pageSize,
  };

  const firstItem =
    roster.total === 0
      ? 0
      : (roster.page - 1) * roster.pageSize + 1;

  const lastItem = Math.min(
    roster.total,
    roster.page * roster.pageSize,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={TPO_OWNER_PAGE_COPY.students}
        description="Everyone in placements, from the batches you made eligible."
        actions={manageAllowed?<TpoAcademicImportWorkspace />:undefined}
      />
      <details className="rounded-xl border border-border bg-surface p-3">
       <summary className="min-h-10 cursor-pointer text-sm font-semibold">More student tools</summary>
       <nav aria-label="Student roster tools" className="mt-3 flex flex-wrap items-center gap-2">
        {manageAllowed?<TpoStudentSavedViews />:null}
        <Link href="/tpo/students/requests" className="inline-flex min-h-10 items-center rounded-md border border-border px-3 text-sm font-semibold text-primary-text">Student Requests</Link>
        <Link href="/tpo/students/preparation-prep" className="inline-flex min-h-10 items-center rounded-md border border-border px-3 text-sm font-semibold text-primary-text">Preparation support</Link>
        <TpoSafeCsvDownload href={exportHref} filename="tpo-students.csv" label="Export filtered CSV" />
       </nav>
      </details>

      <form action="/tpo/students" method="get"
        className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-4">
        {/* Program and Class are selected in the single grid filter panel.
            Preserve them through this separate advanced-filter form. */}
        <input type="hidden" name="programId" value={query.programId??""}/>
        <input type="hidden" name="classId" value={query.classId??""}/>
        <label className="text-sm font-semibold">Stage
          <select name="legacyStage" defaultValue={query.legacyStage??""}
            className="mt-1 block min-h-11 rounded border border-border bg-surface px-3">
            <option value="">All stages</option>
            {(["ELIGIBLE","INVITED","REGISTERED","VERIFIED","PLACED"] as const).map(stage=>
              <option key={stage} value={stage}>{stage.charAt(0)+stage.slice(1).toLowerCase()}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold">Interviewed with (company)
          <input type="search" name="interviewedWith" maxLength={100}
           defaultValue={query.interviewedWith??""} placeholder="Company name"
           className="min-h-11 w-40 rounded border border-border bg-surface px-3"/>
        </label>
        <label className="text-sm font-semibold">Debarred
          <select name="debarred" defaultValue={query.debarred===undefined?"":query.debarred?"YES":"NO"}
            className="mt-1 block min-h-11 rounded border border-border bg-surface px-3">
            <option value="">Any</option><option value="YES">Debarred</option><option value="NO">Not debarred</option>
          </select>
        </label>
        <label className="text-sm font-semibold">Needs attention
          <select name="needsAttention" defaultValue={query.needsAttention===undefined?"":query.needsAttention?"YES":"NO"}
            className="mt-1 block min-h-11 rounded border border-border bg-surface px-3">
            <option value="">Any</option><option value="YES">Needs attention</option><option value="NO">No attention flags</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold">Furthest round reached (minimum)
          <input type="number" name="minRoundReached" min={0} max={10000} step={1}
           defaultValue={query.minRoundReached??""} className="min-h-11 w-28 rounded border border-border bg-surface px-3"/>
        </label>
        <details className="w-full rounded border border-border p-3">
         <summary className="cursor-pointer font-semibold">Profile strength filters</summary>
         <div className="mt-3 flex flex-wrap gap-3">
          <label className="grid gap-1 text-sm">Gender
           <select name="gender" defaultValue={query.gender??""} className="min-h-11 rounded border border-border p-2">
            <option value="">Any</option>{(["Male","Female","Other"] as const).map(v=><option key={v}>{v}</option>)}
           </select>
          </label>
          <label className="grid gap-1 text-sm">Skill name
           <input type="search" name="skillName" defaultValue={query.skillName??""} maxLength={100}
            placeholder="e.g. Java" className="min-h-11 rounded border border-border p-2"/>
          </label>
          <label className="grid gap-1 text-sm">Birth year
           <input name="birthYear" type="number" min={1900} max={2100} defaultValue={query.birthYear??""} className="min-h-11 w-28 rounded border border-border p-2"/>
          </label>
          {([["minSkills","Skills"],["minProjects","Projects"],["minCertifications","Certifications"],["minExperiences","Experience entries"]] as const).map(([key,label])=>
           <label key={key} className="grid gap-1 text-sm">Minimum {label}
            <input type="number" name={key} min={0} max={100} defaultValue={query[key]??""} className="min-h-11 w-28 rounded border border-border p-2"/>
           </label>)}
          <label className="grid gap-1 text-sm">Profile links
           <select name="hasProfileLinks" defaultValue={query.hasProfileLinks===undefined?"":query.hasProfileLinks?"YES":"NO"} className="min-h-11 rounded border border-border p-2">
            <option value="">Any</option><option value="YES">Provided</option><option value="NO">Not provided</option>
           </select>
          </label>
          {([["hasResume","Resume"],["hasCodingProfiles","Coding profiles"]] as const).map(([key,label])=>
           <label key={key} className="grid gap-1 text-sm">{label}
            <select name={key} defaultValue={query[key]===undefined?"":query[key]?"YES":"NO"} className="min-h-11 rounded border border-border p-2">
             <option value="">Any</option><option value="YES">Provided</option><option value="NO">Not provided</option>
            </select>
           </label>)}
         </div>
        </details>
        <label className="text-sm font-semibold">Profile verified
          <select name="profileStatus" defaultValue={query.profileStatus??""}
            className="mt-1 block min-h-11 rounded border border-border bg-surface px-3">
            <option value="">All verification states</option>
            <option value="VERIFIED">Verified</option>
            <option value="WAITING">Waiting to verify</option>
            <option value="SENT_BACK">Sent back</option>
            <option value="NOT_VERIFIED">Not verified</option>
          </select>
        </label>
        {([
          ["minCgpa","CGPA from",query.minCgpa],
          ["maxCgpa","CGPA to",query.maxCgpa],
        ] as const).map(([name,label,value])=>
         <label key={name} className="grid gap-1 text-sm font-semibold">{label}
          <input type="number" name={name} min={0} max={10} step="0.01"
           defaultValue={value??""} placeholder="Any"
           className="min-h-11 w-28 rounded border border-border bg-surface px-3"/>
         </label>)}
        {([
          ["maxActiveBacklogs","Max active backlogs",query.maxActiveBacklogs],
          ["maxPastBacklogs","Max past backlogs",query.maxPastBacklogs],
        ] as const).map(([name,label,value])=>
         <label key={name} className="grid gap-1 text-sm font-semibold">{label}
          <input type="number" name={name} min={0} max={100} step={1}
           defaultValue={value??""} placeholder="Any"
           className="min-h-11 w-28 rounded border border-border bg-surface px-3"/>
         </label>)}
        <details className="w-full rounded-lg border border-border p-3">
          <summary className="cursor-pointer font-semibold">Academic marks and passing year filters</summary>
          <div className="mt-3 flex flex-wrap gap-3">
            {([
              ["minTenthPct","10th % from",query.minTenthPct],
              ["minTwelfthPct","12th % from",query.minTwelfthPct],
              ["minDiplomaPct","Diploma % from",query.minDiplomaPct],
              ["minUgPct","UG % from",query.minUgPct],
            ] as const).map(([key,label,value])=><label key={key} className="grid gap-1 text-sm">{label}
              <input type="number" min={0} max={100} step="0.01" name={key} defaultValue={value??""}
               className="min-h-11 w-28 rounded border border-border p-2"/></label>)}
            <label className="grid gap-1 text-sm">Passing year
              <input name="passingYear" type="number" min={1950} max={2100} defaultValue={query.passingYear??""}
                className="min-h-11 w-28 rounded border border-border p-2"/></label>
            <label className="grid gap-1 text-sm">Maximum gap years
              <input name="maxGapYears" type="number" min={0} max={100} defaultValue={query.maxGapYears??""}
                className="min-h-11 w-28 rounded border border-border p-2"/></label>
            {([
              ["marksVerified","Marks verified",query.marksVerified],
              ["isLateralEntry","Lateral entry",query.isLateralEntry],
            ] as const).map(([key,label,value])=><label key={key} className="grid gap-1 text-sm">{label}
              <select name={key} defaultValue={value===undefined?"":value?"YES":"NO"}
                className="min-h-11 rounded border border-border p-2">
                <option value="">Any</option><option value="YES">Yes</option><option value="NO">No</option>
              </select></label>)}
          </div>
        </details>
        <label className="text-sm font-semibold">CGPA recorded
          <select name="cgpaRecorded" defaultValue={query.cgpaRecorded===undefined?"":query.cgpaRecorded?"YES":"NO"}
            className="mt-1 block min-h-11 rounded border border-border bg-surface px-3">
            <option value="">Any</option><option value="YES">Recorded</option>
            <option value="NO">No recorded CGPA</option>
          </select>
        </label>
        <label className="text-sm font-semibold">Offer waiting on answer
          <select name="offerWaiting" defaultValue={query.offerWaiting===undefined?"":query.offerWaiting?"YES":"NO"}
            className="mt-1 block min-h-11 rounded border border-border bg-surface px-3">
            <option value="">Any</option>
            <option value="YES">Yes</option><option value="NO">No</option>
          </select>
        </label>
        <label className="text-sm font-semibold">After college
          <select name="afterCollege" defaultValue={query.afterCollege??""}
            className="mt-1 block min-h-11 rounded border border-border bg-surface px-3">
            <option value="">All outcomes</option>
            {AFTER_COLLEGE_OUTCOMES.map(outcome=>
              <option key={outcome} value={outcome}>{AFTER_COLLEGE_LABELS[outcome]}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold">Batch
          <select name="batchId" defaultValue={query.batchId??""}
            className="mt-1 block min-h-11 rounded border border-border bg-surface px-3">
            <option value="">Current students</option>
            {batchDirectory.batches.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        {([
          ["minApplications","Applications from",query.minApplications],
          ["maxApplications","Applications to",query.maxApplications],
          ["minOffers","Offers from",query.minOffers],
          ["maxOffers","Offers to",query.maxOffers],
        ] as const).map(([name,label,value])=>
         <label key={name} className="grid gap-1 text-sm font-semibold">{label}
          <input type="number" name={name} min={0} max={10000} step={1}
           defaultValue={value??""} placeholder="Any"
           className="min-h-11 w-28 rounded border border-border bg-surface px-3"/>
         </label>)}
        <button className="min-h-11 rounded border border-border px-4">Show students</button>
      </form>
      {query.batchId?<p className="text-sm text-muted-foreground">
        Students from a finished batch include completed enrollments for follow-up and reporting.
      </p>:null}
      <nav
        aria-label="Students workspace tabs"
        className="flex flex-wrap gap-2 border-b border-border pb-3"
      >
        <Link
          href="/tpo/students"
          aria-current="page"
          className="rounded-md bg-primary-subtle px-4 py-2 text-sm font-semibold text-primary-text"
        >
          Students roster
        </Link>
        <Link
          href="/tpo/students/requests"
          className="rounded-md px-4 py-2 text-sm font-semibold text-body hover:bg-muted"
        >
          Requests
        </Link>
      </nav>

      {!data.definitions.registrationsAvailable ? (
        <section
          role="status"
          className="rounded-xl border border-border bg-surface p-5"
        >
          <h2 className="text-base font-semibold text-warning">
            Placement registration data unavailable
          </h2>
          <p className="mt-2 text-sm leading-6 text-body">
            Placement registration information is unavailable. Registration counts may be incomplete.
          </p>
        </section>
      ) : null}

      {query.profileStatus&&!data.definitions.verificationAvailable?<section role="status"
        className="rounded-xl border border-border bg-surface p-4 text-sm text-warning-text">
        Profile-verification records are unavailable. A missing source must not be mistaken for Not verified.
        <Link href="/tpo/students" className="ml-2 text-primary-text underline">Clear profile filter</Link>
      </section>:null}
      {query.afterCollege&&!data.definitions.afterCollegeAvailable?<section role="status"
        className="rounded-xl border border-border bg-surface p-4 text-sm text-warning-text">
        Saved after-college outcome records are unavailable. The selected outcome cannot be filtered until its registered table is available.
        <Link href="/tpo/students" className="ml-2 text-primary-text underline">Clear outcome filter</Link>
      </section>:null}
      {!data.definitions.externalOffersAvailable ? (
        <section
          role="status"
          className="rounded-xl border border-border bg-surface p-4 text-sm leading-6 text-body"
        >
          External offer information is unavailable. Placed counts may be incomplete.
        </section>
      ) : null}

      {!data.debarmentAvailable?<p role="status" className="text-sm text-warning-text">Timed debarment records are not available right now. Debarment filters and counts may be incomplete.</p>:null}
      {(data.uninvitedCount??0)>0?<section role="status" className="rounded-xl border border-border bg-surface p-4 text-sm">
        Registration is not open for {data.uninvitedCount} students: their batch has not been invited, so they cannot register.
        <Link href="/tpo/batches" className="ml-2 font-semibold text-primary-text underline">Open Placement eligibility</Link>
      </section>:null}
      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Placement intelligence
            </h2>
            <p className="mt-1 text-sm text-body">
              {data.season
                ? `Active placement season: ${data.season.name}`
                : "No active placement season is configured. Season-scoped applications and offers are not included."}
            </p>
          </div>

        </div>

        <p className="mt-3 text-sm text-body" aria-live="polite">Journey of the {summary.activeLearners} students in {query.batchId?"this batch":query.programId?"this program":query.branchId?"this branch":"placements"}.</p>
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Student placement journey">
         {tpoStudentJourneySteps(summary).map(step=><div key={step.label} className="rounded-lg border border-border bg-surface p-4">
          <h3 className="text-sm font-semibold">{step.label}</h3>
          <p className="mt-2 text-2xl font-bold tabular-nums">{step.count}</p>
          <p className="text-xs text-muted-foreground">{step.percent}% of {summary.activeLearners} student(s)</p>
         </div>)}
        </div>
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Journey attention filters">
         {data.debarredCount!=null&&data.debarredCount>0?<Link
          href={scopedHref({...currentFilters,debarred:true,page:1})}
          className="rounded-full border border-border px-3 py-2 text-sm font-semibold text-primary-text">
          Debarred · {data.debarredCount}</Link>:null}
         {tpoStudentJourneyGaps(summary).map(gap=><Link key={gap.state}
          href={scopedHref({...currentFilters,journeyState:gap.state,page:1})}
          className="rounded-full border border-border px-3 py-2 text-sm font-semibold text-primary-text">
          {gap.label} · {gap.count}</Link>)}
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {TPO_STUDENT_JOURNEY_STATES.map((state) => {
            const selected = query.journeyState === state;

            return (
              <Link
                key={state}
                href={scopedHref(tpoJourneyDrillFilters({
                  branchId:query.branchId,
                  search:query.search,
                  columns:first(raw.columns)?.slice(0,800),
                  pageSize:query.pageSize,
                },state))}
                aria-current={selected ? "page" : undefined}
                className={
                  "rounded-lg border p-4 transition hover:border-primary hover:bg-primary-subtle " +
                  (selected
                    ? "border-primary bg-primary-subtle"
                    : "border-border bg-surface")
                }
              >
                <p className="text-sm font-semibold text-body">
                  {JOURNEY_LABELS[state]}
                </p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">
                  {counts[state]}
                </p>
                <div className="mt-2">
                  <StatusBadge tone={metricTone(state)}>
                    View roster
                  </StatusBadge>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-muted px-4 py-3">
            <p className="text-xs font-semibold text-muted-foreground">
              {query.batchId?"Students in selected batch":"Active enrolled learners"}
            </p>
            <p className="mt-1 text-xl font-semibold text-foreground">
              {summary.activeLearners}
            </p>
          </div>
          <div className="rounded-lg bg-muted px-4 py-3">
            <p className="text-xs font-semibold text-muted-foreground">
              Registered placement pool
            </p>
            <p className="mt-1 text-xl font-semibold text-foreground">
              {summary.placementPool}
            </p>
          </div>
          <div className="rounded-lg bg-muted px-4 py-3">
            <p className="text-xs font-semibold text-muted-foreground">
              Placed outside registered pool
            </p>
            <p className="mt-1 text-xl font-semibold text-foreground">
              {summary.placedOutsidePool}
            </p>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Readiness is a provisional signal derived from placement
          participation and available academic evidence, not a
          verified employability assessment. Placed counts use
          accepted offers and available verified external offers;
          they are not confirmed joining counts.
        </p>
      </section>

      <section className="rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold text-foreground">
            Branch intelligence
          </h2>
          <p className="mt-1 text-sm text-body">
            Placement rates use registered placement-pool learners
            as the denominator, not every enrolled learner.
          </p>
        </div>

        {data.branches.length === 0 ? (
          <p className="p-5 text-sm text-body">
            No learners are available for this selection.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3">Branch</th>
                  <th scope="col" className="px-4 py-3">Learners</th>
                  <th scope="col" className="px-4 py-3">Registered</th>
                  <th scope="col" className="px-4 py-3">Applying</th>
                  <th scope="col" className="px-4 py-3">Placed in pool</th>
                  <th scope="col" className="px-4 py-3">Placed overall</th>
                  <th scope="col" className="px-4 py-3">Rate*</th>
                </tr>
              </thead>
              <tbody>
                {data.branches.map((branch) => (
                  <tr
                    key={branch.branchId}
                    className="border-t border-border"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={scopedHref(tpoBranchDrillFilters({
                          journeyState:query.journeyState,
                          search:query.search,
                          columns:first(raw.columns)?.slice(0,800),
                          pageSize:query.pageSize,
                        },branch.branchId))}
                        className="font-semibold text-primary-text hover:underline"
                      >
                        {branch.branchName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {branch.activeLearners}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {branch.placementPool}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {branch.applying}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {branch.placedInPool}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {branch.placed}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {percentage(branch.placementRatePercent)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="px-5 py-3 text-xs leading-5 text-muted-foreground">
          *Rate uses the registered placement pool; — means no registered students.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Students roster
            </h2>
            <p className="mt-1 text-sm text-body" aria-live="polite">
              {roster.total} students in this view · showing {firstItem}–{lastItem}
            </p>
          </div>
          <Link
            href={tpoStudentRosterClearHref(query.pageSize,first(raw.columns))}
            className="text-sm font-semibold text-primary-text hover:underline"
          >
            Clear filters
          </Link>
        </div>

        <form
          action="/tpo/students"
          method="get"
          className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {first(raw.columns)&&<input type="hidden" name="columns" value={first(raw.columns)?.slice(0,800)}/>}
          <label className="flex flex-col gap-1 text-sm font-semibold text-body">
            Journey
            <select
              name="journeyState"
              defaultValue={query.journeyState ?? ""}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-foreground"
            >
              <option value="">All journeys</option>
              {TPO_STUDENT_JOURNEY_STATES.map((state) => (
                <option key={state} value={state}>
                  {JOURNEY_LABELS[state]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold text-body">
            Branch
            <select
              name="branchId"
              defaultValue={query.branchId ?? ""}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-foreground"
            >
              <option value="">All branches</option>
              {data.branches.map((branch) => (
                <option key={branch.branchId} value={branch.branchId}>
                  {branch.branchName}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold text-body">
            Search
            <TpoDebouncedStudentSearch initial={query.search??""} />
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold text-body">
            Page size
            <select
              name="pageSize"
              defaultValue={String(query.pageSize)}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-foreground"
            >
              <option value="25">25 students</option>
              <option value="50">50 students</option>
              <option value="100">100 students</option>
            </select>
          </label>

          <div className="sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-hover"
            >
              Apply filters
            </button>
          </div>
        </form>

        {roster.items.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface p-8 text-sm text-body">
            {roster.total > 0
              ? "This page is outside the matching result range. Return to the first page."
              : Object.entries(currentFilters).some(([key,value])=>!["columns","page","pageSize"].includes(key)&&value!==undefined&&value!==null&&value!=="")
                ? "No students match these filters."
                : "Nobody is in placements yet."}
            {roster.total===0&&!(Object.entries(currentFilters).some(([key,value])=>!["columns","page","pageSize"].includes(key)&&value!==undefined&&value!==null&&value!==""))?<p className="mt-2">Decide who is in on Placement eligibility; they show up here.</p>:null}
            <div className="mt-3">
              <Link
                href={roster.total>0?scopedHref({
                  ...currentFilters,
                  page: 1,
                }):(Object.entries(currentFilters).some(([key,value])=>!["columns","page","pageSize"].includes(key)&&value!==undefined&&value!==null&&value!=="")?"/tpo/students":"/tpo/batches")}
                className="font-semibold text-primary-text hover:underline"
              >
                {roster.total>0?"First matching page":(Object.entries(currentFilters).some(([key,value])=>!["columns","page","pageSize"].includes(key)&&value!==undefined&&value!==null&&value!=="")?"Clear search and filters":"Open Placement eligibility")}
              </Link>
            </div>
          </div>
        ) : null}
        <TpoStudentsSelectionProvider
         key={"selection:"+context.membership.id+":"+JSON.stringify({...currentFilters,page:undefined,pageSize:undefined,columns:undefined})}
         scopeKey={context.membership.id+":"+JSON.stringify({...currentFilters,page:undefined,pageSize:undefined,columns:undefined})}
         allowedIds={roster.total<=5000?(data.exportRows??[]).map(item=>item.membershipId):roster.items.map(item=>item.membershipId)}
         totalCount={roster.total}>
        <Suspense fallback={<p role="status">Loading spreadsheet grid…</p>}>
          <TpoStudentsSpreadsheet rows={roster.items} programs={programChoices.map(([id,name])=>({id,name}))} classes={data.classChoices}
            afterCollege={afterCollege.entries} afterCollegeAvailable={afterCollege.available && manageAllowed}/>
        </Suspense>
        <TpoStudentsSelectionSummary visibleIds={roster.items.map(student=>student.membershipId)} totalCount={roster.total}/>

        {rosterVerifications?.enabled&&rosterVerifications.permitted&&waitingRosterRows.length>0?
          <TpoRosterVerificationBulk rows={waitingRosterRows}/>:null}
        {manageAllowed?<TpoStudentNudgePanel
          key={"nudge:"+query.batchId+":"+query.branchId+":"+roster.page+":"+query.search}
          rows={roster.items.map(student=>({
            id:student.membershipId,
            label:student.displayName+" · "+(student.rollNumber??student.branchName),
            registered:student.registeredForPlacements,
          }))} />:null}
        <TpoBulkActionPanel key={"students:"+query.batchId+":"+query.branchId+":"+roster.page+":"+query.pageSize+":"+query.search+":"+query.journeyState}
          target="STUDENTS"
          rows={roster.items.map(student=>({id:student.membershipId,
            label:student.displayName+" · "+student.branchName}))}
          viewCount={roster.total}
          allRows={roster.total<=5000?data.exportRows?.map(student=>({
            id:student.membershipId,label:student.displayName+" · "+student.branchName
          }))??undefined:undefined}/>

        {manageAllowed&&(await placementTableExists("placement_tpo_prep_assignments"))?<TpoStudentsAssignPrep/>:null}
        {manageAllowed?<TpoStudentsBulkDebar learners={roster.items.map(student=>({
          id:student.membershipId,name:student.displayName,debarred:student.debarred===true
        }))}/>:null}
        {manageAllowed ? (
          <TpoStudentsBulkAdd
            key={"bulk-add:"+query.batchId+":"+query.branchId+":"+roster.page+":"+query.pageSize+":"+query.search+":"+query.journeyState}
            learners={roster.items.map((student) => ({
              membershipId: student.membershipId,
              displayName: student.displayName,
              branchName: student.branchName,
              readinessSignal: student.readinessSignal,
            }))}
            drives={bulkDriveChoices}
          />
        ) : null}

        </TpoStudentsSelectionProvider>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-body">
            Page {roster.page} of {Math.max(1, roster.totalPages)}
          </p>

          <nav
            aria-label="Students roster pagination"
            className="flex flex-wrap items-center gap-2"
          >
            {roster.page > 1 ? (
              <Link
                href={scopedHref({
                  ...currentFilters,
                  page: roster.page - 1,
                })}
                className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text"
              >
                Previous
              </Link>
            ) : null}

            {roster.page < roster.totalPages ? (
              <Link
                href={scopedHref({
                  ...currentFilters,
                  page: roster.page + 1,
                })}
                className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text"
              >
                Next
              </Link>
            ) : null}
          </nav>
        </div>

        <p className="text-xs leading-5 text-muted-foreground">
          CSV exports all students matching the active roster filters,
          not just the visible page. The export uses the same authorized
          college read and CSV formula-escaping helper.
        </p>
      </section>
    </div>
  );
}
