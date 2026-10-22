import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  CollegeRulePreviewError,
  previewCollegeGroupRule,
} from "@/modules/groups/college-rule-preview-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });

const admin: RequestContext = {
  user: { id: SEED_IDS.collegeAdminUser, identityUid: "rule-preview-admin",
    platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.collegeAdminMembership,
    collegeId: SEED_IDS.collegeA, organizationId: SEED_IDS.organization,
    status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const foreign: RequestContext = {
  user: { id: SEED_IDS.facultyUser, identityUid: "rule-preview-foreign",
    platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.facultyCollegeBMembership,
    collegeId: SEED_IDS.collegeB, organizationId: SEED_IDS.organization,
    status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const learner: RequestContext = {
  ...admin, membership: { ...admin.membership!, roles: ["LEARNER"] },
};

describe.skipIf(!enabled)("College group rule preview — isolated PostgreSQL", () => {
  it("reads valid rule matches, prevents foreign college and non-admin visibility, and never writes", async () => {
    const ids = {
      group: randomUUID(), rule: randomUUID(), roster: randomUUID(),
    };
    const marker = "ruleprev-" + ids.group.slice(0, 8);
    await expect(getDb().transaction(async tx => {
      // Registered schema permits only one ACTIVE program enrollment per learner.
      // Use the already-active seed learner's academic program rather than
      // forging a concurrent second enrollment and invalidating the transaction.
      const enrolled=await tx.execute(sql<{program_id:string}>`
        select program_id from learner_program_enrollments
        where membership_id=${SEED_IDS.learnerCollegeAMembership}
          and status='ACTIVE' limit 1`);
      const programId=enrolled.rows[0]?.program_id;
      if(!programId)throw new Error("Seed learner must have an active program enrollment");
      await tx.execute(sql`insert into lms_groups
        (id,kind,owner_scope,college_id,name,status,created_by_user_id)
        values (${ids.group},'STUDY_GROUP','COLLEGE',${SEED_IDS.collegeA},
          ${marker},'ACTIVE',${SEED_IDS.collegeAdminUser})`);
      await tx.execute(sql`insert into lms_group_rules(id,group_id,criteria_json,criteria_version,auto_refresh)
        values (${ids.rule},${ids.group},
          jsonb_build_object('allowedProgramIds',jsonb_build_array(${programId}::text)),
          1,false)`);
      const run = (ctx: RequestContext, raw: unknown) =>
        previewCollegeGroupRule(ctx, raw, tx);
      const input = { groupId: ids.group };
      const result = await run(admin, input);
      expect(result.projection).toMatchObject({
        matched: 1, potentiallyNew: 1, incomplete: false,
      });
      expect(result.group.id).toBe(ids.group);
      await expect(run(foreign, input)).rejects.toMatchObject({
        code: "GROUP_NOT_FOUND",
      });
      await expect(run(learner, input)).rejects.toBeInstanceOf(AuthorizationError);
      await expect(run(admin, { ...input, collegeId: SEED_IDS.collegeB })).rejects.toBeDefined();
      await tx.execute(sql`insert into lms_group_members
        (id,group_id,membership_id,state,source,member_type)
        values (${ids.roster},${ids.group},${SEED_IDS.learnerCollegeAMembership},
          'ACTIVE','MANUAL','LEARNER')`);
      const activePreview = await run(admin, input);
      expect(activePreview.projection).toMatchObject({
        matched: 1, alreadyActive: 1, potentiallyNew: 0,
      });
      const writes = await tx.execute(sql`select count(*)::int as total from lms_group_member_events
        where group_id=${ids.group}`);
      expect(writes.rows[0]?.total).toBe(0);
      throw new Error("ROLLBACK_GROUP_RULE_PREVIEW");
    })).rejects.toThrow("ROLLBACK_GROUP_RULE_PREVIEW");
  });

  it("reports nonexisting group as not found without leaking tenant data", async () => {
    await expect(previewCollegeGroupRule(admin, { groupId: randomUUID() }))
      .rejects.toBeInstanceOf(CollegeRulePreviewError);
  });
});
