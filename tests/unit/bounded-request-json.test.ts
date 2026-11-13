import { describe, expect, it } from "vitest";
import { boundedRequestJson, RequestBodyError } from "@/lib/request-body";

const post = (body: BodyInit | null) => new Request("https://campus.example.test/api/x", { method: "POST", body });

describe("boundedRequestJson", () => {
  it("returns the same value request.json() would for a valid body", async () => {
    expect(await boundedRequestJson(post(JSON.stringify({ a: 1, b: ["x"] })))).toEqual({ a: 1, b: ["x"] });
  });

  it("refuses an oversized body with a 413 error before holding it", async () => {
    const error = await boundedRequestJson(post(JSON.stringify({ pad: "x".repeat(2000) })), 256).catch((e) => e);
    expect(error).toBeInstanceOf(RequestBodyError);
    expect(error.status).toBe(413);
    expect(error.code).toBe("REQUEST_TOO_LARGE");
  });

  it("maps malformed JSON and invalid UTF-8 to a 400 error", async () => {
    for (const body of ["{not json", new Uint8Array([0x7b, 0xff, 0x7d])]) {
      const error = await boundedRequestJson(post(body)).catch((e) => e);
      expect(error).toBeInstanceOf(RequestBodyError);
      expect(error.status).toBe(400);
      expect(error.code).toBe("INVALID_REQUEST");
    }
  });

  it("treats an empty body as invalid JSON, like request.json()", async () => {
    const error = await boundedRequestJson(post(null)).catch((e) => e);
    expect(error).toBeInstanceOf(RequestBodyError);
    expect(error.status).toBe(400);
  });
});
