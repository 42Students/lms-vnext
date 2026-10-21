import "server-only";
import { and, eq, inArray, or } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  activityEvents, collegeMemberships, membershipRoles, inAppNotifications,
  placementCandidateAcademicEvidence, placementApplications, placementJobs, users, learnerProfiles,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { hasMembershipRole } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { assertPersistedPlatformPermission } from "@/modules/permissions/persisted-actor";
import { requirePlacementManageScope } from "./scope";
import { tpoAcademicPreviewRowSchema, type TpoLegacyAcademicStagingRow } from "./tpo-academic-preview-import-model";
import {evaluatePlacementEligibility} from "./eligibility-service";
import {tpoAcademicImportNewlyIneligible} from "./tpo-academic-import-recheck-model";

// Bulk CSVs retain the legacy two-field contract. An individual verified
// correction can submit only the fields that changed; absent fields are never
// zeroed or replaced by self-reported values.
const correctionRowSchema=tpoAcademicPreviewRowSchema.partial({
 cgpa:true,activeBacklogs:true,
}).extend({
 studentCode:z.string().uuid(),
 pastBacklogs:z.number().int().min(0).max(100).optional(),
 tenthPercentage:z.number().min(0).max(100).optional(),
 twelfthPercentage:z.number().min(0).max(100).optional(),
 diplomaPercentage:z.number().min(0).max(100).optional(),
 undergraduatePercentage:z.number().min(0).max(100).optional(),
 postgraduatePercentage:z.number().min(0).max(100).optional(),
 gapYears:z.number().int().min(0).max(100).optional(),
 isLateralEntry:z.boolean().optional(),
 passingYear:z.number().int().min(1950).max(2200).optional(),
}).refine(row=>Object.keys(row).some(key=>key!=="studentCode"),{
 message:"Enter at least one academic field to verify.",
});
const schema = z.object({
  rows: z.array(correctionRowSchema).min(1).max(200),
  mode:z.enum(["BULK","SINGLE"]).default("BULK"),
  skipUnmatched: z.boolean().default(false),
}).strict().superRefine((data,ctx)=>{
 if(data.mode==="SINGLE"&&data.rows.length!==1)
  ctx.addIssue({code:"custom",path:["rows"],message:"Choose exactly one learner to correct."});
});
type Input = z.infer<typeof schema>;

async function scope(context: RequestContext) {
  if (!context.membership || context.membership.status !== "ACTIVE" ||
      !hasMembershipRole(context, "TPO"))
    throw new AuthorizationError("placements.manage");
  return requirePlacementManageScope(context, context.membership.collegeId);
}

function noDuplicates(rows: Input["rows"]) {
  if (new Set(rows.map(row => row.studentCode)).size !== rows.length)
    throw new Error("ACADEMIC_IMPORT_DUPLICATE_STUDENT");
}

async function lookup(
  db: ReturnType<typeof getDb>,
  collegeId: string,
  ids: readonly string[],
) {
  if (!ids.length) return [];
  return db.select({
    id: collegeMemberships.id,
    displayName: users.displayName,
    rollNumber: users.id,
    currentCgpa: placementCandidateAcademicEvidence.cgpaHundredths,
    currentBacklogs: placementCandidateAcademicEvidence.activeBacklogs,
  }).from(collegeMemberships)
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .innerJoin(membershipRoles, and(
      eq(membershipRoles.membershipId, collegeMemberships.id),
      eq(membershipRoles.role, "LEARNER")))
    .leftJoin(placementCandidateAcademicEvidence,
      eq(placementCandidateAcademicEvidence.membershipId, collegeMemberships.id))
    .where(and(eq(collegeMemberships.collegeId, collegeId),
      eq(collegeMemberships.status, "ACTIVE"),
      eq(users.platformStatus, "ACTIVE"),
      inArray(collegeMemberships.id, [...ids])));
}

export async function previewTpoAcademicImport(context: RequestContext, raw: unknown) {
  const input = schema.parse(raw);
  noDuplicates(input.rows);
  const college = await scope(context);
  const rows = await lookup(getDb(), college.id, input.rows.map(row => row.studentCode));
  const found = new Map(rows.map(row => [row.id, row]));
  return {
    rows: input.rows.map(row => {
      const match = found.get(row.studentCode);
      return {
        ...row, match: match ? "WILL_UPDATE" as const : "CANT_MATCH" as const,
        name: match?.displayName ?? null,
        oldCgpa: match?.currentCgpa === null || match?.currentCgpa === undefined
          ? null : match.currentCgpa / 100,
        oldBacklogs: match?.currentBacklogs ?? null,
      };
    }),
  };
}

export async function commitTpoAcademicImport(context: RequestContext, raw: unknown) {
  const input = schema.parse(raw);
  noDuplicates(input.rows);
  const college = await scope(context);
  return getDb().transaction(async tx => {
    await assertPersistedPlatformPermission(tx, context, "placements.manage", {
      collegeId: college.id, organizationId: college.organizationId,
    });
    const ids = input.rows.map(row => row.studentCode);
    // Lock the learner membership and role rows with the eligibility read so
    // no campus-admin status or role change can race a verified import.
    const found = await tx.select({
      id: collegeMemberships.id,userId:collegeMemberships.userId,
    }).from(collegeMemberships)
      .innerJoin(users, eq(users.id, collegeMemberships.userId))
      .innerJoin(membershipRoles, and(
        eq(membershipRoles.membershipId, collegeMemberships.id),
        eq(membershipRoles.role, "LEARNER")))
      .where(and(eq(collegeMemberships.collegeId, college.id),
        eq(collegeMemberships.status, "ACTIVE"),
        eq(users.platformStatus, "ACTIVE"),
        inArray(collegeMemberships.id, ids)))
      .for("share");
    const eligible = new Set(found.map(row => row.id));
    const studentUsers = new Map(found.map(row=>[row.id,row.userId]));
    const staff=await tx.selectDistinct({userId:collegeMemberships.userId}).from(collegeMemberships)
      .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"TPO")))
      .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
      .where(and(eq(collegeMemberships.collegeId,college.id),eq(collegeMemberships.status,"ACTIVE")));
    const missing = ids.filter(id => !eligible.has(id));
    if (missing.length && !input.skipUnmatched)
      throw new Error("ACADEMIC_IMPORT_UNMATCHED_STUDENTS");
    const now = new Date();
    let updated = 0, newlyIneligible = 0;
    for (const row of input.rows) {
      if (!eligible.has(row.studentCode)) continue;
      // Re-evaluate every open application before and after the verified evidence
      // update in the same transaction; never withdraw or delete it.
      const applications=await tx.select({
       id:placementApplications.id,jobId:placementApplications.jobId,
       snapshot:placementApplications.eligibilitySnapshot,
      }).from(placementApplications).innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
       .where(and(eq(placementApplications.membershipId,row.studentCode),
        eq(placementApplications.status,"SUBMITTED"),eq(placementJobs.collegeId,college.id)))
       .for("update",{of:placementApplications});
      const oldStatuses=await Promise.all(applications.map(app=>
       evaluatePlacementEligibility(context,app.jobId,row.studentCode,tx).then(result=>result.status)));
      // Omitted academic fields remain untouched in an existing verified
      // record. This is important when a TPO corrects only one marks field.
      // A single persisted VERIFIED source wins over SELF evidence during
      // placement eligibility, and source provenance remains auditable.
      const evidence = {
        ...(row.cgpa!==undefined?{cgpaHundredths:Math.round(row.cgpa*100)}:{}),
        ...(row.activeBacklogs!==undefined?{activeBacklogs:row.activeBacklogs}:{}),
        ...(row.pastBacklogs!==undefined?{pastBacklogs:row.pastBacklogs}:{}),
        ...(row.tenthPercentage!==undefined?{tenthPctBasisPoints:Math.round(row.tenthPercentage*100)}:{}),
        ...(row.twelfthPercentage!==undefined?{twelfthPctBasisPoints:Math.round(row.twelfthPercentage*100)}:{}),
        ...(row.diplomaPercentage!==undefined?{diplomaPctBasisPoints:Math.round(row.diplomaPercentage*100)}:{}),
        ...(row.undergraduatePercentage!==undefined?{undergraduatePctBasisPoints:Math.round(row.undergraduatePercentage*100)}:{}),
        ...(row.postgraduatePercentage!==undefined?{postgraduatePctBasisPoints:Math.round(row.postgraduatePercentage*100)}:{}),
        ...(row.gapYears!==undefined?{gapYears:row.gapYears}:{}),
        ...(row.isLateralEntry!==undefined?{isLateralEntry:row.isLateralEntry}:{}),
        ...(row.passingYear!==undefined?{passingYear:row.passingYear}:{}),
        source: "VERIFIED" as const,
        // Direct correction is not an import batch, even if later reached
        // from a single-row form. Imported rows have a traceable timestamp.
        importedAt: input.mode==="SINGLE"?null:now,
        sourceMetadata:{mode:input.mode,verifiedFields:Object.keys(row).filter(key=>key!=="studentCode")},
        verifiedAt: now,
        verifiedByUserId: context.user.id,
        updatedAt: now,
      };
      await tx.insert(placementCandidateAcademicEvidence)
        .values({ membershipId: row.studentCode, ...evidence })
        .onConflictDoUpdate({
          target: placementCandidateAcademicEvidence.membershipId,
          set: evidence,
        });
      await tx.insert(activityEvents).values({
        organizationId: college.organizationId, collegeId: college.id,
        actorUserId: context.user.id, actorMembershipId: context.membership!.id,
        module: "PLACEMENTS", eventType: "ACADEMIC_RECORD_IMPORTED",
        subjectType: "placement_candidate_academic_evidence", subjectId: row.studentCode,
        summary: input.mode==="SINGLE"?"Academic record corrected":"Academic record imported",
        metadata: {fields:Object.keys(row).filter(key=>key!=="studentCode"),
         mode:input.mode,source:"VERIFIED"},
      });
      for(let index=0;index<applications.length;index++){
       const application=applications[index]!;
       const current=await evaluatePlacementEligibility(context,application.jobId,row.studentCode,tx);
       if(!tpoAcademicImportNewlyIneligible(oldStatuses[index]!,current.status))continue;
       if(!application.snapshot||typeof application.snapshot!=="object"||Array.isArray(application.snapshot))
        throw new Error("ACADEMIC_IMPORT_INVALID_APPLICATION_SNAPSHOT");
       const learnerUserId=studentUsers.get(row.studentCode);
       if(!learnerUserId)throw new Error("ACADEMIC_IMPORT_MEMBER_CHANGED");
       const [flagged]=await tx.update(placementApplications).set({
        eligibilitySnapshot:{...application.snapshot,
         academicImportReview:{newlyIneligible:true,at:now.toISOString(),
          reason:"VERIFIED_ACADEMIC_EVIDENCE_CHANGED"}},
        updatedAt:now,
       }).where(and(eq(placementApplications.id,application.id),
        eq(placementApplications.membershipId,row.studentCode),
        eq(placementApplications.status,"SUBMITTED")))
        .returning({id:placementApplications.id});
       if(!flagged)throw new Error("ACADEMIC_IMPORT_APPLICATION_CHANGED");
       const [event]=await tx.insert(activityEvents).values({
        organizationId:college.organizationId,collegeId:college.id,
        actorUserId:context.user.id,actorMembershipId:context.membership!.id,
        module:"PLACEMENTS",eventType:"NOW_INELIGIBLE",
        subjectType:"placement_application",subjectId:application.id,
        summary:"Academic import flagged an existing application for eligibility review",
        metadata:{previousStatus:oldStatuses[index],nextStatus:current.status,
         jobId:application.jobId,applicationPreserved:true},
       }).returning({id:activityEvents.id});
       if(!event)throw new Error("ACADEMIC_IMPORT_NOTICE_FAILED");
       const recipients=[{
        userId:learnerUserId,eventId:event.id,title:"Placement eligibility needs review",
        body:"Your updated academic details no longer meet a drive requirement. Your existing application is still recorded. Contact the placement cell.",
        actionHref:"/learn/my-placements",
       },...staff.filter(person=>person.userId!==learnerUserId).map(person=>({
        userId:person.userId,eventId:event.id,title:"Now ineligible after academic import",
        body:"Verified academic data changed an existing applicant's eligibility. Review the affected drive application.",
        actionHref:"/tpo/requests",
       }))];
       await tx.insert(inAppNotifications).values(recipients).onConflictDoNothing();
       newlyIneligible++;
      }
      updated++;
    }
    return { updated, skipped: missing.length, unmatched: missing, newlyIneligible };
  });
}


/** Server-side roll resolution uses CURRENT active learner memberships only,
 * scoped to the caller's college. Duplicated rolls, mismatched UUID+roll and
 * spreadsheet row issues are individual Can't match outcomes, not arbitrary
 * first-match imports. The preview has no mutation side effects. */
export async function previewTpoLegacyAcademicImport(
 context:RequestContext,raw:unknown,
){
 const rows=z.array(z.object({
  rowNumber:z.number().int().min(2).max(10001),
  rollNumber:z.string().max(120),
  studentCode:z.string().nullable(),
  cgpa:z.number().min(0).max(10).nullable(),
  activeBacklogs:z.number().int().min(0).max(100).nullable(),
  tenthPct:z.number().min(0).max(100).nullable(),
  twelfthPct:z.number().min(0).max(100).nullable(),
  diplomaPct:z.number().min(0).max(100).nullable(),
  ugPct:z.number().min(0).max(100).nullable(),
  gapYears:z.number().min(0).max(15).nullable(),
  passingYear:z.number().int().min(1980).max(2100).nullable(),
  batch:z.string().max(100).nullable(),
  gender:z.string().max(100).nullable(),
  issue:z.string().nullable(),
 }).strict()).min(1).max(5000).parse(raw) satisfies TpoLegacyAcademicStagingRow[];
 const college=await scope(context);
 const db=getDb();
 const ids=[...new Set(rows.map(row=>row.studentCode).filter(
  (v):v is string=>v!==null&&z.uuid().safeParse(v).success))];
 const rolls=[...new Set(rows.map(row=>row.rollNumber.trim()).filter(Boolean))];
 const found: {id:string;roll:string|null;name:string|null;cgpa:number|null;backlogs:number|null}[]=[];
 for(let i=0;i<Math.max(ids.length,rolls.length);i+=500){
  const idSlice=ids.slice(i,i+500),rollSlice=rolls.slice(i,i+500);
  if(!idSlice.length&&!rollSlice.length)continue;
  const batch=await db.select({
   id:collegeMemberships.id,roll:learnerProfiles.rollNumber,name:users.displayName,
   cgpa:placementCandidateAcademicEvidence.cgpaHundredths,
   backlogs:placementCandidateAcademicEvidence.activeBacklogs,
  }).from(collegeMemberships)
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
     eq(membershipRoles.role,"LEARNER")))
   .leftJoin(learnerProfiles,eq(learnerProfiles.membershipId,collegeMemberships.id))
   .leftJoin(placementCandidateAcademicEvidence,
     eq(placementCandidateAcademicEvidence.membershipId,collegeMemberships.id))
   .where(and(eq(collegeMemberships.collegeId,college.id),
     eq(collegeMemberships.status,"ACTIVE"),
     eq(users.platformStatus,"ACTIVE"),
     or(idSlice.length?inArray(collegeMemberships.id,idSlice):undefined,
       rollSlice.length?inArray(learnerProfiles.rollNumber,rollSlice):undefined)))
   .limit(2001);
  found.push(...batch);
 }
 const byId=new Map(found.map(row=>[row.id,row]));
 const byRoll=new Map<string,typeof found>();
 for(const row of found)if(row.roll){
  const key=row.roll.trim().toLowerCase();
  byRoll.set(key,[...(byRoll.get(key)??[]),row]);
 }
 return {rows:rows.map(row=>{
  const idMatch=row.studentCode?byId.get(row.studentCode):null;
  const rollMatches=row.rollNumber?byRoll.get(row.rollNumber.trim().toLowerCase())??[]:[];
  const match=idMatch??(rollMatches.length===1?rollMatches[0]:null);
  const problem=row.issue??
   (row.studentCode&&!z.uuid().safeParse(row.studentCode).success?"Invalid learner ID":null)??
   (rollMatches.length>1?"Duplicate roll number in this college":null)??
   (row.studentCode&&row.rollNumber&&
      (!idMatch||idMatch.roll?.trim().toLowerCase()!==row.rollNumber.trim().toLowerCase())
    ?"Student ID and roll number do not match":null)??
   (!match?"No active learner matches this roll / Student ID":null);
  const canImport=problem===null&&match!==null&&row.cgpa!==null&&row.activeBacklogs!==null &&
   row.tenthPct===null&&row.twelfthPct===null&&row.diplomaPct===null&&row.ugPct===null&&
   row.gapYears===null&&row.passingYear===null&&row.batch===null&&row.gender===null;
  return {...row,studentCode:match?.id??row.studentCode,
    name:match?.name??null,
    oldCgpa:match?.cgpa==null?null:match.cgpa/100,
    oldBacklogs:match?.backlogs??null,
    match:canImport?"WILL_UPDATE" as const:"CANT_MATCH" as const,
    issue:problem??(!canImport?"Sparse or additional academic fields require the dedicated verified evidence import. Nothing was discarded.":null)};
 })};
}
