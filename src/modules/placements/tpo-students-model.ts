import {
  getLearnerPlacementAccess,
  type ResolvedPlacementParticipation,
} from "./batch-eligibility-policy";
import { learnerPlacementDashboard } from "./learner-dashboard-model";
import type {TpoStudentVerificationFact} from "./tpo-student-verification-facts";
import {tpoStudentProfileFacts,type TpoStudentProfileFacts} from "./tpo-student-profile-facts";

export const TPO_STUDENT_JOURNEY_STATES = [
  "NOT_REGISTERED",
  "NEEDS_READINESS_SUPPORT",
  "READY_NOT_APPLYING",
  "APPLYING",
  "PLACED",
] as const;

export type TpoStudentJourneyState =
  (typeof TPO_STUDENT_JOURNEY_STATES)[number];

export type TpoStudentApplicationSignal = {
  id: string;
  status: string;
  screeningStatus: string | null;
  companyName?:string|null;
};

export type TpoStudentOfferSignal = {
  status: string;
  joiningStatus: string | null;
};

export type TpoStudentRoundSignal = {
  applicationId: string;
  sequence: number;
  kind: string;
  outcome: string;
};

export type TpoStudentSource = {
  membershipId: string;
  displayName: string | null;
  email: string | null;
  rollNumber: string | null;
  registrationNumber: string | null;
  branchId: string;
  branchName: string;
  programId: string;
  programName: string;
  cohortId: string;
  cohortName: string;
  classIds:readonly string[];
  fromFinishedBatch?: boolean;
  registrationOpen?:boolean|null;
  registrationChoice: string | null;
  profileDocument?:unknown;
  hiddenSearchMatched?:boolean;
  participation: ResolvedPlacementParticipation;
  academicEvidence: {
    cgpaHundredths: number | null;
    activeBacklogs: number | null;
    pastBacklogs: number | null;
    tenthPctBasisPoints?:number|null;twelfthPctBasisPoints?:number|null;
    diplomaPctBasisPoints?:number|null;undergraduatePctBasisPoints?:number|null;
    passingYear?:number|null;gapYears?:number|null;isLateralEntry?:boolean|null;
    academicSource?:string|null;verifiedAt?:Date|null;
  };
  preferencesPresent: boolean;
  verification:TpoStudentVerificationFact;
  applications: readonly TpoStudentApplicationSignal[];
  offers: readonly TpoStudentOfferSignal[];
  appliedResults: readonly TpoStudentRoundSignal[];
  verifiedExternalOfferCount: number;
  ambiguousSection: boolean;
};

export type TpoStudentReadinessSignal =
  | "PARTICIPATION_NOT_ELIGIBLE"
  | "ACADEMIC_EVIDENCE_MISSING"
  | "PARTICIPATION_ELIGIBLE_EVIDENCE_PRESENT";

export type TpoStudentRow = {
  membershipId: string;
  displayName: string;
  email: string | null;
  rollNumber: string | null;
  registrationNumber: string | null;
  branchId: string;
  branchName: string;
  programId: string;
  programName: string;
  cohortId: string;
  cohortName: string;
  classIds:readonly string[];
  fromFinishedBatch?: boolean;
  registrationOpen?:boolean|null;
  registrationChoice: string | null;
  registeredForPlacements: boolean;
  debarred?:boolean|null;
  profileFacts?:TpoStudentProfileFacts;
  hiddenSearchMatched?:boolean;
  participationStatus: ResolvedPlacementParticipation["status"];
  readinessSignal: TpoStudentReadinessSignal;
  preferencesPresent: boolean;
  verification:TpoStudentVerificationFact;
  cgpa: number | null;
  tenthPct?:number|null;twelfthPct?:number|null;diplomaPct?:number|null;ugPct?:number|null;
  passingYear?:number|null;gapYears?:number|null;isLateralEntry?:boolean|null;marksVerified?:boolean|null;
  activeBacklogs: number | null;
  pastBacklogs: number | null;
  applicationCount: number;
  activeApplicationCount: number;
  offerCount: number;
  offersAwaitingAnswer: number;
  acceptedOfferCount: number;
  verifiedExternalOfferCount: number;
  placed: boolean;
  journeyState: TpoStudentJourneyState;
  bestSoFar: string;
  bestCompany?:string|null;
  bestDriveResults?:readonly string[];
  interviewedCompanies?:readonly string[];
  maximumAppliedRoundSequence: number | null;
  ambiguousSection: boolean;
};

export type TpoStudentSummary = {
  activeLearners: number;
  placementPool: number;
  readyNotApplying: number;
  needsReadinessSupport: number;
  notRegistered: number;
  applying: number;
  placed: number;
  placedInPool: number;
  placedOutsidePool: number;
  readinessUnverified: true;
};

export type TpoStudentBranchSummary = TpoStudentSummary & {
  branchId: string;
  branchName: string;
  placementRatePercent: number | null;
};

export type TpoStudentRosterFilter = {
  journeyState?: TpoStudentJourneyState;
  legacyStage?:"ELIGIBLE"|"INVITED"|"REGISTERED"|"VERIFIED"|"PLACED";
  minRoundReached?:number;needsAttention?:boolean;
  interviewedWith?:string;
  debarred?:boolean;
  gender?:string;birthYear?:number;minSkills?:number;minProjects?:number;
  minCertifications?:number;minExperiences?:number;hasProfileLinks?:boolean;hasResume?:boolean;hasCodingProfiles?:boolean;
  branchId?: string;
  programId?: string;
  profileStatus?:Exclude<TpoStudentVerificationFact["status"],"UNKNOWN">;
  minApplications?:number;maxApplications?:number;
  minCgpa?:number;maxCgpa?:number;
  minTenthPct?:number;minTwelfthPct?:number;minDiplomaPct?:number;minUgPct?:number;
  passingYear?:number;maxGapYears?:number;marksVerified?:boolean;isLateralEntry?:boolean;
  maxActiveBacklogs?:number;maxPastBacklogs?:number;
  cgpaRecorded?:boolean;
  minOffers?:number;maxOffers?:number;
  offerWaiting?:boolean;
  classId?:string;
  search?: string;
  page: number;
  pageSize: number;
};

export type TpoStudentRosterPage = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  items: TpoStudentRow[];
};

/**
 * This is an evidence/participation signal, NOT a verified
 * employability or interview-readiness assessment.
 *
 * Job-specific eligibility still belongs to eligibility-service.
 */
export function deriveTpoStudent(
  source: TpoStudentSource,
  now: Date,
): TpoStudentRow {
  const registeredForPlacements=tpoStudentRegisteredForPlacements(
    source.registrationChoice,source.applications.length,
  );

  const participationEligible =
    !source.ambiguousSection &&
    getLearnerPlacementAccess({
      collegeModuleEnabled: true,
      decision: source.participation,
      batchFinished: false,
    }).showPlacements;

  const academicEvidencePresent =
    source.academicEvidence.cgpaHundredths !== null &&
    source.academicEvidence.activeBacklogs !== null;

  const readinessSignal: TpoStudentReadinessSignal =
    !participationEligible
      ? "PARTICIPATION_NOT_ELIGIBLE"
      : !academicEvidencePresent
        ? "ACADEMIC_EVIDENCE_MISSING"
        : "PARTICIPATION_ELIGIBLE_EVIDENCE_PRESENT";

  // Reuse the learner dashboard's definition of an active
  // submitted, non-rejected application.
  const dashboard = learnerPlacementDashboard(
    {
      jobs: [],
      rounds: [],
      offers: [],
      applications: source.applications.map((application) => ({
        applicationId: application.id,
        applicationStatus: application.status,
        screeningStatus:
          application.screeningStatus ?? "PENDING",
      })),
    },
    now,
  );

  const acceptedOfferCount = source.offers.filter(
    (offer) =>
      offer.status === "ACCEPTED" &&
      offer.joiningStatus !== "DID_NOT_JOIN",
  ).length;

  const placed =
    acceptedOfferCount > 0 ||
    source.verifiedExternalOfferCount > 0;

  const offersAwaitingAnswer=source.offers.filter(offer=>offer.status==="ISSUED").length;

  const offerCount = source.offers.filter(
    (offer) =>
      offer.status === "ISSUED" ||
      offer.status === "ACCEPTED",
  ).length;

  let journeyState: TpoStudentJourneyState;

  if (placed) {
    journeyState = "PLACED";
  } else if (!registeredForPlacements) {
    journeyState = "NOT_REGISTERED";
  } else if (dashboard.activeApplicationCount > 0) {
    journeyState = "APPLYING";
  } else if (
    readinessSignal !==
    "PARTICIPATION_ELIGIBLE_EVIDENCE_PRESENT"
  ) {
    journeyState = "NEEDS_READINESS_SUPPORT";
  } else {
    journeyState = "READY_NOT_APPLYING";
  }

  const maximumAppliedRoundSequence =
    source.appliedResults.length > 0
      ? Math.max(
          ...source.appliedResults.map(
            (result) => result.sequence,
          ),
        )
      : null;

  const latestDepth = [...source.appliedResults].sort(
    (a, b) =>
      b.sequence - a.sequence ||
      a.applicationId.localeCompare(b.applicationId),
  )[0];

  let bestSoFar = "Not applied";

  if (source.applications.length > 0) {
    bestSoFar = "Applied";
  }

  if (
    source.applications.some(
      (application) =>
        application.screeningStatus === "SHORTLISTED",
    )
  ) {
    bestSoFar = "Shortlisted";
  }

  if (latestDepth) {
    bestSoFar =
      `${latestDepth.kind.replaceAll("_", " ")} ` +
      `round ${latestDepth.sequence}: ${latestDepth.outcome}`;
  }

  if (offerCount > 0) {
    bestSoFar = "Offer issued";
  }

  if (placed) {
    bestSoFar = "Placed (provisional)";
  }

  return {
    membershipId: source.membershipId,
    displayName: source.displayName?.trim() || "Unnamed learner",
    email: source.email,
    rollNumber: source.rollNumber,
    registrationNumber: source.registrationNumber,
    branchId: source.branchId,
    branchName: source.branchName,
    programId:source.programId,
    programName: source.programName,
    cohortId: source.cohortId,
    cohortName: source.cohortName,
    classIds:source.classIds,
    fromFinishedBatch: Boolean(source.fromFinishedBatch),
    registrationChoice:source.registrationChoice??(registeredForPlacements?"PLACEMENTS":null),
    registrationOpen:source.registrationOpen??null,
    registeredForPlacements,
    participationStatus: source.participation.status,
    readinessSignal,
    preferencesPresent: source.preferencesPresent,
    verification:source.verification,
    cgpa:
      source.academicEvidence.cgpaHundredths === null
        ? null
        : source.academicEvidence.cgpaHundredths / 100,
    tenthPct:source.academicEvidence.tenthPctBasisPoints==null?null:source.academicEvidence.tenthPctBasisPoints/100,
    twelfthPct:source.academicEvidence.twelfthPctBasisPoints==null?null:source.academicEvidence.twelfthPctBasisPoints/100,
    diplomaPct:source.academicEvidence.diplomaPctBasisPoints==null?null:source.academicEvidence.diplomaPctBasisPoints/100,
    ugPct:source.academicEvidence.undergraduatePctBasisPoints==null?null:source.academicEvidence.undergraduatePctBasisPoints/100,
    passingYear:source.academicEvidence.passingYear??null,
    gapYears:source.academicEvidence.gapYears??null,
    isLateralEntry:source.academicEvidence.isLateralEntry??null,
    marksVerified:source.academicEvidence.academicSource==="VERIFIED"&&source.academicEvidence.verifiedAt!=null,
    activeBacklogs: source.academicEvidence.activeBacklogs,
    pastBacklogs: source.academicEvidence.pastBacklogs,
    applicationCount: source.applications.length,
    activeApplicationCount: dashboard.activeApplicationCount,
    offerCount,
    offersAwaitingAnswer,
    acceptedOfferCount,
    verifiedExternalOfferCount:
      source.verifiedExternalOfferCount,
    placed,
    journeyState,
    bestSoFar,
    profileFacts:tpoStudentProfileFacts(source.profileDocument),
    hiddenSearchMatched:source.hiddenSearchMatched??false,
    bestDriveResults:[...source.appliedResults]
      .sort((a,b)=>b.sequence-a.sequence||a.applicationId.localeCompare(b.applicationId))
      .slice(0,20).map(result=>{
        const company=source.applications.find(a=>a.id===result.applicationId)?.companyName??"Company not recorded";
        const kind=result.kind.toLowerCase().replaceAll("_"," ");
        const outcome=result.outcome.toLowerCase().replaceAll("_"," ");
        return company+": "+outcome+" at "+kind+" (round "+result.sequence+")";
      }),
    bestCompany:latestDepth&&!placed&&offerCount===0
      ?source.applications.find(application=>application.id===latestDepth.applicationId)?.companyName??null:null,
    interviewedCompanies:[...new Set(source.appliedResults.flatMap(result=>{
      const name=source.applications.find(application=>application.id===result.applicationId)?.companyName;
      return name?[name]:[];
    }))],
    maximumAppliedRoundSequence,
    ambiguousSection: source.ambiguousSection,
  };
}

export function summarizeTpoStudents(
  rows: readonly TpoStudentRow[],
): TpoStudentSummary {
  const placementPool = rows.filter(
    (row) => row.registeredForPlacements,
  ).length;

  const placedInPool = rows.filter(
    (row) => row.registeredForPlacements && row.placed,
  ).length;

  const placed = rows.filter(
    (row) => row.placed,
  ).length;

  return {
    activeLearners: rows.length,
    placementPool,
    readyNotApplying: rows.filter(
      (row) => row.journeyState === "READY_NOT_APPLYING",
    ).length,
    needsReadinessSupport: rows.filter(
      (row) =>
        row.journeyState === "NEEDS_READINESS_SUPPORT",
    ).length,
    notRegistered: rows.filter(
      (row) => row.journeyState === "NOT_REGISTERED",
    ).length,
    applying: rows.filter(
      (row) => row.journeyState === "APPLYING",
    ).length,
    placed,
    placedInPool,
    placedOutsidePool: placed - placedInPool,
    readinessUnverified: true,
  };
}

/**
 * Each learner contributes to exactly one academic branch.
 * The registered placement pool is the placement-rate
 * denominator, not all enrolled students.
 */
export function summarizeTpoStudentBranches(
  rows: readonly TpoStudentRow[],
): TpoStudentBranchSummary[] {
  const groups = new Map<
    string,
    {
      branchName: string;
      rows: TpoStudentRow[];
    }
  >();

  for (const row of rows) {
    const existing = groups.get(row.branchId) ?? {
      branchName: row.branchName,
      rows: [],
    };
    existing.rows.push(row);
    groups.set(row.branchId, existing);
  }

  return [...groups.entries()]
    .map(([branchId, group]) => {
      const summary = summarizeTpoStudents(group.rows);

      return {
        ...summary,
        branchId,
        branchName: group.branchName,
        placementRatePercent:
          summary.placementPool === 0
            ? null
            : Math.round(
                (summary.placedInPool /
                  summary.placementPool) *
                  10000,
              ) / 100,
      };
    })
    .sort(
      (a, b) =>
        a.branchName.localeCompare(b.branchName) ||
        a.branchId.localeCompare(b.branchId),
    );
}

/**
 * Totals are computed BEFORE these roster filters.
 * This ensures changing pages/search never alters
 * college-wide summary or branch intelligence.
 */
export function filterTpoStudentRoster(
  rows: readonly TpoStudentRow[],
  filter: TpoStudentRosterFilter,
): TpoStudentRosterPage {
  const search =
    filter.search?.trim().toLocaleLowerCase("en-IN") ?? "";

  const filtered = rows
    .filter(
      (row) =>
        !filter.journeyState ||
        row.journeyState === filter.journeyState,
    )
    .filter(
      (row) =>
        !filter.branchId ||
        row.branchId === filter.branchId,
    )
    .filter(row=>!filter.programId||row.programId===filter.programId)
    .filter(row=>filter.debarred===undefined||row.debarred===filter.debarred)
    .filter(row=>!filter.gender||row.profileFacts?.gender===filter.gender)
    .filter(row=>filter.birthYear===undefined||row.profileFacts?.birthYear===filter.birthYear)
    .filter(row=>filter.minSkills===undefined||(row.profileFacts?.skills??0)>=filter.minSkills)
    .filter(row=>filter.minProjects===undefined||(row.profileFacts?.projects??0)>=filter.minProjects)
    .filter(row=>filter.minCertifications===undefined||(row.profileFacts?.certifications??0)>=filter.minCertifications)
    .filter(row=>filter.minExperiences===undefined||(row.profileFacts?.experiences??0)>=filter.minExperiences)
    .filter(row=>filter.hasProfileLinks===undefined||row.profileFacts?.links===filter.hasProfileLinks)
    .filter(row=>filter.hasResume===undefined||row.profileFacts?.resume===filter.hasResume)
    .filter(row=>filter.hasCodingProfiles===undefined||row.profileFacts?.codingProfiles===filter.hasCodingProfiles)
    .filter(row=>!filter.legacyStage||tpoStudentMatchesLegacyStage(row,filter.legacyStage))
    .filter(row=>!filter.interviewedWith||(row.interviewedCompanies??[]).some(company=>
     company.toLocaleLowerCase("en-IN").includes(filter.interviewedWith!.toLocaleLowerCase("en-IN"))))
    .filter(row=>filter.minRoundReached===undefined||
      (row.maximumAppliedRoundSequence!=null&&row.maximumAppliedRoundSequence>=filter.minRoundReached))
    .filter(row=>filter.needsAttention===undefined||tpoStudentNeedsAttention(row)===filter.needsAttention)
    .filter(row=>!filter.classId||row.classIds.includes(filter.classId))
    .filter(row=>!filter.profileStatus||row.verification.status===filter.profileStatus)
    .filter(row=>filter.minApplications===undefined||row.applicationCount>=filter.minApplications)
    .filter(row=>filter.maxApplications===undefined||row.applicationCount<=filter.maxApplications)
    .filter(row=>filter.minOffers===undefined||row.offerCount>=filter.minOffers)
    .filter(row=>filter.maxOffers===undefined||row.offerCount<=filter.maxOffers)
    .filter(row=>filter.offerWaiting===undefined||(row.offersAwaitingAnswer>0)===filter.offerWaiting)
    .filter(row=>filter.minCgpa===undefined||(row.cgpa!==null&&row.cgpa>=filter.minCgpa))
    .filter(row=>filter.maxCgpa===undefined||(row.cgpa!==null&&row.cgpa<=filter.maxCgpa))
    .filter(row=>filter.minTenthPct===undefined||(row.tenthPct!=null&&row.tenthPct>=filter.minTenthPct))
    .filter(row=>filter.minTwelfthPct===undefined||(row.twelfthPct!=null&&row.twelfthPct>=filter.minTwelfthPct))
    .filter(row=>filter.minDiplomaPct===undefined||(row.diplomaPct!=null&&row.diplomaPct>=filter.minDiplomaPct))
    .filter(row=>filter.minUgPct===undefined||(row.ugPct!=null&&row.ugPct>=filter.minUgPct))
    .filter(row=>filter.passingYear===undefined||row.passingYear===filter.passingYear)
    .filter(row=>filter.maxGapYears===undefined||(row.gapYears!=null&&row.gapYears<=filter.maxGapYears))
    .filter(row=>filter.marksVerified===undefined||row.marksVerified===filter.marksVerified)
    .filter(row=>filter.isLateralEntry===undefined||row.isLateralEntry===filter.isLateralEntry)
    .filter(row=>filter.maxActiveBacklogs===undefined||(row.activeBacklogs!==null&&row.activeBacklogs<=filter.maxActiveBacklogs))
    .filter(row=>filter.maxPastBacklogs===undefined||(row.pastBacklogs!==null&&row.pastBacklogs<=filter.maxPastBacklogs))
    .filter(row=>filter.cgpaRecorded===undefined||(row.cgpa!==null)===filter.cgpaRecorded)
    .filter((row) => {
      if (!search) return true;

      if(row.hiddenSearchMatched)return true;
      return [
        row.displayName,
        row.email,
        row.rollNumber,
        row.registrationNumber,
        row.branchName,
        row.cohortName,
        row.programName,
        row.bestCompany,
        row.bestSoFar,
        row.journeyState,
        row.participationStatus,
        row.profileFacts?.gender,
        row.cgpa?.toString(),
        row.activeBacklogs?.toString(),
        row.pastBacklogs?.toString(),
        row.offersAwaitingAnswer.toString(),
        row.applicationCount.toString(),
      ].some((value) =>
        value
          ?.toLocaleLowerCase("en-IN")
          .includes(search),
      );
    })
    .sort(
      (a, b) =>
        a.displayName.localeCompare(b.displayName) ||
        a.membershipId.localeCompare(b.membershipId),
    );

  const offset = (filter.page - 1) * filter.pageSize;

  return {
    total: filtered.length,
    page: filter.page,
    pageSize: filter.pageSize,
    totalPages: Math.ceil(
      filtered.length / filter.pageSize,
    ),
    items: filtered.slice(
      offset,
      offset + filter.pageSize,
    ),
  };
}

/** A finished batch stays reachable for institutional outcomes, never in the default view. */
export function selectTpoStudentWorkingSet(
  rows:readonly TpoStudentRow[],explicitBatch:boolean,
):TpoStudentRow[]{
  return rows.filter(row=>row.participationStatus==="ELIGIBLE" ||
    Boolean(explicitBatch && row.fromFinishedBatch));
}

/** An actual application counts as legacy placement registration when no explicit choice exists. */
export function tpoStudentRegisteredForPlacements(choice:string|null,applicationCount:number):boolean{
 return choice==="PLACEMENTS"||(choice===null&&applicationCount>0);
}

export function tpoStudentMatchesLegacyStage(row:TpoStudentRow,stage:"ELIGIBLE"|"INVITED"|"REGISTERED"|"VERIFIED"|"PLACED"):boolean{
 switch(stage){
  case "ELIGIBLE":return row.participationStatus==="ELIGIBLE";
  case "INVITED":return row.registrationOpen===true;
  case "REGISTERED":return row.registeredForPlacements;
  case "VERIFIED":return row.verification.status==="VERIFIED";
  case "PLACED":return row.placed;
 }
}
export function tpoStudentNeedsAttention(row:TpoStudentRow):boolean{
 return row.debarred===true||row.participationStatus==="INELIGIBLE"||
  row.verification.status==="WAITING"||row.verification.status==="SENT_BACK"||
  row.offersAwaitingAnswer>0||row.ambiguousSection||
  row.readinessSignal==="ACADEMIC_EVIDENCE_MISSING";
}
