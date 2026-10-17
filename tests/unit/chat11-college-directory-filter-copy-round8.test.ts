import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
describe("College Academic Setup filter labels", () => {
  it("COL-academic-setup-15 keeps legacy primary filters and avoids exposing internal evidence jargon", () => {
    for (const path of [
      "src/components/academics/college-academic-directory.tsx",
      "src/components/academics/college-structure-directory.tsx",
    ]) {
      const code = read(path);
      expect(code).toContain('name="q"');
      expect(code).toContain('name="programId"');
      expect(code).toContain('name="status"');
      expect(code).toContain("<summary");
      expect(code).toContain("More filters");
      for (const legacyAuditJargon of [
        "Batch active learner evidence", "Class parent program lifecycle",
        "Elective selection choice constraints", "Semester curriculum mapping presence",
      ]) {
        expect(code).not.toContain(legacyAuditJargon);
      }
    }
  });
});
