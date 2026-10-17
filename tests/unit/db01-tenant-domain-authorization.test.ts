import { describe, expect, it, vi } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  createTenantDomain,
  deleteTenantDomain,
  listTenantDomains,
  setPrimaryTenantDomain,
  verifyTenantDomain,
  type TenantDomainRepository,
  type TenantDomainView,
} from "@/modules/tenant-domains/service";

const COLLEGE_A = "11111111-1111-4111-8111-111111111111";
const COLLEGE_B = "22222222-2222-4222-8222-222222222222";
const ORGANIZATION_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ORGANIZATION_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const DOMAIN_A = "33333333-3333-4333-8333-333333333333";
const DOMAIN_B = "44444444-4444-4444-8444-444444444444";

function actor(overrides: {
  platformStatus?: "ACTIVE" | "DISABLED";
  status?: "ACTIVE" | "SUSPENDED" | "ENDED";
  roles?: NonNullable<RequestContext["membership"]>["roles"];
  collegeId?: string;
  organizationId?: string;
  systemRoles?: RequestContext["user"]["systemRoles"];
  adminScope?: RequestContext["adminScope"];
  noMembership?: boolean;
} = {}): RequestContext {
  return {
    user: {
      id: "actor",
      identityUid: "provider-actor",
      platformStatus: overrides.platformStatus ?? "ACTIVE",
      systemRoles: overrides.systemRoles ?? [],
    },
    membership: overrides.noMembership ? null : {
      id: "membership",
      collegeId: overrides.collegeId ?? COLLEGE_A,
      organizationId: overrides.organizationId ?? ORGANIZATION_A,
      status: overrides.status ?? "ACTIVE",
      roles: overrides.roles ?? ["COLLEGE_ADMIN"],
    },
    adminScope: overrides.adminScope,
  };
}

function store() {
  function domain(
    id: string,
    collegeId: string,
    organizationId: string,
  ): TenantDomainView {
    const now = new Date("2026-10-11T00:00:00.000Z");
    return {
      id,
      collegeId,
      organizationId,
      host: collegeId === COLLEGE_A ? "a.example.test" : "b.example.test",
      isPrimary: false,
      isVerified: true,
      verificationToken: null,
      verifiedAt: now,
      lastCheckedAt: now,
      lastCheckResult: "VERIFIED",
      createdAt: now,
      updatedAt: now,
    };
  }
  const a = domain(DOMAIN_A, COLLEGE_A, ORGANIZATION_A);
  const b = domain(DOMAIN_B, COLLEGE_B, ORGANIZATION_B);
  const create = vi.fn(async () => a);
  const verify = vi.fn(async () => a);
  const primary = vi.fn(async () => a);
  const remove = vi.fn(async () => undefined);
  const list = vi.fn(async (collegeId: string) =>
    collegeId === COLLEGE_A ? [a] : [b],
  );
  const repository: TenantDomainRepository = {
    async loadActiveCollege(collegeId) {
      if (collegeId === COLLEGE_A) {
        return { id: COLLEGE_A, organizationId: ORGANIZATION_A };
      }
      if (collegeId === COLLEGE_B) {
        return { id: COLLEGE_B, organizationId: ORGANIZATION_B };
      }
      return null;
    },
    listByCollege: list,
    async loadDomain(id) {
      return id === DOMAIN_A ? a : id === DOMAIN_B ? b : null;
    },
    async findByHost() {
      return null;
    },
    createDomain: create,
    recordVerificationResult: verify,
    setPrimary: primary,
    deleteDomain: remove,
    async resolveVerifiedHost() {
      return null;
    },
  };
  return { repository, create, verify, primary, remove, list };
}

describe("DB01 tenant-domain authorization and identity-state regression", () => {
  it("prevents suspended college admins from registering new domains", async () => {
    const s = store();
    await expect(
      createTenantDomain(actor({ status: "SUSPENDED" }),
        { collegeId: COLLEGE_A, host: "new.example.test" }, s.repository),
    ).rejects.toBeInstanceOf(AuthorizationError);
    expect(s.create).not.toHaveBeenCalled();
  });

  it("prevents ended memberships from verifying domain ownership", async () => {
    const s = store();
    const verifyDns = vi.fn(async () => ({ verified: true as const, result: "VERIFIED" as const }));
    await expect(
      verifyTenantDomain(actor({ status: "ENDED" }), DOMAIN_A, s.repository,
        { verify: verifyDns }),
    ).rejects.toBeInstanceOf(AuthorizationError);
    expect(verifyDns).not.toHaveBeenCalled();
    expect(s.verify).not.toHaveBeenCalled();
  });

  it("prevents disabled users from deleting persisted tenant domains", async () => {
    const s = store();
    await expect(
      deleteTenantDomain(actor({ platformStatus: "DISABLED" }),
        DOMAIN_A, s.repository),
    ).rejects.toBeInstanceOf(AuthorizationError);
    expect(s.remove).not.toHaveBeenCalled();
  });

  it("does not treat FACULTY as a superadmin with tenant-domain delete power", async () => {
    const s = store();
    await expect(
      deleteTenantDomain(actor({ roles: ["FACULTY"] }),
        DOMAIN_A, s.repository),
    ).rejects.toBeInstanceOf(AuthorizationError);
    expect(s.remove).not.toHaveBeenCalled();
  });

  it("does not let a TPO select a tenant primary domain", async () => {
    const s = store();
    await expect(
      setPrimaryTenantDomain(actor({ roles: ["TPO"] }),
        DOMAIN_A, s.repository),
    ).rejects.toBeInstanceOf(AuthorizationError);
    expect(s.primary).not.toHaveBeenCalled();
  });

  it("prevents a college admin from verifying another college domain", async () => {
    const s = store();
    const verifyDns = vi.fn(async () => ({ verified: true as const, result: "VERIFIED" as const }));
    await expect(
      verifyTenantDomain(actor(), DOMAIN_B, s.repository, { verify: verifyDns }),
    ).rejects.toBeInstanceOf(AuthorizationError);
    expect(verifyDns).not.toHaveBeenCalled();
  });

  it("prevents a college admin from deleting another college domain", async () => {
    const s = store();
    await expect(
      deleteTenantDomain(actor(), DOMAIN_B, s.repository),
    ).rejects.toBeInstanceOf(AuthorizationError);
    expect(s.remove).not.toHaveBeenCalled();
  });

  it("restricts an organization-scoped superadmin to that organization", async () => {
    const s = store();
    await expect(
      deleteTenantDomain(actor({
        noMembership: true,
        systemRoles: ["SUPER_ADMIN"],
        adminScope: { organizationId: ORGANIZATION_A, collegeId: null },
      }), DOMAIN_B, s.repository),
    ).rejects.toBeInstanceOf(AuthorizationError);
    expect(s.remove).not.toHaveBeenCalled();
  });

  it("restricts a college-scoped superadmin to the selected college", async () => {
    const s = store();
    await expect(
      deleteTenantDomain(actor({
        noMembership: true,
        systemRoles: ["SUPER_ADMIN"],
        adminScope: { organizationId: ORGANIZATION_A, collegeId: COLLEGE_A },
      }), DOMAIN_B, s.repository),
    ).rejects.toBeInstanceOf(AuthorizationError);
    expect(s.remove).not.toHaveBeenCalled();
  });

  it("allows an unscoped active superadmin to delete another college domain", async () => {
    const s = store();
    await deleteTenantDomain(actor({
      noMembership: true, systemRoles: ["SUPER_ADMIN"],
    }), DOMAIN_B, s.repository);
    expect(s.remove).toHaveBeenCalledTimes(1);
    expect(s.remove).toHaveBeenCalledWith(DOMAIN_B, undefined);
  });

  it("allows an active authorized superadmin to select a verified primary in their own college", async () => {
    const s = store();
    await setPrimaryTenantDomain(actor({ noMembership: true, systemRoles: ["SUPER_ADMIN"] }), DOMAIN_A, s.repository);
    expect(s.primary).toHaveBeenCalledTimes(1);
    expect(s.primary).toHaveBeenCalledWith(DOMAIN_A);
  });

  it("prevents an ended membership from listing active tenant domains", async () => {
    const s = store();
    await expect(listTenantDomains(actor({ status: "ENDED" }), COLLEGE_A,
      s.repository)).rejects.toBeInstanceOf(AuthorizationError);
    expect(s.list).not.toHaveBeenCalled();
  });

  it("prevents a disabled superadmin from bypassing all tenant protections", async () => {
    const s = store();
    await expect(deleteTenantDomain(actor({
      platformStatus: "DISABLED", noMembership: true,
      systemRoles: ["SUPER_ADMIN"],
    }), DOMAIN_B, s.repository)).rejects.toBeInstanceOf(AuthorizationError);
    expect(s.remove).not.toHaveBeenCalled();
  });

  it("does not allow a logged-in user without a membership to manage a tenant", async () => {
    const s = store();
    await expect(deleteTenantDomain(actor({ noMembership: true }),
      DOMAIN_A, s.repository)).rejects.toBeInstanceOf(AuthorizationError);
    expect(s.remove).not.toHaveBeenCalled();
  });
});
