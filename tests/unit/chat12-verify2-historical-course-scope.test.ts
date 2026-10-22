import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const service = readFileSync("src/modules/courses/super-admin-student-course-progress.ts", "utf8");

describe("chat-12 legacy course progress scope", () => {
  it("requires a class-specific taught delivery and restricts unqualified bookmarks to active offerings", () => {
    expect(service).toContain('classId===null?eq(courseOfferings.status,"ACTIVE"):undefined');
    expect(service).toContain("exists (select 1 from course_teaching_assignments ta");
    expect(service).toContain("ta.delivery_id = ${courseSectionDeliveries.id}");
    expect(service).toContain("eq(departments.collegeId,collegeId)");
    expect(service).toContain('if(!isSuperAdmin(context)||!context.adminScope?.collegeId)');
    expect(service).toContain("if(requestedDeliveryId&&validity?.taughtInClass!==true)");
  });

  it("uses the persisted full-roster aggregate and excludes unfinished quiz attempts", () => {
    expect(service).toContain('count(*) over()::int as "__totalRows"');
    expect(service).toContain("attempt.submitted_at is not null");
    expect(service).toContain('pageSize=20,sort="percent-asc"');
    expect(service).toContain("assertPersistedPlatformPermission");
    expect(service).toContain("se.status='COMPLETED'");
    expect(service).toContain("e.status='COMPLETED'");
    expect(service).toContain("m.status='ACTIVE'");
    expect(service).toContain("s.cohort_id=o.cohort_id and s.academic_period_id=o.academic_period_id");
  });
});
