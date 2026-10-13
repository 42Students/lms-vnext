import { describe, expect, it } from "vitest";

import {
  describeTpoCompanyVisibility,
  type TpoCompanyVisibilityInput,
} from "@/modules/placements/tpo-company-visibility-model";

const sourceDefaults: TpoCompanyVisibilityInput = {
  showCgpaExact: false,
  showTenthTwelfth: true,
  showProjectLinks: true,
  showAssessmentScores: false,
  showAttendance: false,
  updatedAt: null,
};

describe("TPO What Companies See presentation", () => {
  it("projects all five persisted sharing flags", () => {
    const result =
      describeTpoCompanyVisibility(sourceDefaults);

    expect(
      result.fields.map((field) => field.key),
    ).toEqual([
      "showCgpaExact",
      "showTenthTwelfth",
      "showProjectLinks",
      "showAssessmentScores",
      "showAttendance",
    ]);

    expect(result.fields).toHaveLength(5);
  });

  it("labels row-absent values as source defaults", () => {
    const result =
      describeTpoCompanyVisibility(sourceDefaults);

    expect(result.source).toBe(
      "SOURCE_DEFAULT",
    );

    expect(
      result.fields.every(
        (field) => field.source === "SOURCE_DEFAULT",
      ),
    ).toBe(true);

    expect(result.enabledCount).toBe(2);
    expect(result.disabledCount).toBe(3);
  });

  it("labels persisted values even when equal to defaults", () => {
    const result =
      describeTpoCompanyVisibility({
        ...sourceDefaults,
        updatedAt: new Date(
          "2026-10-14T00:00:00.000Z",
        ),
      });

    expect(result.source).toBe(
      "PERSISTED",
    );

    expect(
      result.fields.every(
        (field) => field.source === "PERSISTED",
      ),
    ).toBe(true);

    expect(result.enabledCount).toBe(2);
  });

  it("preserves persisted false settings", () => {
    const result =
      describeTpoCompanyVisibility({
        ...sourceDefaults,
        showTenthTwelfth: false,
        showProjectLinks: false,
        updatedAt: new Date(
          "2026-10-14T00:00:00.000Z",
        ),
      });

    expect(result.enabledCount).toBe(0);
    expect(result.disabledCount).toBe(5);

    const board = result.fields.find(
      (field) => field.key === "showTenthTwelfth",
    );

    expect(board).toMatchObject({
      enabled: false,
      source: "PERSISTED",
    });

    expect(board?.explanation).toContain(
      "does not permit disclosure",
    );
  });

  it("explains enabled and disabled states differently", () => {
    const result =
      describeTpoCompanyVisibility({
        ...sourceDefaults,
        showCgpaExact: true,
      });

    const cgpa = result.fields.find(
      (field) => field.key === "showCgpaExact",
    );

    const attendance = result.fields.find(
      (field) => field.key === "showAttendance",
    );

    expect(cgpa?.enabled).toBe(true);
    expect(cgpa?.explanation).toContain(
      "permits a recruiter-facing view",
    );

    expect(attendance?.enabled).toBe(false);
    expect(attendance?.explanation).toContain(
      "does not permit disclosure",
    );
  });

  it("does not mutate the policy snapshot", () => {
    const input = {
      ...sourceDefaults,
    };

    const original = {
      ...input,
    };

    describeTpoCompanyVisibility(input);

    expect(input).toEqual(original);
  });

  it("handles every sharing flag being enabled", () => {
    const result =
      describeTpoCompanyVisibility({
        ...sourceDefaults,
        showCgpaExact: true,
        showTenthTwelfth: true,
        showProjectLinks: true,
        showAssessmentScores: true,
        showAttendance: true,
      });

    expect(result.enabledCount).toBe(5);
    expect(result.disabledCount).toBe(0);

    expect(
      result.fields.every((field) => field.enabled),
    ).toBe(true);
  });
});
