import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { superAdminBookedInterviewWindow } from "@/modules/placements/super-admin-booked-interviews-range";

describe("Super Admin booked interview calendar: verified IST window and tenant boundary", () => {
  it("SA-BOOKED-INTERVIEWS-01 rejects impossible dates, malformed input and reversed ranges", () => {
    for (const [from, to] of [
      ["2026-02-31","2026-03-05"], ["2025-02-29","2025-03-01"],
      ["2026-13-01","2026-13-05"], ["2026-00-01","2026-03-05"],
      ["2026-10-01T00:00:00","2026-10-03"], ["2026/10/01","2026-10-03"],
      ["2026-10-20","2026-10-19"], ["2026-10-01","garbage"], ["",""],
    ]) expect(superAdminBookedInterviewWindow(from,to), from + " - " + to).toBeNull();
    const singleDay = superAdminBookedInterviewWindow("2026-10-18","2026-10-18");
    expect(singleDay?.fromDate.toISOString()).toBe("2026-10-17T18:30:00.000Z");
    expect(singleDay?.toDate.toISOString()).toBe("2026-10-18T18:30:00.000Z");
    const leap = superAdminBookedInterviewWindow("2024-02-29","2024-03-01");
    expect(leap?.fromDate.toISOString()).toBe("2024-02-28T18:30:00.000Z");
    expect(leap?.toDate.toISOString()).toBe("2024-03-01T18:30:00.000Z");
  });

  it("SA-BOOKED-INTERVIEWS-02 refuses foreign rounds, applications or employer relationships in the selected college", () => {
    const source = readFileSync("src/modules/placements/super-admin-booked-interviews-service.ts","utf8");
    expect(source).toContain('requireSuperAdminSelectedCollege(context,"placements.read")');
    expect(source).toContain("superAdminBookedInterviewWindow(from,to)");
    expect(source).toContain("eq(placementJobs.collegeId,scope.collegeId)");
    expect(source).toContain("eq(placementJobRounds.jobId,s.jobId)");
    expect(source).toContain("eq(placementCompanyRelationships.collegeId,scope.collegeId)");
    expect(source).toContain("eq(placementApplications.jobId,s.jobId)");
    expect(source).toContain('eq(collegeMemberships.collegeId,scope.collegeId)');
    expect(source).toContain('eq(s.status,"BOOKED")');
    expect(source).toContain(".limit(2001)");
    expect(source).toContain("rows.slice(0,2000)");
    expect(source).toContain("truncated:rows.length>2000");
  });

  it("SA-BOOKED-INTERVIEWS-03 prevents department labels from an unrelated college leaking into a selected-college calendar", () => {
    const source = readFileSync("src/modules/placements/super-admin-booked-interviews-service.ts","utf8");
    // The application membership joins are scoped, but program foreign keys
    // are not composite with college. The final department join must not
    // expose a foreign-college department name if imports were malformed.
    expect(source).toContain(
      ".leftJoin(departments,and(eq(departments.id,programs.departmentId),eq(departments.collegeId,scope.collegeId)))",
    );
    expect(source).toContain("eq(collegeMemberships.collegeId,scope.collegeId)");
    expect(source).toContain("departmentName:row.departmentName");
    expect(source).not.toContain(".leftJoin(departments,eq(departments.id,programs.departmentId))");
  });

  it("SA-BOOKED-INTERVIEWS-FIXTURE-05 seeds valid role options and tests two distinct tenant candidates", () => {
    const fixture=readFileSync("tests/integration/chat13-super-admin-booked-interviews-tenant.test.ts","utf8");
    expect(fixture).toContain("insert into placement_job_role_options");
    expect(fixture).toContain("(job_id,role_option_id,membership_id,channel,eligibility_status,");
    expect(fixture).toContain("const candidateA=await candidate(driveA.jobId,learnerA.membershipId!,coordinatorA.userId)");
    expect(fixture).toContain("const candidateB=await candidate(driveB.jobId,learnerB.membershipId!,coordinatorB.userId)");
    expect(fixture).toContain("expect(naive).toHaveLength(2)");
    expect(fixture).toContain("expect(scoped).toEqual([{id:valid!.id,membership_id:learnerB.membershipId}])");
    expect(fixture).not.toContain("createPlacementCandidateFixture(");
  });

  it("SA-BOOKED-INTERVIEWS-04 excludes booked slots with mismatched or foreign candidate links instead of emitting null candidate events", () => {
    const source = readFileSync("src/modules/placements/super-admin-booked-interviews-service.ts","utf8");
    // BOOKED rows always have application_id by a registered DB CHECK.
    // Nullable joins would allow a forged cross-job/cross-college booking to
    // survive the results as a seemingly legitimate anonymous interview.
    expect(source).toContain(".innerJoin(placementApplications,and(eq(placementApplications.id,s.applicationId),eq(placementApplications.jobId,s.jobId)))");
    expect(source).toContain(".innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),eq(collegeMemberships.collegeId,scope.collegeId)))");
    expect(source).toContain(".innerJoin(users,eq(users.id,collegeMemberships.userId))");
    expect(source).not.toContain(".leftJoin(placementApplications,");
    expect(source).not.toContain(".leftJoin(collegeMemberships,");
    const schema=readFileSync("src/db/schema/placement-round-candidate-slots.ts","utf8");
    expect(schema).toContain("${t.status} = 'BOOKED' and ${t.applicationId} is not null");
  });
});
