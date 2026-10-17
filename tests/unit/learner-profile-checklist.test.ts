import { describe, expect, it } from "vitest";
import { emptyLearnerProfileDocument, learnerProfileDocumentSchema } from "@/modules/people/profile-validation";
import {
  learnerProfileChecklist,
  learnerProfileSectionSchema,
} from "@/modules/people/learner-profile-checklist";

describe("Learner profile completion checklist", () => {
  it("matches the original 16-section denominator with honest empty sections", () => {
    const result = learnerProfileChecklist(emptyLearnerProfileDocument);
    expect(result).toMatchObject({ completed: 0, total: 16, percentage: 0 });
    expect(result.items).toHaveLength(16);
    expect(result.items.find(item => item.section === "contacts")?.completed).toBe(false);
    expect(result.items.find(item => item.section === "identity")?.label).toContain("optional");
  });

  it("updates only from the persisted profile document; does not count identity as verified", () => {
    const document = learnerProfileDocumentSchema.parse({
      headline: "Aspiring engineer",
      contacts: { contactEmail: "student@example.test" },
      skills: [{ id: "11111111-1111-4111-8111-111111111111", name: "TypeScript" }],
    });
    const result = learnerProfileChecklist(document);
    expect(result).toMatchObject({ completed: 3, total: 16, percentage: 21 });
    expect(result.percentage).toBeGreaterThan(0);
    expect(result.items.filter(item => item.completed).map(item => item.section))
      .toEqual(["profile-introduction", "contacts", "skills"]);
  });

  it("whitelists only real scroll destinations", () => {
    expect(learnerProfileSectionSchema.parse("contacts")).toBe("contacts");
    expect(learnerProfileSectionSchema.safeParse("connect-accounts").success).toBe(false);
    expect(learnerProfileSectionSchema.safeParse("../other-membership").success).toBe(false);
    expect(learnerProfileSectionSchema.safeParse(["contacts"]).success).toBe(false);
  });
});
