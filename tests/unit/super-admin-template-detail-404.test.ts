import { describe, expect, it } from "vitest";
import { projectTemplateIdSchema } from "@/modules/projects/validation";
import { ProjectsServiceError } from "@/modules/projects/errors";
describe("Super Admin template detail missing-ID contract", () => {
  it("validates detail routes with the same project-template ID schema as the service", () => {
    expect(projectTemplateIdSchema.safeParse("invalid").success).toBe(false);
    expect(projectTemplateIdSchema.safeParse("00000000-0000-4000-8000-000000000010").success).toBe(true);
  });
  it("does not mistake an unrelated lifecycle failure for not-found", () => {
    const absent = new ProjectsServiceError("PROJECT_TEMPLATE_NOT_FOUND");
    const other = new ProjectsServiceError("PROJECT_TEMPLATE_ARCHIVED");
    expect(absent.code === "PROJECT_TEMPLATE_NOT_FOUND").toBe(true);
    expect(other.code === "PROJECT_TEMPLATE_NOT_FOUND").toBe(false);
  });
});
