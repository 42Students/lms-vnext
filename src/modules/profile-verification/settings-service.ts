import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  activityEvents, collegeMemberships, colleges, membershipRoles, systemRoles, users, placementCandidateAcademicEvidence,
} from "@/db/schema";
import {
  profileVerificationAcademicMarks, profileVerificationSettings,
} from "@/db/schema/profile-verification";
import { isSuperAdmin, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";
import {
  convertedPercentageBasisPoints, normaliseCgpaRule,
  type CgpaRule, type RawAcademicMark,
} from "./academic-marks";

const uuid=z.string().uuid();
const ruleInput=z.enum(["X9_5","MINUS_0_5_X10","MINUS_0_75_X10","X10"]);
type Level="10TH"|"12TH"|"DIPLOMA"|"UG"|"PG";
type PercentPatch={tenthPctBasisPoints?:number|null;twelfthPctBasisPoints?:number|null;
  diplomaPctBasisPoints?:number|null;undergraduatePctBasisPoints?:number|null};
const columns:Partial<Record<Level,keyof PercentPatch>>={
  "10TH":"tenthPctBasisPoints","12TH":"twelfthPctBasisPoints",
  "DIPLOMA":"diplomaPctBasisPoints","UG":"undergraduatePctBasisPoints",
};

/**
 * Exact legacy product behavior: changing college CGPA policy recalculates
 * current comparable % across the college; original approved marks remain.
 * College row lock serializes with concurrent verification publications.
 */
export async function setCollegeCgpaConversionRule(
  context:RequestContext, collegeIdInput:string, ruleInputRaw:unknown,
):Promise<{rule:CgpaRule;recomputedMarks:number;updatedLearners:number}>{
  const collegeId=uuid.parse(collegeIdInput),rule=ruleInput.parse(ruleInputRaw);
  return getDb().transaction(async tx=>{
    const [college]=await tx.select({id:colleges.id,organizationId:colleges.organizationId})
      .from(colleges).where(eq(colleges.id,collegeId)).for("update");
    if(!college) throw Error("COLLEGE_NOT_FOUND");
    requirePermission(context,"placements.manage",{collegeId,organizationId:college.organizationId});
    await tx.insert(profileVerificationSettings).values({
      collegeId,cgpaToPct:rule,updatedByUserId:context.user.id,
    }).onConflictDoUpdate({
      target:profileVerificationSettings.collegeId,
      set:{cgpaToPct:rule,updatedByUserId:context.user.id,updatedAt:new Date()},
    });
    const marks=await tx.select({row:profileVerificationAcademicMarks})
      .from(profileVerificationAcademicMarks)
      .innerJoin(collegeMemberships,eq(collegeMemberships.id,
        profileVerificationAcademicMarks.learnerMembershipId))
      .where(eq(collegeMemberships.collegeId,collegeId)).for("update");
    const changes=new Map<string,PercentPatch>();
    let count=0;
    for(const {row} of marks){
      const raw:RawAcademicMark={grade:row.originalGrade,scale:row.originalScale,max:row.originalMax};
      const percent=convertedPercentageBasisPoints(raw,rule);
      await tx.update(profileVerificationAcademicMarks).set({
        percentageBasisPoints:percent,appliedRule:rule,updatedAt:new Date(),
      }).where(eq(profileVerificationAcademicMarks.id,row.id));
      const level=row.level as Level,field=columns[level];
      if(field){
        const patch=changes.get(row.learnerMembershipId)??{};
        patch[field]=percent;
        changes.set(row.learnerMembershipId,patch);
      }
      count++;
    }
    for(const [membershipId,patch] of changes){
      // Only modify the academic percentage columns affected by original
      // marks. Backlogs, unrelated verified fields and provenance stay intact.
      await tx.update(placementCandidateAcademicEvidence)
        .set({...patch,updatedAt:new Date()})
        .where(and(eq(placementCandidateAcademicEvidence.membershipId,membershipId),
          eq(placementCandidateAcademicEvidence.source,"VERIFIED")));
    }
    await tx.insert(activityEvents).values({
      organizationId:college.organizationId,collegeId,actorUserId:context.user.id,
      module:"PLACEMENTS",eventType:"CGPA_RULE_CHANGED",importance:"HIGH",
      subjectType:"COLLEGE",subjectId:collegeId,
      summary:"College CGPA conversion rule updated and verified marks recomputed",
      metadata:{rule,recomputedMarks:count,updatedLearners:changes.size},
    });
    return {rule:normaliseCgpaRule(rule),recomputedMarks:count,updatedLearners:changes.size};
  });
}

/** Only same-college College Admin or scoped Super Admin may control
 * whether TPO admins can review profile-verification requests. */
export async function setTpoProfileVerificationEnabled(
  context:RequestContext,collegeIdInput:string,enabled:boolean,
):Promise<void>{
  const collegeId=uuid.parse(collegeIdInput);
  await getDb().transaction(async tx=>{
    const [college]=await tx.select({id:colleges.id,organizationId:colleges.organizationId})
      .from(colleges).where(eq(colleges.id,collegeId)).for("update");
    if(!college) throw Error("COLLEGE_NOT_FOUND");
    // Revalidate the authorizing role while the college lock is held.
    // Request-context roles alone are insufficient after account revocation.
    if(isSuperAdmin(context)){
      const [superRole]=await tx.select({id:systemRoles.id}).from(systemRoles)
       .where(and(eq(systemRoles.userId,context.user.id),eq(systemRoles.role,"SUPER_ADMIN"))).for("share");
      if(!superRole)throw new AuthorizationError("college.manage");
    }else{
      const membership=context.membership;
      if(!membership||membership.collegeId!==collegeId||membership.status!=="ACTIVE"||
         context.user.platformStatus!=="ACTIVE")throw new AuthorizationError("college.manage");
      const [persisted]=await tx.select({id:collegeMemberships.id})
       .from(collegeMemberships)
       .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
          eq(membershipRoles.role,"COLLEGE_ADMIN")))
       .innerJoin(users,eq(users.id,collegeMemberships.userId))
       .where(and(eq(collegeMemberships.id,membership.id),
         eq(collegeMemberships.userId,context.user.id),
         eq(collegeMemberships.collegeId,collegeId),
         eq(collegeMemberships.status,"ACTIVE"),
         eq(users.platformStatus,"ACTIVE"))).for("share");
      if(!persisted)throw new AuthorizationError("college.manage");
    }
    requirePermission(context,"college.manage",{collegeId,organizationId:college.organizationId});
    await tx.insert(profileVerificationSettings).values({
      collegeId,tpoCanVerifyProfiles:enabled,updatedByUserId:context.user.id,
    }).onConflictDoUpdate({
      target:profileVerificationSettings.collegeId,
      set:{tpoCanVerifyProfiles:enabled,updatedByUserId:context.user.id,
        updatedAt:new Date()},
    });
    await tx.insert(activityEvents).values({
      organizationId:college.organizationId,collegeId,actorUserId:context.user.id,
      module:"PLACEMENTS",eventType:"PROFILE_VERIFICATION_TPO_SETTING_CHANGED",
      subjectType:"COLLEGE",subjectId:collegeId,
      summary:"Placement-cell profile verification permission changed",
      metadata:{enabled},
    });
  });
}

/** Read only the selected college's CGPA conversion, with source default. */
export async function getCollegeCgpaConversionRule(
 context:RequestContext,rawCollegeId:string,
):Promise<CgpaRule>{
 const collegeId=uuid.parse(rawCollegeId);
 const [college]=await getDb().select({organizationId:colleges.organizationId})
  .from(colleges).where(eq(colleges.id,collegeId)).limit(1);
 if(!college)throw Error("COLLEGE_NOT_FOUND");
 requirePermission(context,"placements.manage",{
  collegeId,organizationId:college.organizationId,
 });
 const [setting]=await getDb().select({rule:profileVerificationSettings.cgpaToPct})
  .from(profileVerificationSettings)
  .where(eq(profileVerificationSettings.collegeId,collegeId)).limit(1);
 return normaliseCgpaRule(setting?.rule);
}
