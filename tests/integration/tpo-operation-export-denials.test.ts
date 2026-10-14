import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import {
  getTpoCompanyContactLog,
} from "@/modules/placements/tpo-company-contact-log-service";
import {
  getTpoRoundDriveDay,
} from "@/modules/placements/tpo-round-drive-day-service";
import { requirePlacementManageScope } from "@/modules/placements/scope";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("TPO activity export tests require disposable TEST_DATABASE_URL");
}

const tpo: RequestContext = {
  user: {
    id: SEED_IDS.collegeAdminUser,
    identityUid: "seed-tpo",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.collegeAdminMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["TPO"],
  },
};

afterAll(async () => {
  await closeDatabaseConnection();
});

describe("TPO attendance and company activity PostgreSQL denials", () => {
  it("rejects non-TPO readers before exposing any company/round rows", async () => {
    const other: RequestContext = {
      ...tpo,
      membership: {
        ...tpo.membership!,
        roles: ["COLLEGE_ADMIN"],
      },
    };
    await expect(
      getTpoCompanyContactLog(other, { companyId: randomUUID() }),
    ).rejects.toBeDefined();
    await expect(
      getTpoRoundDriveDay(other, randomUUID()),
    ).rejects.toBeDefined();
  });

  it("does not reveal unknown or foreign company identifiers", async () => {
    const value = await getTpoCompanyContactLog(tpo, {
      companyId: randomUUID(),
    });
    expect(value).toBeNull();
  });

  it("enforces central persisted college scope on foreign requests", async () => {
    const otherCollege: RequestContext = {
      ...tpo,
      membership: {
        ...tpo.membership!,
        collegeId: SEED_IDS.collegeB,
      },
    };
    await expect(
      requirePlacementManageScope(otherCollege, SEED_IDS.collegeA),
    ).rejects.toBeDefined();
  });

  it("hides unknown round identifiers", async () => {
    await expect(
      getTpoRoundDriveDay(tpo, randomUUID()),
    ).rejects.toMatchObject({ code: "PLACEMENT_ROUND_NOT_FOUND" });
  });
});
