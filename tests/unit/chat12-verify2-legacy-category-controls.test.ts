import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("chat-12 verification round 2: legacy filter and accessible controls", () => {
  it("matches legacy category entities before LIMIT without broad module false positives", () => {
    const file = source("src/modules/activity/service.ts");
    const category = file.slice(file.indexOf("function legacyCategoryCondition"), file.indexOf("export async function listActivityEvents"));
    expect(category).toContain("('department','program','semester','batch','class','course','lesson','lecture_hall','academic_year')");
    expect(category).toContain("('faculty','learner','learner_profile','user','college_membership')");
    expect(category).toContain("('class_schedule','announcement','quiz','lesson_content')");
    expect(category).toContain("('project','project_task','project_template','project_instance','project_task_comment')");
    expect(category).toContain('inArray(activityEvents.importance,["HIGH","CRITICAL"])');
    expect(category).not.toContain('inArray(activityEvents.module,["ACADEMICS","COURSES"])');
    expect(category).not.toContain('eq(activityEvents.module,"IDENTITY")');
    expect(category).not.toContain('eq(activityEvents.module,"COURSES")');
    expect(category).not.toContain('eq(activityEvents.module,"PROJECTS")');
    expect(file.indexOf("legacyCategoryCondition(input.legacyCategory)")).toBeLessThan(file.indexOf(".limit(input.limit + 1)"));
  });

  it("preserves the college-scoped hierarchy with the legacy unselected-college warning", () => {
    const page = source("src/app/(authenticated)/admin/module-access/page.tsx");
    expect(page).toContain('if (!collegeId)');
    expect(page).toContain(">Select a college to continue</strong>");
    expect(page).toContain("without mixing tenants.");
    expect(page).toContain('role="status"');
    expect(page).toContain("<SuperAdminCollegeModuleAccessPage");
  });

  it("keeps TPO photos signed and upload-confirmed, with touch targets at least 44px", () => {
    const avatar = source("src/components/tpo/tpo-profile-avatar.tsx");
    const service = source("src/modules/placements/tpo-avatar-service.ts");
    expect(avatar).toContain('className="absolute -bottom-1 -right-1 flex h-11 w-11');
    expect(avatar).toContain('className="inline-flex min-h-11 items-center text-left md:min-h-9');
    expect(avatar).toContain("const limit=5*1024*1024");
    expect(service).toContain("max(5*1024*1024)");
    expect(avatar).toContain("Confirm photo after scan");
    expect(service).toContain("readPrivateObjectAttestation(");
    expect(service).toContain("profileDocumentVersion");
    expect(service).toContain("facultyAvatarCleanupQueue");
  });
});
