import { describe, expect, it } from "vitest";
import { inboundMailListQuerySchema, inboundMailMetadataSchema, safeInboundPreview } from "@/modules/inbound-mail/message-model";
import {
  adminPeopleSearchState,
  adminUserDirectoryPaging,
  adminUsersHref,
  adminUsersQuerySchema,
  roleForPeopleTab,
} from "@/modules/people/admin-user-directory-model";
import {
  adminUnassignedUsersHref,
  adminUnassignedUsersQuerySchema,
  unassignedIdentityPage,
  unassignedIdentityScopeAllowed,
} from "@/modules/people/admin-unassigned-user-model";

const validId = "11111111-1111-4111-8111-111111111111";

describe("/admin second third: inbound mail and People directory behavioral boundaries", () => {
  it("CHAT6-ADMIN-INBOUND-01 validates inbox filters, refuses duplicate/privileged input and caps search", () => {
    expect(inboundMailListQuerySchema.parse({
      status: "TRIAGED", q: "  registration  ", recipient: "  TPO@Example.EDU ", page: "3",
    })).toEqual({ status: "TRIAGED", q: "registration", recipient: "tpo@example.edu", page: 3 });
    for (const input of [
      { status: "DELETED" }, { page: "0" }, { page: "10001" }, { page: "abc" },
      { page: ["1", "2"] }, { q: "x".repeat(121) }, { recipient: "not-an-email" },
      { collegeId: validId }, { status: "NEW", admin: true },
    ]) expect(inboundMailListQuerySchema.safeParse(input).success, JSON.stringify(input)).toBe(false);
  });

  it("CHAT6-ADMIN-INBOUND-02 sanitizes control characters and bounds preview without changing persisted content", () => {
    const raw = "Subject\r\nTo: hidden@example.edu\u0000   message";
    expect(safeInboundPreview(raw)).toBe("Subject To: hidden@example.edu message");
    expect(safeInboundPreview(raw, 9)).toBe("Subject T");
    expect(safeInboundPreview("irrelevant", -100)).toBe("");
    expect(safeInboundPreview("message", Number.NaN)).toBe("message");
    expect(raw).toContain("\r\n");
    expect(inboundMailMetadataSchema.safeParse({
      id: validId, receivedAt: "2026-10-19T01:00:00+05:30",
      fromAddress: "person@example.edu", subject: "Test", status: "NEW",
    }).success).toBe(true);
    expect(inboundMailMetadataSchema.safeParse({
      id: validId, receivedAt: "wrong", fromAddress: "invalid", subject: "Test", status: "NEW",
    }).success).toBe(false);
  });

  it("CHAT6-ADMIN-PEOPLE-01 honors faculty/learner tabs regardless of an incompatible role selector", () => {
    expect(roleForPeopleTab({ tab: "FACULTY", role: "TPO" })).toBe("FACULTY");
    expect(roleForPeopleTab({ tab: "STUDENT", role: "COLLEGE_ADMIN" })).toBe("LEARNER");
    expect(roleForPeopleTab({ tab: "ALL", role: "MENTOR" })).toBe("MENTOR");
    expect(adminPeopleSearchState({ tab: "FACULTY", role: "MENTOR" })).toEqual({
      hiddenTab: "FACULTY", showExplicitRoleFilter: false, effectiveRole: "FACULTY",
    });
    expect(adminPeopleSearchState({ tab: "ALL", role: "MENTOR" })).toEqual({
      hiddenTab: "ALL", showExplicitRoleFilter: true, effectiveRole: "MENTOR",
    });
  });

  it("CHAT6-ADMIN-PEOPLE-02 refuses forged page and role parameters before directory access", () => {
    for (const bad of [
      { page: 0 }, { page: -1 }, { page: 100001 }, { page: ["1", "2"] },
      { page: ["2"] }, { page: "1e2" }, { page: "0x10" }, { page: "1.0" }, { page: true },
      { tab: "SUPER_ADMIN" }, { role: "SUPER_ADMIN" }, { q: "a".repeat(101) },
      { status: "ACTIVE" }, { collegeId: validId },
    ]) expect(adminUsersQuerySchema.safeParse(bad).success, JSON.stringify(bad)).toBe(false);
    expect(adminUserDirectoryPaging(0, 1)).toMatchObject({ page: 1, totalPages: 1, offset: 0 });
    expect(adminUserDirectoryPaging(60, 99)).toMatchObject({ page: 2, totalPages: 2, offset: 30 });
  });

  it("CHAT6-ADMIN-PEOPLE-03 encodes arbitrary search terms and retains authorized filters in pagination", () => {
    const query = adminUsersQuerySchema.parse({ tab: "FACULTY", q: "a&role=SUPER_ADMIN", page: 2 });
    const url = new URL(adminUsersHref(query), "https://platform.example.edu");
    expect(url.pathname).toBe("/admin/people/directory");
    expect(url.searchParams.get("q")).toBe("a&role=SUPER_ADMIN");
    expect(url.searchParams.get("role")).toBeNull();
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("tab")).toBe("FACULTY");
  });

  it("CHAT6-ADMIN-UNASSIGNED-01 refuses any college or organization selection for global unassigned identities", () => {
    expect(unassignedIdentityScopeAllowed(null)).toBe(true);
    expect(unassignedIdentityScopeAllowed({ organizationId: null, collegeId: null })).toBe(true);
    expect(unassignedIdentityScopeAllowed({ organizationId: "org-a" })).toBe(false);
    expect(unassignedIdentityScopeAllowed({ collegeId: "college-a" })).toBe(false);
    expect(unassignedIdentityScopeAllowed({ organizationId: "org-a", collegeId: "college-b" })).toBe(false);
  });

  it("CHAT6-ADMIN-UNASSIGNED-02 bounds unassigned pages and never carries untrusted college scope in hrefs", () => {
    for (const bad of [
      { role: "LEARNER" }, { platformStatus: "SUSPENDED" },
      { q: "q".repeat(101) }, { page: 0 }, { page: 1001 },
      { page: ["1", "2"] }, { page: ["2"] }, { page: "1e2" }, { page: "0x10" },
      { page: "1.0" }, { page: true }, { collegeId: validId },
    ]) expect(adminUnassignedUsersQuerySchema.safeParse(bad).success, JSON.stringify(bad)).toBe(false);
    expect(unassignedIdentityPage(1, 50)).toMatchObject({ page: 1, totalPages: 1, offset: 0 });
    expect(unassignedIdentityPage(61, 3)).toMatchObject({ page: 3, totalPages: 3, offset: 60 });
    const url = new URL(adminUnassignedUsersHref({ role: "NONE", q: "a&collegeId=evil", page: 2 }), "https://example.edu");
    expect(url.pathname).toBe("/admin/people/unassigned");
    expect(url.searchParams.get("q")).toBe("a&collegeId=evil");
    expect(url.searchParams.get("collegeId")).toBeNull();
    expect(url.searchParams.get("role")).toBe("NONE");
  });
});
