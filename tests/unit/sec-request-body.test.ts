import { describe, expect, it } from "vitest";
import {
  AuthRequestBodyTooLarge,
  RequestBodyError,
  boundedRequestJson,
  readBoundedAuthJson,
  readBoundedJsonBody,
  readBoundedJsonRequest,
  readBoundedUtf8Body,
} from "@/lib/request-body";

const post = (body: BodyInit | null, headers: Record<string, string> = {}) =>
  new Request("http://x.test/", { method: "POST", body, headers });

describe("request body readers (one module, one byte counter)", () => {
  it("every reader accepts a normal JSON body", async () => {
    expect(await readBoundedJsonBody(post('{"a":1}'), 100)).toEqual({ kind: "OK", value: { a: 1 } });
    expect(await readBoundedJsonRequest(post('{"a":1}'), 100)).toEqual({ ok: true, value: { a: 1 } });
    expect(await boundedRequestJson(post('{"a":1}'), 100)).toEqual({ a: 1 });
    expect(await readBoundedAuthJson(post('{"a":1}'), 100)).toEqual({ a: 1 });
    expect(await readBoundedUtf8Body(post("hi"), 10)).toEqual({ kind: "OK", body: "hi" });
  });
  it("every reader refuses an oversized streamed body, whatever Content-Length says", async () => {
    const big = "x".repeat(50);
    expect(await readBoundedUtf8Body(post(big), 10)).toEqual({ kind: "TOO_LARGE" });
    expect(await readBoundedJsonBody(post(JSON.stringify({ big })), 10)).toEqual({ kind: "TOO_LARGE" });
    expect(await readBoundedJsonRequest(post(JSON.stringify({ big })), 10)).toEqual({ ok: false });
    await expect(boundedRequestJson(post(JSON.stringify({ big })), 10)).rejects.toMatchObject({ status: 413, code: "REQUEST_TOO_LARGE" });
    await expect(readBoundedAuthJson(post(JSON.stringify({ big })), 10)).rejects.toBeInstanceOf(AuthRequestBodyTooLarge);
  });
  it("every reader refuses invalid JSON and invalid UTF-8", async () => {
    expect(await readBoundedJsonBody(post("{nope"), 100)).toEqual({ kind: "INVALID" });
    expect(await readBoundedJsonRequest(post("{nope"), 100)).toEqual({ ok: false });
    await expect(boundedRequestJson(post("{nope"), 100)).rejects.toBeInstanceOf(RequestBodyError);
    expect(await readBoundedUtf8Body(post(new Uint8Array([0xff, 0xfe, 0xfd])), 100)).toEqual({ kind: "INVALID_UTF8" });
  });
  it("the sensitive reader also rejects a lying or malformed Content-Length up front", async () => {
    expect(await readBoundedJsonRequest(post('{"a":1}', { "content-length": "999" }), 100)).toEqual({ ok: false });
    expect(await readBoundedJsonRequest(post('{"a":1}', { "content-length": "1e3" }), 100)).toEqual({ ok: false });
  });
  it("the old module paths are gone", async () => {
    for (const path of ["bounded-json-body", "bounded-json-request", "bounded-request-json", "bounded-utf8-body"]) {
      expect(() => require.resolve(`../../src/lib/${path}.ts`)).toThrow();
    }
  });
});
