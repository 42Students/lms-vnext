import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { apiFetch, FriendlyFetchError } from "@/lib/api-fetch";

const path = "src/components/admin/admin-revoke-sessions.tsx";
afterEach(() => vi.unstubAllGlobals());

describe("AUTH-sessions-07 administrative session-revocation failure resilience", () => {
  it("AUTH-sessions-07 locks the complete revoke action, not just a disabled button", () => {
    const source = readFileSync(path, "utf8");
    expect(source).toContain('import {useGuardedAction} from "@/hooks/use-guarded-action"');
    expect(source).toContain("const {run,pending:busy}=useGuardedAction()");
    expect(source).toContain("await run(async()=>{");
    expect(source).toContain('method:"POST"');
    expect(source).toContain('credentials:"same-origin"');
    expect(source).toContain("JSON.stringify({userId,confirm:true})");
    expect(source).toContain("disabled={busy||count<1}");
    expect(source).toContain("pending={busy}");
    expect(source).toContain("setConfirmOpen(false)");
    expect(source).toContain("router.refresh()");
    expect(source).not.toContain("const response=await fetch(");
    expect(source).not.toContain("setBusy(true)");
  });

  it("AUTH-sessions-07 rejects a raw 503 HTML response without revealing the proxy body", async () => {
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response("<html>internal=db-secret</html>", { status: 503, headers: { "content-type": "text/html" } })
    ));
    let caught: unknown;
    try {
      await apiFetch("/api/admin/colleges/college-a/sessions", {method:"POST"});
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(FriendlyFetchError);
    expect((caught as Error).message).not.toContain("db-secret");
    expect((caught as FriendlyFetchError).status).toBe(502);
  });

  it("AUTH-sessions-07 masks a thrown network exception including secrets", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("postgres://internal:password@localhost");
    }));
    let caught: unknown;
    try {
      await apiFetch("/api/admin/colleges/college-a/sessions", {method:"POST"});
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(FriendlyFetchError);
    expect((caught as Error).message).not.toContain("postgres://");
    expect((caught as FriendlyFetchError).status).toBe(0);
  });
});
