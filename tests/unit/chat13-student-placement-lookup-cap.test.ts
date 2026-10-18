import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  STUDENT_LOOKUP_CAP,
  STUDENT_LOOKUP_APPLICATION_CAP,
  capStudentLookupRows,
} from "@/modules/placements/college-placement-student-lookup-model";

describe("SA-STUDENT-LOOKUP-CAP-01 truthful supervised placement lookup paging", () => {
  it("marks a result as truncated only if a sixteenth matching learner exists", () => {
    const exact = Array.from({length: STUDENT_LOOKUP_CAP}, (_, i) => i);
    const capped = capStudentLookupRows(exact, STUDENT_LOOKUP_CAP);
    expect(capped.items).toEqual(exact);
    expect(capped.truncated).toBe(false);
    const over = capStudentLookupRows([...exact, 15], STUDENT_LOOKUP_CAP);
    expect(over.items).toEqual(exact);
    expect(over.truncated).toBe(true);
    expect(over.items).not.toBe(exact);
  });

  it("detects the 101st application rather than warning on exactly 100 rows", () => {
    const exact = Array.from({length: STUDENT_LOOKUP_APPLICATION_CAP}, (_,i)=>({id:i}));
    expect(capStudentLookupRows(exact,STUDENT_LOOKUP_APPLICATION_CAP)).toEqual({
      items:exact,truncated:false,
    });
    const overflow=capStudentLookupRows([...exact,{id:100}],STUDENT_LOOKUP_APPLICATION_CAP);
    expect(overflow.items).toHaveLength(STUDENT_LOOKUP_APPLICATION_CAP);
    expect(overflow.items[99]?.id).toBe(99);
    expect(overflow.items.some(r=>r.id===100)).toBe(false);
    expect(overflow.truncated).toBe(true);
    expect(exact).toHaveLength(100);
  });

  it("probes an additional authorized database row and does not disclose it in output", () => {
    const service=readFileSync("src/modules/placements/college-placement-student-lookup-service.ts","utf8");
    expect(service).toContain(".limit(STUDENT_LOOKUP_CAP+1)");
    expect(service).toContain("capStudentLookupRows(people,STUDENT_LOOKUP_CAP).items.map");
    expect(service).toContain(".limit(STUDENT_LOOKUP_APPLICATION_CAP+1)");
    expect(service).toContain(".orderBy(desc(placementApplications.submittedAt),desc(placementApplications.id),desc(placementOffers.id))");
    expect(service).toContain("capStudentLookupRows(rows,STUDENT_LOOKUP_APPLICATION_CAP)");
    expect(service).toContain("applications:applications.items");
    expect(service).toContain("truncated:applications.truncated");
    expect(service).toContain("people.length>STUDENT_LOOKUP_CAP");
    expect(service).toContain("eq(collegeMemberships.collegeId,collegeId)");
    expect(service).toContain("eq(placementJobs.collegeId,collegeId)");
    expect(service).toContain("eq(placementCompanyRelationships.collegeId,collegeId)");
  });
});
