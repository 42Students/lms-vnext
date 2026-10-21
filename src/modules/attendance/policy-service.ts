import "server-only";

import {eq,sql} from "drizzle-orm";
import {z} from "zod";
import { getDb } from "@/db/client";
import { activityEvents, attendancePolicies } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requireAttendanceCollege } from "./admin-service";
import {CoursesServiceError} from "@/modules/courses/errors";
import {
  attendancePolicyUpdateSchema,
  DEFAULT_ATTENDANCE_POLICY,
} from "./policy-validation";

export async function correctionHoursDeploymentMax(){
 const row=await getDb().execute(sql<{definition:string}>`
  select pg_get_constraintdef(oid) as definition from pg_constraint
  where conname='attendance_policies_correction_window_ck' limit 1
 `);
 return (()=>{const definition=row.rows[0]?.definition;return typeof definition==="string"&&definition.includes("8760")?8760:168;})();
}
/**
 * Read the persisted policy for one authorized college.
 *
 * A college without an attendance_policies row uses
 * the same defaults already exposed by admin-service,
 * Faculty attendance and Learner attendance.
 */
export async function getCollegeAttendancePolicy(
  context: RequestContext,
  collegeIdInput: string,
) {
  const college = await requireAttendanceCollege(
    context,
    collegeIdInput,
  );

  const [stored] = await getDb()
    .select({
      eligibilityThresholdPercent:
        attendancePolicies.eligibilityThresholdPercent,
      correctionWindowHours:
        attendancePolicies.correctionWindowHours,
    })
    .from(attendancePolicies)
    .where(
      eq(
        attendancePolicies.collegeId,
        college.id,
      ),
    )
    .limit(1);

  return {
    college,
    policy: stored ?? DEFAULT_ATTENDANCE_POLICY,
    hasCollegeOverride: Boolean(stored),
    maxCorrectionHours:await correctionHoursDeploymentMax(),
  };
}

/**
 * Replace both policy numbers atomically.
 *
 * The existing attendance scope guard enforces:
 * - an active college;
 * - College Admin membership, or Super Admin
 *   explicitly acting in that selected college;
 * - centralized academics.manage permission.
 *
 * The database primary key allows one policy
 * row per college. This upsert also handles
 * colleges still using the default values.
 */
export async function updateCollegeAttendancePolicy(
  context: RequestContext,
  rawInput: unknown,
) {
  const input =
    attendancePolicyUpdateSchema.parse(rawInput);

  const college = await requireAttendanceCollege(
    context,
    input.collegeId,
  );

  if(input.correctionWindowHours>(await correctionHoursDeploymentMax()))
    throw new Error("ATTENDANCE_POLICY_MIGRATION_PENDING");
  const now = new Date();

  return getDb().transaction(async (tx) => {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${"attendance-policy:"+college.id}))`);
  const [prior] = await tx
    .select({
      eligibilityThresholdPercent:
        attendancePolicies.eligibilityThresholdPercent,
      correctionWindowHours:
        attendancePolicies.correctionWindowHours,
    })
    .from(attendancePolicies)
    .where(eq(attendancePolicies.collegeId, college.id))
    .limit(1);
  const before = prior ?? DEFAULT_ATTENDANCE_POLICY;

  const [saved] = await tx
    .insert(attendancePolicies)
    .values({
      collegeId: college.id,
      eligibilityThresholdPercent:
        input.eligibilityThresholdPercent,
      correctionWindowHours:
        input.correctionWindowHours,
      updatedByUserId: context.user.id,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: attendancePolicies.collegeId,
      set: {
        eligibilityThresholdPercent:
          input.eligibilityThresholdPercent,
        correctionWindowHours:
          input.correctionWindowHours,
        updatedByUserId: context.user.id,
        updatedAt: now,
      },
    })
    .returning({
      collegeId: attendancePolicies.collegeId,
      eligibilityThresholdPercent:
        attendancePolicies.eligibilityThresholdPercent,
      correctionWindowHours:
        attendancePolicies.correctionWindowHours,
      updatedAt: attendancePolicies.updatedAt,
    });

  // COL-attendance-02: audit every policy change in the same transaction.
  await tx.insert(activityEvents).values({
    organizationId: college.organizationId,
    collegeId: college.id,
    actorUserId: context.user.id,
    actorMembershipId:
      context.membership?.collegeId === college.id
        ? context.membership.id
        : null,
    module: "COURSES",
    eventType: "ATTENDANCE_POLICY_UPDATED",
    subjectType: "attendance_policy",
    subjectId: college.id,
    subjectLabel: "Attendance policy",
    summary: "Attendance policy updated",
    metadata: {
      fromEligibilityThresholdPercent: before.eligibilityThresholdPercent,
      toEligibilityThresholdPercent: input.eligibilityThresholdPercent,
      fromCorrectionWindowHours: before.correctionWindowHours,
      toCorrectionWindowHours: input.correctionWindowHours,
    },
    occurredAt: now,
  });
  return saved;
  });
}


/** CAS single-field policy edit: retain the other current column, not a stale
 * client draft. The global/org inheritance hierarchy is not represented by
 * attendance_policies; writing a default number is an explicit college value,
 * NOT deletion of a higher-level override. */
const attendancePolicyFieldPatchSchema=z.strictObject({
  collegeId:z.string().uuid(),
  field:z.enum(["eligibilityThresholdPercent","correctionWindowHours"]),
  expectedValue:z.number().int().min(1).max(8760),
  value:z.number().int().min(1).max(8760),
}).superRefine((value,ctx)=>{
  if(value.field==="eligibilityThresholdPercent" && (value.value>100||value.expectedValue>100))
    ctx.addIssue({code:"custom",path:["value"],message:"Minimum attendance must be 1–100%"});
});
export async function updateCollegeAttendancePolicyField(context:RequestContext,raw:unknown){
  const input=attendancePolicyFieldPatchSchema.parse(raw);
  const college=await requireAttendanceCollege(context,input.collegeId);
  if(input.field==="correctionWindowHours" && input.value>(await correctionHoursDeploymentMax()))
    throw new Error("ATTENDANCE_POLICY_MIGRATION_PENDING");
  return getDb().transaction(async tx=>{
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${"attendance-policy:"+college.id}))`);
    const [stored]=await tx.select({
      eligibilityThresholdPercent:attendancePolicies.eligibilityThresholdPercent,
      correctionWindowHours:attendancePolicies.correctionWindowHours,
    }).from(attendancePolicies)
      .where(eq(attendancePolicies.collegeId,college.id)).for("update").limit(1);
    const before=stored??DEFAULT_ATTENDANCE_POLICY;
    if(before[input.field]!==input.expectedValue)
      throw new CoursesServiceError("ATTENDANCE_STALE_VERSION");
    if(before[input.field]===input.value)
      return {policy:before,hasCollegeOverride:Boolean(stored),changed:false};
    const after={...before,[input.field]:input.value};
    const now=new Date();
    const [updated]=await tx.insert(attendancePolicies).values({
      collegeId:college.id,
      eligibilityThresholdPercent:after.eligibilityThresholdPercent,
      correctionWindowHours:after.correctionWindowHours,
      updatedByUserId:context.user.id,updatedAt:now,
    }).onConflictDoUpdate({target:attendancePolicies.collegeId,set:{
      eligibilityThresholdPercent:after.eligibilityThresholdPercent,
      correctionWindowHours:after.correctionWindowHours,
      updatedByUserId:context.user.id,updatedAt:now,
    }}).returning({
      eligibilityThresholdPercent:attendancePolicies.eligibilityThresholdPercent,
      correctionWindowHours:attendancePolicies.correctionWindowHours,
    });
    await tx.insert(activityEvents).values({
      organizationId:college.organizationId,collegeId:college.id,
      actorUserId:context.user.id,
      actorMembershipId:context.membership?.collegeId===college.id?context.membership.id:null,
      module:"COURSES",eventType:"ATTENDANCE_POLICY_UPDATED",
      subjectType:"attendance_policy",subjectId:college.id,
      summary:"Attendance policy updated",
      metadata:{field:input.field,from:before[input.field],to:input.value},
      occurredAt:now,
    });
    return {policy:updated,hasCollegeOverride:true,changed:true};
  });
}
