import { Button } from "@/components/ui/button";
import { Disclosure } from "@/components/ui/disclosure";
import { Dropdown } from "@/components/ui/dropdown";
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
import { TpoAcademicImportWorkspace } from "@/components/tpo/tpo-academic-import-workspace";
import {TpoStudentNudgePanel} from "@/components/tpo/tpo-student-nudge-panel";
import {TpoStudentsSelectedNote} from "@/components/tpo/tpo-students-selected-note";
import {TpoRosterVerificationBulk} from "@/components/tpo/tpo-roster-verification-bulk";
import {getTpoVerificationQueue} from "@/modules/placements/tpo-verification-queue-service";
import {getTpoAfterCollegeForRoster} from "@/modules/placements/tpo-after-college-roster-service";
import {AFTER_COLLEGE_OUTCOMES,AFTER_COLLEGE_LABELS} from "@/modules/placements/tpo-after-college-model";
import { redirect } from "next/navigation";
import {tpoStudentUrlError,tpoStudentFilterMessage} from "@/modules/placements/tpo-students-url-guard";
import {normalizeTpoStudentLegacyFilters} from "@/modules/placements/tpo-students-filter-aliases";
import {TpoBulkActionPanel} from "@/components/tpo/tpo-bulk-action-panel";

import { getCurrentRequestContext } from "@/auth/request-context";
import {requireTpoBatchActor} from "@/modules/placements/tpo-batch-workspace-read-service";
import {listTpoBatches} from "@/modules/placements/tpo-batch-workspace-read-service";
import { PageHeader } from "@/components/ui/page-header";
import { FilterChipLink } from "@/components/ui/filter-chip";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { InlineNotice } from "@/components/ui/inline-notice";
import { StatusBadge } from "@/components/ui/status-badge";
import { TpoStudentsBulkAdd } from "@/components/tpo/tpo-students-bulk-add";
import {TpoStudentsDriveVisibility} from "@/components/tpo/tpo-students-drive-visibility";
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
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Table} from "@/components/ui/table";

type SearchParams = {
  journeyState?: string | string[];
  everyone?: string | string[];
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
    everyone?:boolean;
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
  if (filters.everyone !== undefined) params.set("everyone", filters.everyone ? "YES" : "NO");
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
  // Session claims alone cannot retain student PII after TPO role removal.
  await requireTpoBatchActor(context);

  const incoming=await searchParams;
  const urlError=tpoStudentUrlError(incoming);
  const raw=urlError?incoming:normalizeTpoStudentLegacyFilters(incoming);
  const parsed = tpoStudentsQuerySchema.safeParse({
    collegeId: context.membership.collegeId,
    journeyState:first(raw.journeyState)||undefined,
    everyone:first(raw.everyone)||undefined,
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
      <div className="min-w-0 space-y-4 md:space-y-6">
        <PageHeader
          title={TPO_OWNER_PAGE_COPY.students}
          description="Students by placement participation and college roster."
        />
        <Alert tone="error">
          <h2 className="text-lg font-semibold text-foreground">
            Invalid Students filters
          </h2>
          <p className="mt-2 text-sm text-body">
            {urlError ?? tpoStudentFilterMessage(raw)}
          </p>
          <Link
            href="/tpo/students"
            className="lms-inline-link mt-4 inline-flex min-h-11 items-center font-semibold text-link underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9"
          >
            Clear filters
          </Link>
        </Alert>
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
    studentsHref({...filters,everyone:filters.everyone??query.everyone,skillName:filters.skillName??query.skillName,programId:filters.programId??query.programId,afterCollege:filters.afterCollege??query.afterCollege,profileStatus:filters.profileStatus??query.profileStatus,
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
    everyone:query.everyone,
    everyone:query.everyone,
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
    <div className="min-w-0 space-y-4 md:space-y-6">
      <PageHeader
        title={TPO_OWNER_PAGE_COPY.students}
        description={query.everyone ? "All active learners in this college, including those not enrolled in placements." : "Everyone in placements, from the batches you made eligible."}
        actions={manageAllowed?<TpoAcademicImportWorkspace />:undefined}
      />
      <nav
        aria-label="Students workspace tabs"
        className="flex flex-wrap gap-2 border-b border-border pb-3"
      >
        <Link
          href="/tpo/students"
          aria-current="page"
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] bg-primary-subtle px-4 py-2 text-sm font-[650] text-link focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9"
        >
          Students roster
        </Link>
        <Link
          href="/tpo/students/requests"
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] px-4 py-2 text-sm font-semibold text-body hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9"
        >
          Requests
        </Link>
      </nav>

      <Dropdown mobileSheet align="start" label="Student roster tools" trigger="More student tools">
        <nav aria-label="Student roster tools" className="flex min-w-52 flex-col gap-2">
        <Link href="/tpo/students/requests" className="lms-inline-link inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-[650] text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Student Requests</Link>
        <Link href="/tpo/students/preparation-prep" className="lms-inline-link inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-[650] text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Preparation support</Link>
        <TpoSafeCsvDownload href={exportHref} filename="students.csv" label="Export filtered CSV" />
       </nav>
      </Dropdown>

      <Disclosure title="Advanced student filters" className="min-w-0 border-b border-border py-3" contentClassName="pt-3">
      <form role="search" aria-label="tpo students filters" action="/tpo/students" method="get"
        className="grid min-w-0 gap-3 border-b border-border py-4 md:grid-cols-2 xl:grid-cols-4 xl:items-end">
        {/* Program and Class are selected in the single grid filter panel.
            Preserve them through this separate advanced-filter form. */}
        <Input type="hidden" name="programId" value={query.programId??""}/>
        <Input type="hidden" name="everyone" value={query.everyone?"YES":"NO"}/>
        <Input type="hidden" name="classId" value={query.classId??""}/>
        <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Stage
          <Select name="legacyStage" defaultValue={query.legacyStage??""}
            className="mt-[6px] block min-h-11 md:min-h-9">
            <option value="">All stages</option>
            {(["ELIGIBLE","INVITED","REGISTERED","VERIFIED","PLACED"] as const).map(stage=>
              <option key={stage} value={stage}>{stage.charAt(0)+stage.slice(1).toLowerCase()}</option>)}
          </Select>
        </label>
        <label className="grid gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Interviewed with (company)
          <Input type="search" name="interviewedWith" maxLength={100}
           defaultValue={query.interviewedWith??""} placeholder="Company name"
           className="w-40"/>
        </label>
        <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Debarred
          <Select name="debarred" defaultValue={query.debarred===undefined?"":query.debarred?"YES":"NO"}
            className="mt-[6px] block min-h-11 md:min-h-9">
            <option value="">Any</option><option value="YES">Debarred</option><option value="NO">Not debarred</option>
          </Select>
        </label>
        <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Needs attention
          <Select name="needsAttention" defaultValue={query.needsAttention===undefined?"":query.needsAttention?"YES":"NO"}
            className="mt-[6px] block min-h-11 md:min-h-9">
            <option value="">Any</option><option value="YES">Needs attention</option><option value="NO">No attention flags</option>
          </Select>
        </label>
        <label className="grid gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Furthest round reached (minimum)
          <Input type="number" name="minRoundReached" min={0} max={10000} step={1}
           defaultValue={query.minRoundReached??""} className="w-28"/>
        </label>
        <Disclosure title="Profile strength filters" className="w-full min-w-0 border-b border-border px-0 py-3">
         <p className="mt-2 text-xs text-muted-foreground">Projects here are self-reported profile entries, not verified Projects workspace outcomes or released grades.</p>
         <div className="mt-3 flex flex-wrap gap-3">
          <label className="grid gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Gender
           <Select name="gender" defaultValue={query.gender??""} className="min-h-11 md:min-h-9 p-2">
            <option value="">Any</option>{(["Male","Female","Other"] as const).map(v=><option key={v}>{v}</option>)}
           </Select>
          </label>
          <label className="grid gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Skill name
           <Input type="search" name="skillName" defaultValue={query.skillName??""} maxLength={100}
            placeholder="e.g. Java" />
          </label>
          <label className="grid gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Birth year
           <Input name="birthYear" type="number" min={1900} max={2100} defaultValue={query.birthYear??""} className="w-28"/>
          </label>
          {([["minSkills","Skills"],["minProjects","Projects"],["minCertifications","Certifications"],["minExperiences","Experience entries"]] as const).map(([key,label])=>
           <label key={key} className="grid gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Minimum {label}
            <Input type="number" name={key} min={0} max={100} defaultValue={query[key]??""} className="w-28"/>
           </label>)}
          <label className="grid gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Profile links
           <Select name="hasProfileLinks" defaultValue={query.hasProfileLinks===undefined?"":query.hasProfileLinks?"YES":"NO"} className="min-h-11 md:min-h-9 p-2">
            <option value="">Any</option><option value="YES">Provided</option><option value="NO">Not provided</option>
           </Select>
          </label>
          {([["hasResume","Resume"],["hasCodingProfiles","Coding profiles"]] as const).map(([key,label])=>
           <label key={key} className="grid gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">{label}
            <Select name={key} defaultValue={query[key]===undefined?"":query[key]?"YES":"NO"} className="min-h-11 md:min-h-9 p-2">
             <option value="">Any</option><option value="YES">Provided</option><option value="NO">Not provided</option>
            </Select>
           </label>)}
         </div>
        </Disclosure>
        <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Profile verified
          <Select name="profileStatus" defaultValue={query.profileStatus??""}
            className="mt-[6px] block min-h-11 md:min-h-9">
            <option value="">All verification states</option>
            <option value="VERIFIED">Verified</option>
            <option value="WAITING">Waiting to verify</option>
            <option value="SENT_BACK">Sent back</option>
            <option value="NOT_VERIFIED">Not verified</option>
          </Select>
        </label>
        {([
          ["minCgpa","CGPA from",query.minCgpa],
          ["maxCgpa","CGPA to",query.maxCgpa],
        ] as const).map(([name,label,value])=>
         <label key={name} className="grid gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">{label}
          <Input type="number" name={name} min={0} max={10} step="0.01"
           defaultValue={value??""} placeholder="Any"
           className="w-28"/>
         </label>)}
        {([
          ["maxActiveBacklogs","Max active backlogs",query.maxActiveBacklogs],
          ["maxPastBacklogs","Max past backlogs",query.maxPastBacklogs],
        ] as const).map(([name,label,value])=>
         <label key={name} className="grid gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">{label}
          <Input type="number" name={name} min={0} max={100} step={1}
           defaultValue={value??""} placeholder="Any"
           className="w-28"/>
         </label>)}
        <Disclosure title="Academic marks and passing year filters" className="w-full min-w-0 border-b border-border px-0 py-3">
          <div className="mt-3 flex flex-wrap gap-3">
            {([
              ["minTenthPct","10th % from",query.minTenthPct],
              ["minTwelfthPct","12th % from",query.minTwelfthPct],
              ["minDiplomaPct","Diploma % from",query.minDiplomaPct],
              ["minUgPct","UG % from",query.minUgPct],
            ] as const).map(([key,label,value])=><label key={key} className="grid gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">{label}
              <Input type="number" min={0} max={100} step="0.01" name={key} defaultValue={value??""}
               className="w-28"/></label>)}
            <label className="grid gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Passing year
              <Input name="passingYear" type="number" min={1950} max={2100} defaultValue={query.passingYear??""}
                className="w-28"/></label>
            <label className="grid gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Maximum gap years
              <Input name="maxGapYears" type="number" min={0} max={100} defaultValue={query.maxGapYears??""}
                className="w-28"/></label>
            {([
              ["marksVerified","Marks verified",query.marksVerified],
              ["isLateralEntry","Lateral entry",query.isLateralEntry],
            ] as const).map(([key,label,value])=><label key={key} className="grid gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">{label}
              <Select name={key} defaultValue={value===undefined?"":value?"YES":"NO"}
                className="min-h-11 md:min-h-9 p-2">
                <option value="">Any</option><option value="YES">Yes</option><option value="NO">No</option>
              </Select></label>)}
          </div>
        </Disclosure>
        <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">CGPA recorded
          <Select name="cgpaRecorded" defaultValue={query.cgpaRecorded===undefined?"":query.cgpaRecorded?"YES":"NO"}
            className="mt-[6px] block min-h-11 md:min-h-9">
            <option value="">Any</option><option value="YES">Recorded</option>
            <option value="NO">No recorded CGPA</option>
          </Select>
        </label>
        <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Offer waiting on answer
          <Select name="offerWaiting" defaultValue={query.offerWaiting===undefined?"":query.offerWaiting?"YES":"NO"}
            className="mt-[6px] block min-h-11 md:min-h-9">
            <option value="">Any</option>
            <option value="YES">Yes</option><option value="NO">No</option>
          </Select>
        </label>
        <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">After college
          <Select name="afterCollege" defaultValue={query.afterCollege??""}
            className="mt-[6px] block min-h-11 md:min-h-9">
            <option value="">All outcomes</option>
            {AFTER_COLLEGE_OUTCOMES.map(outcome=>
              <option key={outcome} value={outcome}>{AFTER_COLLEGE_LABELS[outcome]}</option>)}
          </Select>
        </label>
        <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Batch
          <Select name="batchId" defaultValue={query.batchId??""}
            className="mt-[6px] block min-h-11 md:min-h-9">
            <option value="">Current students</option>
            {batchDirectory.batches.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
          </Select>
        </label>
        {([
          ["minApplications","Applications from",query.minApplications],
          ["maxApplications","Applications to",query.maxApplications],
          ["minOffers","Offers from",query.minOffers],
          ["maxOffers","Offers to",query.maxOffers],
        ] as const).map(([name,label,value])=>
         <label key={name} className="grid gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">{label}
          <Input type="number" name={name} min={0} max={10000} step={1}
           defaultValue={value??""} placeholder="Any"
           className="w-28"/>
         </label>)}
        <Button variant="secondary" type="submit" className="min-h-11 w-full px-4 md:w-auto md:min-h-9">Show students</Button>
      </form>
      </Disclosure>
      {query.batchId?<p className="text-sm text-muted-foreground">
        Students from a finished batch include completed enrollments for follow-up and reporting.
      </p>:null}


      {!data.definitions.registrationsAvailable ? (
        <Alert tone="warning">
          <h2 className="text-base font-semibold text-warning">
            Placement registration data unavailable
          </h2>
          <p className="mt-2 text-sm leading-6 text-body">
            Placement registration information is unavailable. Registration counts may be incomplete.
          </p>
        </Alert>
      ) : null}

      {query.profileStatus&&!data.definitions.verificationAvailable?<Alert tone="warning">
        Profile-verification records are unavailable. A missing source must not be mistaken for Not verified.
        <Link href="/tpo/students" className="lms-inline-link ml-2 inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Clear profile filter</Link>
      </Alert>:null}
      {query.afterCollege&&!data.definitions.afterCollegeAvailable?<Alert tone="warning">
        Saved after-college outcome records are unavailable. The selected outcome cannot be filtered until its registered table is available.
        <Link href="/tpo/students" className="lms-inline-link ml-2 inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Clear outcome filter</Link>
      </Alert>:null}
      {!data.definitions.externalOffersAvailable ? (
        <Alert tone="warning">
          External offer information is unavailable. Placed counts may be incomplete.
        </Alert>
      ) : null}

      {!data.debarmentAvailable?<InlineNotice tone="info" message="Timed debarment records are not available right now. Debarment filters and counts may be incomplete."/>:null}
      {(data.uninvitedCount??0)>0?<Alert tone="warning">
        Registration is not open for {data.uninvitedCount} students: their batch has not been invited, so they cannot register.
        <Link href="/tpo/batches" className="lms-inline-link ml-2 inline-flex min-h-11 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Open Placement eligibility</Link>
      </Alert>:null}
      <Disclosure title="Placement intelligence" className="min-w-0 border-b border-border py-3" contentClassName="pt-3">
      <section className="min-w-0">
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
        <div role="group" className="mt-5 grid min-w-0 grid-cols-2 gap-0 overflow-hidden rounded-[var(--lms-canvas-radius)] border border-border md:grid-cols-4" aria-label="Student placement journey">
         {tpoStudentJourneySteps(summary).map(step=><div key={step.label} className="min-w-0 border-b border-r border-border bg-surface p-4 last:border-r-0">
          <h3 className="text-sm font-semibold">{step.label}</h3>
          <p className="mt-2 text-2xl font-bold tabular-nums">{step.count}</p>
          <p className="text-xs text-muted-foreground">{step.percent}% of {summary.activeLearners} student(s)</p>
         </div>)}
        </div>
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Journey attention filters">
         {data.debarredCount!=null&&data.debarredCount>0?<FilterChipLink
          href={scopedHref({...currentFilters,debarred:true,page:1})}
          tone="warning" selected={query.debarred === true}>
          Debarred · {data.debarredCount}</FilterChipLink>:null}
         {tpoStudentJourneyGaps(summary).map(gap=><FilterChipLink key={gap.state}
          href={scopedHref({...currentFilters,journeyState:gap.state,page:1})}
          tone="warning" selected={query.journeyState === gap.state}>
          {gap.label} · {gap.count}</FilterChipLink>)}
        </div>
        <div className="mt-5 grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-5">
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
                  "rounded-[var(--lms-control-radius)] border p-4 transition hover:border-primary hover:bg-primary-subtle " +
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

        <div className="mt-5 grid min-w-0 grid-cols-1 gap-0 overflow-hidden rounded-[var(--lms-canvas-radius)] border border-border md:grid-cols-3">
          <div className="min-w-0 border-b border-r border-border bg-surface px-4 py-3 last:border-r-0">
            <p className="text-xs font-semibold text-muted-foreground">
              {query.batchId?"Students in selected batch":"Active enrolled learners"}
            </p>
            <p className="mt-1 text-xl font-semibold text-foreground">
              {summary.activeLearners}
            </p>
          </div>
          <div className="min-w-0 border-b border-r border-border bg-surface px-4 py-3 last:border-r-0">
            <p className="text-xs font-semibold text-muted-foreground">
              Registered placement pool
            </p>
            <p className="mt-1 text-xl font-semibold text-foreground">
              {summary.placementPool}
            </p>
          </div>
          <div className="min-w-0 border-b border-r border-border bg-surface px-4 py-3 last:border-r-0">
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
      </Disclosure>

      <Disclosure title="Branch intelligence" className="min-w-0 border-y border-border py-3" contentClassName="pt-3">
      <section className="min-w-0">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">
            Branch intelligence
          </h2>
          <p className="mt-1 text-sm text-body">
            Placement rates use registered placement-pool learners
            as the denominator, not every enrolled learner.
          </p>
        </div>

        {data.branches.length === 0 ? (
          <p className="p-6 text-sm text-body">
            No learners are available for this selection.
          </p>
        ) : (
          <div className="hidden md:block">
            <Table scrollLabel="Branch intelligence" className="min-w-[52rem]">
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
                        className="lms-inline-link inline-flex min-h-11 items-center font-semibold text-link underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9"
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
            </Table>
          </div>
        )}

        {data.branches.length ? <ul className="space-y-3 px-4 pt-4 md:hidden" aria-label="Branch intelligence">
          {data.branches.map(branch => <li key={branch.branchId} className="min-w-0 border-b border-border py-4">
            <Link href={scopedHref(tpoBranchDrillFilters({
              journeyState:query.journeyState, search:query.search,
              columns:first(raw.columns)?.slice(0,800), pageSize:query.pageSize,
            },branch.branchId))} className="lms-inline-link inline-flex min-h-11 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">{branch.branchName}</Link>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-body">Learners</dt><dd className="font-semibold tabular-nums">{branch.activeLearners}</dd></div>
              <div><dt className="text-body">Registered</dt><dd className="font-semibold tabular-nums">{branch.placementPool}</dd></div>
              <div><dt className="text-body">Applying</dt><dd className="font-semibold tabular-nums">{branch.applying}</dd></div>
              <div><dt className="text-body">Rate*</dt><dd className="font-semibold tabular-nums">{percentage(branch.placementRatePercent)}</dd></div>
            </dl>
            <Disclosure title="More placement outcomes" className="mt-3 border-t border-border pt-2 [&>summary]:min-h-11">
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt>Placed in pool</dt><dd>{branch.placedInPool}</dd></div>
                <div><dt>Placed overall</dt><dd>{branch.placed}</dd></div>
              </dl>
            </Disclosure>
          </li>)}
        </ul> : null}

        <p className="px-6 py-3 text-xs leading-5 text-muted-foreground">
          *Rate uses the registered placement pool; — means no registered students.
        </p>
      </section>
      </Disclosure>

      <section className="min-w-0 space-y-4">
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
            className="lms-inline-link inline-flex min-h-11 items-center text-sm font-semibold text-link underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9"
          >
            Clear filters
          </Link>
        </div>

        <form role="search" aria-label="tpo students filters"
          action="/tpo/students"
          method="get"
          className="grid min-w-0 gap-3 border-y border-border py-4 md:grid-cols-2 lg:grid-cols-4"
        >
          {first(raw.columns)&&<Input type="hidden" name="columns" value={first(raw.columns)?.slice(0,800)}/>}
          <label className="flex flex-col gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Journey
            <Select
              name="journeyState"
              defaultValue={query.journeyState ?? ""}
              className="min-h-11 md:min-h-9"
            >
              <option value="">All journeys</option>
              {TPO_STUDENT_JOURNEY_STATES.map((state) => (
                <option key={state} value={state}>
                  {JOURNEY_LABELS[state]}
                </option>
              ))}
            </Select>
          </label>

          <label className="flex flex-col gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Branch
            <Select
              name="branchId"
              defaultValue={query.branchId ?? ""}
              className="min-h-11 md:min-h-9"
            >
              <option value="">All branches</option>
              {data.branches.map((branch) => (
                <option key={branch.branchId} value={branch.branchId}>
                  {branch.branchName}
                </option>
              ))}
            </Select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold text-body">
            Search
            <TpoDebouncedStudentSearch initial={query.search??""} />
          </label>

          <label className="flex flex-col gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Roster
            <Select name="everyone" defaultValue={query.everyone?"YES":"NO"} className="min-h-11 md:min-h-9">
              <option value="NO">In placements</option>
              <option value="YES">Everyone at this college</option>
            </Select>
          </label>

          <label className="flex flex-col gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Page size
            <Select
              name="pageSize"
              defaultValue={String(query.pageSize)}
              className="min-h-11 md:min-h-9"
            >
              <option value="25">25 students</option>
              <option value="50">50 students</option>
              <option value="100">100 students</option>
            </Select>
          </label>

          <div className="md:col-span-2 lg:col-span-4">
            <Button variant="primary"
              type="submit"
              className="min-h-11 w-full px-6 md:w-auto md:min-h-9"
            >
              Apply filters
            </Button>
          </div>
        </form>

        {roster.items.length === 0 ? (
          <div className="border-y border-border py-8 text-sm text-body">
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
                className="lms-inline-link inline-flex min-h-11 items-center font-semibold text-link underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9"
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
        <Suspense fallback={<Skeleton label="Loading spreadsheet grid…" variant="row" count={5}/>}>
          <TpoStudentsSpreadsheet rows={roster.items} programs={programChoices.map(([id,name])=>({id,name}))} classes={data.classChoices}
            afterCollege={afterCollege.entries} afterCollegeAvailable={afterCollege.available && manageAllowed}
            canManageViews={manageAllowed}/>
        </Suspense>
        <TpoStudentsSelectionSummary visibleIds={roster.items.map(student=>student.membershipId)} totalCount={roster.total}/>

        {rosterVerifications?.enabled&&rosterVerifications.permitted&&waitingRosterRows.length>0?
          <TpoRosterVerificationBulk rows={waitingRosterRows}/>:null}
        <Disclosure title="Bulk student actions" className="min-w-0 border-t border-border py-3" contentClassName="min-w-0 space-y-4 pt-3">
        {manageAllowed?<TpoStudentNudgePanel
          key={"nudge:"+query.batchId+":"+query.branchId+":"+roster.page+":"+query.search}
          rows={roster.items.map(student=>({
            id:student.membershipId,
            label:student.displayName+" · "+(student.rollNumber??student.branchName),
            registered:student.registeredForPlacements,
          }))} />:null}
        <TpoStudentsSelectedNote allowedIds={roster.total<=5000?(data.exportRows??[]).map(student=>student.membershipId):roster.items.map(student=>student.membershipId)}/>
        <TpoBulkActionPanel key={"students:"+query.batchId+":"+query.branchId+":"+roster.page+":"+query.pageSize+":"+query.search+":"+query.journeyState}
          target="STUDENTS"
          rows={roster.items.map(student=>({id:student.membershipId,
            label:student.displayName+" · "+student.branchName}))}
          viewCount={roster.total}
          allRows={roster.total<=5000?data.exportRows?.map(student=>({
            id:student.membershipId,label:student.displayName+" · "+student.branchName
          }))??undefined:undefined}/>

        {manageAllowed?<TpoStudentsDriveVisibility
          learners={(roster.total<=5000?data.exportRows??roster.items:roster.items).map(student=>({
           id:student.membershipId,name:student.displayName,
          }))}
          drives={managedJobs.filter(item=>["DRAFT","PUBLISHED"].includes(item.job.status)).map(item=>({
           id:item.job.id,name:item.company.name+" · "+item.job.title,status:item.job.status,
          }))}/>:null}
        {manageAllowed&&(await placementTableExists("placement_tpo_prep_assignments"))?<TpoStudentsAssignPrep/>:null}
        {manageAllowed?<TpoStudentsBulkDebar learners={
          (roster.total<=5000?data.exportRows??roster.items:roster.items).map(student=>({
           id:student.membershipId,name:student.displayName,debarred:student.debarred===true,
          }))
        }/>:null}
        {manageAllowed ? (
          <TpoStudentsBulkAdd
            key={"bulk-add:"+query.batchId+":"+query.branchId+":"+roster.page+":"+query.pageSize+":"+query.search+":"+query.journeyState}
            learners={roster.items.map((student) => ({
              membershipId: student.membershipId,
              displayName: student.displayName,
              branchName: student.branchName,
              readinessSignal: student.readinessSignal,
            }))}
            allLearners={roster.total<=5000?data.exportRows?.map(student=>({
              membershipId:student.membershipId,
              displayName:student.displayName,
              branchName:student.branchName,
              readinessSignal:student.readinessSignal,
            }))??undefined:undefined}
            drives={bulkDriveChoices}
          />
        ) : null}

        </Disclosure>
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
                className="lms-inline-link inline-flex min-h-11 items-center rounded-[8px] md:rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-[650] text-link underline hover:text-link focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9"
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
                className="lms-inline-link inline-flex min-h-11 items-center rounded-[8px] md:rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-[650] text-link underline hover:text-link focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9"
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
