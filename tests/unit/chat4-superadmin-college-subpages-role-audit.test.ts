import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  canManageCollegeDirectoryRow,
} from "@/modules/colleges/admin-directory-access-model";
import type { RequestContext } from "@/modules/identity/context";

const root = "src/app/(authenticated)/admin/colleges/[collegeId]/";
const read = (suffix: string) => readFileSync(join(process.cwd(), root, suffix), "utf8");
const collegeId = "11111111-1111-4111-8111-111111111111";
const otherId = "22222222-2222-4222-8222-222222222222";
const organizationId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const admin: RequestContext = {
  user: {
    id: "user", identityUid: "identity", platformStatus: "ACTIVE",
    systemRoles: ["SUPER_ADMIN"],
  },
  membership: null,
  adminScope: { collegeId, organizationId },
};

describe("Super Admin college and tenant subpage threat and state audit", () => {
  it("SA-COL-AUDIT-01 branding requires Super Admin scope and validates college before fetching stored URLs", () => {
    const branding = read("branding/page.tsx");
    const guard = branding.indexOf('requirePermission(context,"admin-scope.select")');
    const id = branding.indexOf("collegeIdSchema.safeParse(collegeId)");
    const readPreview = branding.indexOf("getSuperAdminCollegeBrandingPreview(context, collegeId)");
    expect(guard).toBeGreaterThan(-1);
    expect(id).toBeGreaterThan(guard);
    expect(readPreview).toBeGreaterThan(id);
    expect(branding).toContain("if (!branding) notFound()");
    expect(branding).toContain('can(context,"college.manage",{collegeId,organizationId:tenant.organizationId})');
    expect(branding).toContain("canEdit={canEdit}");
    expect(branding).toContain("initialVersion={persisted.version}");
    expect(branding).toContain("Actual login appearance and tenant-domain routing require separate browser verification.");
    expect(branding).toContain('className="border-t border-border pt-3 text-xs text-muted-foreground"');
    expect(branding).toContain('aria-label="Edit college branding" className="min-w-0 space-y-3 border-t border-border pt-4"');
    expect(canManageCollegeDirectoryRow(admin, {id:collegeId,organizationId})).toBe(true);
    expect(canManageCollegeDirectoryRow(admin, {id:otherId,organizationId})).toBe(false);
  });

  it("SA-COL-AUDIT-02 subdomain and sign-in management restrict operations to the selected college", () => {
    const subdomain = read("subdomain/page.tsx");
    const signin = read("signin/page.tsx");
    expect(subdomain.indexOf("getSuperAdminTenantLifecycleDetail(context,collegeId)"))
      .toBeLessThan(subdomain.indexOf('requirePermission(context,"college.manage"'));
    expect(subdomain).toContain('requirePermission(context,"college.manage",{organizationId:college.organizationId,collegeId:college.id})');
    expect(subdomain).toContain("listTenantDomainsWithRuntime(context,college.id)");
    expect(subdomain).toContain("getManagedCollegeSubdomain(context,college.id)");
    expect(subdomain).toContain("Only a verified address can become primary.");
    expect(subdomain).toContain("do not bypass host ownership checks.");
    expect(signin.indexOf('requirePermission(context,"admin-scope.select")'))
      .toBeLessThan(signin.indexOf("readAdminCollegeSignInPolicy(context,collegeId)"));
    expect(signin).toContain("collegeIdSchema.safeParse(collegeId)");
    expect(signin).toContain('policy.kind!=="MIGRATION_PENDING"&&policy.kind!=="INVALID_POLICY"');
    expect(signin).toContain("Existing sessions are not revoked.");
  });

  it("SA-COL-AUDIT-03 verification protects college ID before reading queue and does not fabricate availability", () => {
    const verification = read("verification/page.tsx");
    expect(verification.indexOf("requireSuperAdminVerificationCollege(context,collegeId)"))
      .toBeLessThan(verification.indexOf("listCollegeVerificationQueue(context,parsed.data,college.id)"));
    expect(verification).toContain("verificationQueueFilters.safeParse");
    expect(verification).toContain("Object.values(raw).some(Array.isArray)");
    expect(verification).toContain("Invalid verification filters.");
    expect(verification).toContain("Verification storage is not yet available.");
    expect(verification).toContain("The verification queue exceeds its safe scan cap.");
    expect(verification).toContain("eq(profileVerificationSettings.collegeId,college.id)");
    expect(verification).toContain("SuperAdminVerificationPanel");
  });

  it("SA-COL-AUDIT-04 admin device and history pages require a scoped service and preserve bounded, friendly states", () => {
    const devices = read("admins/[userId]/page.tsx");
    const history = read("admins/[userId]/history/page.tsx");
    expect(devices).toContain("listCollegeAdminSessions(await getCurrentRequestContext(),collegeId,userId)");
    expect(devices).toContain("up to 100 shown");
    expect(devices).toContain("No active sessions for this account.");
    expect(devices).toContain("AdminRevokeSessions");
    expect(devices).toContain('timeZone:"Asia/Kolkata"');
    const guard = history.indexOf('requirePermission(context,"admin-scope.select")');
    const parse = history.indexOf("parseAdminSessionHistoryPage(raw)");
    const list = history.indexOf("listCollegeAdminHistory(context,collegeId,userId,page)");
    expect(guard).toBeGreaterThan(-1);
    expect(parse).toBeGreaterThan(guard);
    expect(list).toBeGreaterThan(parse);
    expect(history).toContain("Cross-college and raw event metadata are excluded.");
    expect(history).toContain("Invalid history page");
    expect(history).toContain("No matching identity or platform history");
    expect(history).toContain("more available");
    expect(history).toContain("Previous 100");
    expect(history).toContain("Next 100");
  });

  it("SA-COL-AUDIT-05 tenant nested route loading and error boundaries show recovery, never stack traces", () => {
    const error = read("error.tsx");
    const loading = read("loading.tsx");
    expect(error).toContain('title="Tenant details could not be loaded"');
    expect(error).toContain("onClick={reset}");
    expect(error).not.toContain("error.stack");
    expect(loading).toContain("GracefulPageLoading");
    expect(loading).toContain("Loading tenant identity and lifecycle in the current safety scope");
  });
});
