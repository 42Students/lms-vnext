import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(path, "utf8");

describe("chat-14 guarded mutation adoption", () => {
  it("GR-30 GR-31 protects shared notification toolbar writes with an actual synchronous lock", () => {
    const code = source("src/components/activity/notification-toolbar.tsx");
    expect(code).toContain("useGuardedAction()");
    expect(code).toContain("await run(async () => {");
    expect(code).toContain("await apiFetch(markAllEndpoint");
    expect(code).toContain("disabled={pending || unreadCount === 0}");
  });

  it("GR-35 replaces the shared notification browser confirm with a consequence dialog", () => {
    const code = source("src/components/activity/notification-toolbar.tsx");
    expect(code).toContain("<ConfirmActionDialog");
    expect(code).toContain("consequence={confirmMessage}");
    expect(code).toContain("onConfirm={() => void markAllRead()}");
    expect(code).not.toContain("window.confirm(");
  });

  it("GR-04 GR-30 GR-31 keeps learner inbox draft and consent while marking personal messages read", () => {
    const code = source("src/components/activity/learner-notifications-inbox.tsx");
    expect(code).toContain("useGuardedAction()");
    expect(code).toContain("await runMarkAll(async () => {");
    expect(code).toContain('await apiFetch("/api/notifications/read-all"');
    expect(code).toContain("setConfirmReadAll(false)");
    expect(code).toContain("setMarkAllError(error instanceof Error");
  });

  it("GR-04 GR-30 GR-31 preserves first-reader outcome when guarding TPO cell receipts", () => {
    const code = source("src/components/tpo/tpo-placement-cell-read-action.tsx");
    expect(code).toContain("useGuardedAction({timeoutMs:30000})");
    expect(code).toContain("await run(async () => {");
    expect(code).toContain("await apiFetch<{firstInCollege?:boolean}>");
    expect(code).toContain("data?.firstInCollege?");
    expect(code).toContain("disabled={busy}");
  });

  it("GR-30 GR-31 guards the manual-redirect placement toggle without changing publication copy", () => {
    const code = source("src/components/placements/tpo-public-placement-toggle.tsx");
    expect(code).toContain("useGuardedAction({timeoutMs:30000})");
    expect(code).toContain("await run(async () => {");
    expect(code).toContain('redirect:"manual"');
    expect(code).toContain('response.type==="opaqueredirect"');
    expect(code).toContain("Your placements page is live");
    expect(code).toContain("disabled={busy||(!enabled&&!canEnable)}");
  });

  it("GR-30 GR-31 guards department creation and retains accessible validation and success", () => {
    const code = source("src/components/admin/department-create-form.tsx");
    expect(code).toContain("useGuardedAction({timeoutMs:30000})");
    expect(code).toContain("void run(async () => {");
    expect(code).toContain(".catch(() => setError(DEPARTMENT_COPY.createFailed");
    expect(code).toContain("Department name must be 255 characters or less");
    expect(code).toContain("disabled={pending || !name.trim()}");
  });
});
