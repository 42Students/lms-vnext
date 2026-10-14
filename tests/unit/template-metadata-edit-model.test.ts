import { describe, expect, it } from "vitest";
import { templateMetadataEditDecision, templateMetadataEditSchema } from "@/modules/projects/template-metadata-edit-model";
const raw = { title: " New ", summary: "", changeNote: " Reason ", expectedCurrentVersion: 1, expectedUpdatedAt: "2026-10-15T00:00:00.000Z" };
const input = templateMetadataEditSchema.parse(raw);
const row = { title: "Old", summary: null, status: "DRAFT", currentVersion: 1 };
describe("Draft template metadata revision", () => {
  it("normalizes summary and requires reason plus exact tokens", () => {
    expect(input).toMatchObject({ title: "New", summary: null, changeNote: "Reason" });
    for (const invalid of [{ ...raw, collegeId: "override" }, { ...raw, expectedCurrentVersion: 0 }, { ...raw, changeNote: " " }, { ...raw, expectedUpdatedAt: "2026-10-15" }])
      expect(templateMetadataEditSchema.safeParse(invalid).success).toBe(false);
  });
  it("checks stale state before published/no-op state and only edits drafts", () => {
    expect(templateMetadataEditDecision({ ...row, title: "New", status: "PUBLISHED" }, input, false)).toBe("PROJECT_TEMPLATE_STALE_VERSION");
    expect(templateMetadataEditDecision({ ...row, currentVersion: 2 }, input, true)).toBe("PROJECT_TEMPLATE_STALE_VERSION");
    expect(templateMetadataEditDecision({ ...row, status: "PUBLISHED" }, input, true)).toBe("PROJECT_TEMPLATE_INVALID_STATE");
    expect(templateMetadataEditDecision({ ...row, title: "New" }, input, true)).toBe("PROJECT_TEMPLATE_UNCHANGED");
    expect(templateMetadataEditDecision(row, input, true)).toBeNull();
  });
});
