import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  canActOnEntireTpoView,
  isTpoBulkPageSelected,
  isTpoBulkPreviewCurrent,
  matchTpoBulkRollNumbers,
  selectTpoBulkPage,
  toggleTpoBulkRow,
} from "@/modules/placements/tpo-bulk-ui-model";
import {
  tpoBulkConfirmRequestSchema,
  tpoBulkPreviewRequestSchema,
  selectedBulkActionRows,
} from "@/modules/placements/tpo-bulk-workflow-model";
import {
  signTpoBulkPreview,
  verifyTpoBulkPreview,
  TPO_BULK_PREVIEW_TTL_MS,
} from "@/modules/placements/tpo-bulk-preview-token";
import { canExactUndo, previewBulkAction } from "@/modules/placements/tpo-bulk-action-model";
import { readTpoBulkRequestBody, TpoBulkBodyError, TPO_BULK_BODY_MAX_BYTES } from "@/modules/placements/tpo-bulk-request-body";

const A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const C = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const SECRET = "unit-test-secret-do-not-use-in-production";
const NOW = 1_900_000_000_000;

describe("TPO-students-14/TPO-students-17 signed bulk preview concurrency", () => {
  const plan = tpoBulkPreviewRequestSchema.parse({
    target: "STUDENTS", action: "INELIGIBLE", note: "Missing required proof", ids: [A, B],
  });
  const selections = [{ id: A, version: "none" }, { id: B, version: "2:2026-10-18T00:00:00Z" }];

  it("binds a preview to exact actor, membership, action, reason, IDs and row versions", () => {
    const token = signTpoBulkPreview(SECRET, "user:college-membership", plan, selections, NOW);
    expect(verifyTpoBulkPreview(SECRET, "user:college-membership", plan, selections, token, NOW + 1)).toBe(true);
    expect(verifyTpoBulkPreview(SECRET, "user:other-membership", plan, selections, token, NOW + 1)).toBe(false);
    expect(verifyTpoBulkPreview(SECRET, "user:college-membership", { ...plan, note: "New reason" }, selections, token, NOW + 1)).toBe(false);
    expect(verifyTpoBulkPreview(SECRET, "user:college-membership", plan, [...selections].reverse(), token, NOW + 1)).toBe(false);
    expect(verifyTpoBulkPreview(SECRET, "user:college-membership", plan, [{ id: A, version: "changed" }, selections[1]], token, NOW + 1)).toBe(false);
    expect(verifyTpoBulkPreview(SECRET, "user:college-membership", plan, selections, token, NOW + TPO_BULK_PREVIEW_TTL_MS)).toBe(false);
  });

  it("rejects destructive confirmation without acknowledgement and malformed or duplicate payloads", () => {
    const request = { ...plan, selections, confirmed: true, previewToken: "signed-token-1234" };
    expect(tpoBulkConfirmRequestSchema.safeParse({ ...request, acknowledged: true }).success).toBe(true);
    expect(tpoBulkConfirmRequestSchema.safeParse({ ...request, acknowledged: false }).success).toBe(false);
    expect(tpoBulkConfirmRequestSchema.safeParse({ ...request, ids: [A, A], acknowledged: true }).success).toBe(false);
    expect(tpoBulkConfirmRequestSchema.safeParse({ ...request, ids: [A, C], acknowledged: true }).success).toBe(true);
    // The schema intentionally cannot authenticate a preview; the confirm service must
    // separately verify the signed token and exact ordered selections.
    expect(tpoBulkPreviewRequestSchema.safeParse({ ...plan, ids: Array(201).fill(A) }).success).toBe(false);
    expect(tpoBulkPreviewRequestSchema.safeParse({ ...plan, action: "DELETE_ALL" }).success).toBe(false);
  });

  it("prevents processing a stale selection while permitting only the correct CAS undo", () => {
    const readiness = new Map([
      [A, { version: "v1", ready: true }],
      [B, { version: "v2", ready: false, reason: "Outside this college" }],
    ]);
    const rows = selectedBulkActionRows([A, B, C], readiness);
    expect(rows.map(row => row.status)).toEqual(["ready", "skipped", "skipped"]);
    expect(isTpoBulkPreviewCurrent([A, B], [A])).toBe(false);
    expect(isTpoBulkPreviewCurrent([A], [A, B])).toBe(true);
    expect(canExactUndo({ id: A, undoVersion: "v2" }, { id: A, version: "v2" })).toBe(true);
    expect(canExactUndo({ id: A, undoVersion: "v2" }, { id: A, version: "v3" })).toBe(false);
    expect(canExactUndo({ id: A, undoVersion: "v2" }, { id: B, version: "v2" })).toBe(false);
  });
});

describe("TPO-students-14/TPO-students-17 bounded cross-page bulk selection", () => {
  it("requires the complete authorized view before offering select-all", () => {
    const whole = [{ id: A, label: "First" }, { id: B, label: "Second" }];
    expect(canActOnEntireTpoView(2, whole)).toBe(true);
    expect(canActOnEntireTpoView(3, whole)).toBe(false);
    expect(canActOnEntireTpoView(2, [whole[0], whole[0]])).toBe(false);
    expect(canActOnEntireTpoView(5001, whole)).toBe(false);
    expect(canActOnEntireTpoView(2, undefined)).toBe(false);
  });

  it("keeps page toggle identity-based and never adds a duplicate learner", () => {
    const first = toggleTpoBulkRow([A], B, true);
    expect(first).toEqual([A, B]);
    expect(toggleTpoBulkRow(first, B, true)).toEqual([A, B]);
    expect(toggleTpoBulkRow(first, A, false)).toEqual([B]);
    expect(isTpoBulkPageSelected([A, B], [A])).toBe(false);
    expect(isTpoBulkPageSelected([A, B], [A, B, C])).toBe(true);
    expect(selectTpoBulkPage([A, B, A])).toEqual([A, B]);
  });

  it("does not select ambiguous or unknown roll numbers", () => {
    const matches = matchTpoBulkRollNumbers([
      { id: A, label: "A", rollNumber: "CS01" },
      { id: B, label: "B", rollNumber: "CS01" },
      { id: C, label: "C", rollNumber: "CS02" },
    ], "CS01,CS02,FOREIGN");
    expect(matches.ids).toEqual([C]);
    expect(matches.unmatched).toEqual(["CS01", "FOREIGN"]);
  });

  it("flags duplicate attempted work rather than silently applying the same action twice", () => {
    const rows = previewBulkAction(
      [{ id: A, version: "v1", label: "A" }, { id: A, version: "v1", label: "A again" }],
      () => ({ allowed: true }),
    );
    expect(rows[0].status).toBe("ready");
    expect(rows[1]).toMatchObject({ status: "skipped", reason: "Duplicate selection" });
  });
});

describe("TPO-students-14 bounded request payload", () => {
  it("rejects bad media type, malformed JSON, oversized body and JSON arrays", async () => {
    const request = (body: string, type = "application/json") => new Request("http://localhost/api/placements/tpo/bulk-actions/preview", {
      method: "POST", headers: { "content-type": type }, body,
    });
    await expect(readTpoBulkRequestBody(request("{}", "text/plain"))).rejects.toMatchObject({ status: 415 });
    await expect(readTpoBulkRequestBody(request("{"))).rejects.toBeInstanceOf(TpoBulkBodyError);
    await expect(readTpoBulkRequestBody(request("[]"))).rejects.toMatchObject({ status: 400 });
    await expect(readTpoBulkRequestBody(request("x".repeat(TPO_BULK_BODY_MAX_BYTES + 1)))).rejects.toMatchObject({ status: 413 });
    await expect(readTpoBulkRequestBody(request('{"target":"STUDENTS"}'))).resolves.toMatchObject({ target: "STUDENTS" });
  });
});

describe("TPO-students-14 client boundary and streaming resource guard", () => {
  it("keeps the interactive bulk panel marked as a client component before any import", () => {
    const file = readFileSync(resolve(process.cwd(), "src/components/tpo/tpo-bulk-action-panel.tsx"), "utf8");
    expect(file.trimStart().startsWith('"use client";')).toBe(true);
    expect(file).toContain("useGuardedAction");
    expect(file).toContain("isTpoBulkPreviewCurrent");
  });

  it("rejects oversize chunked requests without a Content-Length header", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(60 * 1024));
        controller.enqueue(new Uint8Array(8 * 1024));
        controller.close();
      },
    });
    const request = new Request("http://localhost/api/placements/tpo/bulk-actions/confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: stream,
      duplex: "half",
    } as RequestInit & { duplex: "half" });
    expect(request.headers.get("content-length")).toBeNull();
    await expect(readTpoBulkRequestBody(request)).rejects.toMatchObject({ status: 413 });
  });
});
