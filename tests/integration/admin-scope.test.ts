import {
  afterAll,
  describe,
  expect,
  it,
} from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import {
  listAdminScopeChoices,
  resolveAdminScopeSelection,
} from "@/modules/admin-scope/service";
import { listOrganizations } from "@/modules/organizations/service";
import { listColleges } from "@/modules/colleges/service";
import { AuthorizationError } from "@/modules/permissions/policy";
import { SEED_IDS } from "../../scripts/db-seed-data";

const superAdmin: RequestContext = {
  user: {
    id: SEED_IDS.superAdminUser,
    identityUid: "seed-superadmin",
    platformStatus: "ACTIVE",
    systemRoles: ["SUPER_ADMIN"],
  },
  membership: null,
};

const collegeAdmin: RequestContext = {
  user: {
    id: SEED_IDS.collegeAdminUser,
    identityUid: "seed-college-admin",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.collegeAdminMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["COLLEGE_ADMIN"],
  },
};

afterAll(async () => {
  await closeDatabaseConnection();
});

describe("Super Admin scope against PostgreSQL", () => {
  it("lists active scope choices only for SUPER_ADMIN", async () => {
    const choices = await listAdminScopeChoices(superAdmin);

    expect(choices.organizations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: SEED_IDS.organization,
          name: "Seed Organization",
        }),
      ]),
    );
    expect(choices.colleges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: SEED_IDS.collegeA,
          organizationId: SEED_IDS.organization,
        }),
        expect.objectContaining({
          id: SEED_IDS.collegeB,
          organizationId: SEED_IDS.organization,
        }),
      ]),
    );

    await expect(
      listAdminScopeChoices(collegeAdmin),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("resolves organization and college selections server-side", async () => {
    await expect(
      resolveAdminScopeSelection(superAdmin, {
        kind: "organization",
        organizationId: SEED_IDS.organization,
      }),
    ).resolves.toEqual({
      organizationId: SEED_IDS.organization,
      collegeId: null,
    });

    await expect(
      resolveAdminScopeSelection(superAdmin, {
        kind: "college",
        collegeId: SEED_IDS.collegeA,
      }),
    ).resolves.toEqual({
      organizationId: SEED_IDS.organization,
      collegeId: SEED_IDS.collegeA,
    });
  });

  it("constrains organization and college reads to the selected college", async () => {
    const scoped: RequestContext = {
      ...superAdmin,
      adminScope: {
        organizationId: SEED_IDS.organization,
        collegeId: SEED_IDS.collegeA,
      },
    };

    const organizations = await listOrganizations(scoped);
    const colleges = await listColleges(scoped);

    expect(organizations).toEqual([
      expect.objectContaining({
        id: SEED_IDS.organization,
      }),
    ]);
    expect(colleges).toEqual([
      expect.objectContaining({
        id: SEED_IDS.collegeA,
        organizationId: SEED_IDS.organization,
      }),
    ]);
  });

  it("keeps organization scope broad only inside that organization", async () => {
    const scoped: RequestContext = {
      ...superAdmin,
      adminScope: {
        organizationId: SEED_IDS.organization,
        collegeId: null,
      },
    };

    const colleges = await listColleges(scoped);

    expect(colleges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: SEED_IDS.collegeA }),
        expect.objectContaining({ id: SEED_IDS.collegeB }),
      ]),
    );
  });
});
