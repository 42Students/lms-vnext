import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { afterCollegeOutcomeSchema, afterCollegeOptions } from "@/modules/placements/tpo-after-college-model";

describe("TPO-students-05 after-college roster editing", () => {
  it("offers the six manual outcomes (placed and debarred need evidence)", () => {
    const options = afterCollegeOptions();
    expect(options).toHaveLength(6);
    expect(options.every(option => afterCollegeOutcomeSchema.safeParse(option.value).success)).toBe(true);
  });
  it("mounts a scoped editor with original-row version and undo path", () => {
    const page = readFileSync("src/app/(authenticated)/tpo/students/page.tsx","utf8");
    const grid = readFileSync("src/components/tpo/tpo-students-spreadsheet.tsx","utf8");
    const editor = readFileSync("src/components/tpo/tpo-after-college-editor.tsx","utf8");
    expect(page).toContain("getTpoAfterCollegeForRoster(context");
    expect(grid).toContain("<TpoAfterCollegeEditor");
    expect(editor).toContain('method: "PUT"');
    expect(editor).toContain("expectedVersion: version");
    expect(editor).toContain("Undo");
    expect(editor).toContain("cause instanceof FriendlyFetchError && cause.status===409");
    expect(editor).toContain("Your outcome selection is kept below");
  });
});
