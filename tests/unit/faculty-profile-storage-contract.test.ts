import { describe, expect, it } from "vitest";
import { facultyProfileDocumentSchema } from "@/modules/people/faculty-profile-document";
describe("Faculty private document storage contract", () => {
 it("rejects raw identity and login fields", () => {
  expect(facultyProfileDocumentSchema.safeParse({aadhaarNumber:"123456789012"}).success).toBe(false);
  expect(facultyProfileDocumentSchema.safeParse({loginEmail:"external@example.com"}).success).toBe(false);
 });
});
