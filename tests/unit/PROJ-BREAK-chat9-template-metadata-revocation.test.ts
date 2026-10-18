import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  templateMetadataEditDecision,
  templateMetadataEditSchema,
} from "@/modules/projects/template-metadata-edit-model";

describe("IIT Dharwad Projects: template admin stale-session and CAS hardening", () => {
  const proposed = () => templateMetadataEditSchema.parse({
    title: "Project template revised",
    summary: "Revised objectives",
    changeNote: "Safer requirements",
    expectedCurrentVersion: 2,
    expectedUpdatedAt: "2099-01-01T00:00:00.000Z",
  });
  it("PROJ-BREAK-idor-14 rechecks persisted platform authority after the template lock, before any write", () => {
    const source = readFileSync(join(process.cwd(), "src/modules/projects/template-metadata-edit-service.ts"), "utf8");
    const lock = source.indexOf('.for("update")');
    const persisted = source.indexOf('await assertPersistedPlatformPermission(tx, context, "project-template.manage")');
    const decision = source.indexOf("templateMetadataEditDecision(locked.template");
    const write = source.indexOf("tx.update(projectTemplates)");
    expect(source).toContain('requirePermission(context, "project-template.manage")');
    expect(source).toContain("return getDb().transaction(async tx =>");
    expect(source).toContain('import { assertPersistedPlatformPermission } from "@/modules/permissions/persisted-actor"');
    expect(lock).toBeGreaterThan(0);
    expect(persisted).toBeGreaterThan(lock);
    expect(persisted).toBeLessThan(decision);
    expect(decision).toBeLessThan(write);
  });
  it("PROJ-BREAK-races-08 does not permit archived, published, stale, or unchanged metadata edits", () => {
    const input = proposed();
    expect(templateMetadataEditDecision({ currentVersion: 2, status: "DRAFT", title: "Old", summary: null }, input, true)).toBeNull();
    for (const status of ["ARCHIVED", "PUBLISHED", "INVALID"]) {
      expect(templateMetadataEditDecision({ currentVersion: 2, status, title: "Old", summary: null }, input, true))
        .toBe("PROJECT_TEMPLATE_INVALID_STATE");
    }
    for (const currentVersion of [1, 3]) {
      expect(templateMetadataEditDecision({ currentVersion, status: "DRAFT", title: "Old", summary: null }, input, true))
        .toBe("PROJECT_TEMPLATE_STALE_VERSION");
    }
    expect(templateMetadataEditDecision({ currentVersion: 2, status: "DRAFT", title: "Old", summary: null }, input, false))
      .toBe("PROJECT_TEMPLATE_STALE_VERSION");
    expect(templateMetadataEditDecision({ currentVersion: 2, status: "DRAFT", title: input.title, summary: input.summary }, input, true))
      .toBe("PROJECT_TEMPLATE_UNCHANGED");
  });
  it("PROJ-BREAK-races-09 validates the edit payload before entering the template write transaction", () => {
    const good = proposed();
    expect(good.summary).toBe("Revised objectives");
    const base = {
      title: good.title, summary: good.summary, changeNote: good.changeNote,
      expectedCurrentVersion: good.expectedCurrentVersion, expectedUpdatedAt: good.expectedUpdatedAt,
    };
    expect(templateMetadataEditSchema.safeParse({ ...base, title: " " }).success).toBe(false);
    expect(templateMetadataEditSchema.safeParse({ ...base, expectedCurrentVersion: -1 }).success).toBe(false);
    expect(templateMetadataEditSchema.safeParse({ ...base, expectedUpdatedAt: "not-a-timestamp" }).success).toBe(false);
    expect(templateMetadataEditSchema.safeParse({ ...base, unexpected: "malicious" }).success).toBe(false);
  });
});
