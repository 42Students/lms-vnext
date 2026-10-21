import {
  filterLearnerVisible,
  isLearnerVisible,
  learnerAvailability,
  learnerChildAvailability,
} from "@/utils/courseUtils/contentAvailability";

describe("learner content availability", () => {
  test("legacy records with missing visibility flags remain available", () => {
    expect(learnerAvailability({ id: 1 })).toEqual({
      visible: true,
      actionable: true,
      reason: null,
    });
  });

  test("explicit hidden or unpublished records are never learner-visible", () => {
    [
      { active: false },
      { enabled: false },
      { published: false },
      { is_published: false },
      { status: "DRAFT" },
      { status: "UNPUBLISHED" },
      { status: "HIDDEN" },
    ].forEach((record) => {
      expect(isLearnerVisible(record)).toBe(false);
      expect(learnerAvailability(record).actionable).toBe(false);
    });
  });

  test("locked records stay visible but cannot be opened and retain the reason", () => {
    expect(learnerAvailability({
      locked: true,
      prerequisiteReason: "Complete Lesson 1 first.",
    })).toEqual({
      visible: true,
      actionable: false,
      reason: "Complete Lesson 1 first.",
    });
  });

  test("parent lesson restrictions also gate otherwise-open child content", () => {
    const child = { id: 9, active: true, enabled: true };

    expect(learnerChildAvailability({ enabled: false }, child).visible).toBe(false);
    expect(learnerChildAvailability({
      locked: true,
      lockedReason: "Finish the prerequisite lesson.",
    }, child)).toEqual({
      visible: true,
      actionable: false,
      reason: "Finish the prerequisite lesson.",
    });
  });

  test("filterLearnerVisible removes only explicitly non-public records", () => {
    const items = [
      { id: 1 },
      { id: 2, active: false },
      { id: 3, status: "DRAFT" },
      { id: 4, locked: true },
    ];

    expect(filterLearnerVisible(items).map((item) => item.id)).toEqual([1, 4]);
  });
});
