import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  CollegePromotionExecuteError,
  executeCollegeBatchPromotion,
} from "@/modules/academics/college-batch-promotion-execute";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = !!process.env.TEST_DATABASE_URL &&
  process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });

const admin: RequestContext = {
  user: { id: SEED_IDS.collegeAdminUser, identityUid: "promotion-executor",
    platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.collegeAdminMembership,
    collegeId: SEED_IDS.collegeA, organizationId: SEED_IDS.organization,
    status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const foreign: RequestContext = {
  user: { ...admin.user, id: SEED_IDS.facultyUser },
  membership: { id: SEED_IDS.facultyCollegeBMembership,
    collegeId: SEED_IDS.collegeB, organizationId: SEED_IDS.organization,
    status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const faculty: RequestContext = {
  ...admin, membership: { ...admin.membership!, roles: ["FACULTY"] },
};

describe.skipIf(!enabled)("College batch promotion execute, rollback-only disposable PG", () => {
  it("rechecks blockers, version, tenant; commits state/event/audit atomically before rollback", async () => {
    const ids = {
      user: randomUUID(), membership: randomUUID(), role: randomUUID(),
      period: randomUUID(), program: randomUUID(), term1: randomUUID(),
      term2: randomUUID(), course: randomUUID(), termCourse: randomUUID(),
      cohort: randomUUID(), section: randomUUID(),
      enrollment: randomUUID(), sectionEnrollment: randomUUID(),
    };
    const marker = "promotion-execute-" + ids.cohort.slice(0, 8);
    // Outer transaction rolls back the whole fixture, including append-only
    // cohort_progression_events/activity_events. Never DELETE audit/history.
    await expect(getDb().transaction(async (tx) => {
      await tx.execute(sql`insert into users(id,identity_uid,display_name)
        values (${ids.user}, ${marker + "-user"}, ${marker})`);
      await tx.execute(sql`insert into college_memberships(id,user_id,college_id,status)
        values (${ids.membership},${ids.user},${SEED_IDS.collegeA},'ACTIVE')`);
      await tx.execute(sql`insert into membership_roles(id,membership_id,role)
        values (${ids.role},${ids.membership},'LEARNER')`);
      await tx.execute(sql`insert into academic_periods(id,college_id,name,code,start_date,end_date)
        values (${ids.period},${SEED_IDS.collegeA},${marker},${marker},'2026-07-01','2026-12-31')`);
      await tx.execute(sql`insert into programs(id,department_id,name,code,duration_terms)
        values (${ids.program},${SEED_IDS.departmentA},${marker},${marker},2)`);
      await tx.execute(sql`insert into program_terms(id,program_id,term_number,name)
        values (${ids.term1},${ids.program},1,${marker + " I"}),
          (${ids.term2},${ids.program},2,${marker + " II"})`);
      await tx.execute(sql`insert into courses(id,department_id,name,code)
        values (${ids.course},${SEED_IDS.departmentA},${marker},${marker})`);
      await tx.execute(sql`insert into program_term_courses
        (id,program_term_id,course_id,type,credits,display_order)
        values (${ids.termCourse},${ids.term2},${ids.course},'CORE',3,1)`);
      await tx.execute(sql`insert into cohorts(id,program_id,name,code,start_period_id,status)
        values (${ids.cohort},${ids.program},${marker},${marker},${ids.period},'ACTIVE')`);
      await tx.execute(sql`insert into cohort_progression_state
        (cohort_id,current_term_number,current_academic_year_start,current_period_id)
        values (${ids.cohort},1,2026,${ids.period})
        on conflict (cohort_id) do nothing`);
      await tx.execute(sql`insert into sections(id,cohort_id,academic_period_id,name,code)
        values (${ids.section},${ids.cohort},${ids.period},${marker},${marker})`);
      await tx.execute(sql`insert into learner_program_enrollments
        (id,membership_id,program_id,cohort_id,status)
        values (${ids.enrollment},${ids.membership},${ids.program},${ids.cohort},'ACTIVE')`);
      await tx.execute(sql`insert into section_enrollments
        (id,learner_enrollment_id,section_id,academic_period_id,status)
        values (${ids.sectionEnrollment},${ids.enrollment},${ids.section},${ids.period},'ACTIVE')`);

      const command = { cohortId: ids.cohort, programId: ids.program,
        expectedVersion: 0, yearStart: 2028,
        expectedCheckedLearners:1, expectedTargetTerm:2, expectedAcademicYearStart:2028,
        action: "PROMOTE" as const, confirm: true as const };
      const run = (ctx: RequestContext, input: unknown) =>
        executeCollegeBatchPromotion(ctx, input, (fn) => tx.transaction(fn));

      await expect(run(foreign, command)).rejects.toMatchObject({
        code: "BATCH_NOT_FOUND",
      });
      await expect(run(faculty, command)).rejects.toBeInstanceOf(AuthorizationError);
      await expect(run(admin, { ...command, expectedVersion: 5 })).rejects.toMatchObject({
        code: "PROMOTION_STALE",
      });
      await tx.execute(sql`update section_enrollments set status='MOVED',ended_at=now()
        where id=${ids.sectionEnrollment}`);
      await expect(run(admin, command)).rejects.toMatchObject({
        code: "PROMOTION_BLOCKED",
      });
      await tx.execute(sql`update section_enrollments set status='ACTIVE',ended_at=null
        where id=${ids.sectionEnrollment}`);
      await expect(run(admin, {...command,expectedCheckedLearners:2}))
        .rejects.toMatchObject({code:"PROMOTION_PREVIEW_CHANGED"});
      await expect(run(admin, {...command,expectedTargetTerm:3}))
        .rejects.toMatchObject({code:"PROMOTION_PREVIEW_CHANGED"});
      // COL-academic-setup-R04: execute must recheck target curriculum in
      // its transaction rather than trusting an earlier good preview.
      await tx.execute(sql`delete from program_term_courses where id=${ids.termCourse}`);
      await expect(run(admin,command)).rejects.toMatchObject({code:"PROMOTION_BLOCKED"});
      await tx.execute(sql`insert into program_term_courses
        (id,program_term_id,course_id,type,credits,display_order)
        values (${ids.termCourse},${ids.term2},${ids.course},'CORE',3,1)`);
      const result = await run(admin, command);
      expect(result).toMatchObject({
        cohortId: ids.cohort, version: 1, currentTermNumber: 2,
        academicYearStart: 2028, checkedLearners: 1,
      });
      await expect(run(admin, command)).rejects.toBeInstanceOf(CollegePromotionExecuteError);
      const state = await tx.execute(sql`select current_term_number,version,
        current_academic_year_start from cohort_progression_state
        where cohort_id=${ids.cohort}`);
      expect(state.rows[0]).toMatchObject({
        current_term_number: 2, version: "1", current_academic_year_start: 2028,
      });
      const history = await tx.execute(sql`select event_kind,from_term_number,to_term_number,state_version
        from cohort_progression_events where cohort_id=${ids.cohort}`);
      expect(history.rows).toHaveLength(1);
      expect(history.rows[0]).toMatchObject({
        event_kind: "PROMOTION", from_term_number: 1, to_term_number: 2, state_version: "1",
      });
      const audit = await tx.execute(sql`select event_type from activity_events
        where subject_id=${ids.cohort} order by occurred_at desc`);
      expect(audit.rows.some(row => row.event_type === "academics.batch.promoted")).toBe(true);
      throw new Error("ROLLBACK_FIXTURE_AFTER_ASSERTIONS");
    })).rejects.toThrow("ROLLBACK_FIXTURE_AFTER_ASSERTIONS");
  });
});
