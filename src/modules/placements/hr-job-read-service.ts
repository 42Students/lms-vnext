import "server-only";
import { and, desc, eq, exists, gt, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { collegeMemberships, placementApplications, placementApplicationScreenings,
  placementJobRoleOptions, placementOffers, placementJoiningOutcomes, placementJobRounds,placementRoundResults,users,
  learnerProfiles,placementCompanyRelationships,profileVerificationAcademicMarks,profileVerifications,placementDriveSelections,placementRoundCandidateSlots,learnerProgramEnrollments,programs,departments,placementCompanyVisibilitySettings,placementJobs,placementRecruiterCollegeGrants,placementRecruiterProfiles,placementCompanies } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import {projectRecruiterProfileLinks} from "./recruiter-applicant-shared-links-model";
import {uniqueHrVerifiedAcademicMarks} from "./hr-verified-marks-model";
import { findRecruiterScopedGrant } from "./recruiter-grant-selection-model";
import { getRecruiterPlacementWorkspace } from "./recruiter-workspace-service";
import { hrApplicantFilterSchema, HR_APPLICANT_PAGE_SIZE, projectSharedApplicants, hrApplicantPageBounds, HR_OFFER_PAGE_SIZE, hrOfferPageBounds,type HrApplicantStage } from "./hr-job-applicants-model";

/** Legacy drive operations map to these separate authorized vNext contracts. */
export const HR_DRIVE_ACTIONS={DRIVE:"recruiter-workspace",ROUNDS:"recruiter-workspace",
 APPLICANTS:"hr-job-read",PIPELINE:"hr-job-read",RESULTS:"round-results",
 SLOTS:"round-candidate-slots",SELECTIONS:"drive-selection",OFFERS:"hr-offer-read",ZIP:"authorized-export"} as const;
export async function getHrJobRead(context: RequestContext, rawJobId: string, rawFilters: unknown) {
  const filters = hrApplicantFilterSchema.parse(rawFilters);
  // This pre-read enforces the exact active company relationship and college grant.
  let resolvedJobId=rawJobId;
  // Imported integer IDs are scoped locators, not grants. Re-run the standard
  // workspace permission checks on the resolved UUID.
  if(/^[1-9][0-9]{0,9}$/.test(rawJobId)){
   const matches=await getDb().select({id:placementJobs.id}).from(placementJobs)
    .innerJoin(placementCompanyRelationships,and(
     eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId),
     eq(placementCompanyRelationships.collegeId,placementJobs.collegeId),
     eq(placementCompanyRelationships.status,"ACTIVE")))
    .innerJoin(placementCompanies,and(
     eq(placementCompanies.id,placementCompanyRelationships.companyId),
     eq(placementCompanies.id,context.recruiter?.companyId??""),
     eq(placementCompanies.status,"ACTIVE")))
    .innerJoin(placementRecruiterProfiles,and(
     eq(placementRecruiterProfiles.userId,context.user.id),
     eq(placementRecruiterProfiles.companyId,placementCompanies.id),
     eq(placementRecruiterProfiles.status,"ACTIVE")))
    .innerJoin(placementRecruiterCollegeGrants,and(
     eq(placementRecruiterCollegeGrants.recruiterUserId,context.user.id),
     eq(placementRecruiterCollegeGrants.companyRelationshipId,placementCompanyRelationships.id),
     eq(placementRecruiterCollegeGrants.status,"ACTIVE"),
     eq(placementRecruiterCollegeGrants.verificationStatus,"VERIFIED"),
     gt(placementRecruiterCollegeGrants.validUntil,sql`clock_timestamp()`),
     sql<boolean>`'DRIVES'=ANY(${placementRecruiterCollegeGrants.capabilities})`))
    .where(eq(placementJobs.legacyJobId,Number(rawJobId))).limit(2);
   if(matches.length===1)resolvedJobId=matches[0]!.id;
  }
  const workspace = await getRecruiterPlacementWorkspace(context, resolvedJobId);
  const where = and(
    eq(placementApplications.jobId, workspace.job.id),
    eq(collegeMemberships.collegeId, workspace.college.id),
    eq(collegeMemberships.status, "ACTIVE"),
    eq(users.platformStatus, "ACTIVE"),
    // The recruiter cannot inspect unshared applications or screening decisions.
    eq(placementApplicationScreenings.status, "SHORTLISTED"),
  );
  const db = getDb();
  const grant=findRecruiterScopedGrant(context.recruiter?.grants,
    workspace.college.id, workspace.job.companyRelationshipId);
  const [share]=grant?await db.select({columns:placementCompanyRelationships.shareColumnDefaults})
   .from(placementCompanyRelationships)
   .where(and(eq(placementCompanyRelationships.id,grant.companyRelationshipId),
    eq(placementCompanyRelationships.collegeId,workspace.college.id),
    eq(placementCompanyRelationships.companyId,context.recruiter?.companyId??""),
    eq(placementCompanyRelationships.status,"ACTIVE"))).limit(1):[];
  const shareRoll=Boolean(share?.columns?.includes("roll"));
  const shareBranch=Boolean(share?.columns?.includes("branch"));
  const sharePhone=Boolean(share?.columns?.includes("phone"));
  const shareEmail=Boolean(share?.columns?.includes("email"));
  // Both controls must permit release: relationship column AND college-wide visibility.
  // A missing college visibility row denies disclosure rather than inheriting permissive defaults.
  const [visibility]=await db.select({
    projects:placementCompanyVisibilitySettings.showProjectLinks,
    academic:placementCompanyVisibilitySettings.showTenthTwelfth,
    cgpa:placementCompanyVisibilitySettings.showCgpaExact,
  }).from(placementCompanyVisibilitySettings)
    .where(eq(placementCompanyVisibilitySettings.collegeId,workspace.college.id)).limit(1);
  const shareUg=Boolean(share?.columns?.includes("cgpa") && visibility?.cgpa);
  const shareTenth=Boolean(share?.columns?.includes("tenth") && visibility?.academic);
  const shareTwelfth=Boolean(share?.columns?.includes("twelfth") && visibility?.academic);
  const shareSkills=Boolean(share?.columns?.includes("skillMatch"));
  const shareResume=Boolean(share?.columns?.includes("resume"));
  const shareProjects=Boolean(share?.columns?.includes("projects") && visibility?.projects);
  // REC-home-drives-45: milestone predicates evaluate only inside the same
  // college-scoped, TPO-shortlisted audience. Stage counts may overlap.
  const roundMilestone=(kinds:readonly string[],outcome:"PASS"|"FAIL")=>exists(
   db.select({id:placementRoundResults.id}).from(placementRoundResults)
    .innerJoin(placementJobRounds,eq(placementJobRounds.id,placementRoundResults.roundId))
    .where(and(eq(placementRoundResults.applicationId,placementApplications.id),
     eq(placementJobRounds.jobId,workspace.job.id),
     eq(placementRoundResults.status,"APPLIED"),
     eq(placementRoundResults.outcome,outcome),
     inArray(placementJobRounds.kind,[...kinds]))));
  const hasIssuedOffer=exists(db.select({id:placementOffers.id}).from(placementOffers)
    .where(eq(placementOffers.applicationId,placementApplications.id)));
  const hasJoinedOffer=exists(db.select({id:placementJoiningOutcomes.offerId})
    .from(placementJoiningOutcomes)
    .innerJoin(placementOffers,eq(placementOffers.id,placementJoiningOutcomes.offerId))
    .where(and(eq(placementOffers.applicationId,placementApplications.id),
     eq(placementOffers.status,"ACCEPTED"),
     eq(placementJoiningOutcomes.status,"JOINED"))));
  const stageConditions:Record<Exclude<HrApplicantStage,"ALL">,ReturnType<typeof eq>|ReturnType<typeof exists>>={
   APPLIED:eq(placementApplications.status,"SUBMITTED"),
   SHORTLISTED:eq(placementApplications.status,"SUBMITTED"),
   ASSESSMENT:roundMilestone(["TEST","VENDOR_TEST","GD"],"PASS"),
   INTERVIEW:roundMilestone(["INTERVIEW"],"PASS"),
   OFFERED:hasIssuedOffer,HIRED:hasJoinedOffer,
   REJECTED:roundMilestone(["TEST","VENDOR_TEST","GD","INTERVIEW"],"FAIL"),
   WITHDRAWN:eq(placementApplications.status,"WITHDRAWN"),
  };
  // A previously shortlisted applicant may withdraw after passing a round.
  // Keep historical status in ALL/WITHDRAWN, but never surface it as an active
  // assessment, interview, offer, hire or rejection pipeline candidate.
  const activeMilestoneStage=["ASSESSMENT","INTERVIEW","OFFERED","HIRED","REJECTED"].includes(filters.stage);
  const stageCondition=and(where,filters.stage==="ALL"?undefined:stageConditions[filters.stage],
   activeMilestoneStage?eq(placementApplications.status,"SUBMITTED"):undefined);
  const selectionOnly=["SELECTED","PENDING_VERIFICATION","REVOKED"].includes(filters.offerState);
  const offerCondition=filters.offerState === "ALL"
    ? where
    : selectionOnly?and(where,sql`false`):
      and(where,eq(placementOffers.status,filters.offerState));
  const [countsResult,applicationsResult,offerCountsResult,offersResult] = await Promise.allSettled([
    db.select({
      total: sql<number>`count(*)::integer`,
      active: sql<number>`count(*) filter (where ${placementApplications.status} = 'SUBMITTED')::integer`,
      withdrawn: sql<number>`count(*) filter (where ${placementApplications.status} = 'WITHDRAWN')::integer`,
      assessment:sql<number>`count(*) filter (where ${placementApplications.status} = 'SUBMITTED' and ${stageConditions.ASSESSMENT})::integer`,
      interview:sql<number>`count(*) filter (where ${placementApplications.status} = 'SUBMITTED' and ${stageConditions.INTERVIEW})::integer`,
      offered:sql<number>`count(*) filter (where ${placementApplications.status} = 'SUBMITTED' and ${stageConditions.OFFERED})::integer`,
      hired:sql<number>`count(*) filter (where ${placementApplications.status} = 'SUBMITTED' and ${stageConditions.HIRED})::integer`,
      rejected:sql<number>`count(*) filter (where ${placementApplications.status} = 'SUBMITTED' and ${stageConditions.REJECTED})::integer`,
    }).from(placementApplications)
      .innerJoin(placementApplicationScreenings, eq(placementApplicationScreenings.applicationId, placementApplications.id))
      .innerJoin(collegeMemberships, eq(collegeMemberships.id, placementApplications.membershipId))
      .innerJoin(users, eq(users.id, collegeMemberships.userId))
      .where(where),
    db.select({
      id: placementApplications.id, membershipId:placementApplications.membershipId,
      name: users.displayName, email: users.email, phone:users.phoneE164,
      rollNumber: learnerProfiles.rollNumber,
      profileDocument:learnerProfiles.profileDocument,
      role: placementJobRoleOptions.title, status: placementApplications.status,
      screening: placementApplicationScreenings.status,
      submittedAt: placementApplications.submittedAt,
    }).from(placementApplications)
      .innerJoin(placementApplicationScreenings, eq(placementApplicationScreenings.applicationId, placementApplications.id))
      .innerJoin(collegeMemberships, eq(collegeMemberships.id, placementApplications.membershipId))
      .innerJoin(users, eq(users.id, collegeMemberships.userId))
      .leftJoin(learnerProfiles,eq(learnerProfiles.membershipId,placementApplications.membershipId))
      .innerJoin(placementJobRoleOptions, and(eq(placementJobRoleOptions.id, placementApplications.roleOptionId),
        eq(placementJobRoleOptions.jobId, workspace.job.id)))
      .where(stageCondition)
      .orderBy(desc(placementApplications.submittedAt), desc(placementApplications.id))
      .limit(HR_APPLICANT_PAGE_SIZE)
      .offset((filters.page - 1) * HR_APPLICANT_PAGE_SIZE),
    db.select({
      total: sql<number>`count(*)::integer`,
      distinctOffered: sql<number>`count(distinct ${placementOffers.applicationId})::integer`,
      distinctHired: sql<number>`count(distinct ${placementOffers.applicationId})
        filter (where ${placementJoiningOutcomes.status} = 'JOINED')::integer`,
      issued: sql<number>`count(*) filter (where ${placementOffers.status}='ISSUED')::integer`,
      accepted: sql<number>`count(*) filter (where ${placementOffers.status}='ACCEPTED')::integer`,
      declined: sql<number>`count(*) filter (where ${placementOffers.status}='DECLINED')::integer`,
      withdrawn: sql<number>`count(*) filter (where ${placementOffers.status}='WITHDRAWN')::integer`,
      expired: sql<number>`count(*) filter (where ${placementOffers.status}='EXPIRED')::integer`,
      joined: sql<number>`count(*) filter (where ${placementOffers.status}='ACCEPTED'
        and ${placementJoiningOutcomes.status}='JOINED')::integer`,
      awaitingReply: sql<number>`count(*) filter (where ${placementOffers.status}='ISSUED'
        and (${placementOffers.expiresAt} is null or ${placementOffers.expiresAt} >= now()))::integer`,
      overdue: sql<number>`count(*) filter (where ${placementOffers.status}='ISSUED'
        and ${placementOffers.expiresAt} < now())::integer`,
    }).from(placementOffers)
      .leftJoin(placementJoiningOutcomes, eq(placementJoiningOutcomes.offerId, placementOffers.id))
      .innerJoin(placementApplications, eq(placementApplications.id, placementOffers.applicationId))
      .innerJoin(placementApplicationScreenings, eq(placementApplicationScreenings.applicationId, placementApplications.id))
      .innerJoin(collegeMemberships, eq(collegeMemberships.id, placementApplications.membershipId))
      .innerJoin(users, eq(users.id, collegeMemberships.userId))
      .where(where),
    db.select({
      id: placementOffers.id, kind: placementOffers.kind, status: placementOffers.status, role: placementOffers.roleTitle,
      annualCtcInr: placementOffers.annualCtcInr, joiningDate: placementOffers.joiningDate,
      issuedAt: placementOffers.issuedAt, expiresAt: placementOffers.expiresAt,
      applicationId: placementOffers.applicationId,
      joiningStatus: placementJoiningOutcomes.status,
      name: users.displayName,
    }).from(placementOffers)
      .leftJoin(placementJoiningOutcomes, eq(placementJoiningOutcomes.offerId, placementOffers.id))
      .innerJoin(placementApplications, eq(placementApplications.id, placementOffers.applicationId))
      .innerJoin(placementApplicationScreenings, eq(placementApplicationScreenings.applicationId, placementApplications.id))
      .innerJoin(collegeMemberships, eq(collegeMemberships.id, placementApplications.membershipId))
      .innerJoin(users, eq(users.id, collegeMemberships.userId))
      .where(offerCondition)
      .orderBy(desc(placementOffers.issuedAt), desc(placementOffers.id))
      .limit(HR_OFFER_PAGE_SIZE).offset((filters.offerPage - 1) * HR_OFFER_PAGE_SIZE),
  ]);
  if(countsResult.status!=="fulfilled"||applicationsResult.status!=="fulfilled")
   throw new Error("RECRUITER_DRIVE_REQUIRED_READ_UNAVAILABLE");
  const counts=countsResult.value, applications=applicationsResult.value;
  const offerCounts=offerCountsResult.status==="fulfilled"?offerCountsResult.value:[];
  const offers=offersResult.status==="fulfilled"?offersResult.value:[];
  const offersUnavailable=offerCountsResult.status!=="fulfilled"||offersResult.status!=="fulfilled";
  // REC-home-drives-46: only placement-cell recorded candidate slots
  // with confirmedAt count as confirmed; internal recruiter BOOKED does not.
  const slotRows=(filters.tab==="rounds"||filters.tab==="overview")
    ?await db.select({roundId:placementRoundCandidateSlots.roundId,
      total:sql<number>`count(*) filter (where ${placementRoundCandidateSlots.status} <> 'CANCELLED')::integer`,
      confirmed:sql<number>`count(*) filter (where ${placementRoundCandidateSlots.confirmedAt} is not null and ${placementRoundCandidateSlots.status} <> 'CANCELLED')::integer`})
     .from(placementRoundCandidateSlots)
     .where(eq(placementRoundCandidateSlots.jobId,workspace.job.id))
     .groupBy(placementRoundCandidateSlots.roundId).catch(()=>[]):[];
  const roundSlotCounts=Object.fromEntries(slotRows.map(row=>[row.roundId,
   {confirmed:Number(row.confirmed),total:Number(row.total)}])) as Record<string,{confirmed:number;total:number}>;
  // REC-home-drives-52: formal selection ledger is not an issued offer.
  // Share the same shortlisted/active-college boundary as the offer reader,
  // and never treat a CANCELLED selection as a revoked issued offer.
  const selectionStatus=filters.offerState==="SELECTED"?"SELECTED":
   filters.offerState==="PENDING_VERIFICATION"?"VERIFIED":
   filters.offerState==="REVOKED"?"CANCELLED":null;
  const readSelections=filters.offerState==="ALL"||selectionStatus!==null;
  const selectionWhere=and(where,
   eq(placementDriveSelections.jobId,workspace.job.id),
   selectionStatus?eq(placementDriveSelections.status,selectionStatus):
    inArray(placementDriveSelections.status,["SELECTED","VERIFIED","CANCELLED"]));
  const selectionJoin=()=>db.select({
   id:placementDriveSelections.id,
   applicationId:placementDriveSelections.applicationId,
   name:users.displayName,
   role:placementDriveSelections.roleTitle,
   status:placementDriveSelections.status,
   annualCtcInr:placementDriveSelections.annualCtcInr,
   recordedAt:placementDriveSelections.recordedAt,
  }).from(placementDriveSelections)
   .innerJoin(placementApplications,eq(placementApplications.id,placementDriveSelections.applicationId))
   .innerJoin(placementApplicationScreenings,eq(placementApplicationScreenings.applicationId,placementApplications.id))
   .innerJoin(collegeMemberships,eq(collegeMemberships.id,placementApplications.membershipId))
   .innerJoin(users,eq(users.id,collegeMemberships.userId));
  const selectionReads=readSelections
   ?await Promise.allSettled([
    db.select({total:sql<number>`count(*)::integer`}).from(placementDriveSelections)
     .innerJoin(placementApplications,eq(placementApplications.id,placementDriveSelections.applicationId))
     .innerJoin(placementApplicationScreenings,eq(placementApplicationScreenings.applicationId,placementApplications.id))
     .innerJoin(collegeMemberships,eq(collegeMemberships.id,placementApplications.membershipId))
     .innerJoin(users,eq(users.id,collegeMemberships.userId))
     .where(selectionWhere),
    selectionJoin().where(selectionWhere).orderBy(desc(placementDriveSelections.recordedAt),
     desc(placementDriveSelections.id)).limit(HR_OFFER_PAGE_SIZE)
     .offset((filters.offerPage-1)*HR_OFFER_PAGE_SIZE),
   ]):null;
  const selectionCountRows=selectionReads?.[0].status==="fulfilled"?selectionReads[0].value:[];
  const selectionRows=selectionReads?.[1].status==="fulfilled"?selectionReads[1].value:[];
  const selectionsUnavailable=Boolean(selectionReads?.some(result=>result.status==="rejected"));
  const selectionTotal=Number(selectionCountRows[0]?.total??0);
  const selectionPage=hrOfferPageBounds(filters.offerPage,selectionTotal);
  const totals = counts[0];
  const applicantCounts = {
    all: Number(totals?.total ?? 0),
    shortlisted: Number(totals?.active ?? 0),
    withdrawn: Number(totals?.withdrawn ?? 0),
  };
  const stageCounts:Record<HrApplicantStage,number>={
   ALL:applicantCounts.all,APPLIED:applicantCounts.shortlisted,
   SHORTLISTED:applicantCounts.shortlisted,
   ASSESSMENT:Number(totals?.assessment??0),INTERVIEW:Number(totals?.interview??0),
   OFFERED:Number(totals?.offered??0),HIRED:Number(totals?.hired??0),
   REJECTED:Number(totals?.rejected??0),WITHDRAWN:applicantCounts.withdrawn,
  };
  // REC-home-drives-38: read only already-verified academic marks for
  // this authorized 25-row page. Raw learner JSON is never sent to employers.
  const memberIds=[...new Set(applications.map(row=>row.membershipId))];
  const grades=(memberIds.length&&(shareUg||shareTenth||shareTwelfth))
   ?await db.select({
     membershipId:profileVerificationAcademicMarks.learnerMembershipId,
     level:profileVerificationAcademicMarks.level,
     percentage:profileVerificationAcademicMarks.percentageBasisPoints,
    }).from(profileVerificationAcademicMarks)
     .innerJoin(profileVerifications,and(
      eq(profileVerifications.id,profileVerificationAcademicMarks.verificationId),
      eq(profileVerifications.section,"EDUCATION"),
      inArray(profileVerifications.status,["VERIFIED","UPDATE_PENDING"])))
     .where(and(inArray(profileVerificationAcademicMarks.learnerMembershipId,memberIds),
      inArray(profileVerificationAcademicMarks.level,["UG","10TH","12TH","DIPLOMA"]))).catch(()=>[])
   :[];
  // Conflicting verified-history rows are not an employer disclosure grant.
  // A single historical duplicate must never win by undefined SQL row order.
  const byMember=uniqueHrVerifiedAcademicMarks(grades);
  // A branch is derived from the college's active program enrollment, never
  // unverified learner-supplied profile JSON. Ambiguous multiple branches fail closed.
  const activeBranches=(memberIds.length&&shareBranch)
   ?await db.select({membershipId:learnerProgramEnrollments.membershipId,
      branch:departments.name})
      .from(learnerProgramEnrollments)
      .innerJoin(programs,eq(programs.id,learnerProgramEnrollments.programId))
      .innerJoin(departments,eq(departments.id,programs.departmentId))
      .where(and(inArray(learnerProgramEnrollments.membershipId,memberIds),
       eq(learnerProgramEnrollments.status,"ACTIVE"),
       eq(departments.collegeId,workspace.college.id))).catch(()=>[]):[];
  const branchSet=new Map<string,Set<string>>();
  for(const row of activeBranches){
   const names=branchSet.get(row.membershipId)??new Set<string>();
   names.add(row.branch);
   branchSet.set(row.membershipId,names);
  }
  const percentage=(points:number|undefined)=>
   points===undefined?null:(points/100).toFixed(2).replace(/\.00$/,"")+"%";
  const projected = projectSharedApplicants(applications.map(({membershipId,profileDocument,...row})=>{
    const active = row.status === "SUBMITTED";
    const marks = active ? byMember.get(membershipId) : undefined;
    // A historically shortlisted applicant may later withdraw. The employer
    // can retain a status row, not stale private project URLs, contacts,
    // resumes or verified education details from a prior open tab.
    const links = active
      ? projectRecruiterProfileLinks(profileDocument, {
          projects: shareProjects, skills: shareSkills,
        })
      : { githubUrl: null, portfolioUrl: null, skills: [] as string[],
          projects: [] as Array<{ name: string; url: string }> };
    return {...row,
      resumeShared:active && shareResume,
      githubUrl:links.githubUrl,portfolioUrl:links.portfolioUrl,
      sharedSkills:links.skills,sharedProjects:links.projects,
      rollNumber:active && shareRoll?row.rollNumber:null,
      email:active && shareEmail?row.email:null,
      phone:active && sharePhone?row.phone:null,
      branch:active && shareBranch && branchSet.get(membershipId)?.size===1
       ?[...branchSet.get(membershipId)!][0]??null:null,
      ugPercentage:active && shareUg?percentage(marks?.UG):null,
      tenthPercentage:active && shareTenth?percentage(marks?.["10TH"]):null,
      twelfthOrDiplomaPercentage:active && shareTwelfth?
        percentage(marks?.["12TH"]??marks?.DIPLOMA):null,
    };
  }), filters.stage);
  const selectedTotal = stageCounts[filters.stage];
  return {
    workspace, filters, roundSlotCounts, selectionRows, selectionPage, selectionTotal, stageCounts,
    offersUnavailable,selectionsUnavailable,legacyActionContract:HR_DRIVE_ACTIONS,
    selectedCandidateIds:selectionRows.map(row=>row.applicationId),
    applicants: { rows: projected.rows, counts: applicantCounts },
    applicantsPage: hrApplicantPageBounds(filters.page, selectedTotal),
    applicantsTruncated: false,
    offerSummary: {
      recorded: Number(offerCounts[0]?.total ?? 0),
      distinctOffered:Number(offerCounts[0]?.distinctOffered ?? 0),
      distinctHired:Number(offerCounts[0]?.distinctHired ?? 0),
      issued: Number(offerCounts[0]?.issued ?? 0),
      accepted: Number(offerCounts[0]?.accepted ?? 0),
      declined: Number(offerCounts[0]?.declined ?? 0),
      joined: Number(offerCounts[0]?.joined ?? 0),
      awaitingReply: Number(offerCounts[0]?.awaitingReply ?? 0),
      overdue: Number(offerCounts[0]?.overdue ?? 0),
    },
    offers:offers.map(row=>({...row,ctcLpa:row.annualCtcInr==null?null:(Number(row.annualCtcInr)/100000).toFixed(2)})),
    offersPage: hrOfferPageBounds(filters.offerPage,
      filters.offerState === "ISSUED" ? Number(offerCounts[0]?.issued ?? 0) :
      filters.offerState === "ACCEPTED" ? Number(offerCounts[0]?.accepted ?? 0) :
      filters.offerState === "DECLINED" ? Number(offerCounts[0]?.declined ?? 0) :
      filters.offerState === "WITHDRAWN" ? Number(offerCounts[0]?.withdrawn ?? 0) :
      filters.offerState === "EXPIRED" ? Number(offerCounts[0]?.expired ?? 0) :
      Number(offerCounts[0]?.total ?? 0)),
    offersTotal: Number(offerCounts[0]?.total ?? 0),
  };
}
