import {
  afterAll,
  describe,
  expect,
  it,
} from "vitest";
import {
  closeDatabaseConnection,
} from "@/db/client";
import {
  executeAiTool,
} from "@/ai/tools/registry";
import type {
  RequestContext,
} from "@/modules/identity/context";
import { SEED_IDS } from "../../scripts/db-seed-data";

const tpo: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser,
    identityUid: "seed-shared-faculty",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.facultyCollegeAMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["FACULTY", "TPO"],
  },
};

const otherCollegeTpo: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser,
    identityUid: "seed-shared-faculty",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.facultyCollegeBMembership,
    collegeId: SEED_IDS.collegeB,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["FACULTY", "TPO"],
  },
};

const learner: RequestContext = {
  user: {
    id: SEED_IDS.learnerUser,
    identityUid: "seed-learner",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.learnerCollegeAMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["LEARNER"],
  },
};

afterAll(async () => {
  await closeDatabaseConnection();
});

describe("AI tool authorization", () => {
  it("executes an authorized placement tool through the canonical domain service", async () => {
    const result =
      (await executeAiTool(
        tpo,
        "placements.get_operations",
        {
          collegeId:
            SEED_IDS.collegeA,
        },
      )) as {
        summary: {
          totalJobs: number;
        };
      };

    expect(
      result.summary.totalJobs,
    ).toBeGreaterThanOrEqual(0);
  });

  it("does not let an AI tool cross the active membership college", async () => {
    await expect(
      executeAiTool(
        otherCollegeTpo,
        "placements.get_operations",
        {
          collegeId:
            SEED_IDS.collegeA,
        },
      ),
    ).rejects.toThrow(
      "Missing permission: placements.manage",
    );
  });

  it("does not upgrade a learner into a placement manager through tool execution", async () => {
    await expect(
      executeAiTool(
        learner,
        "placements.get_operations",
        {
          collegeId:
            SEED_IDS.collegeA,
        },
      ),
    ).rejects.toThrow(
      "Missing permission: placements.manage",
    );
  });
});
