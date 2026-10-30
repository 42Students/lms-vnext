import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  CollegeElectiveSlotMutationError,
  createCollegeElectiveSlot,
  updateCollegeElectiveSlot,
} from "@/modules/electives/college-slot-mutation-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });

const admin: RequestContext = {
  user: { id: SEED_IDS.collegeAdminUser, identityUid: "w-elective-admin",
    platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.collegeAdminMembership,
    collegeId: SEED_IDS.collegeA, organizationId: SEED_IDS.organization,
    status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const foreign: RequestContext = {
  user: { id: SEED_IDS.facultyUser, identityUid: "w-elective-foreign",
    platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.facultyCollegeBMembership,
    collegeId: SEED_IDS.collegeB, organizationId: SEED_IDS.organization,
    status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const faculty: RequestContext = {
  ...admin, membership: { ...admin.membership!, roles: ["FACULTY"] },
};

describe.skipIf(!enabled)("College elective slot create/edit isolated PostgreSQL", () => {
  it("creates and edits with audit, stale/foreign denial, and blocks selections under dependency", async () => {
    const ids = {
      period: randomUUID(), program: randomUUID(), cohort: randomUUID(),
      section: randomUUID(), course: randomUUID(), offering: randomUUID(),
      delivery: randomUUID(), group: randomUUID(), electiveOffering: randomUUID(),
      roster: randomUUID(), learnerUser: randomUUID(),
      learnerMembership: randomUUID(), learnerRole: randomUUID(),
      learnerEnrollment: randomUUID(), learnerSectionEnrollment: randomUUID(),
    };
    const marker = "elw-" + ids.program.slice(0, 8);
    await expect(getDb().transaction(async tx => {
      await tx.execute(sql`insert into academic_periods(id,college_id,name,code,start_date,end_date,status)
        values (${ids.period},${SEED_IDS.collegeA},${marker},${marker},'2026-07-01','2026-12-31','ACTIVE')`);
      await tx.execute(sql`insert into programs(id,department_id,name,code,duration_terms)
        values (${ids.program},${SEED_IDS.departmentA},${marker},${marker},4)`);
      const runCreate = (ctx: RequestContext, raw: unknown) =>
        createCollegeElectiveSlot(ctx, raw, (cb) => tx.transaction(cb));
      const runEdit = (ctx: RequestContext, id: string, raw: unknown) =>
        updateCollegeElectiveSlot(ctx, id, raw, (cb) => tx.transaction(cb));
      const input = {
        programId: ids.program, academicPeriodId: ids.period,
        // A freshly created cohort starts in term 1. Match the persisted
        // cohort progression; a term-2 elective would correctly be denied.
        // This tests the slot selection lock, not academic-year matching.
        // The DB03 year mismatch rejection has dedicated positive/negative
        // PostgreSQL coverage in groups-db03.test.ts. Use a period-bound
        // slot with no extra year filter so the valid learner roster can form.
        semesterNumber: 1, academicYear: null,
        name: marker, description: null,
        credits: 3, minPick: 1, maxPick: 2, confirm: true,
      };
      await expect(runCreate(foreign, input)).rejects.toMatchObject({
        code: "ELECTIVE_PROGRAM_NOT_FOUND",
      });
      await expect(runCreate(faculty, input)).rejects.toBeInstanceOf(AuthorizationError);
      const slot = await runCreate(admin, input);
      expect(slot).toMatchObject({ collegeId: SEED_IDS.collegeA, version: 0 });
      const changed = {
        expectedVersion: 0, name: marker + "-updated", description: "readable",
        credits: 3, minPick: 1, maxPick: 2, confirm: true,
      };
      await expect(runEdit(foreign, slot.id, changed)).rejects.toMatchObject({
        code: "ELECTIVE_SLOT_NOT_FOUND",
      });
      const updated = await runEdit(admin, slot.id, changed);
      expect(updated).toMatchObject({ version: 1, name: marker + "-updated" });
      await expect(runEdit(admin, slot.id, changed)).rejects.toMatchObject({
        code: "ELECTIVE_SLOT_STALE",
      });

      await tx.execute(sql`insert into cohorts(id,program_id,name,code,start_period_id,status)
        values (${ids.cohort},${ids.program},${marker},${marker},${ids.period},'ACTIVE')`);
      await tx.execute(sql`insert into sections(id,cohort_id,academic_period_id,name,code)
        values (${ids.section},${ids.cohort},${ids.period},${marker},${marker})`);
      await tx.execute(sql`insert into courses(id,department_id,name,code)
        values (${ids.course},${SEED_IDS.departmentA},${marker},${marker})`);
      await tx.execute(sql`insert into course_offerings(id,course_id,cohort_id,academic_period_id,type)
        values (${ids.offering},${ids.course},${ids.cohort},${ids.period},'ELECTIVE')`);
      await tx.execute(sql`insert into course_section_deliveries(id,offering_id,section_id)
        values (${ids.delivery},${ids.offering},${ids.section})`);
      await tx.execute(sql`insert into lms_groups(id,college_id,owner_scope,kind,name,created_by_user_id,status,active_count)
        values (${ids.group},${SEED_IDS.collegeA},'COLLEGE','ELECTIVE',${marker},
          ${SEED_IDS.collegeAdminUser},'ACTIVE',1)`);
      await tx.execute(sql`insert into elective_offerings(id,slot_id,course_id,group_id,backed_delivery_id)
        values (${ids.electiveOffering},${slot.id},${ids.course},${ids.group},${ids.delivery})`);
      // DB03 elective membership requires an active learner with a current
      // enrollment in this slot's programme. The globally seeded learner has
      // a different programme; never alter that unrelated account.
      await tx.execute(sql`insert into users(id,identity_uid,display_name)
        values (${ids.learnerUser},${marker + "-learner"},'Elective test learner')`);
      await tx.execute(sql`insert into college_memberships(id,user_id,college_id,status)
        values (${ids.learnerMembership},${ids.learnerUser},${SEED_IDS.collegeA},'ACTIVE')`);
      await tx.execute(sql`insert into membership_roles(id,membership_id,role)
        values (${ids.learnerRole},${ids.learnerMembership},'LEARNER')`);
      await tx.execute(sql`insert into learner_program_enrollments
        (id,membership_id,program_id,cohort_id,status)
        values (${ids.learnerEnrollment},${ids.learnerMembership},${ids.program},${ids.cohort},'ACTIVE')`);
      // The registered elective roster guard also checks a live section
      // enrollment, not just a matching primary programme enrollment.
      // DB03 requires current cohort progression to match the elective slot
      // semester. A direct-fixture cohort might not yet have a state row.
      await tx.execute(sql`insert into cohort_progression_state
        (cohort_id,current_term_number)
        values (${ids.cohort},1) on conflict (cohort_id) do nothing`);
      await tx.execute(sql`insert into section_enrollments
        (id,learner_enrollment_id,section_id,academic_period_id,status)
        values (${ids.learnerSectionEnrollment},${ids.learnerEnrollment},
          ${ids.section},${ids.period},'ACTIVE')`);
      await tx.execute(sql`insert into lms_group_members(id,group_id,membership_id,state,source,member_type)
        values (${ids.roster},${ids.group},${ids.learnerMembership},'ACTIVE','MANUAL','LEARNER')`);
      await expect(runEdit(admin, slot.id, {
        ...changed, expectedVersion: 1, maxPick: 1,
      })).rejects.toMatchObject({ code: "ELECTIVE_SELECTION_LOCKED" });
      const saved = await tx.execute(sql`select name,max_pick,version from elective_slots where id=${slot.id}`);
      expect(saved.rows[0]).toMatchObject({
        name: marker + "-updated", max_pick: 2, version: 1,
      });
      const audit = await tx.execute(sql`select event_type from activity_events
        where subject_id=${slot.id} order by occurred_at desc`);
      expect(audit.rows.map(row => row.event_type)).toEqual(expect.arrayContaining([
        "academics.elective_slot.created", "academics.elective_slot.updated",
      ]));
      throw new Error("ROLLBACK_TEST_ELECTIVE");
    })).rejects.toThrow("ROLLBACK_TEST_ELECTIVE");
  });
});
