import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { termCourseEditFields } from "@/modules/academics/college-term-mapping-model";

describe("semester mapping legacy mandatory/type independence", () => {
  it("allows optional CORE mappings without silently converting them into electives", () => {
    const mandatoryCore = { type: "CORE" as const, legacyIsMandatory: true };
    expect(termCourseEditFields(mandatoryCore, { isMandatory: false }))
      .toEqual({ type: "CORE", isMandatory: false });
    expect(termCourseEditFields(mandatoryCore, { type: "ELECTIVE", isMandatory: false }))
      .toEqual({ type: "ELECTIVE", isMandatory: false });
    expect(termCourseEditFields({ type: "CORE", legacyIsMandatory: null }, {}))
      .toEqual({ type: "CORE", isMandatory: null });
    expect(termCourseEditFields({ type: "ELECTIVE", legacyIsMandatory: false }, { type: "CORE" }))
      .toEqual({ type: "CORE", isMandatory: false });
  });

  it("does not turn imported nullable credits into 3 when reordering", () => {
    const manager = readFileSync(
      "src/components/academics/college-term-mapping-manager.tsx", "utf8",
    );
    expect(manager).toContain("creditsValue === null ? null : parseTermCourseCreditsDraft(creditsValue)");
    expect(manager.match(/onClick=\{\(\)=>updateMapping\(row\.id,null,/g)).toHaveLength(2);
    expect(manager.match(/updateMapping\(source\.id, null,/g)).toHaveLength(2);
    expect(manager).toContain("updateMapping(row.id, null, next + 1)");
    expect(manager).toContain("changedCredits && creditsResult?.success");
    const service = readFileSync(
      "src/modules/academics/college-term-mapping-service.ts", "utf8",
    );
    expect(service).toContain("termCourseEditFields(current, {");
    expect(service).toContain("before.findIndex(row => row.id === mappingId) + 1");
  });
});
