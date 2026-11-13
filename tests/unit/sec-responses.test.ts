import { describe, expect, it } from "vitest";
import { CACHE, noStoreJson, privateJson, publicJson, strictPrivateJson, withCachePolicy } from "@/security/responses";

describe("response helpers", () => {
  it("set the cache policy for their route class and keep the caller's status and headers", async () => {
    const r = privateJson({ ok: true }, { status: 201, headers: { "x-extra": "1" } });
    expect(r.status).toBe(201);
    expect(r.headers.get("Cache-Control")).toBe(CACHE.PRIVATE);
    expect(r.headers.get("x-extra")).toBe("1");
    expect(await r.json()).toEqual({ ok: true });
    expect(strictPrivateJson({}).headers.get("Cache-Control")).toBe("private, no-store, max-age=0");
    expect(noStoreJson({}).headers.get("Cache-Control")).toBe("no-store");
    expect(publicJson({}).headers.get("Cache-Control")).toBe("public, max-age=60");
  });
  it("cannot be weakened by a caller-supplied Cache-Control", () => {
    expect(privateJson({}, { headers: { "Cache-Control": "public, max-age=999" } }).headers.get("Cache-Control")).toBe(CACHE.PRIVATE);
  });
  it("withCachePolicy overwrites an existing header on a built response", () => {
    const r = withCachePolicy(new Response("x", { headers: { "Cache-Control": "public" } }), CACHE.PRIVATE);
    expect(r.headers.get("Cache-Control")).toBe("private, no-store");
  });
});
