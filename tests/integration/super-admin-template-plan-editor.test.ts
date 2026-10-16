import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  createProjectTemplate, getProjectTemplateDetail, reviseProjectTemplate,
} from "@/modules/projects/template-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });

const admin: RequestContext = {
  user: {
    id: SEED_IDS.superAdminUser,
    identityUid: "template-plan-integration",
    platformStatus: "ACTIVE",
    systemRoles: ["SUPER_ADMIN"],
  },
  membership: null,
  adminScope: null,
};

const initialBlueprint = {
  overview: { goal: "Student project", deliverables: ["Demo"] },
  releases: [{ key: "release-1", title: "MVP", sequence: 0 }],
  sprints: [{ key: "sprint-1", releaseKey: "release-1", title: "Plan", sequence: 0 }],
  tasks: [{
    key: "task-1", sprintKey: "sprint-1", title: "Design",
    priority: "MEDIUM" as const, sequence: 0,
  }],
  resources: [],
};

describe.skipIf(!enabled)("SA-placements-projects-83 / SA-placements-projects-84 versioned template editors (PG)", () => {
  afterAll(async () => { await closeDatabaseConnection(); });

  it("persists sprint goals/due labels and task estimates as a new immutable version", async () => {
    const created = await createProjectTemplate(admin, {
      slug: "template-plan-" + randomUUID(),
      title: "Editable project template",
      blueprint: initialBlueprint,
    });
    const newBlueprint = {
      ...initialBlueprint,
      sprints: [
        { ...initialBlueprint.sprints[0], title: "Foundation", dueLabel: "Week 2", goal: "Ship demo" },
        { key: "sprint-2", releaseKey: "release-1", title: "Test", sequence: 1 },
      ],
      tasks: [
        { ...initialBlueprint.tasks[0], estimatePoints: 13, priority: "HIGH" as const },
        { key: "task-2", sprintKey: "sprint-2", title: "QA", priority: "LOW" as const, sequence: 0 },
      ],
    };
    const revised = await reviseProjectTemplate(admin, created.template.id, {
      expectedVersion: 1,
      title: created.template.title,
      blueprint: newBlueprint,
      changeNote: "Updated template sprint/task plan",
    });
    expect(revised.template.currentVersion).toBe(2);
    const detail = await getProjectTemplateDetail(admin, created.template.id);
    expect(detail.currentVersion?.blueprint).toMatchObject({
      overview: initialBlueprint.overview,
      sprints: newBlueprint.sprints,
      tasks: newBlueprint.tasks,
      resources: [],
    });
    expect(detail.versions.find(row => row.version === 1)?.blueprint)
      .toEqual(created.version.blueprint);
    await expect(reviseProjectTemplate(admin, created.template.id, {
      expectedVersion: 1, title: "Stale", blueprint: initialBlueprint,
    })).rejects.toMatchObject({ code: "PROJECT_TEMPLATE_STALE_VERSION" });
    // The template service must enforce the centrally-scoped write permission.
    const scoped = {
      ...admin,
      adminScope: { collegeId: SEED_IDS.collegeA, organizationId: SEED_IDS.organization },
    };
    await expect(reviseProjectTemplate(scoped, created.template.id, {
      expectedVersion: 2, title: "Unauthorised", blueprint: newBlueprint,
    })).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("rejects invalid sprint pointers and out-of-range estimates before persistence", async () => {
    const created = await createProjectTemplate(admin, {
      slug: "template-plan-invalid-" + randomUUID(),
      title: "Template validation",
      blueprint: initialBlueprint,
    });
    await expect(reviseProjectTemplate(admin, created.template.id, {
      expectedVersion: 1,
      title: "Invalid",
      blueprint: {
        ...initialBlueprint,
        tasks: [{ ...initialBlueprint.tasks[0], sprintKey: "missing", estimatePoints: 14 }],
      },
    })).rejects.toThrow();
    const detail = await getProjectTemplateDetail(admin, created.template.id);
    expect(detail.template.currentVersion).toBe(1);
  });
});
