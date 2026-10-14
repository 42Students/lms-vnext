import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
function source(path:string) {
  return readFileSync(new URL("../../"+path,import.meta.url),"utf8");
}
describe("isolated learner placement PostgreSQL fixtures",()=>{
  const helper=source("tests/support/learner-placement-write-fixture.ts");
  it("creates its own actor, ACTIVE enrollment, college module access and ELIGIBLE decision",()=>{
    for(const name of [
      "colleges","departments","users","college_memberships","membership_roles",
      "academic_periods","programs","cohorts","learner_program_enrollments",
      "module_access_rules","placement_eligibility_decisions",
    ]) expect(helper).toContain("INSERT INTO "+name);
    expect(helper).toContain("'COLLEGE'");
    expect(helper).toContain("'MEMBERSHIP'");
    expect(helper).toContain("'ELIGIBLE'");
    expect(helper).not.toContain("SEED_IDS.learnerCollegeAMembership");
    expect(helper).not.toContain("INSERT INTO cohort_progression_state");
  });
  it.each([
    "tests/integration/learner-preferences-write.test.ts",
    "tests/integration/learner-offer-decision-write.test.ts",
  ])("%s uses independent placement actor and asserts live gate",path=>{
    const test=source(path);
    expect(test).toContain("seedLearnerPlacementWriteFixture(pool,");
    expect(test).toContain("cleanupLearnerPlacementWriteFixture(pool,");
    expect(test).toContain("requireLearnerPlacementAccess(");
    expect(test).not.toContain("newLearnerCourseWriteFixture()");
    expect(test).not.toContain("SEED_IDS.learnerCollegeAMembership");
    expect(test).not.toContain("VALUES('MEMBERSHIP',$1,'placements'");
  });
  it("never deletes immutable audit or history records during cleanup",()=>{
    const body=helper.slice(helper.indexOf("export async function cleanupLearnerPlacementWriteFixture"));
    expect(body).not.toMatch(/DELETE FROM (activity_events|placement_offer_status_history|placement_application_status_history|cohort_progression_events)/);
    expect(body).toContain("referenced.rows[0]?.preserve");
  });
});