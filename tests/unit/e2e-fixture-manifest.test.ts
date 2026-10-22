import { describe, expect, it } from "vitest";
import {
  E2E_FIXTURE_INSERT_ORDER,
  E2E_LEGACY_FIXTURE_KEYS,
  buildE2EFixtureManifest,
  buildE2EFixtureSeedLedger,
  deterministicE2EFixtureId,
  e2eFixtureActivationReady,
  reconcileE2EFixtureManifest,
} from "@/modules/people/e2e-fixture-manifest";

describe("isolated cross-module E2E fixture contract", () => {
  const manifest = buildE2EFixtureManifest("qa_lane13_isolated");

  it("materializes one stable UUID per legacy fixture type and a typed phone map", () => {
    const again = buildE2EFixtureManifest("qa_lane13_isolated");
    expect(manifest).toEqual(again);
    expect(manifest.nodes).toHaveLength(E2E_LEGACY_FIXTURE_KEYS.length);
    expect(Object.keys(manifest.ids)).toHaveLength(E2E_LEGACY_FIXTURE_KEYS.length);
    expect(new Set(manifest.nodes.map(node => node.id)).size).toBe(manifest.nodes.length);
    for (const node of manifest.nodes) {
      expect(node.id).toBe(deterministicE2EFixtureId(manifest.namespace, node.key));
      expect(node.id).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-8[a-f0-9]{3}-[a-f0-9]{12}$/);
    }
    expect(Object.keys(manifest.testPhones).sort()).toEqual(
      ["adminA", "facultyA", "facultyB", "learnerA", "learnerB"],
    );
  });

  it("keeps different fixture namespaces isolated and rejects unsafe namespace inputs", () => {
    const other = buildE2EFixtureManifest("qa_lane13_other");
    expect(other.ids.collegeA).not.toBe(manifest.ids.collegeA);
    expect(other.ids.jobApplicationA).not.toBe(manifest.ids.jobApplicationA);
    expect(() => buildE2EFixtureManifest("../production")).toThrow();
    expect(() => buildE2EFixtureManifest("x")).toThrow();
  });

  it("orders every manifest dependency before the dependent row", () => {
    const encountered = new Set<string>();
    for (const node of manifest.nodes) {
      for (const requirement of node.requires) {
        expect(encountered.has(requirement)).toBe(true);
      }
      encountered.add(node.key);
    }
    for (const table of ["users", "organizations", "colleges", "college_memberships",
      "course_lessons", "lesson_video_assets", "attendance_records",
      "placement_applications", "project_instances"]) {
      expect(E2E_FIXTURE_INSERT_ORDER).toContain(table);
    }
  });

  it("reuses only matching IDs, not an unrelated tenant's row", () => {
    const stored = new Map([["collegeA" as const, manifest.ids.collegeA]]);
    const resolution = reconcileE2EFixtureManifest(manifest, stored);
    expect(resolution.reused).toBe(1);
    expect(resolution.missing).toBe(manifest.nodes.length - 1);
    expect(() => reconcileE2EFixtureManifest(
      manifest, new Map([["collegeA" as const, buildE2EFixtureManifest("qa_lane13_other").ids.collegeA]]),
    )).toThrow("collides");
  });

  it("never reports planned but unpersisted private media as ready", () => {
    const persisted = new Set(manifest.nodes
      .filter(node => !node.externalBinaryRequired)
      .map(node => node.key));
    const ledger = buildE2EFixtureSeedLedger(manifest, persisted);
    expect(ledger.status).toBe("PARTIAL");
    expect(ledger.persistedIds.videoA).toBeUndefined();
    expect(ledger.persistedIds.studentImageA).toBeUndefined();
    expect(ledger.missing.map(item => item.key)).toEqual(["videoA", "studentImageA"]);
    expect(ledger.missing.every(item => item.reason === "PRIVATE_SCANNED_UPLOAD_REQUIRED")).toBe(true);
    expect(e2eFixtureActivationReady({
      developmentMode: true, operatorAuthorized: true, schemaMigrationsReady: true,
      persistedNodeCount: persisted.size, verifiedMediaCount: 2,
    }, manifest)).toBe(false);
    expect(e2eFixtureActivationReady({
      developmentMode: true, operatorAuthorized: true, schemaMigrationsReady: true,
      persistedNodeCount: manifest.nodes.length, verifiedMediaCount: 0,
    }, manifest)).toBe(false);
  });
});
