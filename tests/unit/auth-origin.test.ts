import { describe, expect, it } from "vitest";
import { isSameOriginRequest } from "@/auth/origin";

describe("auth same-origin guard", () => {
  it("accepts the public origin behind a trusted proxy", () => {
    const request = new Request(
      "http://internal-service/api/auth/session",
      {
        method: "POST",
        headers: {
          origin: "https://lms.example.com",
          "x-forwarded-host": "lms.example.com",
          "x-forwarded-proto": "https",
        },
      },
    );

    expect(isSameOriginRequest(request)).toBe(true);
  });

  it("rejects a foreign origin", () => {
    const request = new Request(
      "https://lms.example.com/api/auth/session",
      {
        method: "POST",
        headers: {
          origin: "https://evil.example",
          host: "lms.example.com",
        },
      },
    );

    expect(isSameOriginRequest(request)).toBe(false);
  });

  it("fails closed when the browser sends no origin", () => {
    const request = new Request(
      "https://lms.example.com/api/auth/session",
      {
        method: "POST",
        headers: {
          host: "lms.example.com",
        },
      },
    );

    expect(isSameOriginRequest(request)).toBe(false);
  });
});
