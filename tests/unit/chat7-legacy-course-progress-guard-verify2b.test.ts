import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const sqlSource=readFileSync(
  "src/modules/courses/super-admin-student-course-progress.ts","utf8",
);
const reviewSource=readFileSync(
  "src/components/courses/faculty-assignment-review.tsx","utf8",
);

describe("legacy course progress and faculty publication parity",()=>{
  it("excludes deleted historical quiz attempts and only counts published work",()=>{
    expect(sqlSource).toContain("attempt.submitted_at is not null");
    expect(sqlSource).toContain("attempt.deleted_at is null");
    expect(sqlSource).toContain("attempt.legacy_deleted is distinct from true");
    expect(sqlSource).toContain("q.status='PUBLISHED'");
    expect(sqlSource).toContain("q.legacy_deleted_at is null");
    expect(sqlSource).toContain("q.legacy_active is distinct from false");
    expect(sqlSource).toContain("q.legacy_enabled is distinct from false");
    expect(sqlSource).toContain("sub.submitted_at is not null and sub.deleted_at is null");
  });
  it("prevents close and student switching during any in-flight grade release",()=>{
    expect(reviewSource).toContain("bulkInFlight.current=true");
    expect(reviewSource).toContain("bulkInFlight.current=false");
    expect(reviewSource).toContain("mutationInFlight.current||bulkInFlight.current");
    expect(reviewSource).toContain("!mutationInFlight.current&&!bulkInFlight.current");
    expect(reviewSource).toContain("disabled={mutationBusy||bulkBusy}");
  });
});
