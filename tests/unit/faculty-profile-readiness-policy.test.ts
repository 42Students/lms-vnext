import { describe, expect, it } from "vitest";
import { facultyProfileDocumentSchema } from "@/modules/people/faculty-profile-document";
describe("Faculty staged profile gate", () => {
 it("has a safe default document with no private identity values", () => {
  const data=facultyProfileDocumentSchema.parse({});
  expect(data.about.description).toBe("");
  expect(data.identitySummary.aadhaarDocumentId).toBeNull();
 });
});
