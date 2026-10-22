import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { facultyLegacyProfileExceptions, facultyContactEditSchema } from "@/modules/people/faculty-profile-document";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("Lane 13 verification: faculty lifecycle and private staff profile", () => {
  it("requires the same persisted admin permission and optimistic concurrency on both staff edit aliases", () => {
    const legacy = source("src/app/api/people/[membershipId]/faculty-profile/route.ts");
    const dedicated = source("src/app/api/people/faculty-document/[membershipId]/route.ts");
    const service = source("src/modules/people/faculty-admin-document-service.ts");
    for (const route of [legacy, dedicated]) {
      expect(route).toContain("patchFacultyDocumentForAdmin(");
      expect(route).toContain("getFacultyDocumentForAdmin(");
      expect(route).toContain("isSameOriginRequest(request)");
    }
    expect(service).toContain("assertPersistedPlatformPermission(tx,context,\"people.manage\",scope)");
    expect(service).toContain("profile_document_version=${version}");
    expect(service).toContain('roles.includes("COLLEGE_ADMIN")||roles.includes("TPO")');
    expect(legacy).not.toContain("tx.update(facultyProfiles)");
    expect(legacy).toContain('aadhaarDocumentId:null,panDocumentId:null');
    expect(legacy).toContain('profileImageDocumentId:null');
  });

  it("preserves Super Admin protected-staff edit authority but makes college staff read-only", () => {
    const route = source("src/app/api/people/[membershipId]/faculty-profile/route.ts");
    expect(route).toContain('roles.includes("FACULTY")&&(!protectedRole||isSuperAdmin(context))');
    expect(route).toContain('protectedRole&&!isSuperAdmin(context)');
  });

  it("revokes existing device sessions and returns a legacy-readable active project conflict", () => {
    const service = source("src/modules/people/college-faculty-lifecycle-service.ts");
    const route = source("src/app/api/college/faculty/[membershipId]/lifecycle/route.ts");
    const ui = source("src/components/college/college-faculty-lifecycle-action.tsx");
    expect(service).toContain("tx.update(identityDeviceSessions)");
    expect(service).toContain("isNull(identityDeviceSessions.revokedAt)");
    expect(service).toContain("activeMentorProjectCount(tx,membershipId)");
    const mentorGuard = source("src/modules/people/active-mentor-project-guard.ts");
    expect(mentorGuard).toContain('or(eq(projectMembers.role,"MENTOR"),eq(projectMembers.roleKind,"MENTOR"))');
    expect(mentorGuard).toContain("isNull(projectMembers.deletedAt)");
    expect(mentorGuard).toContain("eq(projectMembers.deletedByWorkspace,false)");
    expect(mentorGuard).toContain('ne(projectInstances.status,"ARCHIVED")');
    expect(route).toContain("activeProjectCount: error.activeMentorProjects");
    expect(route).toContain("message: error.message");
    expect(ui).toContain("revokes current device sessions");
    expect(ui).toContain("Reassign those projects to another mentor first.");
  });

  it("rejects unsafe self-reported contact combinations and reports over-limit legacy rows without truncation", () => {
    const valid = {
      contactMobile: "9876543210", contactPhone: "91234567890",
      contactMail: "faculty@example.com",
    };
    const schema = facultyContactEditSchema;
    expect(schema.safeParse(valid).success).toBe(true);
    expect(schema.safeParse({...valid, contactPhone: valid.contactMobile}).success).toBe(false);
    expect(schema.safeParse({...valid, contactMobile: "1234"}).success).toBe(false);
    expect(schema.safeParse({...valid, contactMail: "invalid"}).success).toBe(false);
    expect(facultyLegacyProfileExceptions({education:Array.from({length:31},()=>({}))}))
      .toContain("education: 31 rows require no-truncation migration review");
  });
});
