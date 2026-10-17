import "server-only";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { collegeMemberships, placementApplications, placementApplicationScreenings,
  placementJobRoleOptions, placementOffers, placementJoiningOutcomes, users,
  learnerProfiles,placementCompanyRelationships,profileVerificationAcademicMarks,profileVerifications } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { getRecruiterPlacementWorkspace } from "./recruiter-workspace-service";
import { hrApplicantFilterSchema, HR_APPLICANT_PAGE_SIZE, projectSharedApplicants, hrApplicantPageBounds, HR_OFFER_PAGE_SIZE, hrOfferPageBounds } from "./hr-job-applicants-model";

export async function getHrJobRead(context: RequestContext, rawJobId: string, rawFilters: unknown) {
  const filters = hrApplicantFilterSchema.parse(rawFilters);
  // This pre-read enforces the exact active company relationship and college grant.
  const workspace = await getRecruiterPlacementWorkspace(context, rawJobId);
  const where = and(
    eq(placementApplications.jobId, workspace.job.id),
    eq(collegeMemberships.collegeId, workspace.college.id),
    eq(collegeMemberships.status, "ACTIVE"),
    eq(users.platformStatus, "ACTIVE"),
    // The recruiter cannot inspect unshared applications or screening decisions.
    eq(placementApplicationScreenings.status, "SHORTLISTED"),
  );
  const db = getDb();
  const grant=context.recruiter?.grants.find(item=>item.collegeId===workspace.college.id);
  const [share]=grant?await db.select({columns:placementCompanyRelationships.shareColumnDefaults})
   .from(placementCompanyRelationships)
   .where(and(eq(placementCompanyRelationships.id,grant.companyRelationshipId),
    eq(placementCompanyRelationships.collegeId,workspace.college.id),
    eq(placementCompanyRelationships.companyId,context.recruiter?.companyId??""),
    eq(placementCompanyRelationships.status,"ACTIVE"))).limit(1):[];
  const shareRoll=Boolean(share?.columns?.includes("roll"));
  const shareEmail=Boolean(share?.columns?.includes("email"));
  const shareUg=Boolean(share?.columns?.includes("cgpa"));
  const shareTenth=Boolean(share?.columns?.includes("tenth"));
  const shareTwelfth=Boolean(share?.columns?.includes("twelfth"));
  const stageCondition=filters.stage === "ALL"
    ? where
    : and(where,eq(placementApplications.status,filters.stage === "SHORTLISTED" ? "SUBMITTED" : "WITHDRAWN"));
  const offerCondition=filters.offerState === "ALL"
    ? where
    : and(where,eq(placementOffers.status,filters.offerState));
  const [counts,applications, offerCounts,offers] = await Promise.all([
    db.select({
      total: sql<number>`count(*)::integer`,
      active: sql<number>`count(*) filter (where ${placementApplications.status} = 'SUBMITTED')::integer`,
      withdrawn: sql<number>`count(*) filter (where ${placementApplications.status} = 'WITHDRAWN')::integer`,
    }).from(placementApplications)
      .innerJoin(placementApplicationScreenings, eq(placementApplicationScreenings.applicationId, placementApplications.id))
      .innerJoin(collegeMemberships, eq(collegeMemberships.id, placementApplications.membershipId))
      .innerJoin(users, eq(users.id, collegeMemberships.userId))
      .where(where),
    db.select({
      id: placementApplications.id, membershipId:placementApplications.membershipId,
      name: users.displayName, email: users.email,
      rollNumber: learnerProfiles.rollNumber,
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
  const totals = counts[0];
  const applicantCounts = {
    all: Number(totals?.total ?? 0),
    shortlisted: Number(totals?.active ?? 0),
    withdrawn: Number(totals?.withdrawn ?? 0),
  };
  // REC-home-drives-38: read only already-verified academic marks for
  // this authorized 25-row page. Raw learner JSON is never sent to employers.
  type AcademicLevel="UG"|"10TH"|"12TH"|"DIPLOMA";
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
      inArray(profileVerificationAcademicMarks.level,["UG","10TH","12TH","DIPLOMA"])))
   :[];
  const byMember=new Map<string,Partial<Record<AcademicLevel,number>>>();
  for(const mark of grades){
   if(mark.percentage===null)continue;
   if(mark.level!=="UG"&&mark.level!=="10TH"&&mark.level!=="12TH"&&mark.level!=="DIPLOMA")continue;
   const row=byMember.get(mark.membershipId)??{};
   row[mark.level]=mark.percentage;
   byMember.set(mark.membershipId,row);
  }
  const percentage=(points:number|undefined)=>
   points===undefined?null:(points/100).toFixed(2).replace(/\\.00$/,"")+"%";
  const projected = projectSharedApplicants(applications.map(({membershipId,...row})=>{
    const marks=byMember.get(membershipId);
    return {...row,
      rollNumber:shareRoll?row.rollNumber:null,
      email:shareEmail?row.email:null,
      ugPercentage:shareUg?percentage(marks?.UG):null,
      tenthPercentage:shareTenth?percentage(marks?.["10TH"]):null,
      twelfthOrDiplomaPercentage:shareTwelfth?
        percentage(marks?.["12TH"]??marks?.DIPLOMA):null,
    };
  }), filters.stage);
  const selectedTotal = filters.stage === "SHORTLISTED" ? applicantCounts.shortlisted
    : filters.stage === "WITHDRAWN" ? applicantCounts.withdrawn : applicantCounts.all;
  return {
    workspace, filters,
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
    offers,
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
